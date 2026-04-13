import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * DashboardPage - 仪表盘页面
 * 核心指标获取、预警检查、快捷操作
 */
export class DashboardPage extends BasePage {
  // 页面路径
  readonly path = '/';

  // 核心指标选择器
  readonly totalOrdersCard = '[data-testid="total-orders"], .ant-card:has-text("总订单数")';
  readonly pendingOrdersCard = '[data-testid="pending-orders"], .ant-card:has-text("待处理")';
  readonly deliveredOrdersCard = '[data-testid="delivered-orders"], .ant-card:has-text("已完成")';
  readonly totalAmountCard = '[data-testid="total-amount"], .ant-card:has-text("交易总额")';
  readonly inventoryCard = '[data-testid="inventory"], .ant-card:has-text("库存")';
  readonly supplierCard = '[data-testid="supplier"], .ant-card:has-text("供应商")';

  // 预警区域
  readonly alertList = '.ant-alert, [class*="alert"]';
  readonly alertItem = '[class*="alert"] .ant-alert-message, [class*="alert-message"]';
  
  // 待办事项
  readonly todoList = '[class*="todo"], .ant-todo-list';
  readonly todoItem = '[class*="todo-item"], .ant-list-item';
  
  // 快捷操作入口
  readonly quickActions = '[class*="quick-action"], [class*="shortcut"]';
  readonly newOrderButton = 'button:has-text("新建订单"), a:has-text("新建订单")';
  readonly supplierManageButton = 'a:has-text("供应商管理"), button:has-text("供应商管理")';
  readonly inventoryButton = 'a:has-text("库存查询"), button:has-text("库存查询")';

  // 图表区域
  readonly charts = '.ant-chart, [class*="chart"]';
  readonly fulfillmentChart = '[class*="fulfillment"], [id*="fulfillment"]';
  readonly trendChart = '[class*="trend"], [id*="trend"]';

  // 导航菜单
  readonly navMenu = '.ant-menu, nav';
  readonly dashboardNav = '.ant-menu-item:has-text("仪表盘"), .ant-menu-item:has-text("首页")';
  readonly purchaseOrderNav = 'a[href*="purchase-order"], .ant-menu-item:has-text("采购订单")';
  readonly supplierNav = 'a[href*="supplier"], .ant-menu-item:has-text("供应商")';
  readonly inventoryNav = 'a[href*="inventory"], .ant-menu-item:has-text("库存")';

  constructor(page: Page) {
    super(page);
  }

  /**
   * 访问仪表盘页面
   */
  async visit(): Promise<void> {
    await this.navigate(this.path);
    await this.waitForLoading();
  }

  /**
   * 等待仪表盘数据加载完成
   */
  async waitForDashboardLoaded(): Promise<void> {
    // 等待至少一个核心卡片加载
    await this.waitForVisible(this.totalOrdersCard, 15000);
    await this.waitForNetworkIdle();
  }

  /**
   * 获取总订单数
   */
  async getTotalOrdersCount(): Promise<number> {
    const card = await this.waitForVisible(this.totalOrdersCard);
    const text = await card.textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  /**
   * 获取待处理订单数
   */
  async getPendingOrdersCount(): Promise<number> {
    const card = await this.waitForVisible(this.pendingOrdersCard);
    const text = await card.textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  /**
   * 获取已完成订单数
   */
  async getDeliveredOrdersCount(): Promise<number> {
    const card = await this.waitForVisible(this.deliveredOrdersCard);
    const text = await card.textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  /**
   * 获取交易总额
   */
  async getTotalAmount(): Promise<string> {
    const card = await this.waitForVisible(this.totalAmountCard);
    return card.textContent() ?? '';
  }

  /**
   * 获取库存数量
   */
  async getInventoryQuantity(): Promise<number> {
    const card = await this.waitForVisible(this.inventoryCard);
    const text = await card.textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  /**
   * 获取活跃供应商数
   */
  async getActiveSupplierCount(): Promise<number> {
    const card = await this.waitForVisible(this.supplierCard);
    const text = await card.textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  /**
   * 获取所有预警信息
   */
  async getAlerts(): Promise<string[]> {
    const alerts = await this.page.locator(this.alertItem).all();
    const alertTexts: string[] = [];
    for (const alert of alerts) {
      const text = await alert.textContent();
      if (text) alertTexts.push(text.trim());
    }
    return alertTexts;
  }

  /**
   * 检查是否有警告级别预警
   */
  async hasWarningAlert(): Promise<boolean> {
    return this.page.locator('.ant-alert-warning, [class*="alert-warning"]').isVisible();
  }

  /**
   * 检查是否有错误级别预警
   */
  async hasErrorAlert(): Promise<boolean> {
    return this.page.locator('.ant-alert-error, [class*="alert-error"]').isVisible();
  }

  /**
   * 获取待办事项列表
   */
  async getTodoItems(): Promise<string[]> {
    const items = await this.page.locator(this.todoItem).all();
    const todos: string[] = [];
    for (const item of items) {
      const text = await item.textContent();
      if (text) todos.push(text.trim());
    }
    return todos;
  }

  /**
   * 点击新建订单按钮
   */
  async clickNewOrder(): Promise<void> {
    await this.click(this.newOrderButton);
    await this.waitForURL(/\/purchase-order/);
  }

  /**
   * 点击供应商管理入口
   */
  async clickSupplierManage(): Promise<void> {
    await this.click(this.supplierManageButton);
    await this.waitForURL(/\/supplier/);
  }

  /**
   * 点击库存查询入口
   */
  async clickInventory(): Promise<void> {
    await this.click(this.inventoryButton);
    await this.waitForURL(/\/inventory/);
  }

  /**
   * 导航到采购订单页面
   */
  async goToPurchaseOrders(): Promise<void> {
    await this.click(this.purchaseOrderNav);
    await this.waitForURL(/\/purchase-order/);
  }

  /**
   * 导航到供应商页面
   */
  async goToSuppliers(): Promise<void> {
    await this.click(this.supplierNav);
    await this.waitForURL(/\/supplier/);
  }

  /**
   * 导航到库存页面
   */
  async goToInventory(): Promise<void> {
    await this.click(this.inventoryNav);
    await this.waitForURL(/\/inventory/);
  }

  /**
   * 刷新数据
   */
  async refreshData(): Promise<void> {
    const refreshButton = this.page.locator('button[icon*="reload"], button:has-text("刷新")').first();
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await this.waitForLoading();
    }
  }

  /**
   * 验证核心指标数据正确加载
   */
  async verifyMetricsLoaded(): Promise<void> {
    await expect(this.page.locator(this.totalOrdersCard)).toBeVisible();
    await expect(this.page.locator(this.pendingOrdersCard)).toBeVisible();
    await expect(this.page.locator(this.deliveredOrdersCard)).toBeVisible();
    await expect(this.page.locator(this.totalAmountCard)).toBeVisible();
  }

  /**
   * 验证快捷操作入口可用
   */
  async verifyQuickActions(): Promise<void> {
    await expect(this.page.locator(this.newOrderButton)).toBeVisible();
    await expect(this.page.locator(this.supplierManageButton)).toBeVisible();
    await expect(this.page.locator(this.inventoryButton)).toBeVisible();
  }

  /**
   * 获取仪表盘完整摘要
   */
  async getDashboardSummary(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    deliveredOrders: number;
    totalAmount: string;
    inventoryQuantity: number;
    activeSuppliers: number;
    alertCount: number;
    todoCount: number;
  }> {
    return {
      totalOrders: await this.getTotalOrdersCount(),
      pendingOrders: await this.getPendingOrdersCount(),
      deliveredOrders: await this.getDeliveredOrdersCount(),
      totalAmount: await this.getTotalAmount(),
      inventoryQuantity: await this.getInventoryQuantity(),
      activeSuppliers: await this.getActiveSupplierCount(),
      alertCount: (await this.getAlerts()).length,
      todoCount: (await this.getTodoItems()).length,
    };
  }
}
