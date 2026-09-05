#!/usr/bin/env bash
#
# Build and release synora-ai.uz.
#
# Runs as the `deploy` user, both by hand and from GitHub Actions, so the two
# paths cannot drift. Builds into a fresh release directory, smoke-tests it on a
# spare port, and only then flips the `current` symlink and restarts the service
# — a broken build never reaches the live process.
#
#   ./deploy.sh              # deploy origin/master
#   DEPLOY_REF=<sha> ./deploy.sh
#
set -euo pipefail

BASE=/opt/synora-ai
SRC=$BASE/src
RELEASES=$BASE/releases
REPO_URL=https://github.com/asadbekayubovwork/synora-ai.git
BRANCH=${DEPLOY_BRANCH:-master}
SERVICE=synora-ai
APP_PORT=3000
PROBE_PORT=3999
KEEP_RELEASES=5

export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
export CI=1

log() { printf '\n\033[1;34m==>\033[0m %s\n' "$*"; }
die() { printf '\n\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

# Poll an HTTP endpoint until it answers, so we never race a slow boot.
wait_for_http() {
  local url=$1 tries=${2:-40}
  for _ in $(seq 1 "$tries"); do
    if curl -fs -o /dev/null --max-time 3 "$url" 2>/dev/null; then return 0; fi
    sleep 0.5
  done
  return 1
}

# ---------------------------------------------------------------- fetch source
if [ ! -d "$SRC/.git" ]; then
  log "Cloning $REPO_URL"
  git clone --branch "$BRANCH" "$REPO_URL" "$SRC"
else
  log "Fetching origin/$BRANCH"
  git -C "$SRC" fetch --prune origin "$BRANCH"
fi

TARGET_REF=${DEPLOY_REF:-origin/$BRANCH}
git -C "$SRC" reset --hard "$TARGET_REF"
# Drop build leftovers but keep node_modules so installs stay incremental.
git -C "$SRC" clean -fdx -e node_modules

SHA=$(git -C "$SRC" rev-parse --short HEAD)
SUBJECT=$(git -C "$SRC" log -1 --pretty=%s)
RELEASE=$RELEASES/$(date -u +%Y%m%d-%H%M%S)-$SHA
log "Deploying $SHA — $SUBJECT"

# ----------------------------------------------------------- install and build
cd "$SRC"
log "pnpm install"
pnpm install --frozen-lockfile

log "pnpm build"
pnpm build
[ -f "$SRC/.output/server/index.mjs" ] || die "build produced no .output/server/index.mjs"

# --------------------------------------------------------------- stage release
log "Staging $RELEASE"
mkdir -p "$RELEASE"
cp -a "$SRC/.output" "$RELEASE/.output"
git -C "$SRC" rev-parse HEAD > "$RELEASE/REVISION"

# ------------------------------------------------- smoke-test before going live
log "Smoke-testing the new build on port $PROBE_PORT"
PORT=$PROBE_PORT HOST=127.0.0.1 NODE_ENV=production \
  node "$RELEASE/.output/server/index.mjs" > /tmp/synora-probe.log 2>&1 &
PROBE_PID=$!
if wait_for_http "http://127.0.0.1:$PROBE_PORT/"; then
  kill "$PROBE_PID" 2>/dev/null || true
  wait "$PROBE_PID" 2>/dev/null || true
else
  kill "$PROBE_PID" 2>/dev/null || true
  echo "--- probe log ---"; cat /tmp/synora-probe.log
  rm -rf "$RELEASE"
  die "new build did not serve a request; live site left untouched"
fi

# ------------------------------------------------------- flip symlink, restart
PREVIOUS=$(readlink -f "$BASE/current" 2>/dev/null || true)
log "Activating release"
ln -sfn "$RELEASE" "$BASE/current"
sudo /usr/bin/systemctl restart "$SERVICE"

if wait_for_http "http://127.0.0.1:$APP_PORT/"; then
  log "Live: $SHA"
else
  if [ -n "$PREVIOUS" ] && [ -d "$PREVIOUS" ]; then
    log "Health check failed — rolling back to $(basename "$PREVIOUS")"
    ln -sfn "$PREVIOUS" "$BASE/current"
    sudo /usr/bin/systemctl restart "$SERVICE"
    wait_for_http "http://127.0.0.1:$APP_PORT/" && log "Rolled back" || log "Rollback also unhealthy"
  fi
  sudo /usr/bin/journalctl -u "$SERVICE" -n 40 --no-pager || true
  die "service did not come up on port $APP_PORT"
fi

# ------------------------------------------------------------- prune old builds
log "Pruning old releases (keeping $KEEP_RELEASES)"
cd "$RELEASES"
ls -1dt -- */ 2>/dev/null | tail -n +$((KEEP_RELEASES + 1)) | while read -r old; do
  old=${old%/}
  [ "$RELEASES/$old" = "$(readlink -f "$BASE/current")" ] && continue
  echo "  removing $old"
  rm -rf -- "$RELEASES/${old:?}"
done

log "Done — https://synora-ai.uz ($SHA)"
