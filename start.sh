#!/bin/bash

# 白酒供应链Demo系统启动脚本

set -e

echo "=========================================="
echo "  白酒供应链数字化管控平台 - 启动脚本"
echo "=========================================="

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 获取docker-compose命令
DOCKER_COMPOSE="docker-compose"
if ! command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
fi

echo ""
echo "📦 构建并启动容器..."
echo ""

# 构建并启动
$DOCKER_COMPOSE up -d --build

echo ""
echo "⏳ 等待服务启动..."
echo ""

# 等待后端服务启动
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ 后端服务已就绪 (端口 8000)"
        break
    fi
    echo "  等待后端启动... ($i/30)"
    sleep 2
done

# 等待前端服务启动
for i in {1..15}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ 前端服务已就绪 (端口 3000)"
        break
    fi
    echo "  等待前端启动... ($i/15)"
    sleep 2
done

echo ""
echo "=========================================="
echo "  🎉 启动完成！"
echo "=========================================="
echo ""
echo "📍 访问地址："
echo "   前端界面: http://localhost:3000"
echo "   API文档:  http://localhost:8000/docs"
echo ""
echo "📋 常用命令："
echo "   查看日志: $DOCKER_COMPOSE logs -f"
echo "   停止服务: $DOCKER_COMPOSE down"
echo "   重启服务: $DOCKER_COMPOSE restart"
echo ""
echo "🔐 默认数据库信息："
echo "   主机: localhost:5432"
echo "   数据库: supply_chain"
echo "   用户名: postgres"
echo "   密码: postgres"
echo ""
