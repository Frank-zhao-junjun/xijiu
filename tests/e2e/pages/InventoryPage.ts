import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * InventoryPage - 库存管理页面
 * 库存查询、预警检查、出入库记录
 */
export class InventoryPage extends BasePage {
  // 页面路径
  readonly path = '/inventory';

  // 列表页面元素
  readonly inventoryTable = 'table.ant-table, .ant-table-wrapper';
  readonly inventoryTableRows = 'table.ant-table-tbody tr';
  
  // 搜索和筛选
  readonly searchInput = 'input[placeholder*="搜索"], input[placeholder*="物料"]';
  readonly warehouseFilter = '.ant-select:has-text("仓库"), [class*="warehouse-filter"]';
  readonly categoryFilter = '.ant-select:has-text("类别"), [class*="category-filter"]';
  readonly stockFilter = '.ant-select:has-text("库存状态"), [class*="stock-filter"]';
  
  // 操作按钮
  readonly refreshButton = 'button[icon*="reload"]';
  readonly exportButton = 'button:has-text("导出")';
  readonly inboundButton = 'button:has-text("入库"), button:has-text("入库登记")';
  readonly outboundButton = 'button:has-text("出库"), button:has-text("出库登记")';
  readonly inventoryCheckButton = 'button:has-text("盘点")';
  
  // 分页
  readonly pagination = '.ant-pagination';
  readonly totalText = '.ant-pagination-total-text';

  // 库存卡片/统计
  readonly totalQuantityCard = '[class*="stat"]:has-text("库存总量"), [class*="card"]:has-text("库存总量")';
  readonly totalValueCard = '[class*="stat"]:has-text("库存价值"), [class*="card"]:has-text("库存价值")';
  readonly lowStockCard = '[class*="stat"]:has-text("低库存"), [class*="card"]:has-text("低库存预警")';
  readonly expiringCard = '[class*="stat"]:has-text("临期"), [class*="card"]:has-text("临期预警")';

  // 预警区域
  readonly alertSection = '[class*="alert"], .ant-alert';
  readonly lowStockAlert = ':text("库存不足"), :text("低库存"), [class*="low-stock"]';
  readonly warningBadge = '[class*="warning"], [class*="alert-warning"]';
  readonly errorBadge = '[class*="error"], [class*="alert-error"]';

  // 表格列
  readonly materialColumn = 'td:nth-child(2)'; // 物料名称
  readonly warehouseColumn = 'td:nth-child(3)'; // 仓库
  readonly quantityColumn = 'td:nth-child(4)'; // 数量
  readonly unitColumn = 'td:nth-child(5)'; // 单位
  readonly safeStockColumn = 'td:nth-child(6)'; // 安全库存
  readonly statusColumn = 'td:nth-child(7)'; // 状态

  // 出入库记录
  readonly recordTab = '[class*="tab"]:has-text("出入库记录"), .ant-tabs-tab:has-text("记录")';
  readonly inboundRecordTable = '[class*="inbound"] table';
  readonly outboundRecordTable = '[class*="outbound"] table';
  readonly recordTypeColumn = 'td:nth-child(2)'; // 类型
  readonly recordQuantityColumn = 'td:nth-child(3)'; // 数量
  readonly recordDateColumn = 'td:nth-child(4)'; // 日期

  // 表单元素
  readonly form = '.ant-form, form';
  readonly quantityInput = 'input[type="number"]:near(:text("数量")), input[class*="quantity"]';
  readonly remarkInput = 'textarea[class*="remark"], textarea[placeholder*="备注"]';
  readonly submitButton = 'button:has-text("提交"), button:has-text("保存"), button[type="submit"]';
  readonly cancelButton = 'button:has-text("取消")';

  // 弹窗
  readonly confirmModal = '.ant-modal';
  readonly confirmOkButton = '.ant-modal button:has-text("确定"), .ant-modal button:has-text("确认")';
  readonly successMessage = '.ant-message-success';

  // 图表
  readonly distributionChart = '[class*="distribution"], [id*="distribution"]';
  readonly trendChart = '[class*="trend"], [id*="trend"]';

  // 状态标签
  readonly statusNormal = ':text("正常"), [class*="status-normal"]';
  readonly statusLow = ':text("低库存"), [class*="status-low"]';
  readonly statusWarning = ':text("预警"), [class*="status-warning"]';
  readonly statusDanger = ':text("紧急"), [class*="status-danger"]';

  constructor(page: Page) {
    super(page);
  }

  /**
   * 访问库存页面
   */
  async visit(): Promise<void> {
    await this.navigate(this.path);
    await this.waitForLoading();
  }

  /**
   * 等待列表加载完成
   */
  async waitForListLoaded(): Promise<void> {
    await this.waitForVisible(this.inventoryTable, 15000);
    await this.waitForNetworkIdle();
  }

  /**
   * 获取库存物料数量
   */
  async getInventoryCount(): Promise<number> {
    await this.waitForListLoaded();
    return this.getTableRowCount(this.inventoryTable);
  }

  /**
   * 获取指定行物料名称
   */
  async getMaterialName(rowIndex: number): Promise<string> {
    return this.getCellText(rowIndex, 2, this.inventoryTable);
  }

  /**
   * 获取指定行库存数量
   */
  async getQuantity(rowIndex: number): Promise<number> {
    const text = await this.getCellText(rowIndex, 4, this.inventoryTable);
    const match = text.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  }

  /**
   * 获取指定行库存状态
   */
  async getStatus(rowIndex: number): Promise<string> {
    return this.getCellText(rowIndex, 7, this.inventoryTable);
  }

  /**
   * 搜索库存
   */
  async searchInventory(keyword: string): Promise<void> {
    await this.fill(this.searchInput, keyword);
    await this.waitForLoading();
  }

  /**
   * 按仓库筛选
   */
  async filterByWarehouse(warehouse: string): Promise<void> {
    await this.click(this.warehouseFilter);
    await this.page.waitForSelector('.ant-select-dropdown', { state: 'visible' });
    await this.click(`.ant-select-item:has-text("${warehouse}")`);
    await this.waitForLoading();
  }

  /**
   * 按类别筛选
   */
  async filterByCategory(category: string): Promise<void> {
    await this.click(this.categoryFilter);
    await this.page.waitForSelector('.ant-select-dropdown', { state: 'visible' });
    await this.click(`.ant-select-item:has-text("${category}")`);
    await this.waitForLoading();
  }

  /**
   * 按库存状态筛选
   */
  async filterByStockStatus(status: string): Promise<void> {
    await this.click(this.stockFilter);
    await this.page.waitForSelector('.ant-select-dropdown', { state: 'visible' });
    await this.click(`.ant-select-item:has-text("${status}")`);
    await this.waitForLoading();
  }

  /**
   * 获取总库存数量
   */
  async getTotalQuantity(): Promise<number> {
    const card = await this.waitForVisible(this.totalQuantityCard);
    const text = await card.textContent();
    const match = text?.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  }

  /**
   * 获取总库存价值
   */
  async getTotalValue(): Promise<string> {
    const card = await this.waitForVisible(this.totalValueCard);
    return card.textContent() ?? '';
  }

  /**
   * 获取低库存预警数量
   */
  async getLowStockCount(): Promise<number> {
    const card = await this.waitForVisible(this.lowStockCard);
    const text = await card.textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  /**
   * 检查是否有低库存预警
   */
  async hasLowStockAlert(): Promise<boolean> {
    return this.page.locator(this.lowStockAlert).isVisible();
  }

  /**
   * 检查是否有警告/错误级别预警
   */
  async hasWarning(): Promise<boolean> {
    return this.page.locator(this.warningBadge).isVisible();
  }

  /**
   * 点击入库按钮
   */
  async clickInbound(): Promise<void> {
    await this.click(this.inboundButton);
    await this.waitForVisible(this.form);
  }

  /**
   * 点击出库按钮
   */
  async clickOutbound(): Promise<void> {
    await this.click(this.outboundButton);
    await this.waitForVisible(this.form);
  }

  /**
   * 入库操作
   */
  async inbound(data: { material: string; quantity: number; remark?: string }): Promise<void> {
    await this.clickInbound();
    
    // 选择物料
    const materialSelect = this.page.locator('[class*="material"] input, [class*="product"] input').first();
    await materialSelect.click();
    await this.page.waitForSelector('.ant-select-dropdown', { state: 'visible' });
    await this.click(`.ant-select-item:has-text("${data.material}")`);
    
    // 填写数量
    await this.fill(this.quantityInput, data.quantity.toString());
    
    // 填写备注（可选）
    if (data.remark) {
      await this.fill(this.remarkInput, data.remark);
    }
    
    // 提交
    await this.click(this.submitButton);
    await this.waitForSelector(this.successMessage, { timeout: 10000 });
  }

  /**
   * 出库操作
   */
  async outbound(data: { material: string; quantity: number; remark?: string }): Promise<void> {
    await this.clickOutbound();
    
    // 选择物料
    const materialSelect = this.page.locator('[class*="material"] input, [class*="product"] input').first();
    await materialSelect.click();
    await this.page.waitForSelector('.ant-select-dropdown', { state: 'visible' });
    await this.click(`.ant-select-item:has-text("${data.material}")`);
    
    // 填写数量
    await this.fill(this.quantityInput, data.quantity.toString());
    
    // 填写备注（可选）
    if (data.remark) {
      await this.fill(this.remarkInput, data.remark);
    }
    
    // 提交
    await this.click(this.submitButton);
    await this.waitForSelector(this.successMessage, { timeout: 10000 });
  }

  /**
   * 查看出入库记录
   */
  async viewRecords(): Promise<void> {
    await this.click(this.recordTab);
    await this.waitForLoading();
  }

  /**
   * 获取出入库记录数量
   */
  async getRecordCount(): Promise<number> {
    const inboundRows = await this.page.locator(`${this.inboundRecordTable} tbody tr`).count();
    const outboundRows = await this.page.locator(`${this.outboundRecordTable} tbody tr`).count();
    return inboundRows + outboundRows;
  }

  /**
   * 点击盘点按钮
   */
  async clickInventoryCheck(): Promise<void> {
    await this.click(this.inventoryCheckButton);
    await this.waitForVisible(this.form);
  }

  /**
   * 验证库存状态
   */
  async verifyStatus(expectedStatus: string, rowIndex: number = 1): Promise<void> {
    const actualStatus = await this.getStatus(rowIndex);
    await expect(actualStatus).toContain(expectedStatus);
  }

  /**
   * 验证列表非空
   */
  async verifyListNotEmpty(): Promise<void> {
    const count = await this.getInventoryCount();
    expect(count).toBeGreaterThan(0);
  }

  /**
   * 获取完整库存摘要
   */
  async getInventorySummary(): Promise<{
    totalQuantity: number;
    totalValue: string;
    lowStockCount: number;
    itemCount: number;
  }> {
    return {
      totalQuantity: await this.getTotalQuantity(),
      totalValue: await this.getTotalValue(),
      lowStockCount: await this.getLowStockCount(),
      itemCount: await this.getInventoryCount(),
    };
  }

  /**
   * 验证统计卡片可见
   */
  async verifyStatsVisible(): Promise<void> {
    await expect(this.page.locator(this.totalQuantityCard)).toBeVisible();
    await expect(this.page.locator(this.totalValueCard)).toBeVisible();
  }

  /**
   * 刷新库存数据
   */
  async refresh(): Promise<void> {
    await this.click(this.refreshButton);
    await this.waitForLoading();
  }

  /**
   * 获取分页信息
   */
  async getPaginationInfo(): Promise<{ current: number; total: number }> {
    const totalText = await this.getText(this.totalText);
    const match = totalText.match(/共\s*(\d+)\s*条/);
    const total = match ? parseInt(match[1], 10) : 0;
    
    const currentPage = await this.page.locator('.ant-pagination-item-active').textContent();
    return {
      current: currentPage ? parseInt(currentPage, 10) : 1,
      total
    };
  }

  /**
   * 导出库存数据
   */
  async exportInventory(): Promise<void> {
    await this.click(this.exportButton);
    await this.waitForLoading();
  }
}
