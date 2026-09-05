# Production deployment — synora-ai.uz

Live at **https://synora-ai.uz** on `169.58.183.151` (Ubuntu 24.04), behind nginx,
run by systemd. This directory is the source of truth for the server config; the
files are copied to the paths listed below.

| File | Server path |
| --- | --- |
| `deploy.sh` | `/opt/synora-ai/deploy.sh` |
| `synora-ai.service` | `/etc/systemd/system/synora-ai.service` |
| `synora-ai.uz.conf` | `/etc/nginx/sites-available/synora-ai.uz.conf` |
| `synora-certbot-bootstrap.*` | `/usr/local/sbin/`, `/etc/systemd/system/` |

## How a deploy works

Pushing to `master` triggers [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml),
which SSHes in as `deploy` and runs `/opt/synora-ai/deploy.sh` for that commit.
The same script is what you run by hand, so CI and manual deploys cannot drift.

`deploy.sh` fetches the commit, runs `pnpm install --frozen-lockfile && pnpm build`,
copies `.output` into a timestamped directory under `/opt/synora-ai/releases/`,
**starts it on port 3999 and waits for a real HTTP response**, and only then points
`/opt/synora-ai/current` at it and restarts the service. A build that fails to
serve is discarded before the live process is touched; if the restarted service
fails its health check, the previous release is put back automatically. The last
five releases are kept.

## Layout on the server

```
/opt/synora-ai/
├── deploy.sh
├── src/                    git checkout + node_modules (build workspace)
├── releases/<utc>-<sha>/   built .output + REVISION
└── current -> releases/…   what systemd runs
```

The app listens on `127.0.0.1:3000` only; nginx terminates TLS and proxies to it.
It runs as the unprivileged `synora` user, which cannot write to its own files.
The `deploy` user owns the code and may run exactly one privileged command
(`systemctl restart synora-ai`, via `/etc/sudoers.d/deploy-synora`).

Only one instance runs, deliberately: `server/utils/otpStore.ts` holds OTP state
in memory, so a second worker would not see codes issued by the first.

## Common tasks

```bash
ssh deploy@169.58.183.151 /opt/synora-ai/deploy.sh     # deploy master by hand
ssh root@169.58.183.151 journalctl -u synora-ai -f     # tail app logs
ssh root@169.58.183.151 systemctl status synora-ai
```

Roll back to an earlier release:

```bash
ssh deploy@169.58.183.151
ls /opt/synora-ai/releases                             # pick one
ln -sfn /opt/synora-ai/releases/<name> /opt/synora-ai/current
sudo systemctl restart synora-ai
```

## TLS

`synora-certbot-bootstrap.timer` runs every 10 minutes and issues the Let's
Encrypt certificate as soon as `synora-ai.uz` resolves to this server, adds the
HTTPS redirect, then disables itself. Renewals afterwards are handled by the
stock `certbot.timer`. To check on it:

```bash
ssh root@169.58.183.151 journalctl -u synora-certbot-bootstrap -n 20
```

## CI secret

The workflow needs one repository secret, `DEPLOY_SSH_KEY`: the private half of
the `ed25519` keypair in `/home/deploy/.ssh/github-actions`, whose public half is
in `/home/deploy/.ssh/authorized_keys`. The server address and its host key are
pinned in the workflow itself.
