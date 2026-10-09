#!/bin/bash
set -euo pipefail

if (( $# > 1 )) || [[ ${1-} == '' && $# -gt 0 ]]; then
  echo "Usage: ./start.sh [nginx-output-directory]" >&2
  exit 1
fi

repo=$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)
webroot=$(node -e 'const fs = require("node:fs"); const path = require("node:path"); const p = path.resolve(process.argv[1]); console.log(fs.existsSync(p) ? fs.realpathSync(p) : p)' "${1:-/var/www/html}")
fallback_url=${DISPLAY_URL:-http://localhost}
cd "$repo"

# Cron normally lacks the desktop user's display environment.
if [[ -z ${XDG_RUNTIME_DIR:-} && -d /run/user/$(id -u) ]]; then
  export XDG_RUNTIME_DIR="/run/user/$(id -u)"
fi
if [[ -z ${WAYLAND_DISPLAY:-} && -n ${XDG_RUNTIME_DIR:-} ]]; then
  for socket in "$XDG_RUNTIME_DIR"/wayland-*; do
    if [[ -S "$socket" ]]; then
      export WAYLAND_DISPLAY=${socket##*/}
      break
    fi
  done
fi
if [[ -z ${DISPLAY:-} && -S /tmp/.X11-unix/X0 ]]; then
  export DISPLAY=:0
fi
if [[ -z ${DBUS_SESSION_BUS_ADDRESS:-} && -S ${XDG_RUNTIME_DIR:-/nonexistent}/bus ]]; then
  export DBUS_SESSION_BUS_ADDRESS="unix:path=$XDG_RUNTIME_DIR/bus"
fi

if [[ -f display.conf ]]; then
  source display.conf
  day=$(LC_ALL=C date +%a | tr '[:upper:]' '[:lower:]')
  time=$(date +%H%M)
  if [[ ",$DAYS," == *",$day,"* ]] &&
    (( 10#$time >= 10#${START//:/} && 10#$time < 10#${END//:/} )); then
    state=on
  else
    state=off
  fi
  echo "Display schedule: $day $time -> $state"
  if command -v wlr-randr >/dev/null 2>&1; then
    if ! wlr-randr --output "${DISPLAY_OUTPUT:-HDMI-A-1}" "--$state"; then
      echo "Could not turn display $state; check the output name and desktop session." >&2
    fi
  else
    echo "wlr-randr not found; skipping display schedule." >&2
  fi
fi

if [[ -n ${KIOSK_BROWSER:-} ]]; then
  browser=$KIOSK_BROWSER
elif command -v chromium >/dev/null 2>&1; then
  browser=chromium
elif command -v chromium-browser >/dev/null 2>&1; then
  browser=chromium-browser
else
  browser=firefox
fi
if ! command -v "$browser" >/dev/null 2>&1; then
  echo "No kiosk browser found; install Chromium or Firefox, or set KIOSK_BROWSER." >&2
  exit 1
fi

# Check the page before selecting it for the kiosk, even during a long build.
target_url=$fallback_url
if [[ -n ${PRIMARY_URL:-} ]]; then
  if [[ $PRIMARY_URL != http://* && $PRIMARY_URL != https://* ]]; then
    echo "PRIMARY_URL must be an HTTP(S) URL; using the local fallback." >&2
  elif curl --fail --location --silent --show-error --output /dev/null \
    --proto '=http,https' --proto-redir '=http,https' \
    --connect-timeout 3 --max-time 8 "$PRIMARY_URL"; then
    target_url=$PRIMARY_URL
  else
    echo "Primary URL unavailable; using the local fallback." >&2
  fi
fi

ensure_kiosk() {
  local target=$1 force=${2:-false} current=''
  if [[ -f tooling/.kiosk-target ]]; then
    current=$(<tooling/.kiosk-target)
  fi
  if [[ $force != true && $current == "$target" ]] && pgrep -f "$browser.*--kiosk" >/dev/null; then
    return
  fi
  pkill -f "$browser.*--kiosk" || true
  for attempt in 1 2 3; do
    if ! pgrep -f "$browser.*--kiosk" >/dev/null; then break; fi
    sleep 1
  done
  echo "Kiosk: $target"
  "$browser" --kiosk "$target" 9>&- >/dev/null 2>&1 &
  printf '%s\n' "$target" > tooling/.kiosk-target
}

ensure_kiosk "$target_url"

# A long build must not block the display schedule or URL switching.
exec 9>tooling/.start.lock
if ! flock -n 9; then
  echo "A previous start.sh run is still active; skipping."
  exit 0
fi

if [[ "$webroot" == / || "$webroot" == "$repo" || "$webroot" == "$repo/"* ]]; then
  echo "Output directory must be outside the project and cannot be /" >&2
  exit 1
fi

previous=$(git rev-parse HEAD)
updated=false
install=false
if git fetch origin main; then
  if git merge --ff-only FETCH_HEAD; then
    if [[ $(git rev-parse HEAD) != "$previous" ]]; then
      updated=true
      if ! git diff --quiet "$previous" HEAD -- package.json package-lock.json; then
        install=true
      fi
    fi
  else
    echo "Could not fast-forward; leaving local files untouched and using the current revision." >&2
  fi
else
  echo "Could not fetch updates; using the current revision." >&2
fi

if [[ ! -x node_modules/.bin/vite || "$install" == true ]]; then
  echo "Installing build dependencies..."
  npm ci --include=dev
fi

rebuild=$updated
if [[ ${REBUILD:-0} == 1 || ! -f "$webroot/index.html" ]]; then
  rebuild=true
elif [[ -n $(find content -type f ! -path 'content/generated/*' -newer "$webroot/index.html" -print -quit) ]]; then
  rebuild=true
fi

if [[ "$rebuild" == true ]]; then
  echo "Building site into $webroot..."
  npm run build -- --outDir "$webroot" --emptyOutDir
fi

# Reload the fallback only if its local build changed; leave a live page alone.
if [[ "$rebuild" == true && -f tooling/.kiosk-target && $(<tooling/.kiosk-target) == "$fallback_url" ]]; then
  ensure_kiosk "$fallback_url" true
fi
