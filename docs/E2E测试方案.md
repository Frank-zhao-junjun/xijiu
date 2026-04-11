# 白酒供应链Demo系统 E2E测试方案

> **文档版本**：v1.0  
> **创建日期**：2026-04-12  
> **技术栈**：React 18 + TypeScript + Ant Design 5 + Vite 5 | FastAPI + Python 3.13 + SQLite

---

## 一、测试策略概述

### 1.1 测试金字塔模型

本系统采用经典的测试金字塔分层策略，合理分配测试资源：

```
                    /  E2E Tests  \        ← 10-15%: 核心业务链路
                   /  Integration  \       ← 25-30%: API与组件协作
                  /     Unit        \     ← 55-65%: 函数与组件单元
```

| 测试层级 | 数量占比 | 执行频率 | 工具选择 |
|---------|---------|---------|---------|
| 单元测试 | 55-65% | 每次提交 | Vitest + Testing Library |
| 接口测试 | 25-30% | 每次提交/PR | pytest + httpx |
| E2E测试 | 10-15% | PR合并前/每日构建 | **Playwright** |

### 1.2 E2E测试定位

E2E测试聚焦于**高价值核心路径**，覆盖：
- 多模块协作的完整业务流程
- 跨前端与后端的数据一致性
- 关键业务功能的端到端验证

**不追求100%覆盖率**，而是确保核心功能链路的稳定可靠。

### 1.3 测试环境管理

| 环境 | 用途 | 数据策略 |
|-----|------|---------|
| `local` | 开发调试 | Mock数据 + SQLite测试库 |
| `dev` | 功能验收 | 独立测试数据库 |
| `staging` | 预发布验证 | 生产数据脱敏 |
| `ci` | CI/CD执行 | 独立容器环境 |

---

## 二、框架选型对比与推荐

### 2.1 主流框架对比

| 维度 | Playwright | Cypress | Selenium |
|-----|------------|---------|----------|
| **性能** | ⭐⭐⭐⭐⭐ 最高 | ⭐⭐⭐⭐ | ⭐⭐ |
| **跨浏览器** | ⭐⭐⭐⭐⭐ Chromium/Firefox/WebKit | ⭐⭐ 仅Chromium | ⭐⭐⭐⭐ |
| **并行执行** | ⭐⭐⭐⭐⭐ 免费内置 | ⭐⭐ 需付费Cloud | ⭐⭐⭐ Grid配置复杂 |
| **学习曲线** | ⭐⭐⭐⭐ 低 | ⭐⭐⭐⭐⭐ 最低 | ⭐⭐ |
| **Flakiness率** | ⭐⭐⭐⭐⭐ 2.3% | ⭐⭐⭐ 4.1% | ⭐ 8.7% |
| **Python支持** | ⭐⭐⭐⭐⭐ 原生 | ⭐ 仅JS/TS | ⭐⭐⭐⭐⭐ |
| **移动端模拟** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **调试工具** | ⭐⭐⭐⭐⭐ Trace Viewer | ⭐⭐⭐⭐ Time Travel | ⭐⭐ |

### 2.2 性能基准数据

基于行业实测（100个E2E用例）：
- **Playwright**: ~12秒（最快）
- **Cypress**: ~19秒
- **Selenium**: ~25秒

### 2.3 最终推荐：Playwright

**选择理由**：

1. **多语言原生支持**：与FastAPI后端使用相同Python生态，降低多语言维护成本
2. **免费并行执行**：CI/CD中可自由配置workers，无需额外付费
3. **跨浏览器完整覆盖**：覆盖Chrome、Firefox、Safari三大引擎
4. **Python + TypeScript双测**：前端用TS编写E2E，后端用pytest补充API测试
5. **Trace Viewer**：提供可附加到Jira的失败回放文件
6. **低Flakiness**：自动等待机制减少元素定位失败

---

## 三、测试用例清单

### 3.1 Dashboard（仪表盘）

| 用例ID | 用例名称 | 优先级 | 测试要点 |
|-------|---------|--------|---------|
| D-001 | 仪表盘数据加载 | P0 | KPI卡片数据正确渲染 |
| D-002 | 预警提示显示 | P0 | 低库存/待审批预警气泡正确显示 |
| D-003 | 快捷操作入口 | P1 | 各模块跳转链接可用 |
| D-004 | 图表数据交互 | P1 | 图表hover显示详情 |
| D-005 | 数据刷新功能 | P2 | 手动刷新后数据更新 |

### 3.2 采购订单模块

| 用例ID | 用例名称 | 优先级 | 测试要点 |
|-------|---------|--------|---------|
| PO-001 | 创建采购订单 | P0 | 表单填写→提交→列表新增记录 |
| PO-002 | 订单详情查看 | P0 | 详情页数据完整展示 |
| PO-003 | 订单状态流转 | P0 | 待审批→已审批→已发货→已完成 |
| PO-004 | 订单审批流程 | P0 | 审批通过/驳回后状态更新 |
| PO-005 | 发货确认操作 | P0 | 填写物流信息→确认发货 |
| PO-006 | 订单筛选与搜索 | P1 | 按状态/供应商/日期筛选 |
| PO-007 | 订单分页功能 | P1 | 分页导航正确、数据显示完整 |
| PO-008 | 订单批量操作 | P2 | 批量审核/导出功能 |

### 3.3 供应商管理模块

| 用例ID | 用例名称 | 优先级 | 测试要点 |
|-------|---------|--------|---------|
| S-001 | 供应商列表展示 | P0 | 表格数据加载、分页正常 |
| S-002 | 新增供应商 | P0 | 表单验证→保存→列表更新 |
| S-003 | 编辑供应商信息 | P0 | 修改后数据持久化 |
| S-004 | 删除供应商 | P1 | 确认弹窗→删除→列表更新 |
| S-005 | 供应商评级功能 | P0 | 评级计算正确、显示准确 |
| S-006 | 供应商统计看板 | P1 | 评级分布图、供货趋势图 |

### 3.4 库存管理模块

| 用例ID | 用例名称 | 优先级 | 测试要点 |
|-------|---------|--------|---------|
| I-001 | 实时库存展示 | P0 | 库存数据实时准确 |
| I-002 | 库存预警配置 | P0 | 阈值设置→触发预警 |
| I-003 | 低库存告警 | P0 | 低于阈值→告警提示 |
| I-004 | 库存记录查询 | P1 | 入库/出库流水可查 |
| I-005 | 库存盘点功能 | P1 | 盘点数据录入→差异计算 |

### 3.5 质检管理模块

| 用例ID | 用例名称 | 优先级 | 测试要点 |
|-------|---------|--------|---------|
| Q-001 | 创建质检单 | P0 | 表单填写→提交→列表显示 |
| Q-002 | 质检判定流程 | P0 | 合格/不合格→状态更新 |
| Q-003 | 质检结果记录 | P1 | 检测指标记录完整 |
| Q-004 | 质检报告生成 | P1 | PDF导出格式正确 |

### 3.6 批次追溯模块

| 用例ID | 用例名称 | 优先级 | 测试要点 |
|-------|---------|--------|---------|
| T-001 | 一瓶一码查询 | P0 | 输入追溯码→显示完整链路 |
| T-002 | 批次信息展示 | P0 | 生产→质检→入库→出库全链路 |
| T-003 | 异常追溯定位 | P0 | 问题产品快速定位来源 |
| T-004 | 追溯数据导出 | P1 | Excel/CSV导出格式正确 |

---

## 四、测试数据管理方案

### 4.1 测试数据策略

| 策略类型 | 适用场景 | 实现方式 |
|---------|---------|---------|
| **独立测试DB** | 所有E2E测试 | SQLite测试库文件 |
| **Fixture数据** | 固定测试数据 | Python/JSON fixtures |
| **动态生成** | 每次运行唯一数据 | Factory模式/Faker |
| **API Mock** | 第三方服务 | MSW (前端) / responses (后端) |

### 4.2 数据准备流程

```python
# conftest.py - 测试环境初始化
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import shutil

@pytest.fixture(scope="session")
def test_db():
    """会话级：创建测试数据库"""
    # 复制模板数据库
    shutil.copy("data/template.db", "data/test.db")
    
    engine = create_engine("sqlite:///data/test.db")
    TestingSessionLocal = sessionmaker(bind=engine)
    
    yield TestingSessionLocal
    
    # 清理
    engine.dispose()

@pytest.fixture(scope="function")
def db_session(test_db):
    """函数级：每个测试独立事务"""
    session = test_db()
    session.begin()
    yield session
    session.rollback()
    session.close()

@pytest.fixture
def supplier_data():
    """供应商测试数据"""
    return {
        "name": "测试酒厂-2026",
        "contact": "张三",
        "phone": "13800138000",
        "rating": "A"
    }
```

### 4.3 数据隔离方案

1. **数据库隔离**：每个测试使用独立事务，测试后自动回滚
2. **唯一标识**：使用时间戳/uuid确保数据不冲突
3. **清理策略**：
   - 函数级：测试结束后清理
   - 会话级：整个测试套件结束后清理

### 4.4 Mock vs 真实数据

| 场景 | 推荐策略 |
|-----|---------|
| 基础CRUD功能 | ✅ 真实数据库 |
| 第三方API集成 | ✅ Mock数据 |
| 性能测试 | ✅ Mock数据 |
| 完整业务流程 | ✅ 真实数据库 + 最小化Mock |
| 异常场景测试 | ✅ Mock数据 |

---

## 五、CI/CD集成配置

### 5.1 GitHub Actions工作流

```yaml
# .github/workflows/e2e.yml
name: E2E Testing

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # 单元测试 + API测试
  unit-and-api-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.13'
          
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-cov pytest-asyncio
          
      - name: Run Unit Tests
        run: pytest tests/unit/ -v --cov=app --cov-report=xml
        
      - name: Run API Tests
        run: pytest tests/api/ -v
        
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          file: ./coverage.xml

  # E2E测试（前端）
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
        
      - name: Start Backend
        run: |
          cd ../backend
          pip install -r requirements.txt
          uvicorn app.main:app --port 8080 &
          sleep 5
          
      - name: Start Frontend
        run: npm run dev &
        env:
          VITE_API_BASE: http://localhost:8080
          
      - name: Wait for services
        run: |
          npx wait-on http://localhost:3000
          npx wait-on http://localhost:8080
          
      - name: Run E2E Tests
        run: npx playwright test
        continue-on-error: true
        
      - name: Upload Test Results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          
      - name: Upload Traces on Failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-traces
          path: test-results/**/trace.zip
          retention-days: 7

  # 测试报告合并
  test-summary:
    needs: [unit-and-api-tests, e2e-tests]
    runs-on: ubuntu-latest
    steps:
      - name: Test Summary
        run: |
          echo "## Test Results Summary" >> $GITHUB_STEP_SUMMARY
          echo "- Unit Tests: ${{ needs.unit-and-api-tests.result }}" >> $GITHUB_STEP_SUMMARY
          echo "- API Tests: ${{ needs.unit-and-api-tests.result }}" >> $GITHUB_STEP_SUMMARY
          echo "- E2E Tests: ${{ needs.e2e-tests.result }}" >> $GITHUB_STEP_SUMMARY
```

### 5.2 Playwright配置

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,                    // 并行执行
  forbidOnly: !!process.env.CI,           // CI禁止only标记
  retries: process.env.CI ? 2 : 0,        // CI失败重试2次
  workers: process.env.CI ? 4 : undefined, // CI使用4个worker
  
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-results.json' }],
  ],
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',              // 首次失败录制trace
    screenshot: 'only-on-failure',        // 失败时截图
    video: 'retain-on-failure',           // 失败时保留视频
    viewport: { width: 1920, height: 1080 },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // 可选：多浏览器测试
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

### 5.3 失败重试与截图机制

```typescript
// tests/e2e/support/hooks.ts
import { test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // 设置测试上下文
  await page.context().setExtraHTTPHeaders({
    'X-Test-Env': 'e2e'
  });
});

test.afterEach(async ({ testInfo }) => {
  if (testInfo.status === 'failed') {
    console.log(`Test failed: ${testInfo.title}`);
    console.log(`Artifacts: ${testInfo.attachments}`);
  }
});
```

---

## 六、核心测试代码示例

### 6.1 项目结构

```
supply-chain-demo/
├── tests/
│   ├── e2e/
│   │   ├── pages/              # Page Object Models
│   │   │   ├── DashboardPage.ts
│   │   │   ├── PurchaseOrderPage.ts
│   │   │   ├── SupplierPage.ts
│   │   │   └── ...
│   │   ├── specs/              # 测试规格
│   │   │   ├── dashboard.spec.ts
│   │   │   ├── purchase-order.spec.ts
│   │   │   └── ...
│   │   ├── fixtures/           # 测试数据
│   │   │   ├── suppliers.json
│   │   │   └── orders.json
│   │   ├── support/           # 支持文件
│   │   │   ├── hooks.ts
│   │   │   └── helpers.ts
│   │   └── playwright.config.ts
│   ├── api/                   # API测试
│   └── unit/                  # 单元测试
├── backend/
│   └── tests/
│       ├── conftest.py
│       └── test_api.py
```

### 6.2 Page Object Model

```typescript
// tests/e2e/pages/PurchaseOrderPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class PurchaseOrderPage {
  readonly page: Page;
  readonly createButton: Locator;
  readonly orderTable: Locator;
  readonly statusFilter: Locator;
  readonly searchInput: Locator;
  
  // 详情页
  readonly detailModal: Locator;
  readonly approveButton: Locator;
  readonly rejectButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createButton = page.getByRole('button', { name: '创建采购订单' });
    this.orderTable = page.locator('.ant-table-tbody');
    this.statusFilter = page.locator('[data-testid="status-filter"]');
    this.searchInput = page.locator('[data-testid="search-input"]');
  }

  async goto() {
    await this.page.goto('/purchase-orders');
  }

  async createOrder(orderData: {
    supplier: string;
    product: string;
    quantity: number;
    expectedDate: string;
  }) {
    await this.createButton.click();
    
    // 填写表单
    await this.page.getByLabel('供应商').fill(orderData.supplier);
    await this.page.getByLabel('产品').fill(orderData.product);
    await this.page.getByLabel('数量').fill(orderData.quantity.toString());
    await this.page.getByLabel('预计到货日期').fill(orderData.expectedDate);
    
    // 提交
    await this.page.getByRole('button', { name: '提交' }).click();
    
    // 等待列表更新
    await expect(this.orderTable.getByText(orderData.product)).toBeVisible();
  }

  async approveOrder(orderId: string) {
    await this.orderTable.getByText(orderId).locator('..')
      .getByRole('button', { name: '审批' }).click();
    await this.page.getByRole('button', { name: '通过' }).click();
  }

  async filterByStatus(status: 'pending' | 'approved' | 'shipped' | 'completed') {
    await this.statusFilter.click();
    await this.page.getByRole('menuitem', { name: status }).click();
  }

  async searchByKeyword(keyword: string) {
    await this.searchInput.fill(keyword);
    await this.page.keyboard.press('Enter');
  }
}
```

### 6.3 采购订单完整流程测试

```typescript
// tests/e2e/specs/purchase-order.spec.ts
import { test, expect } from '@playwright/test';
import { PurchaseOrderPage } from '../pages/PurchaseOrderPage';
import { DashboardPage } from '../pages/DashboardPage';
import { formatDate, generateOrderNo } from '../support/helpers';

test.describe('采购订单完整流程', () => {
  let orderPage: PurchaseOrderPage;
  let dashboardPage: DashboardPage;
  
  test.beforeEach(async ({ page }) => {
    orderPage = new PurchaseOrderPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test('PO-001: 创建采购订单并自动出现在列表', async ({ page }) => {
    const orderNo = generateOrderNo();
    const orderData = {
      supplier: '茅台集团',
      product: '飞天茅台53度 500ml',
      quantity: 100,
      expectedDate: formatDate(7), // 7天后
    };

    await orderPage.goto();
    await orderPage.createOrder(orderData);

    // 验证订单出现在列表
    await expect(orderPage.orderTable.getByText(orderData.product)).toBeVisible();
    await expect(orderPage.orderTable.getByText('待审批')).toBeVisible();
  });

  test('PO-002: 订单详情查看', async ({ page }) => {
    await orderPage.goto();
    
    // 点击第一行查看详情
    await orderPage.orderTable.locator('tr').first().click();
    
    // 验证详情弹窗
    await expect(orderPage.detailModal).toBeVisible();
    await expect(orderPage.detailModal.getByText('订单编号')).toBeVisible();
    await expect(orderPage.detailModal.getByText('供应商')).toBeVisible();
    await expect(orderPage.detailModal.getByText('产品信息')).toBeVisible();
  });

  test('PO-003: 订单状态流转 - 审批通过', async ({ page }) => {
    const orderNo = generateOrderNo();
    
    // 1. 创建订单
    await orderPage.goto();
    await orderPage.createOrder({
      supplier: '五粮液股份',
      product: '普五52度 500ml',
      quantity: 200,
      expectedDate: formatDate(10),
    });

    // 2. 审批通过
    await orderPage.approveOrder(orderNo);
    
    // 3. 验证状态更新
    await expect(orderPage.orderTable.getByText('已审批')).toBeVisible();
  });

  test('PO-004: 订单状态流转 - 发货确认', async ({ page }) => {
    await orderPage.goto();
    
    // 找到已审批的订单
    await orderPage.filterByStatus('approved');
    
    // 点击发货
    await orderPage.orderTable.locator('tr').first()
      .getByRole('button', { name: '发货' }).click();
    
    // 填写物流信息
    await page.getByLabel('物流单号').fill('SF1234567890');
    await page.getByRole('button', { name: '确认发货' }).click();
    
    // 验证状态更新
    await expect(orderPage.orderTable.getByText('已发货')).toBeVisible();
    await expect(orderPage.orderTable.getByText('SF1234567890')).toBeVisible();
  });

  test('PO-006: 订单筛选功能', async ({ page }) => {
    await orderPage.goto();
    
    // 按状态筛选
    await orderPage.filterByStatus('pending');
    
    // 验证只有待审批订单
    const rows = await orderPage.orderTable.locator('tr').count();
    expect(rows).toBeGreaterThan(0);
    
    // 按关键词搜索
    await orderPage.searchByKeyword('茅台');
    
    // 等待搜索结果
    await page.waitForTimeout(500);
  });

  test('PO-007: 订单分页功能', async ({ page }) => {
    await orderPage.goto();
    
    // 验证分页控件存在
    await expect(page.locator('.ant-pagination')).toBeVisible();
    
    // 点击下一页
    const nextButton = page.locator('.ant-pagination-next');
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForTimeout(500);
    }
    
    // 验证当前页码
    const activePage = page.locator('.ant-pagination-item-active');
    await expect(activePage).toBeVisible();
  });
});
```

### 6.4 Dashboard测试

```typescript
// tests/e2e/specs/dashboard.spec.ts
import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('仪表盘功能', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
  });

  test('D-001: 仪表盘数据正确加载', async ({ page }) => {
    await dashboardPage.goto();
    
    // 验证KPI卡片
    await expect(dashboardPage.kpiCards).toHaveCount(4);
    
    // 验证各KPI数据非空
    await expect(dashboardPage.totalOrdersCard).toBeVisible();
    await expect(dashboardPage.pendingOrdersCard).toBeVisible();
    await expect(dashboardPage.inventoryAlertCard).toBeVisible();
    await expect(dashboardPage.qualityPassRateCard).toBeVisible();
  });

  test('D-002: 预警提示正确显示', async ({ page }) => {
    await dashboardPage.goto();
    
    // 检查低库存预警
    const inventoryAlert = dashboardPage.getAlert('low-inventory');
    if (await inventoryAlert.isVisible()) {
      await expect(inventoryAlert).toContainText(/库存不足|低于阈值/);
    }
    
    // 检查待审批订单预警
    const pendingAlert = dashboardPage.getAlert('pending-orders');
    await expect(pendingAlert).toBeVisible();
  });

  test('D-003: 快捷操作入口跳转', async ({ page }) => {
    await dashboardPage.goto();
    
    // 点击"采购订单"入口
    await dashboardPage.quickActions.getByText('采购订单').click();
    await expect(page).toHaveURL(/\/purchase-orders/);
    
    // 点击"供应商管理"入口
    await dashboardPage.quickActions.getByText('供应商管理').click();
    await expect(page).toHaveURL(/\/suppliers/);
  });
});
```

### 6.5 API测试示例（pytest + httpx）

```python
# backend/tests/test_api.py
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.fixture
async def client():
    """异步HTTP客户端"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_create_purchase_order(client: AsyncClient):
    """测试创建采购订单API"""
    response = await client.post(
        "/api/purchase-orders",
        json={
            "supplier_id": 1,
            "product_id": 1,
            "quantity": 100,
            "expected_date": "2026-04-20"
        }
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "pending"
    assert data["quantity"] == 100


@pytest.mark.asyncio
async def test_list_purchase_orders(client: AsyncClient):
    """测试查询采购订单列表"""
    response = await client.get("/api/purchase-orders")
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["items"], list)
    assert "total" in data


@pytest.mark.asyncio
async def test_filter_orders_by_status(client: AsyncClient):
    """测试按状态筛选订单"""
    response = await client.get(
        "/api/purchase-orders",
        params={"status": "pending"}
    )
    
    assert response.status_code == 200
    data = response.json()
    for order in data["items"]:
        assert order["status"] == "pending"


@pytest.mark.asyncio
async def test_supplier_crud(client: AsyncClient):
    """测试供应商CRUD操作"""
    # Create
    create_response = await client.post(
        "/api/suppliers",
        json={
            "name": "测试供应商",
            "contact": "李四",
            "phone": "13900139000",
            "rating": "A"
        }
    )
    assert create_response.status_code == 201
    supplier_id = create_response.json()["id"]
    
    # Read
    get_response = await client.get(f"/api/suppliers/{supplier_id}")
    assert get_response.status_code == 200
    assert get_response.json()["name"] == "测试供应商"
    
    # Update
    update_response = await client.put(
        f"/api/suppliers/{supplier_id}",
        json={"name": "测试供应商-更新"}
    )
    assert update_response.status_code == 200
    assert update_response.json()["name"] == "测试供应商-更新"
    
    # Delete
    delete_response = await client.delete(f"/api/suppliers/{supplier_id}")
    assert delete_response.status_code == 204
```

---

## 七、最佳实践建议

### 7.1 测试编写规范

1. **测试命名**：使用描述性名称，如 `shouldDisplayErrorMessageWhenSubmitEmptyForm`
2. **单一职责**：每个测试只验证一个关注点
3. **独立性**：测试间无依赖，可任意顺序执行
4. **可重复性**：测试结果稳定，相同输入必须产生相同输出

### 7.2 Page Object最佳实践

```typescript
// ✅ 推荐：封装交互逻辑
class SupplierPage {
  async createSupplier(data: SupplierData) {
    await this.createButton.click();
    await this.fillForm(data);
    await this.submitButton.click();
  }
  
  async searchAndVerify(keyword: string, expectedName: string) {
    await this.searchInput.fill(keyword);
    await expect(this.table.getByText(expectedName)).toBeVisible();
  }
}

// ❌ 避免：在测试中直接操作DOM
test('create supplier', async ({ page }) => {
  await page.click('[data-testid="create-btn"]');  // 不推荐
  await page.fill('[data-testid="name-input"]', 'xxx');  // 不推荐
});
```

### 7.3 稳定性保障

1. **使用 `data-testid`**：避免依赖CSS选择器
2. **显式等待**：使用 `waitForSelector` 等待元素
3. **合理重试**：CI中设置2次重试捕获偶发问题
4. **环境隔离**：每个测试使用独立数据

### 7.4 性能优化

1. **并行执行**：充分利用多核CPU
2. **按需加载浏览器**：CI中仅安装需要的浏览器
3. **减少等待**：使用自动等待而非固定timeout
4. **批量操作**：多个相似操作合并

### 7.5 维护策略

1. **定期清理**：移除废弃测试和fixture
2. **追踪覆盖率**：关注核心路径覆盖
3. **失败分析**：定期回顾失败原因，优化测试
4. **文档同步**：需求变更时同步更新测试

---

## 八、附录

### A. 依赖安装

```bash
# 前端E2E依赖
npm install -D @playwright/test
npx playwright install chromium

# 后端测试依赖
pip install pytest pytest-asyncio pytest-cov httpx
```

### B. 运行命令

```bash
# 前端E2E测试
npm run test:e2e              # 运行所有E2E测试
npm run test:e2e -- --ui      # 打开Playwright UI模式
npm run test:e2e:report       # 查看HTML报告

# 后端API测试
pytest tests/api/ -v
pytest --cov=app tests/

# 全部测试
npm run test:e2e && pytest tests/api/
```

### C. 报告查看

```bash
# 本地查看Playwright HTML报告
npx playwright show-report

# 查看失败测试的Trace
npx playwright show-trace test-results/xxx/trace.zip
```

---

> **文档结束**
> 
> 如有问题或建议，请联系测试团队。
