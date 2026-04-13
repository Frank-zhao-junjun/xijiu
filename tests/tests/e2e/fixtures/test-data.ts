/**
 * 测试数据 - 测试夹具数据
 * 用于E2E测试的模拟数据
 */

// ==================== 供应商测试数据 ====================

export const supplierTestData = {
  validSupplier: {
    name: `测试供应商-${Date.now()}`,
    contact: '张三',
    phone: '13800138000',
    email: 'test@example.com',
    address: '四川省成都市武侯区测试路123号',
    rating: 'A',
    status: '合作中',
  },
  supplierForEdit: {
    name: '待编辑供应商',
    contact: '李四',
    phone: '13900139000',
  },
  suppliers: [
    {
      name: '四川川粮集团',
      contact: '王经理',
      phone: '028-12345678',
      email: 'wang@chuanliang.com',
      address: '四川省成都市锦江区',
      rating: 'A',
      status: '合作中',
    },
    {
      name: '贵州茅台镇酒业',
      contact: '刘总',
      phone: '0851-87654321',
      email: 'liu@maotai.com',
      address: '贵州省仁怀市茅台镇',
      rating: 'A+',
      status: '合作中',
    },
    {
      name: '宜宾五粮液供应',
      contact: '陈经理',
      phone: '0831-88888888',
      email: 'chen@wuliangye.com',
      address: '四川省宜宾市翠屏区',
      rating: 'A',
      status: '合作中',
    },
    {
      name: '江苏洋河酒厂',
      contact: '张总',
      phone: '0527-66666666',
      email: 'zhang@yanghe.com',
      address: '江苏省宿迁市洋河镇',
      rating: 'B',
      status: '待审核',
    },
    {
      name: '山西汾酒集团',
      contact: '赵经理',
      phone: '0359-55555555',
      email: 'zhao@fenjiu.com',
      address: '山西省运城市汾阳市',
      rating: 'A',
      status: '暂停',
    },
  ],
};

// ==================== 采购订单测试数据 ====================

export const purchaseOrderTestData = {
  validOrder: {
    supplier: '四川川粮集团',
    material: '高粱',
    quantity: 1000,
    unitPrice: 5.5,
    deliveryDate: '2026-04-30',
    remark: 'E2E测试订单',
  },
  orderForApproval: {
    supplier: '贵州茅台镇酒业',
    material: '小麦',
    quantity: 500,
    unitPrice: 3.2,
  },
  orders: [
    {
      orderNumber: 'PO-20260401-0001',
      supplier: '四川川粮集团',
      material: '高粱',
      quantity: 1000,
      unitPrice: 5.5,
      totalAmount: 5500,
      status: '草稿',
    },
    {
      orderNumber: 'PO-20260401-0002',
      supplier: '贵州茅台镇酒业',
      material: '小麦',
      quantity: 800,
      unitPrice: 3.2,
      totalAmount: 2560,
      status: '已提交',
    },
    {
      orderNumber: 'PO-20260401-0003',
      supplier: '宜宾五粮液供应',
      material: '糯米',
      quantity: 500,
      unitPrice: 4.0,
      totalAmount: 2000,
      status: '已确认',
    },
    {
      orderNumber: 'PO-20260401-0004',
      supplier: '江苏洋河酒厂',
      material: '大米',
      quantity: 1200,
      unitPrice: 2.8,
      totalAmount: 3360,
      status: '已发货',
    },
    {
      orderNumber: 'PO-20260401-0005',
      supplier: '山西汾酒集团',
      material: '玉米',
      quantity: 600,
      unitPrice: 2.5,
      totalAmount: 1500,
      status: '已完成',
    },
  ],
};

// ==================== 库存测试数据 ====================

export const inventoryTestData = {
  materials: [
    {
      name: '高粱',
      warehouse: '原料库A区',
      quantity: 5000,
      unit: '公斤',
      safeStock: 1000,
      status: '正常',
    },
    {
      name: '小麦',
      warehouse: '原料库A区',
      quantity: 800,
      unit: '公斤',
      safeStock: 1000,
      status: '低库存',
    },
    {
      name: '糯米',
      warehouse: '原料库B区',
      quantity: 3000,
      unit: '公斤',
      safeStock: 500,
      status: '正常',
    },
    {
      name: '大米',
      warehouse: '原料库B区',
      quantity: 200,
      unit: '公斤',
      safeStock: 300,
      status: '低库存',
    },
    {
      name: '玉米',
      warehouse: '原料库C区',
      quantity: 4500,
      unit: '公斤',
      safeStock: 800,
      status: '正常',
    },
  ],
  warehouses: ['原料库A区', '原料库B区', '原料库C区', '成品库', '包材库'],
  categories: ['粮食类', '酿造辅料', '包装材料', '成品酒'],
};

// ==================== 仪表盘测试数据 ====================

export const dashboardTestData = {
  expectedMetrics: {
    minTotalOrders: 0,
    maxPendingOrders: 100,
    maxDeliveredOrders: 10000,
  },
  alertKeywords: ['库存不足', '订单逾期', '质检异常', '资质过期', '预警', '告警'],
  todoKeywords: ['审批', '质检', '确认', '处理', '完成'],
};

// ==================== 用户操作流程测试数据 ====================

export const workflowTestData = {
  // 完整采购流程
  purchaseWorkflow: {
    createOrder: {
      supplier: '四川川粮集团',
      material: '高粱',
      quantity: 2000,
      unitPrice: 5.5,
    },
    approveOrder: {
      expectedStatus: '已确认',
    },
    shipOrder: {
      logisticsCompany: '顺丰速运',
      trackingNumber: 'SF1234567890',
    },
    receiveOrder: {
      actualQuantity: 2000,
      qualityResult: '合格',
    },
  },

  // 供应商管理流程
  supplierWorkflow: {
    addSupplier: {
      name: '测试供应商-E2E',
      contact: '测试人员',
      phone: '400-888-8888',
      rating: 'B',
      status: '待审核',
    },
    approveSupplier: {
      expectedStatus: '合作中',
    },
  },

  // 库存管理流程
  inventoryWorkflow: {
    inbound: {
      material: '高粱',
      quantity: 1000,
      remark: 'E2E测试入库',
    },
    outbound: {
      material: '小麦',
      quantity: 200,
      remark: 'E2E测试出库',
    },
  },
};

// ==================== 边界测试数据 ====================

export const boundaryTestData = {
  // 边界值测试
  quantityBoundary: [0, 1, 999999, 1000000],
  priceBoundary: [0, 0.01, 999999.99, 1000000],
  
  // 字符串长度测试
  nameMinLength: 1,
  nameMaxLength: 100,
  remarkMaxLength: 500,
  
  // 日期边界
  pastDate: '2020-01-01',
  futureDate: '2030-12-31',
  today: new Date().toISOString().split('T')[0],
};

// ==================== 辅助函数 ====================

/**
 * 生成唯一的供应商名称
 */
export function generateUniqueSupplierName(): string {
  return `供应商-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * 生成唯一的订单号
 */
export function generateUniqueOrderNumber(): string {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PO-${date}-${random}`;
}

/**
 * 生成随机手机号
 */
export function generateRandomPhone(): string {
  const prefixes = ['130', '131', '132', '133', '135', '136', '137', '138', '139', '150', '151', '152', '155', '156', '157', '158', '159', '180', '181', '182', '183', '184', '185', '186', '187', '188', '189'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return `${prefix}${suffix}`;
}

/**
 * 生成随机邮箱
 */
export function generateRandomEmail(): string {
  const username = `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const domains = ['example.com', 'test.com', 'demo.com', 'mail.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${username}@${domain}`;
}

/**
 * 获取测试数据中随机供应商
 */
export function getRandomSupplier(): typeof supplierTestData.suppliers[0] {
  const index = Math.floor(Math.random() * supplierTestData.suppliers.length);
  return supplierTestData.suppliers[index];
}

/**
 * 获取测试数据中随机物料
 */
export function getRandomMaterial(): typeof inventoryTestData.materials[0] {
  const index = Math.floor(Math.random() * inventoryTestData.materials.length);
  return inventoryTestData.materials[index];
}
