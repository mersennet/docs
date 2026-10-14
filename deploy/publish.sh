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
# The search entry files keep their names while the index they point to is
# renamed on every build (and the old one deleted above): drop them at the edge.
echo "==> purge the search entry files at the edge"
[[ -f "$HOME/.mersennet/cloudflare.env" ]] && set -a && . "$HOME/.mersennet/cloudflare.env" && set +a
if [[ -n "${CF_API_TOKEN:-}" && -n "${CF_ZONE_ID:-}" ]]; then
  body="$(cd dist/pagefind && find . -maxdepth 1 -type f -printf '%f\n' | python3 -c 'import json, sys; print(json.dumps({"files": ["https://docs.mersennet.com/pagefind/" + f.strip() for f in sys.stdin if f.strip()]}))')"
  for i in 1 2 3; do
    curl -fsS -m 20 -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache" \
      -H "Authorization: Bearer $CF_API_TOKEN" -H 'Content-Type: application/json' --data "$body" 2>/dev/null | grep -q '"success":true' \
      && { echo "    purged"; break; }
    [[ $i -eq 3 ]] && echo "    warning: edge purge failed; search may fail for up to 5 minutes" >&2
    sleep 4
  done
else
  echo "    warning: CF_API_TOKEN/CF_ZONE_ID not set; search may fail for up to 5 minutes" >&2
fi
echo "==> live: $(curl -s -o /dev/null -w '%{http_code}' https://docs.mersennet.com/)"
