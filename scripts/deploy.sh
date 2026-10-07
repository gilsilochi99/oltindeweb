#!/usr/bin/env bash
# Builds the site on this machine and deploys it to the Namecheap server
# (Stellar Plus shared hosting: too little memory to build there).
#
#   npm run deploy
#
# Needs the SSH key ~/.ssh/oltinde_deploy (authorized in cPanel → SSH Access).
# The app's settings (DATABASE_URL, keys...) live in the server's Node.js app
# config (cPanel → Setup Node.js App), not in this package, so a deploy never
# touches them. Uploaded files live in ~/oltinde.com/uploads, outside the app.
set -euo pipefail
cd "$(dirname "$0")/.."

SERVER="hyefndgu@premium61-4.web-hosting.com"
SSH=(ssh -i "$HOME/.ssh/oltinde_deploy" -p 21098 -o BatchMode=yes "$SERVER")
SCP=(scp -i "$HOME/.ssh/oltinde_deploy" -P 21098 -o BatchMode=yes)
APP_DIR=oltinde-app          # relative to the server home folder
DIST=.next-prod              # separate from `npm run dev`'s .next

echo "==> Building"
npx prisma generate >/dev/null
NEXT_DIST_DIR=$DIST NEXT_TELEMETRY_DISABLED=1 npx next build

echo "==> Packaging"
rm -rf .deploy && mkdir -p .deploy/app/public .deploy/app/$DIST
# tar pipes instead of cp: much faster for thousands of small files on Windows.
tar -C $DIST/standalone --exclude=./public/uploads --exclude=./node_modules/@img \
    --exclude='./node_modules/.prisma/client/query_engine-windows.dll.node' -cf - . | tar -C .deploy/app -xf -
tar -C $DIST -cf - static | tar -C .deploy/app/$DIST -xf -
tar -C public --exclude=./uploads -cf - . | tar -C .deploy/app/public -xf -
cp node_modules/.prisma/client/libquery_engine-rhel-*.so.node .deploy/app/node_modules/.prisma/client/
tar -C .deploy/app -czf .deploy/app.tar.gz .
echo "    $(du -h .deploy/app.tar.gz | cut -f1) to upload"

echo "==> Uploading"
"${SSH[@]}" 'mkdir -p ~/deploy'
"${SCP[@]}" .deploy/app.tar.gz "$SERVER:deploy/app.tar.gz"

echo "==> Installing and restarting"
"${SSH[@]}" "APP_DIR=$APP_DIR bash -s" <<'REMOTE'
set -euo pipefail
cd ~
rm -rf "$APP_DIR.new" && mkdir "$APP_DIR.new"
tar -xzf deploy/app.tar.gz -C "$APP_DIR.new"
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

echo "==> Checking https://oltinde.com"
sleep 5
curl -s -o /dev/null -w "    homepage: HTTP %{http_code}\n" --max-time 120 https://oltinde.com/ || true
