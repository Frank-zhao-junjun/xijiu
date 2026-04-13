import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * SupplierPage - 供应商管理页面
 * 供应商列表、创建、编辑、评级
 */
export class SupplierPage extends BasePage {
  // 页面路径
  readonly path = '/supplier';

  // 列表页面元素
  readonly supplierTable = 'table.ant-table, .ant-table-wrapper';
  readonly supplierTableRows = 'table.ant-table-tbody tr';
  
  // 搜索和筛选
  readonly searchInput = 'input[placeholder*="搜索"], input[placeholder*="供应商"]';
  readonly statusFilter = '.ant-select:has-text("状态"), [class*="status-filter"]';
  
  // 操作按钮
  readonly newSupplierButton = 'button:has-text("新增"), button:has-text("新建"), button:has-text("添加")';
  readonly refreshButton = 'button[icon*="reload"]';
  readonly exportButton = 'button:has-text("导出")';
  
  // 分页
  readonly pagination = '.ant-pagination';
  readonly totalText = '.ant-pagination-total-text';

  // 表单元素
  readonly supplierForm = '.ant-form, form';
  readonly nameInput = 'input[class*="name"]:near(:text("名称")), input[placeholder*="名称"]';
  readonly contactInput = 'input[class*="contact"]:near(:text("联系人")), input[placeholder*="联系人"]';
  readonly phoneInput = 'input[class*="phone"]:near(:text("电话")), input[type="tel"]';
  readonly emailInput = 'input[class*="email"]:near(:text("邮箱")), input[type="email"]';
  readonly addressInput = 'input[class*="address"]:near(:text("地址")), input[placeholder*="地址"]';
  readonly ratingSelect = '.ant-select:has-text("评级"), [class*="rating"] .ant-select';
  readonly statusSelect = '.ant-select:has-text("状态"), [class*="status"] .ant-select';
  readonly submitButton = 'button:has-text("提交"), button:has-text("保存"), button[type="submit"]';
  readonly cancelButton = 'button:has-text("取消")';

  // 详情/编辑页面
  readonly supplierDetailTitle = '[class*="detail"] h1, .ant-typography:has-text("供应商详情")';
  readonly editButton = 'button:has-text("编辑"), button:has-text("修改")';
  readonly deleteButton = 'button:has-text("删除"), button:has-text("移除")';
  readonly infoSection = '.ant-descriptions, [class*="info-section"]';

  // 评级显示
  readonly ratingBadge = '.ant-rate, [class*="rating"], [class*="star"]';
  readonly ratingA = ':text("A级"), :text("A"), [class*="rating-A"]';
  readonly ratingB = ':text("B级"), :text("B"), [class*="rating-B"]';
  readonly ratingC = ':text("C级"), :text("C"), [class*="rating-C"]';

  // 统计看板
  readonly statsCards = '[class*="stat-card"], .ant-card';
  readonly ratingDistributionChart = '[class*="rating-chart"], [id*="rating"]';
  readonly trendChart = '[class*="trend-chart"], [id*="trend"]';

  // 弹窗
  readonly confirmModal = '.ant-modal:has-text("确认"), .ant-modal:has-text("删除")';
  readonly confirmOkButton = '.ant-modal button:has-text("确定"), .ant-modal button:has-text("确认")';
  readonly successMessage = '.ant-message-success';

  // 表格列
  readonly nameColumn = 'td:nth-child(2)';
  readonly codeColumn = 'td:nth-child(3)';
  readonly statusColumn = 'td:nth-child(4)';
  readonly ratingColumn = 'td:nth-child(5)';
  readonly contactColumn = 'td:nth-child(6)';

  constructor(page: Page) {
    super(page);
  }

  /**
   * 访问供应商列表
   */
  async visit(): Promise<void> {
    await this.navigate(this.path);
    await this.waitForLoading();
  }

  /**
   * 等待列表加载完成
   */
  async waitForListLoaded(): Promise<void> {
    await this.waitForVisible(this.supplierTable, 15000);
    await this.waitForNetworkIdle();
  }

  /**
   * 获取供应商数量
   */
  async getSupplierCount(): Promise<number> {
    await this.waitForListLoaded();
    return this.getTableRowCount(this.supplierTable);
  }

  /**
   * 获取指定行供应商名称
   */
  async getSupplierName(rowIndex: number): Promise<string> {
    return this.getCellText(rowIndex, 2, this.supplierTable);
  }

  /**
   * 获取指定行供应商状态
   */
  async getSupplierStatus(rowIndex: number): Promise<string> {
    return this.getCellText(rowIndex, 4, this.supplierTable);
  }

  /**
   * 获取指定行供应商评级
   */
  async getSupplierRating(rowIndex: number): Promise<string> {
    return this.getCellText(rowIndex, 5, this.supplierTable);
  }

  /**
   * 搜索供应商
   */
  async searchSupplier(keyword: string): Promise<void> {
    await this.fill(this.searchInput, keyword);
    await this.waitForLoading();
  }

  /**
   * 按状态筛选供应商
   */
  async filterByStatus(status: string): Promise<void> {
    await this.click(this.statusFilter);
    await this.page.waitForSelector('.ant-select-dropdown', { state: 'visible' });
    await this.click(`.ant-select-item:has-text("${status}")`);
    await this.waitForLoading();
  }

  /**
   * 点击新增供应商
   */
  async clickNewSupplier(): Promise<void> {
    await this.click(this.newSupplierButton);
    await this.waitForVisible(this.supplierForm);
  }

  /**
   * 创建供应商
   */
  async createSupplier(data: {
    name: string;
    contact?: string;
    phone?: string;
    email?: string;
    address?: string;
    rating?: string;
    status?: string;
  }): Promise<string> {
    await this.clickNewSupplier();
    
    // 填写表单
    if (data.name) {
      await this.fill(this.nameInput, data.name);
    }
    if (data.contact) {
      await this.fill(this.contactInput, data.contact);
    }
    if (data.phone) {
      await this.fill(this.phoneInput, data.phone);
    }
    if (data.email) {
      await this.fill(this.emailInput, data.email);
    }
    if (data.address) {
      await this.fill(this.addressInput, data.address);
    }
    if (data.rating) {
      await this.click(this.ratingSelect);
      await this.page.waitForSelector('.ant-select-dropdown', { state: 'visible' });
      await this.click(`.ant-select-item:has-text("${data.rating}")`);
    }
    if (data.status) {
      await this.click(this.statusSelect);
      await this.page.waitForSelector('.ant-select-dropdown', { state: 'visible' });
      await this.click(`.ant-select-item:has-text("${data.status}")`);
    }
    
    // 提交
    await this.click(this.submitButton);
    await this.waitForSelector(this.successMessage, { timeout: 10000 });
    
    // 返回列表获取新供应商
    await this.visit();
    const firstSupplierName = await this.getSupplierName(1);
    return firstSupplierName;
  }

  /**
   * 点击供应商查看详情
   */
  async clickSupplier(rowIndex: number = 1): Promise<void> {
    const supplierLink = this.page.locator(
      `${this.supplierTable} tbody tr:nth-child(${rowIndex}) a, ${this.supplierTable} tbody tr:nth-child(${rowIndex}) button`
    );
    await supplierLink.first().click();
    await this.waitForVisible(this.supplierDetailTitle, 10000);
  }

  /**
   * 编辑供应商
   */
  async editSupplier(rowIndex: number, data: { name?: string; contact?: string; phone?: string }): Promise<void> {
    await this.clickSupplier(rowIndex);
    await this.click(this.editButton);
    
    if (data.name) {
      await this.clearAndFill(this.nameInput, data.name);
    }
    if (data.contact) {
      await this.clearAndFill(this.contactInput, data.contact);
    }
    if (data.phone) {
      await this.clearAndFill(this.phoneInput, data.phone);
    }
    
    await this.click(this.submitButton);
    await this.waitForSelector(this.successMessage, { timeout: 10000 });
  }

  /**
   * 删除供应商
   */
  async deleteSupplier(rowIndex: number = 1): Promise<void> {
    // 悬停以显示删除按钮
    await this.hover(`${this.supplierTable} tbody tr:nth-child(${rowIndex})`);
    await this.click(this.deleteButton);
    
    // 确认删除
    if (await this.isVisible(this.confirmModal)) {
      await this.click(this.confirmOkButton);
    }
    await this.waitForSelector(this.successMessage, { timeout: 10000 });
  }

  /**
   * 验证供应商存在
   */
  async verifySupplierExists(name: string): Promise<void> {
    await this.searchSupplier(name);
    const count = await this.getSupplierCount();
    expect(count).toBeGreaterThan(0);
  }

  /**
   * 验证供应商不存在
   */
  async verifySupplierNotExists(name: string): Promise<void> {
    await this.searchSupplier(name);
    const count = await this.getSupplierCount();
    expect(count).toBe(0);
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    pending: number;
    suspended: number;
  }> {
    const cards = await this.page.locator(this.statsCards).all();
    const stats: Record<string, number> = {};
    
    for (const card of cards) {
      const text = await card.textContent();
      if (text) {
        const match = text.match(/(\d+)/);
        if (match) {
          const value = parseInt(match[1], 10);
          if (text.includes('总计') || text.includes('总数')) stats.total = value;
          else if (text.includes('合作中') || text.includes('活跃')) stats.active = value;
          else if (text.includes('待审核')) stats.pending = value;
          else if (text.includes('暂停')) stats.suspended = value;
        }
      }
    }
    
    return stats;
  }

  /**
   * 验证评级分布图表存在
   */
  async verifyRatingChart(): Promise<void> {
    await expect(this.page.locator(this.ratingDistributionChart)).toBeVisible();
  }

  /**
   * 验证供应商详情完整
   */
  async verifySupplierDetailComplete(): Promise<void> {
    await expect(this.page.locator(this.supplierDetailTitle)).toBeVisible();
    await expect(this.page.locator(this.infoSection)).toBeVisible();
  }

  /**
   * 验证列表非空
   */
  async verifyListNotEmpty(): Promise<void> {
    const count = await this.getSupplierCount();
    expect(count).toBeGreaterThan(0);
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
}
