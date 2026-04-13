import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * PurchaseOrderPage - 采购订单页面
 * 订单列表、创建订单、审批流程
 */
export class PurchaseOrderPage extends BasePage {
  // 页面路径
  readonly path = '/purchase-order';

  // 列表页面元素
  readonly orderTable = 'table.ant-table, .ant-table-wrapper';
  readonly orderTableRows = 'table.ant-table-tbody tr';
  readonly orderNumberCell = 'td:nth-child(2)'; // 订单号列
  readonly statusCell = 'td:nth-child(4)'; // 状态列
  
  // 搜索和筛选
  readonly searchInput = 'input[placeholder*="搜索"], input.ant-input';
  readonly statusFilter = '.ant-select:has-text("状态"), [class*="status-filter"]';
  readonly dateRangePicker = '.ant-picker-range, [class*="date-picker"]';
  
  // 操作按钮
  readonly newOrderButton = 'button:has-text("新建"), button:has-text("创建")';
  readonly refreshButton = 'button[icon*="reload"], button:has-text("刷新")';
  readonly exportButton = 'button:has-text("导出")';
  
  // 分页
  readonly pagination = '.ant-pagination';
  readonly nextPageButton = '.ant-pagination-next';
  readonly prevPageButton = '.ant-pagination-prev';
  readonly totalText = '.ant-pagination-total-text';

  // 表单元素
  readonly orderForm = '.ant-form, form';
  readonly supplierSelect = '.ant-select:has-text("供应商"), [class*="supplier"] input';
  readonly materialSelect = '.ant-select:has-text("原料"), [class*="material"] input';
  readonly quantityInput = 'input[type="number"]:near(:text("数量")), input[class*="quantity"]';
  readonly unitPriceInput = 'input[type="number"]:near(:text("单价")), input[class*="price"]';
  readonly submitButton = 'button:has-text("提交"), button:has-text("保存"), button[type="submit"]';
  readonly cancelButton = 'button:has-text("取消")';

  // 详情页面
  readonly orderDetailTitle = '[class*="detail"] h1, [class*="detail"] h2, .ant-typography:has-text("订单详情")';
  readonly orderInfoSection = '[class*="info-section"], .ant-descriptions';
  readonly lineItemsTable = '[class*="line-items"] table, [class*="items"] table';
  readonly statusHistory = '[class*="history"], [class*="timeline"]';
  readonly approveButton = 'button:has-text("通过"), button:has-text("审批通过")';
  readonly rejectButton = 'button:has-text("驳回"), button:has-text("拒绝")';
  readonly shipButton = 'button:has-text("发货"), button:has-text("确认发货")';
  readonly receiveButton = 'button:has-text("收货"), button:has-text("确认收货")';

  // 弹窗
  readonly confirmModal = '.ant-modal:has-text("确认")';
  readonly confirmOkButton = '.ant-modal button:has-text("确定"), .ant-modal button:has-text("确认")';
  readonly confirmCancelButton = '.ant-modal button:has-text("取消")';
  readonly successMessage = '.ant-message:has-text("成功"), .ant-message-success';

  // 状态标签
  readonly statusDraft = ':text("草稿")';
  readonly statusSubmitted = ':text("已提交")';
  readonly statusConfirmed = ':text("已确认")';
  readonly statusShipped = ':text("已发货")';
  readonly statusDelivered = ':text("已到货"), :text("已入库")';

  constructor(page: Page) {
    super(page);
  }

  /**
   * 访问采购订单列表
   */
  async visit(): Promise<void> {
    await this.navigate(this.path);
    await this.waitForLoading();
  }

  /**
   * 等待列表加载完成
   */
  async waitForListLoaded(): Promise<void> {
    await this.waitForVisible(this.orderTable, 15000);
    await this.waitForNetworkIdle();
  }

  /**
   * 获取订单列表行数
   */
  async getOrderCount(): Promise<number> {
    await this.waitForListLoaded();
    return this.getTableRowCount(this.orderTable);
  }

  /**
   * 获取指定行订单号
   */
  async getOrderNumber(rowIndex: number): Promise<string> {
    return this.getCellText(rowIndex, 2, this.orderTable);
  }

  /**
   * 获取指定行订单状态
   */
  async getOrderStatus(rowIndex: number): Promise<string> {
    return this.getCellText(rowIndex, 4, this.orderTable);
  }

  /**
   * 搜索订单
   */
  async searchOrder(keyword: string): Promise<void> {
    await this.fill(this.searchInput, keyword);
    await this.waitForLoading();
  }

  /**
   * 按状态筛选订单
   */
  async filterByStatus(status: string): Promise<void> {
    await this.click(this.statusFilter);
    await this.page.waitForSelector('.ant-select-dropdown', { state: 'visible' });
    await this.click(`.ant-select-item:has-text("${status}")`);
    await this.waitForLoading();
  }

  /**
   * 点击新建订单
   */
  async clickNewOrder(): Promise<void> {
    await this.click(this.newOrderButton);
    await this.waitForVisible(this.orderForm);
  }

  /**
   * 创建采购订单
   */
  async createOrder(data: {
    supplier: string;
    material: string;
    quantity: number;
    unitPrice?: number;
  }): Promise<string> {
    await this.clickNewOrder();
    
    // 选择供应商
    await this.click(this.supplierSelect);
    await this.page.waitForSelector('.ant-select-dropdown', { state: 'visible' });
    await this.click(`.ant-select-item:has-text("${data.supplier}")`);
    
    // 选择原料
    await this.click(this.materialSelect);
    await this.page.waitForSelector('.ant-select-dropdown', { state: 'visible' });
    await this.click(`.ant-select-item:has-text("${data.material}")`);
    
    // 填写数量
    await this.fill(this.quantityInput, data.quantity.toString());
    
    // 填写单价（可选）
    if (data.unitPrice) {
      await this.fill(this.unitPriceInput, data.unitPrice.toString());
    }
    
    // 提交
    await this.click(this.submitButton);
    await this.waitForSelector(this.successMessage, { timeout: 10000 });
    
    // 返回列表获取新订单号
    await this.visit();
    const firstOrderNumber = await this.getOrderNumber(1);
    return firstOrderNumber;
  }

  /**
   * 点击订单查看详情
   */
  async clickOrder(rowIndex: number = 1): Promise<void> {
    const orderLink = this.page.locator(`${this.orderTable} tbody tr:nth-child(${rowIndex}) a, ${this.orderTable} tbody tr:nth-child(${rowIndex}) button`);
    await orderLink.first().click();
    await this.waitForVisible(this.orderDetailTitle, 10000);
  }

  /**
   * 审批通过订单
   */
  async approveOrder(orderNumber?: string): Promise<void> {
    if (orderNumber) {
      await this.searchOrder(orderNumber);
    }
    await this.clickOrder();
    await this.click(this.approveButton);
    
    // 确认弹窗
    if (await this.isVisible(this.confirmModal)) {
      await this.click(this.confirmOkButton);
    }
    await this.waitForSelector(this.successMessage, { timeout: 10000 });
  }

  /**
   * 驳回订单
   */
  async rejectOrder(orderNumber?: string): Promise<void> {
    if (orderNumber) {
      await this.searchOrder(orderNumber);
    }
    await this.clickOrder();
    await this.click(this.rejectButton);
    
    // 确认弹窗
    if (await this.isVisible(this.confirmModal)) {
      await this.click(this.confirmOkButton);
    }
    await this.waitForSelector(this.successMessage, { timeout: 10000 });
  }

  /**
   * 确认发货
   */
  async shipOrder(orderNumber?: string): Promise<void> {
    if (orderNumber) {
      await this.searchOrder(orderNumber);
    }
    await this.clickOrder();
    await this.click(this.shipButton);
    
    // 确认弹窗
    if (await this.isVisible(this.confirmModal)) {
      await this.click(this.confirmOkButton);
    }
    await this.waitForSelector(this.successMessage, { timeout: 10000 });
  }

  /**
   * 确认收货
   */
  async receiveOrder(orderNumber?: string): Promise<void> {
    if (orderNumber) {
      await this.searchOrder(orderNumber);
    }
    await this.clickOrder();
    await this.click(this.receiveButton);
    
    // 确认弹窗
    if (await this.isVisible(this.confirmModal)) {
      await this.click(this.confirmOkButton);
    }
    await this.waitForSelector(this.successMessage, { timeout: 10000 });
  }

  /**
   * 验证订单状态
   */
  async verifyOrderStatus(expectedStatus: string, rowIndex: number = 1): Promise<void> {
    const actualStatus = await this.getOrderStatus(rowIndex);
    await expect(actualStatus).toContain(expectedStatus);
  }

  /**
   * 翻到下一页
   */
  async goToNextPage(): Promise<void> {
    await this.click(this.nextPageButton);
    await this.waitForLoading();
  }

  /**
   * 翻到上一页
   */
  async goToPrevPage(): Promise<void> {
    await this.click(this.prevPageButton);
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
   * 验证订单详情数据完整
   */
  async verifyOrderDetailComplete(): Promise<void> {
    await expect(this.page.locator(this.orderDetailTitle)).toBeVisible();
    await expect(this.page.locator(this.orderInfoSection)).toBeVisible();
    await expect(this.page.locator(this.lineItemsTable)).toBeVisible();
  }

  /**
   * 获取订单总金额
   */
  async getOrderTotalAmount(): Promise<string> {
    const amountCell = this.page.locator(`${this.orderTable} tbody tr:first-child td:nth-child(6))`).first();
    if (await amountCell.isVisible()) {
      return amountCell.textContent() ?? '';
    }
    return '';
  }

  /**
   * 验证列表非空
   */
  async verifyListNotEmpty(): Promise<void> {
    const count = await this.getOrderCount();
    expect(count).toBeGreaterThan(0);
  }

  /**
   * 导出订单
   */
  async exportOrders(): Promise<void> {
    await this.click(this.exportButton);
    // 等待下载或确认弹窗
    await this.waitForLoading();
  }
}
