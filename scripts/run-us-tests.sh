#!/usr/bin/env bash
# 启动 Docker Compose 后跑全量 US 矩阵测试。
# 用法:
#   ./scripts/run-us-tests.sh              # 直连后端 :8000
#   ./scripts/run-us-tests.sh --nginx      # 经 Nginx :3000
#   ./scripts/run-us-tests.sh --fresh      # down -v 后重建

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

THROUGH_NGINX=0
FRESH=0
for arg in "$@"; do
  case "$arg" in
    --nginx) THROUGH_NGINX=1 ;;
    --fresh) FRESH=1 ;;
  esac
done

if [[ "$FRESH" -eq 1 ]]; then
  echo ">>> docker compose down -v"
  docker compose down -v || true
fi

echo ">>> docker compose up -d --build"
docker compose up -d --build

BACKEND="http://127.0.0.1:8000/health"
NGINX="http://127.0.0.1:3000/health"

echo ">>> 等待后端就绪: $BACKEND"
for i in $(seq 1 60); do
  if curl -sf "$BACKEND" >/dev/null; then
    echo ">>> 后端已就绪"
    break
  fi
  sleep 2
  if [[ "$i" -eq 60 ]]; then
    echo "后端未就绪，请检查: docker compose logs backend" >&2
    exit 1
  fi
done

if [[ "$THROUGH_NGINX" -eq 1 ]]; then
  echo ">>> 等待 Nginx 就绪: $NGINX"
  for i in $(seq 1 45); do
    if curl -sf "$NGINX" >/dev/null; then
      echo ">>> Nginx 已就绪"
      break
    fi
    sleep 2
    if [[ "$i" -eq 45 ]]; then
      echo "Nginx 未就绪，请检查: docker compose logs frontend" >&2
      exit 1
    fi
  done
  export XIJIU_API_BASE="http://127.0.0.1:3000"
else
  export XIJIU_API_BASE="http://127.0.0.1:8000"
fi

echo ">>> XIJIU_API_BASE=$XIJIU_API_BASE"

if command -v python3 >/dev/null 2>&1; then PY=python3
elif command -v python >/dev/null 2>&1; then PY=python
else
  echo "未找到 Python，请安装后执行:" >&2
  echo "  export XIJIU_API_BASE=$XIJIU_API_BASE" >&2
  echo "  pip install -r requirements-dev.txt && pytest tests/api/test_user_stories_smoke.py -v" >&2
  exit 1
fi

"$PY" -m pip install -q -r requirements-dev.txt
"$PY" -m pytest tests/api/test_user_stories_smoke.py -v --tb=short
