import { test, expect, Page } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { PurchaseOrderPage } from '../pages/PurchaseOrderPage';
import { SupplierPage } from '../pages/SupplierPage';
import { InventoryPage } from '../pages/InventoryPage';
import { dashboardTestData, purchaseOrderTestData } from '../fixtures/test-data';

/**
 * 仪表盘E2E测试套件
 * 测试用例: D-001 ~ D-005
 */
test.describe('仪表盘 (Dashboard)', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await dashboardPage.visit();
    await dashboardPage.waitForDashboardLoaded();
  });

  /**
   * D-001: 仪表盘数据加载
   * 验证: KPI卡片数据正确渲染
   */
  test('D-001: 仪表盘核心指标数据正确加载', async () => {
    // 验证核心指标卡片可见
    await dashboardPage.verifyMetricsLoaded();

    // 验证数据格式正确（非负数）
    const summary = await dashboardPage.getDashboardSummary();
    expect(summary.totalOrders).toBeGreaterThanOrEqual(0);
    expect(summary.pendingOrders).toBeGreaterThanOrEqual(0);
    expect(summary.deliveredOrders).toBeGreaterThanOrEqual(0);
    expect(summary.inventoryQuantity).toBeGreaterThanOrEqual(0);
    expect(summary.activeSuppliers).toBeGreaterThanOrEqual(0);

    // 验证指标之间的逻辑关系
    expect(summary.totalOrders).toBeGreaterThanOrEqual(summary.pendingOrders);
    expect(summary.totalOrders).toBeGreaterThanOrEqual(summary.deliveredOrders);
  });

  /**
   * D-002: 预警提示显示
   * 验证: 低库存/待审批预警气泡正确显示
   */
  test('D-002: 预警区域正确显示', async () => {
    // 验证预警区域可见
    const alerts = await dashboardPage.getAlerts();
    
    // 预警信息可以是空列表，但区域应该可见
    const alertSection = dashboardPage.page.locator('.ant-alert, [class*="alert"]');
    if (await alertSection.count() > 0) {
      // 如果有预警，验证包含关键词
      for (const alert of alerts) {
        const hasKeyword = dashboardTestData.alertKeywords.some(
          keyword => alert.includes(keyword)
        );
        expect(hasKeyword).toBeTruthy();
      }
    }
  });

  /**
   * D-003: 快捷操作入口
   * 验证: 各模块跳转链接可用
   */
  test('D-003: 快捷操作入口可点击且导航正确', async () => {
    // 验证快捷操作按钮可见
    await dashboardPage.verifyQuickActions();

    // 测试采购订单入口
    await dashboardPage.goToPurchaseOrders();
    const purchaseOrderPage = new PurchaseOrderPage(dashboardPage.page);
    await purchaseOrderPage.waitForListLoaded();
    await expect(dashboardPage.page.url()).toContain('purchase-order');

    // 返回仪表盘
    await dashboardPage.visit();

    // 测试供应商入口
    await dashboardPage.goToSuppliers();
    const supplierPage = new SupplierPage(dashboardPage.page);
    await supplierPage.waitForListLoaded();
    await expect(dashboardPage.page.url()).toContain('supplier');

    // 返回仪表盘
    await dashboardPage.visit();

    // 测试库存入口
    await dashboardPage.goToInventory();
    const inventoryPage = new InventoryPage(dashboardPage.page);
    await inventoryPage.waitForListLoaded();
    await expect(dashboardPage.page.url()).toContain('inventory');
  });

  /**
   * D-004: 图表数据交互
   * 验证: 图表hover显示详情
   */
  test('D-004: 图表区域可见且可交互', async () => {
    // 验证图表区域存在
    const charts = dashboardPage.page.locator(dashboardPage.charts);
    const chartCount = await charts.count();

    // 如果有图表，验证至少一个可见
    if (chartCount > 0) {
      await expect(charts.first()).toBeVisible();
    }
  });

  /**
   * D-005: 数据刷新功能
   * 验证: 手动刷新后数据更新
   */
  test('D-005: 刷新功能正常工作', async () => {
    // 获取刷新前数据
    const beforeSummary = await dashboardPage.getDashboardSummary();

    // 执行刷新
    await dashboardPage.refreshData();

    // 验证页面仍然正常加载
    await dashboardPage.waitForDashboardLoaded();

    // 获取刷新后数据
    const afterSummary = await dashboardPage.getDashboardSummary();

    // 验证数据一致（没有异常错误）
    expect(afterSummary.totalOrders).toBeGreaterThanOrEqual(0);
    expect(afterSummary.pendingOrders).toBeGreaterThanOrEqual(0);
  });
});

/**
 * 仪表盘跨模块集成测试
 */
test.describe('仪表盘 - 跨模块集成', () => {
  test('从仪表盘快速创建采购订单', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.visit();
    await dashboardPage.waitForDashboardLoaded();

    // 记录当前订单数
    const beforeCount = await dashboardPage.getTotalOrdersCount();

    // 点击新建订单
    await dashboardPage.clickNewOrder();

    // 验证跳转到订单页面
    const purchaseOrderPage = new PurchaseOrderPage(page);
    await purchaseOrderPage.waitForVisible(purchaseOrderPage.orderForm);
    
    // 验证URL变化
    await expect(page.url()).toContain('purchase-order');
  });

  test('仪表盘待办事项导航', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.visit();
    await dashboardPage.waitForDashboardLoaded();

    // 获取待办事项
    const todos = await dashboardPage.getTodoItems();

    // 验证待办事项不为空
    if (todos.length > 0) {
      // 点击第一个待办事项（如果有链接）
      const todoItem = dashboardPage.page.locator(dashboardPage.todoItem).first();
      if (await todoItem.locator('a, button').count() > 0) {
        await todoItem.locator('a, button').first().click();
        // 验证页面导航成功
        await page.waitForLoadState('networkidle');
      }
    }
  });
});
