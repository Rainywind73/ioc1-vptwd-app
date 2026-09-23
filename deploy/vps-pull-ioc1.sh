#!/bin/bash
# Kéo mã đã kiểm tra vào docroot app. Không đụng nginx, chứng chỉ, lab khác.
set -euo pipefail
SRC=/opt/ioc1-src
DST=/var/www/ioc1-vptwd/app
REPO=https://github.com/Rainywind73/ioc1-vptwd-app.git
FLAG=/etc/ioc1-cd.enable
LOG=/var/log/ioc1-cd.log
LOCK=/var/lock/ioc1-cd.lock

log() { printf '%s %s\n' "$(date -Is)" "$*" | tee -a "$LOG"; }

if [[ "$(id -u)" -ne 0 ]]; then
  echo "cần root" >&2
  exit 1
fi

mkdir -p "$SRC" "$DST" "$(dirname "$LOG")"
touch "$LOG"
exec 9>"$LOCK"
if ! flock -n 9; then
  log "bỏ qua — lượt trước còn chạy"
  exit 0
fi

if [[ ! -d "$SRC/.git" ]]; then
  log "clone lần đầu"
  git clone --depth 1 "$REPO" "$SRC"
else
  git -C "$SRC" fetch --depth 1 origin main
  git -C "$SRC" reset --hard origin/main
fi

SHA="$(git -C "$SRC" rev-parse HEAD)"
IDX="$SRC/app/index.html"
[[ -f "$IDX" ]] || { log "thiếu app/index.html"; exit 2; }
grep -q 'Trung tâm điều hành giám sát thông minh VPTWD' "$IDX" || { log "title lệch"; exit 3; }
grep -q 'BẢN NGHIÊN CỨU KIẾN TRÚC' "$IDX" || { log "thiếu banner"; exit 4; }
if grep -q 'BẢN CLONE NGHIÊN CỨU KIẾN TRÚC' "$IDX"; then
  log "còn CLONE"
  exit 5
fi
for need in app/css/app.css app/js/app.js app/js/router.js app/data/mock/boot.json app/data/mock/home.json; do
  [[ -f "$SRC/$need" ]] || { log "thiếu $need"; exit 6; }
done

if [[ ! -f "$FLAG" ]]; then
  log "CD tắt — đã pull $SHA, không rsync"
  exit 0
fi

rsync -a --delete --exclude '.well-known' "$SRC/app/" "$DST/"
printf '%s\n' "$SHA" > /var/lib/ioc1-revision
chown -R www-data:www-data /var/www/ioc1-vptwd
log "rsync $SHA"
curl -sf --max-time 15 https://ioc1.castidea.vn/healthz || true
