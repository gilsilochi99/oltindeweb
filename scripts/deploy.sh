#!/usr/bin/env bash
# Builds the site on this machine and deploys it to the Namecheap server
# (Stellar Plus shared hosting: too little memory to build there).
#
#   npm run deploy            # libraries are uploaded only if they changed
#   FULL=1 npm run deploy     # always upload everything
#
# Needs the SSH key ~/.ssh/oltinde_deploy (authorized in cPanel → SSH Access).
# The app's settings (DATABASE_URL, keys...) live in the server's Node.js app
# config (cPanel → Setup Node.js App), not in this package, so a deploy never
# touches them. Uploaded files live in ~/oltinde.com/uploads, outside the app.
set -euo pipefail
cd "$(dirname "$0")/.."

SERVER="hyefndgu@premium61-4.web-hosting.com"
SSH=(ssh -i "$HOME/.ssh/oltinde_deploy" -p 21098 -o BatchMode=yes -o LogLevel=ERROR "$SERVER")
SCP=(scp -i "$HOME/.ssh/oltinde_deploy" -P 21098 -o BatchMode=yes -o LogLevel=ERROR)
APP_DIR=oltinde-app          # relative to the server home folder
DIST=.next-prod              # separate from `npm run dev`'s .next
step() { echo "==> $1 ($((SECONDS / 60))m$((SECONDS % 60))s)"; }

step "Building"
npx prisma generate >/dev/null
NEXT_DIST_DIR=$DIST NEXT_TELEMETRY_DISABLED=1 npx next build

step "Packaging"
rm -rf .deploy && mkdir -p .deploy
# The server's runtime engine for Prisma goes next to the generated client.
cp node_modules/.prisma/client/libquery_engine-rhel-*.so.node $DIST/standalone/node_modules/.prisma/client/
rm -f $DIST/standalone/node_modules/.prisma/client/query_engine-windows.dll.node

# node_modules (~95 MB) rarely changes: compare its fingerprint with the one
# installed on the server and reuse the server's copy when they match.
DEPS_SHA=$(cd $DIST/standalone && find node_modules -type f ! -path 'node_modules/@img/*' -print0 | sort -z | xargs -0 sha1sum | sha1sum | cut -c1-40)
REMOTE_SHA=$("${SSH[@]}" "cat ~/$APP_DIR/.deps-sha 2>/dev/null || true")
if [ -z "${FULL:-}" ] && [ "$DEPS_SHA" = "$REMOTE_SHA" ]; then
  WITH_DEPS=0; echo "    libraries unchanged: reusing the server's node_modules"
else
  WITH_DEPS=1; echo "    libraries changed: uploading node_modules"
fi
echo "$DEPS_SHA" > .deploy/.deps-sha

# One archive, straight from the build output (no intermediate copy): the
# standalone server, the static assets under .next-prod/static, and public/
# without user uploads.
MEMBERS=(./server.js ./package.json ./$DIST)
[ -d $DIST/standalone/src ] && MEMBERS+=(./src)
[ "$WITH_DEPS" = 1 ] && MEMBERS+=(./node_modules)
tar -czf .deploy/app.tar.gz \
    --exclude=./node_modules/@img \
    -C $DIST/standalone "${MEMBERS[@]}" \
    -C "$PWD/$DIST" --transform "s,^static,$DIST/static," static \
    -C "$PWD" --exclude=public/uploads public \
    -C "$PWD/.deploy" .deps-sha
echo "    $(du -h .deploy/app.tar.gz | cut -f1) to upload"

step "Uploading"
"${SSH[@]}" 'mkdir -p ~/deploy'
"${SCP[@]}" .deploy/app.tar.gz "$SERVER:deploy/app.tar.gz"

step "Installing and restarting"
"${SSH[@]}" "APP_DIR=$APP_DIR WITH_DEPS=$WITH_DEPS bash -s" <<'REMOTE'
set -euo pipefail
cd ~
rm -rf "$APP_DIR.new" && mkdir "$APP_DIR.new"
tar -xzf deploy/app.tar.gz -C "$APP_DIR.new"
# Unchanged libraries: hard-link the running copy (instant, no extra space).
if [ "$WITH_DEPS" = 0 ]; then cp -al "$APP_DIR/node_modules" "$APP_DIR.new/node_modules"; fi
# The host's umask (0002) makes files group-writable, which LiteSpeed/CloudLinux
# can refuse to run: owner-writable only, readable by the web server.
find "$APP_DIR.new" -type d -exec chmod 755 {} +
find "$APP_DIR.new" -type f -exec chmod 644 {} +
# Keep the Node.js app manager's own files (e.g. tmp/restart.txt) across deploys.
[ -d "$APP_DIR/tmp" ] && cp -a "$APP_DIR/tmp" "$APP_DIR.new/"
rm -rf "$APP_DIR.old"
[ -d "$APP_DIR" ] && mv "$APP_DIR" "$APP_DIR.old"
mv "$APP_DIR.new" "$APP_DIR"
cloudlinux-selector restart --json --interpreter nodejs --app-root "$APP_DIR" >/dev/null
rm -f deploy/app.tar.gz
echo "    installed; previous version kept in ~/$APP_DIR.old"
REMOTE

step "Checking https://oltinde.com"
sleep 5
curl -s -o /dev/null -w "    homepage: HTTP %{http_code}\n" --max-time 120 https://oltinde.com/ || true
step "Done"
