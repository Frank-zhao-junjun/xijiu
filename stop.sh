#!/bin/bash

# 白酒供应链Demo系统停止脚本

echo "=========================================="
echo "  白酒供应链数字化管控平台 - 停止脚本"
echo "=========================================="

# 获取docker-compose命令
DOCKER_COMPOSE="docker-compose"
if ! command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
fi

echo ""
echo "🛑 停止所有服务..."
$DOCKER_COMPOSE down

echo ""
echo "✅ 服务已停止"
echo ""
echo "💡 如需清除所有数据，请运行："
echo "   docker volume rm supply-chain-demo_postgres_data"
echo ""
