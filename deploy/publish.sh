#!/usr/bin/env bash
# Build the docs, rsync to the primary app host, then pull the standby forward
# and confirm both origins serve the new build (both sit behind docs.mersennet.com;
# without the sync the standby serves the previous build for up to 5 minutes).
set -euo pipefail
cd "$(dirname "$0")/.."
HOST="${DOCS_HOST:-root@178.104.211.138}"
STANDBY="${DOCS_STANDBY:-root@178.104.230.201}"
DEST=/var/www/docs.mersennet.com
SHA="$(git rev-parse --short HEAD)"
echo "==> build ($SHA)"
npm run build > /tmp/docs-build.log 2>&1 || { tail -20 /tmp/docs-build.log; exit 1; }
echo "$SHA" > dist/BUILD
echo "==> rsync to $HOST"
rsync -az --delete dist/ "$HOST:$DEST/"
echo "==> sync the standby"
ssh -o BatchMode=yes "$STANDBY" 'systemctl start standby-sync.service'
for i in $(seq 1 12); do
  [[ "$(ssh -o BatchMode=yes "$STANDBY" "cat $DEST/BUILD 2>/dev/null")" == "$SHA" ]] && break
  sleep 5
done
[[ "$(ssh -o BatchMode=yes "$STANDBY" "cat $DEST/BUILD 2>/dev/null")" == "$SHA" ]] && echo "    standby serves $SHA" || { echo "    standby did not pick up $SHA"; exit 1; }
echo "==> live: $(curl -s -o /dev/null -w '%{http_code}' https://docs.mersennet.com/)"
