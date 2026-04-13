#!/bin/bash
# E2E测试快速启动脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
E2E_DIR="$SCRIPT_DIR"
API_DIR="$SCRIPT_DIR/../api"

echo "=========================================="
echo "白酒供应链Demo系统 - E2E测试框架"
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查Node.js
check_node() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}错误: Node.js 未安装${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓${NC} Node.js $(node --version)"
}

# 检查Python
check_python() {
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}错误: Python3 未安装${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓${NC} Python $(python3 --version)"
}

# 安装Playwright依赖
install_playwright() {
    echo ""
    echo -e "${YELLOW}[1/3] 安装E2E测试依赖...${NC}"
    cd "$E2E_DIR"
    
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    
    npx playwright install chromium --with-deps 2>/dev/null || true
    echo -e "${GREEN}✓${NC} E2E测试依赖安装完成"
}

# 安装pytest依赖
install_pytest() {
    echo ""
    echo -e "${YELLOW}[2/3] 安装API测试依赖...${NC}"
    cd "$API_DIR"
    
    pip3 install pytest pytest-asyncio httpx aiosqlite -q
    echo -e "${GREEN}✓${NC} API测试依赖安装完成"
}

# 运行E2E测试
run_e2e_tests() {
    echo ""
    echo -e "${YELLOW}[3/3] 运行E2E测试...${NC}"
    cd "$E2E_DIR"
    
    # 检查前端服务是否运行
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} 前端服务运行中 (http://localhost:3000)"
    else
        echo -e "${YELLOW}⚠${NC} 前端服务未运行，启动中..."
        echo "请手动运行: cd ../../frontend && npm run dev"
    fi
    
    echo ""
    echo "选择测试模式:"
    echo "1) 运行所有E2E测试"
    echo "2) 带UI运行E2E测试"
    echo "3) 运行特定测试文件"
    echo "4) 运行API测试"
    echo "5) 全部运行"
    echo "0) 退出"
    echo ""
    read -p "请选择 [1-5, 0]: " choice
    
    case $choice in
        1)
            npm run test
            ;;
        2)
            npm run test:ui
            ;;
        3)
            echo "可用的测试文件:"
            ls -1 specs/*.spec.ts
            read -p "输入文件名: " filename
            npx playwright test "specs/$filename"
            ;;
        4)
            cd "$API_DIR"
            pytest -v
            ;;
        5)
            cd "$E2E_DIR"
            npm run test
            cd "$API_DIR"
            pytest -v
            ;;
        0)
            exit 0
            ;;
        *)
            echo "无效选择"
            exit 1
            ;;
    esac
}

# 主流程
main() {
    echo ""
    echo "检查环境..."
    check_node
    check_python
    
    # 解析参数
    case "${1:-}" in
        install)
            install_playwright
            install_pytest
            echo ""
            echo -e "${GREEN}所有依赖安装完成！${NC}"
            ;;
        e2e)
            install_playwright
            cd "$E2E_DIR"
            npm run test
            ;;
        api)
            install_pytest
            cd "$API_DIR"
            pytest -v
            ;;
        all)
            install_playwright
            install_pytest
            run_e2e_tests
            ;;
        *)
            install_playwright
            install_pytest
            run_e2e_tests
            ;;
    esac
}

main "$@"
