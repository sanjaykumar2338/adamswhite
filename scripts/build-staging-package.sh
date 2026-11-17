#!/bin/sh

set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$project_root"

if [ ! -f public/build/manifest.json ]; then
    echo "Missing public/build/manifest.json. Run npm ci && npm run build first." >&2
    exit 1
fi

commit=$(git rev-parse --short=12 HEAD)
package_name="shiftrix-staging-${commit}"
temporary_root=$(mktemp -d "${TMPDIR:-/tmp}/shiftrix-package.XXXXXX")
release_root="$temporary_root/$package_name"

cleanup() {
    rm -rf -- "$temporary_root"
}
trap cleanup EXIT HUP INT TERM

mkdir -p "$release_root" artifacts
git archive HEAD | tar -xf - -C "$release_root"

mkdir -p "$release_root/public/build" "$release_root/deployment/staging" "$release_root/docs"
cp -R public/build/. "$release_root/public/build/"
cp deployment/staging/.env.staging.example "$release_root/deployment/staging/"
cp deployment/staging/check-hosting.php "$release_root/deployment/staging/"
cp docs/DEPLOYMENT.md docs/NAMECHEAP-STAGING-CHECKLIST.md "$release_root/docs/"

cat > "$release_root/DEPLOYMENT-MANIFEST.txt" <<EOF
SHIFTRIX staging deployment package
Source commit: $(git rev-parse HEAD)
Built UTC: $(date -u '+%Y-%m-%dT%H:%M:%SZ')
Frontend manifest SHA-256: $(shasum -a 256 public/build/manifest.json | awk '{print $1}')

This package intentionally excludes .env, vendor, node_modules, the inventory workbook,
local databases, logs, credentials and user uploads. Run Composer on the staging host.
EOF

archive="artifacts/${package_name}.tar.gz"
tar -czf "$archive" -C "$temporary_root" "$package_name"
shasum -a 256 "$archive" > "${archive}.sha256"

echo "Created $archive"
echo "Created ${archive}.sha256"
