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
export PLS=studio-pls                                # Private Link Service (Premium + Private Link only)
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

**Storage network rule scope.** The `Microsoft.Storage` service endpoint and
the storage account's network allow-rule must both target the subnet the AKS
nodes **actually run in** — not a separate dedicated "storage subnet". Node/pod
traffic originates from the nodes' own subnet, so allow-listing any other
subnet plus `--default-action Deny` locks the cluster out of its own NFS
share.

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
# --full-observability adds 9 langfuse-* (langfuse-encryption-key MUST be `openssl rand -hex 32` = 64 hex;
#   langfuse-init-project-public-key = pk-lf-<16 hex>, langfuse-init-project-secret-key = sk-lf-<24 hex>)
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

## Fix the LB health-probe path (required, before Front Door)

Run this **immediately after `vibedata install kubernetes` succeeds and
before wiring Front Door to the ingress** — not reactively after seeing 0%
origin health. The Azure Standard LB behind AKS's internal ingress Service
health-probes `/` by default; ingress-nginx's own default backend 404s there,
so every node reads unhealthy and the LB silently drops **all** inbound
traffic, including anything a Private Link Service points at it.

```bash
kubectl -n ingress-nginx annotate svc ingress-nginx-controller \
  service.beta.kubernetes.io/azure-load-balancer-health-probe-request-path=/healthz
```

Verify with the LB's `DipAvailability` metric reaching 100% — **not** an
in-cluster `curl` to the LB IP. A pod curl to the LB IP returns 200 whether or
not the bug is present, because kube-proxy short-circuits Service/LB IPs via
node iptables, so the request never actually traverses the Azure LB; only
real external traffic (e.g. via Front Door / Private Link) does. The
annotation lives on the live Service object, not ingress-nginx's Helm values,
so a Helm upgrade of ingress-nginx reverts it — re-apply after any such
upgrade. Tracked upstream as VD-4055.

## Front Door Premium + Private Link (Phase 3)

Requires the profile created above to be `Premium_AzureFrontDoor` (Private
Link is Premium-only). Do this after the health-probe fix above, once the
internal LB is passing its own health check.

**1. Create the Private Link Service directly against the existing internal
LB** — do **not** use the `service.beta.kubernetes.io/azure-pls-create`
Service annotation. It failed for 40+ minutes with `AuthorizationFailed` even
with correct RBAC and a forced `az aks update`; this looks like an AKS
control-plane token-caching bug and did not resolve with waiting. Creating the
PLS with your own credentials against the LB's frontend sidesteps the AKS
cluster identity entirely.

The PLS's subnet needs **both** `privateEndpointNetworkPolicies` and
`privateLinkServiceNetworkPolicies` set to `Disabled` — missing the second one
is the easy mistake:

```bash
az network vnet subnet update -g $RG --vnet-name <vnet> --name <pls-subnet> \
  --private-endpoint-network-policies Disabled \
  --private-link-service-network-policies Disabled
```

Use these flag forms, not `--disable-private-endpoint-network-policies` /
`--disable-private-link-service-network-policies`: `az` marks those deprecated
and prints a replacement warning.

The internal LB (`kubernetes-internal`) lives in the AKS node resource group
(`MC_*`), not `$RG` — `--lb-frontend-ip-configs` needs the **full
cross-resource-group resource ID**; `--lb-name` plus a bare config name fails
with `InvalidResourceReference`:

```bash
NODE_RG=$(az aks show -g $RG -n $AKS --query nodeResourceGroup -o tsv)
LB_FRONTEND_ID=$(az network lb frontend-ip show -g "$NODE_RG" \
  --lb-name kubernetes-internal --name <frontend-config-name> --query id -o tsv)

az network private-link-service create -g $RG --name $PLS --location $LOCATION \
  --vnet-name <vnet> --subnet <pls-subnet> \
  --lb-frontend-ip-configs "$LB_FRONTEND_ID"
```

**2. Create the origin group** — probe `/healthz`, the same path the LB fix
above made healthy:

```bash
az afd origin-group create --resource-group $RG --profile-name $FD_PROFILE \
  --origin-group-name studio-og \
  --probe-request-type GET --probe-protocol Http --probe-path /healthz \
  --probe-interval-in-seconds 100 --sample-size 4 \
  --successful-samples-required 3 --additional-latency-in-milliseconds 50
```

**3. Point the Front Door origin at the PLS.** `--host-name` is the internal
LB's **private IP** (`kubectl -n ingress-nginx get svc
ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}'`)
— an AKS internal LB has no FQDN. `--shared-private-link-resource` must be a
**single JSON string** with `private-link` as a nested `{id: ...}` object;
space-separated `key=value` and flat-JSON forms both fail:

```bash
PLS_ID=$(az network private-link-service show -g $RG --name $PLS --query id -o tsv)

az afd origin create --resource-group $RG --profile-name $FD_PROFILE \
  --origin-group-name studio-og --origin-name studio-ingress \
  --host-name <internal-lb-private-ip> --origin-host-header "$FD_HOST" \
  --http-port 80 --https-port 443 --priority 1 --weight 1000 \
  --enabled-state Enabled --enforce-certificate-name-check true \
  --shared-private-link-resource "{\"private-link\":{\"id\":\"$PLS_ID\"},\"private-link-location\":\"$LOCATION\",\"request-message\":\"studio access\"}"
```

`--enforce-certificate-name-check` must stay `true` — Azure hard-rejects
`false` for any Private Link origin (`EnforceCertificateNameCheck must be
enabled for Private Link`), even when the route forwards over plain HTTP.

**4. Create the route.** Without it Front Door has nowhere to send requests
and returns its own 404 forever:

```bash
az afd route create --resource-group $RG --profile-name $FD_PROFILE \
  --endpoint-name $FD_ENDPOINT --route-name studio-route \
  --origin-group studio-og --supported-protocols Http Https \
  --forwarding-protocol HttpOnly --https-redirect Enabled \
  --link-to-default-domain Enabled
```

**5. Approve the private endpoint connection.** Ownership of both sides does
not auto-approve it — the connection request comes from Microsoft's own
Front-Door-managed subscription, not yours. It appears within ~15-60s of
route creation:

```bash
PE_ID=$(az network private-link-service show -g $RG --name $PLS \
  --query "privateEndpointConnections[0].id" -o tsv)
az network private-endpoint-connection approve --id "$PE_ID"
```

**Propagation, not a fault.** After approval, Front Door's
`OriginHealthPercentage` can sit at a flat 0% (its own 404) for up to ~30
minutes even when everything above is correct. Before changing any config,
verify the cheap signals first — LB `DipAvailability`, PLS connection status
`Approved`, origin/route `provisioningState` — and if those are all correct,
the remaining wait is Azure propagation, not a fault to fix.

Re-running install re-adds the private annotation + releases the public IP,
so redo this Phase after a re-install.

## Go-live + first login

```bash
az keyvault secret show --vault-name $VAULT --name bootstrap-key --query value -o tsv   # one-time admin key → open /login
```

## Pause / teardown

| Goal | Command |
| --- | --- |
| Pause / resume (keeps data) | `az aks stop -g $RG -n $AKS` / `az aks start …` (Front Door + ingress IP persist; still ~$1-2/day) |

### Tear down to $0 (Front Door Premium + Private Link)

`az aks delete` and the RG delete can run **concurrently** with the Front
Door teardown below — they're fully independent. Front Door itself must go in
order:

1. `az afd profile delete --resource-group $RG --profile-name $FD_PROFILE --no-wait`
   — a Premium profile with an active Private Link origin is slow (~15-20 min
   observed) and blocks past most CLI timeouts; poll
   `az afd profile show --resource-group $RG --profile-name $FD_PROFILE` for
   `ResourceNotFound` instead of waiting on the foreground call.
2. Deleting the profile does **not** release its private endpoint connection
   in time for a follow-up PLS delete — `az network private-link-service
   delete` fails with `PrivateLinkServiceWithPrivateEndpointConnectionsCannotBeDeleted`
   even after the FD profile is fully gone. Fix: explicitly
   `az network private-endpoint-connection delete --id <connection-id> --yes`
   first, then retry.
3. `az network private-link-service delete -g $RG --name $PLS`
4. `az storage account delete` (**erases data**), `az keyvault delete` +
   `az keyvault purge` (frees the name), or `az group delete --name $RG` for
   everything.

**Neither `az afd profile delete` nor `az network private-link-service
delete` accept `--yes`** — neither prompts, so there's nothing to skip;
passing it is a CLI error (`unrecognized arguments`). Only the
private-endpoint-connection delete in step 2 needs (and requires) `--yes`.

**Rebuilding shortly after?** Front Door **profile names**
(`Microsoft.Cdn/profiles`) have a post-delete cooldown that is **not**
resource-group-scoped — reusing `$FD_PROFILE` right after a teardown fails
with `(Conflict) That resource name isn't available`, even in a different RG,
same subscription. Pick a new profile name for the rebuild rather than
waiting on an unknown cooldown duration.
