#!/bin/bash
set -euo pipefail
SRC=/opt/ioc1-src
DST=/var/www/ioc1-vptwd/app
REPO=https://github.com/Rainywind73/ioc1-vptwd-app.git
FLAG=/etc/ioc1-cd.enable
if [[ "$(id -u)" -ne 0 ]]; then echo "cần root"; exit 1; fi
mkdir -p "$SRC" "$DST"
if [[ ! -d "$SRC/.git" ]]; then
  git clone --depth 1 "$REPO" "$SRC"
else
  git -C "$SRC" fetch --depth 1 origin main
  git -C "$SRC" reset --hard origin/main
fi
IDX="$SRC/app/index.html"
[[ -f "$IDX" ]] || { echo "thiếu app/index.html"; exit 2; }
grep -q 'Trung tâm điều hành giám sát thông minh VPTWD' "$IDX" || { echo "title lệch"; exit 3; }
grep -q 'BẢN NGHIÊN CỨU KIẾN TRÚC' "$IDX" || { echo "thiếu banner"; exit 4; }
if grep -q 'BẢN CLONE NGHIÊN CỨU KIẾN TRÚC' "$IDX"; then echo "còn CLONE"; exit 5; fi
if [[ ! -f "$FLAG" ]]; then
  echo "CD tắt — đã pull $SRC, không rsync"
  git -C "$SRC" rev-parse --short HEAD
  exit 0
fi
rsync -a --delete --exclude '.well-known' "$SRC/app/" "$DST/"
chown -R www-data:www-data /var/www/ioc1-vptwd
echo "rsync $(git -C "$SRC" rev-parse --short HEAD)"
curl -sf https://ioc1.castidea.vn/healthz || true
