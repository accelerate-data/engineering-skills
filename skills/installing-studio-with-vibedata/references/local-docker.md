# Local Docker path

One machine, one operator. Non-prod compose auth: `NODE_ENV=development`,
`AUTH_ENABLED=false`, no web-login gate. Studio and the CLI are paired 1:1 —
there is no version to pick.

## 1. Gate the prerequisites (login-only)

Run these checks. On any miss, stop and hand back the exact fix — do not run
install past a failed gate.

| Check | Command | On failure |
| --- | --- | --- |
| `vibedata` on PATH | `vibedata version` | `curl -fsSL https://github.com/accelerate-data/vibedata-official/releases/latest/download/install.sh \| sh` |
| Docker daemon running | `docker info` | Start Docker Desktop / the Docker Engine, then re-check |
| GitHub signed in **(required)** | `gh auth status` | `gh auth login --scopes repo,read:org,workflow` — **required to create a domain**; install blocks without it |

`az login` is **optional** and **Fabric-only** — it happens *inside the
container after install*, not now. State this so the customer isn't sent to
Azure they don't need. Skip it entirely for DuckDB-only pipelines.

## 2. Drive the install

Ask two things, then run it:

- **Observability?** Lean by default (~3.5 GB images). `--with-observability`
  adds LGTM+Alloy; `--full-observability` adds Langfuse too (~11 GB). Sizes the
  host — the optional containers carry hard memory caps; core services don't.
- **Reached from another machine / using a companion app off-host?** Pass
  `--studio-url http://<host-ip>:5173` (that one value drives Studio + Obot +
  Grafana/Langfuse logins; `http://host[:port]` only, no HTTPS for Local
  Docker). Studio's own screens work off-host with no flag.

```bash
vibedata install compose
# or:
vibedata install compose --full-observability --studio-url http://<host-ip>:5173
```

It renders `.env` + compose, pulls images, starts the stack, applies
migrations, and imports the laptop GitHub session into the API container. It
prompts for nothing on a fresh install (reads `DATA_DIR/state.json`; default
`~/.vibedata/studio`).

**Report the outcome** — the command ends in one state:

| State | Meaning | Next |
| --- | --- | --- |
| **ready** | up, migrations applied, storage writable | open `http://localhost:5173` (or the `--studio-url`) |
| **degraded** | up, but a non-critical surface flags | name the affected check + the operator action |
| **blocked** | can't proceed safely | name the failed precondition (Docker authority, port conflict, registry, missing sign-in, stale files) + the fix |
| **not configured** | `DATA_DIR` missing/unmanaged | run `install compose` |

Exit codes: `0` ok · `1` error · `2` misuse · `3` blocked · `4` not configured.
LLM provider is set **inside Studio** (Org Settings → LLM), not by the CLI.

## 3. Fabric cloud/GitHub creds (only if they use Fabric)

These run **inside the API container** — they are not `vibedata` commands. Walk
the customer through them; don't wrap them. (Default `DATA_DIR`
`~/.vibedata/studio` shown; substitute a custom one.)

```bash
# Sign the container in to Azure (device-code streams to your terminal)
docker compose -f ~/.vibedata/studio/docker-compose.yml exec -it api az login --use-device-code

# Verify Azure in the container
docker compose -f ~/.vibedata/studio/docker-compose.yml exec -T api az account show --output table

# Verify the imported GitHub session
docker compose -f ~/.vibedata/studio/docker-compose.yml exec api gh auth token >/dev/null
```

If the `gh` check fails: `gh auth login --scopes repo,read:org,workflow` on the
laptop, then `vibedata install compose` again. Sessions bind-mount under
`DATA_DIR`, so `down`/`up` keeps you signed in.

## Day-2

| Goal | Command |
| --- | --- |
| Update to a new version | update the binary first, then `vibedata update compose` (reuses state, preserves the observability profile + data) |
| Start / stop / restart | `vibedata compose up [--with-observability \| --full-observability] \| down \| restart` (`down` preserves data) |
| Change LAN address / topology | re-run `install compose` with the new `--studio-url` / observability flag |
| Sign CLI in/out of Studio | `vibedata login [--studio-url URL]` / `vibedata logout` |
| Tear down | `vibedata cleanup [--force \| -y] [--keep-images]` — removes this project's containers, network, volumes, images; **preserves `DATA_DIR`**; prompts unless `--force` |

`compose up/down/restart` never modify state or prompt. `cleanup` is the only
one that prompts (skip with `--force`) and is scoped to the Studio Compose
project only — it does **not** touch a k8s deployment.
