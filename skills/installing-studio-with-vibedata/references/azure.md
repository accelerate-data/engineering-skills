# Azure (AKS) — cloud file for the Kubernetes path

The concrete `az` commands for [`kubernetes.md`](kubernetes.md). **Only Azure is
implemented today.** Everything here is the **customer's** to run in Azure — the
installer creates nothing. Full step-by-step + Front Door go-live:
`docs/user-guide/reference/k8s-deployment-azure.md`.

## Variables (set once, reused below)

```bash
export RG=studio-rg LOCATION=eastus AKS=studio-aks
export STORAGE=studiofiles01 SHARE=studio-data      # storage account: 3-24 lowercase, GLOBALLY UNIQUE
export VAULT=studio-kv-01                            # 3-24 chars, GLOBALLY UNIQUE
export FD_PROFILE=studio-fd FD_ENDPOINT=studio
```

## Prereq (Azure sign-in)

`az account show` → if not signed in: `az login` then
`az account set --subscription "<sub>"`.

## Infra the installer can NOT create — hand off, never fake

| Infra | Create it with | Verify |
| --- | --- | --- |
| Providers (first run) | `az provider register --namespace Microsoft.{ContainerService,Compute,Network,Storage,KeyVault}` | `az provider show --namespace Microsoft.ContainerService --query registrationState -o tsv` → `Registered` |
| AKS cluster | `az group create …` → `az aks create … --enable-managed-identity --generate-ssh-keys` → `az aks get-credentials -g $RG -n $AKS` | `kubectl get nodes` → `Ready` |
| Azure Files **NFS v4.1** share | `az storage account create --sku Premium_LRS --kind FileStorage --https-only false` + `az storage share-rm create --enabled-protocols NFS` + subnet service-endpoint & network rules (deny by default) | `az storage account show … --query networkRuleSet` |
| Key Vault | `az keyvault create --name $VAULT -g $RG` (+ RBAC below) | `az keyvault show --name $VAULT` |
| Front Door edge (**required** — SSO refuses plain HTTP) | `az afd profile create --sku Standard_AzureFrontDoor --origin-response-timeout-seconds 240` (Premium for Private Link) + `az afd endpoint create` | endpoint `hostName` becomes `--domain`; `az afd profile show … --query originResponseTimeoutSeconds` → `240` |

**Never leave the origin timeout at Azure's 30s default.** It is how long Front
Door waits for Studio before returning `504`, and opening an Intent takes longer
— Studio clones the repo and starts an agent pod (~40s warm, ~110s the first
time a node pulls the agent image). At 30s the edge gives up mid-open, and
because the caller disconnected Studio discards the half-built agent and starts
over on the retry, so users see repeated gateway errors on a working install.
240 is the Azure maximum. Existing profile, no reinstall needed:

```bash
az afd profile update --profile-name $FD_PROFILE -g $RG --origin-response-timeout-seconds 240
```

Allow a few minutes for it to reach every edge location before retesting.

## Detect vault state + cluster read access (RBAC)

```bash
az keyvault secret list --vault-name $VAULT --query "[].name" -o tsv
CLUSTER_ID=$(az aks show -g $RG -n $AKS --query identityProfile.kubeletidentity.clientId -o tsv)
az role assignment list --assignee "$CLUSTER_ID" --scope "$(az keyvault show --name $VAULT --query id -o tsv)" -o table
```

## Set the secrets (self-generated values; verify each)

Writing needs the **Key Vault Secrets Officer** role on yourself (propagates
~1-2 min). Set every name from `kubernetes.md` §3 that the vault list is missing:

```bash
az keyvault secret set --vault-name $VAULT --name pg-password         --value "$(openssl rand -hex 24)"
az keyvault secret set --vault-name $VAULT --name auth-secret         --value "$(openssl rand -base64 32)"
az keyvault secret set --vault-name $VAULT --name data-encryption-key --value "$(openssl rand -base64 32)"
az keyvault secret set --vault-name $VAULT --name obot-client-secret  --value "$(openssl rand -base64 32)"
az keyvault secret set --vault-name $VAULT --name obot-db-password    --value "$(openssl rand -hex 24)"
az keyvault secret set --vault-name $VAULT --name bootstrap-key       --value "$(openssl rand -base64 16)"
# --with-observability: grafana-client-secret (b64 32), grafana-admin-password (b64 24)
# --full-observability adds 7 langfuse-* (langfuse-encryption-key MUST be `openssl rand -hex 32` = 64 hex)
```

Verify each, and grant the cluster read if the RBAC check above was empty:

```bash
az keyvault secret show --vault-name $VAULT --name <name> --query name -o tsv
az role assignment create --role "Key Vault Secrets User" --assignee "$CLUSTER_ID" \
  --scope "$(az keyvault show --name $VAULT --query id -o tsv)"
```

## Derived install values → run the install

```bash
VAULT_URL=$(az keyvault show --name $VAULT --query properties.vaultUri -o tsv)
STORAGE_URL="$(az storage account show -g $RG -n $STORAGE --query primaryEndpoints.file -o tsv)$SHARE"
FD_HOST=$(az afd endpoint show --endpoint-name $FD_ENDPOINT --profile-name $FD_PROFILE -g $RG --query hostName -o tsv)
CLUSTER_ID=$(az aks show -g $RG -n $AKS --query identityProfile.kubeletidentity.clientId -o tsv)

vibedata install kubernetes --cloud azure \
  --domain "$FD_HOST" --storage-url "$STORAGE_URL" \
  --vault-url "$VAULT_URL" --vault-identity-client-id "$CLUSTER_ID"
```

## Go-live + first login

Wire Front Door to the private ingress — full Phase 3 (Standard public origin /
Premium Private Link) in the deployment doc. Re-running install re-adds the
private annotation + releases the public IP, so redo Phase 3 A1 if you
re-install. Then:

```bash
az keyvault secret show --vault-name $VAULT --name bootstrap-key --query value -o tsv   # one-time admin key → open /login
```

## Pause / teardown

| Goal | Command |
| --- | --- |
| Pause / resume (keeps data) | `az aks stop -g $RG -n $AKS` / `az aks start …` (Front Door + ingress IP persist; still ~$1-2/day) |
| Tear down to $0 | `az aks delete`, `az afd profile delete`, `az storage account delete` (**erases data**), `az keyvault delete` + `az keyvault purge`, or `az group delete --name $RG` for everything |
