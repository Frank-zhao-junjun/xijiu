# Supply Chain E2E Tests

白酒供应链Demo系统的端到端测试套件

## 技术栈

- **E2E测试**: Playwright + TypeScript
- **API测试**: pytest + httpx
- **浏览器**: Chromium, Firefox, WebKit

## 目录结构

```
tests/
├── e2e/                          # Playwright E2E测试
│   ├── playwright.config.ts      # Playwright配置
│   ├── package.json              # 依赖配置
│   ├── pages/                    # Page Object Model
│   │   ├── BasePage.ts           # 基础页面类
│   │   ├── DashboardPage.ts      # 仪表盘页面
│   │   ├── PurchaseOrderPage.ts  # 采购订单页面
│   │   ├── SupplierPage.ts       # 供应商页面
│   │   └── InventoryPage.ts     # 库存页面
│   ├── fixtures/                 # 测试数据
│   │   └── test-data.ts
│   └── specs/                    # 测试用例
│       ├── dashboard.spec.ts     # 仪表盘测试
│       ├── purchase-order.spec.ts # 采购订单测试
│       ├── supplier.spec.ts      # 供应商测试
│       └── inventory.spec.ts     # 库存测试
└── api/                          # pytest API测试
    ├── conftest.py               # pytest配置
    ├── test_suppliers.py         # 供应商API测试
    ├── test_purchase_orders.py   # 采购订单API测试
    └── test_dashboard.py         # Dashboard API测试
```

## 快速开始

### 安装依赖

```bash
cd tests/e2e
npm install
```

### 运行E2E测试

```bash
# 运行所有测试
npm run test

# 带UI运行
npm run test:ui

# 调试模式
npm run test:debug

# 在特定浏览器运行
npx playwright test --project=chromium
```

### 运行API测试

```bash
cd tests/api
pip install pytest httpx pytest-asyncio
pytest -v
```

## 测试用例覆盖

### 仪表盘 (Dashboard)
- D-001: 仪表盘数据加载
- D-002: 预警提示显示
- D-003: 快捷操作入口
- D-004: 图表数据交互
- D-005: 数据刷新功能

### 采购订单 (Purchase Order)
- PO-001: 创建采购订单
- PO-002: 订单详情查看
- PO-003: 订单状态流转
- PO-004: 订单审批流程
- PO-005: 发货确认操作
- PO-006: 订单筛选与搜索
- PO-007: 订单分页功能
- PO-008: 订单批量操作

### 供应商管理 (Supplier)
- S-001: 供应商列表展示
- S-002: 新增供应商
- S-003: 编辑供应商信息
- S-004: 删除供应商
- S-005: 供应商评级功能
- S-006: 供应商统计看板

### 库存管理 (Inventory)
- I-001: 实时库存展示
- I-002: 库存预警配置
- I-003: 低库存告警
- I-004: 库存记录查询
- I-005: 库存盘点功能

## 环境配置

测试使用以下环境变量：

```bash
# 前端地址
FRONTEND_URL=http://localhost:3000

# 后端API地址
API_URL=http://localhost:8080

# 测试数据库
TEST_DB_PATH=./data/test.db
```

## CI/CD 集成

### GitHub Actions

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: cd tests/e2e && npm install
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      - name: Run tests
        run: npm run test
```

## 报告

测试报告生成在 `playwright-report/` 目录：

```bash
# 查看HTML报告
npm run report
```

## 调试技巧

1. **截图**: 失败时自动截图保存在 `test-results/`
2. **录像**: 失败用例自动录制保存在 `test-results/`
3. **Trace Viewer**: 使用 `playwright show-trace` 查看trace文件
4. **headed模式**: 使用 `npm run test:headed` 可视化调试
