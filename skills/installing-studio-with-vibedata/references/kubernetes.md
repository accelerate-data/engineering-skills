# Kubernetes path (cloud-agnostic flow)

The install flow is the same on every cloud; only the infra commands differ.
Pick the cloud file for the concrete commands:

| Cloud | Status | File |
| --- | --- | --- |
| Azure (AKS) | supported today | [`azure.md`](azure.md) |
| AWS / GCP | **not supported yet** | — (no file — the CLI errors on these clouds) |

**Cloud scope gate.** Offer **Azure**. If the customer wants AWS or GCP, say
plainly: *"Kubernetes install supports Azure only today — AWS and GCP aren't
supported yet."* Never run `--cloud aws`/`gcp` to surface the raw
`UnsupportedCloud` error. When the CLI's `CloudProvider` gains a cloud, add its
`<cloud>.md` here and one row above — nothing is pre-scaffolded.

**Installer creates nothing in the cloud.** `vibedata install kubernetes` only
*reads* coordinates (vault URL, storage URL, domain, cluster identity) and
installs Studio *into* an existing cluster over kubeconfig. Every cloud
resource is the customer's to create — hand back the exact command (cloud file)
and never claim you created it.

## The shape (same on every cloud)

gate prereqs → detect live state → ensure Studio's secrets exist → hand off the
infra the installer can't make → drive the install → go live (HTTPS edge) →
day-2 via Argo. Do not proceed past a failed gate.

## 1. Prereqs (cloud-agnostic part)

| Check | Command | On failure |
| --- | --- | --- |
| `vibedata` on PATH | `vibedata version` | install the binary (see local-docker ref) |
| `kubectl` present + cluster reachable | `kubectl get nodes` → `Ready` | fix kubeconfig (cloud file's `get-credentials` step) |
| Right cluster selected | `kubectl config current-context` | `--kube-context` at install, or `kubectl config use-context` |

Cloud CLI sign-in (e.g. `az login`) and cluster creation are in the cloud file.

## 2. Detect live state

```bash
kubectl get ns studio
kubectl -n studio get externalsecret        # after install: want SecretSynced
kubectl -n argocd get applications
```

Vault secret list + the cluster's read access to the vault are cloud-specific
(cloud file). **Image-pull creds:** none needed — Studio pulls **public**
images and chart, so there is no registry login to detect or create.

## 3. Studio's secrets (names are the same on every cloud)

A **missing** secret means its ExternalSecret never syncs and pods won't start,
so every name must exist in the cloud's vault before install. The *values* are
self-generated and the *set/verify commands* are cloud-specific (cloud file).

- **9 core (always):** `pg-password`, `auth-secret`, `data-encryption-key`,
  `data-encryption-key-id` (`k1` on a new install),
  `data-encryption-retired-keys` (`{}` on a new install), `obot-client-secret`,
  `obot-db-password`, `obot-tunnel-peer-token`, `bootstrap-key`.
- **`--with-observability` adds 2:** `grafana-client-secret`,
  `grafana-admin-password`.
- **`--full-observability` adds those 2 and 10:** `langfuse-salt`,
  `langfuse-nextauth-secret`, `langfuse-encryption-key` (64 hex),
  `langfuse-client-secret`, `langfuse-db-password`,
  `langfuse-clickhouse-password`, `langfuse-redis-password`,
  `langfuse-minio-password`, `langfuse-init-project-public-key`,
  `langfuse-init-project-secret-key`.

A cloud whose file share needs a mount key adds `storage-key` to the core set.
Azure Files NFS v4.1 mounts key-free, so on Azure the core set is the 9 above.
This list drifts as the installer gains secrets, so print the authoritative set
instead of trusting it: `vibedata install kubernetes --list-secrets` (plus the
profile flag), which needs no cluster, vault or share. It derives from what the
profile actually renders, so it cannot disagree with what the install demands.

## 4. Drive the install

```bash
vibedata install kubernetes \
  --cloud <cloud> \
  --domain "<https-hostname>" \
  --storage-url "<shared-file-store-url>" \
  --vault-url "<vault-url>" \
  --vault-identity-client-id "<cluster-identity>"
```

The four values are derived per cloud (cloud file). No flags → an interactive
form (kubeconfig, domain, storage URL, vault URL). Optional:
`--with-observability` / `--full-observability` / `--no-observability` (the
first two need the matching secrets), `--version` (pin one release instead of
tracking the auto-upgrade channel — the recovery install), `--kube-context`,
`--storage-resource-group`, `--timeout` (default 600), `--kubeconfig`.
Idempotent — safe to re-run. It prints the Studio URL, the **private** ingress
address, and where to read the bootstrap key.

**Re-running requires the profile flag.** A re-install that names no profile
blocks and prints both the keep and the remove command, rather than quietly
turning observability off and deleting Langfuse's data. `--no-observability` is
the only way to remove it.

**A missing vault secret now fails in seconds, by name.** The install stops with
`VAULT_SECRET_UNREADABLE`, naming the key, the vault, and the profile's full key
set. Operators no longer meet this as a 600s Argo timeout or an ExternalSecret
stuck un-synced, so don't send them looking there first.

**A cloud install runs in production mode.** The chart derives `NODE_ENV` from
the install scheme: `https` (any cloud install, since the edge provides real
HTTPS) renders `production`; only a local `http` kind install renders
`development`. Operator-visible consequences, all of them intentional:

- CORS is locked to the Studio URL instead of reflecting every origin.
- `Secure` CSRF/OAuth-state cookies.
- The outbound-URL guard rejects loopback/private hosts in user-supplied
  endpoints — so a **private-network OIDC issuer or LLM apiBase is refused**.
  This is the one that surprises operators wiring internal SSO.
- Unexpected-error messages are sanitized.
- The e2e-session test-login door is hard-disabled.

It still boots in bootstrap mode: first admin via the bootstrap key, then that
admin adds real SSO.

**Agent pods are network-fenced.** Each Intent's agent pod runs under a
default-deny NetworkPolicy and can only reach what Studio allows. If an operator
asks why an agent can't call an internal service, that's the fence, not a
misconfiguration — it needs a deliberate allow-list change, not a workaround.

**Draining is not instant.** The backend carries a termination grace budget so
in-flight work finishes on rollout; pods legitimately sit `Terminating` for a
while during upgrades. Don't let anyone force-delete them to "speed it up".

**Telemetry goes through Alloy.** On both observability profiles Alloy is the
edge collector every producer sends OTLP to — backend to `alloy:4318`, obot via
its config, and the browser through the frontend's `/otel/` proxy — and it fans
out to the `grafana/otel-lgtm` bundle. It runs as a Deployment, not a node-level
DaemonSet, so other pods' container logs are not shipped to Loki; Studio's own
logs, traces and metrics arrive over OTLP regardless.

**Size for `--full-observability` before promising it.** On a 2-node / 8-vCPU
cluster the observability stack plus Studio reserves ~91-94% of CPU *requests*,
leaving ~220-320m per node. An agent pod requests 250m, so there is room for
about one agent at a time and a rolling restart (500m) can find nowhere to
schedule — the symptom is a `Pending` pod and an Intent that never gets an agent,
not an error message. Recommend a third node, or size nodes larger, for anyone
running agents alongside full observability. `--with-observability` and the
default (no flag) are far lighter.

## 5. Go live + first login

**Before wiring the edge, apply the cloud file's ingress LB health-probe
fix.** A default AKS internal LB health-probes `/`, which ingress-nginx 404s
on, so every node reads unhealthy and the LB silently drops all inbound
traffic — invisibly to in-cluster tests. See the cloud file for the exact
annotation and how to verify it.

The ingress is private until you then wire the cloud's HTTPS edge (cloud
file) — required, because SSO refuses plain HTTP. Then read the
`bootstrap-key` from the vault (cloud file) and open `/login` to create the
first admin.

## Day-2 (no vibedata CLI for k8s)

| Goal | How |
| --- | --- |
| Upgrade | **not automatic, and no `vibedata` command** — see "Upgrades" below. Argo tracks the channel and reports `OutOfSync`; nothing rolls out until a sync is requested. |
| Health | `kubectl -n argocd get applications` and `kubectl -n studio get pods` |
| Pause / teardown | cloud file (the cloud's stop/delete commands). `vibedata cleanup` is **Docker-only** — it does not apply here. |
| Grow the database disk | Postgres starts on a 5 GiB PVC `data-postgres-0`. Check with `kubectl -n studio exec postgres-0 -- df -h /var/lib/postgresql/data`; grow by patching the PVC's `storage` request — AKS's `managed-csi` expands online, no downtime. |
| Back up | `vibedata backup kubernetes --to <backup-share-url> [--name <package>]` — an EXISTING second share, not DATA_DIR. Created during prereqs (cloud file); there is no command to make one. |
| List packages | `vibedata restore kubernetes --from <backup-share-url> --list` |
| Restore | `vibedata restore kubernetes --from <share>/<package> [--yes] [--with-langfuse]` — the supported path is a fresh cluster, so it refuses one that already holds data. See "Recovering a failed upgrade". |
| CLI sign-in to Studio | `vibedata login [--studio-url URL]` / `logout` (same as Docker) |

## Upgrades — asked for, never automatic

Studio never upgrades itself. Argo tracks the release channel and reports the
new version `OutOfSync`, then waits: an automatic sync would roll a release out
before any backup existed. **Back up first** — migrations have no down-path, so
a bad upgrade is recovered from a backup, not rolled back.

Prefer the repo's reference script over driving it by hand:
`scripts/devops/upgrade-with-recovery.sh` drains users behind the edge, backs
up, syncs, health-checks, and either restores the edge or runs the recovery.
Before touching anything it checks there is a newer release, that the app is not
pinned, that regional vCPU quota has room for a recovery cluster, and that the
vault holds every secret the new version needs — a release can add a secret, and
syncing the chart alone cannot deliver one. It reads secret *names* only, so
whoever runs it needs `az keyvault secret show` or it refuses to start. Copy and
adapt its cloud-specific parts.

By hand it is two commands — request the sync, then watch it:

```bash
kubectl -n argocd annotate application studio-app argocd.argoproj.io/refresh=hard --overwrite
kubectl -n argocd patch application studio-app --type merge \
  -p '{"operation":{"sync":{"prune":true,"syncStrategy":{"hook":{}}}}}'
```

The in-cluster gate runs on every sync: it blocks new logins, waits for
in-flight agent work, and only then swaps the version.

A secret added to the vault is not in the cluster yet — it re-reads hourly.
Force it with
`kubectl -n studio annotate externalsecret studio-secrets force-sync=$(date +%s) --overwrite`.

## Recovering a failed upgrade

Restoring **over** the broken cluster is not the supported path. Recovery builds
a new one and leaves the old running — it is the only place the failure can be
reproduced.

1. Take the edge offline (cloud file), leaving the cluster up.
2. `--list` the packages and pick the version that ran *before* the upgrade, not
   the newest.
3. Create a new cluster and a new data share, **reusing the same vault**, storage
   account and edge. A new vault means a new `data-encryption-key`, which means
   every stored credential is unreadable. Needs a second cluster's worth of vCPU
   quota — confirm that before an outage, not during one.
4. Install that version pinned: `vibedata install kubernetes … --version vX.Y.Z`,
   using the matching `vibedata` binary (CLI and Studio pair 1:1). Without
   `--version` it tracks the open channel and pulls the release that just failed.
5. `vibedata restore kubernetes --from <share>/<package>` into it. Add
   `--with-langfuse` only if Langfuse's trace store survived, else its dashboards
   point at nothing.
6. Repeat the in-Studio `gh` / `az` sign-ins — token caches are not in a backup.
7. Point the edge at the new cluster, verify, and only later delete the
   quarantined one.
