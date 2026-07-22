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

- **6 core (always):** `pg-password`, `auth-secret`, `data-encryption-key`,
  `obot-client-secret`, `obot-db-password`, `bootstrap-key`.
- **`--with-observability` adds 2:** `grafana-client-secret`,
  `grafana-admin-password`.
- **`--full-observability` adds those 2 and 7:** `langfuse-salt`,
  `langfuse-nextauth-secret`, `langfuse-encryption-key` (64 hex),
  `langfuse-client-secret`, `langfuse-clickhouse-password`,
  `langfuse-redis-password`, `langfuse-minio-password`.

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
`--with-observability` / `--full-observability` (need the matching secrets),
`--kube-context`, `--storage-resource-group`, `--timeout` (default 600),
`--kubeconfig`. Idempotent — safe to re-run. It prints the Studio URL, the
**private** ingress address, and where to read the bootstrap key.

## 5. Go live + first login

The ingress is private until you wire the cloud's HTTPS edge (cloud file) —
required, because SSO refuses plain HTTP. Then read the `bootstrap-key` from the
vault (cloud file) and open `/login` to create the first admin.

## Day-2 (no vibedata CLI for k8s)

| Goal | How |
| --- | --- |
| Upgrade | **automatic** — a published release rolls out via Argo CD behind the safety gate. No `vibedata` command; do not invent one. |
| Health | `kubectl -n argocd get applications` and `kubectl -n studio get pods` |
| Pause / teardown | cloud file (the cloud's stop/delete commands). `vibedata cleanup` is **Docker-only** — it does not apply here. |
| CLI sign-in to Studio | `vibedata login [--studio-url URL]` / `logout` (same as Docker) |

## Known issue — first install hangs at the upgrade gate

Until a release carrying the fix ships, a brand-new install can stall: the Argo
PreSync upgrade gate runs before the DB exists and blocks. Symptom:
`READINESS_FAILED: studio-app not healthy within 600s`, Argo app
`OutOfSync / Missing`. **Do not re-run install** — recover by bringing Postgres
up first, then enabling auto-sync (exact patches in the cloud's deployment doc's
"Temporary workaround"). Then finish go-live.
