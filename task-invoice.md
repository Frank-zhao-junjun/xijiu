## CRM V3.3 开发任务：发票管理模块

### 项目背景
这是一个基于 Next.js 16 + shadcn/ui 的简易CRM系统。当前版本 V3.2 已完成产品管理模块。需要新增发票管理模块形成完整销售闭环。

### 现有代码结构参考
- 订单类型定义：src/lib/crm-types.ts (Order, OrderItem)
- 报价单模块：src/app/quotes/
- 订单模块：src/app/orders/

### 开发要求

#### 1. 类型定义 (src/lib/crm-types.ts)
新增发票相关类型：
- InvoiceStatus: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled' | 'refunded'
- InvoiceItem: id, invoiceId, productName, description, quantity, unitPrice, discount, subtotal, sortOrder
- Invoice: id, invoiceNumber(INV-YYYYMMDD-序号格式), orderId, orderNumber, customerId, customerName, taxId(购方税号), billingAddress, status, issueDate, dueDate, subtotal, taxRate(默认0.06), tax, total, paidDate, paymentMethod, notes, items, createdAt, updatedAt
- INVOICE_STATUS_CONFIG 状态配置对象

#### 2. 发票列表页 (src/app/invoices/page.tsx)
- 统计卡片：全部/草稿/已开票/已收款/逾期
- 搜索框（按发票号、客户名搜索）
- 状态筛选标签
- 表格展示：发票号、客户、金额、状态、日期、操作
- 新建发票按钮

#### 3. 新建发票页 (src/app/invoices/new/page.tsx)
- 从订单选择（下拉选择已确认/待付款/已付款/已完成的订单）
- 自动带入订单客户信息
- 开票信息填写：税号、开票地址
- 发票明细（从订单items带入，可编辑）
- 金额计算（自动计算小计、税额、总计）
- 保存为草稿或直接开票

#### 4. 发票详情页 (src/app/invoices/[id]/page.tsx)
- 发票完整信息展示（含打印预览样式）
- 状态流转操作按钮
- 打印发票按钮（window.print）
- 编辑按钮（仅草稿状态）
- 删除按钮（仅草稿状态）
- 开票、收款操作

#### 5. 发票编辑页 (src/app/invoices/[id]/edit/page.tsx)
- 仅草稿状态可编辑
- 修改开票信息
- 修改明细
- 保存更新

#### 6. API路由
- src/app/api/invoices/route.ts: GET(列表) + POST(创建)
- src/app/api/invoices/[id]/route.ts: GET + PUT + DELETE

#### 7. 侧边栏入口 (src/components/crm/sidebar.tsx)
- 在"订单管理"后添加"发票管理"菜单项
- 使用 FileText 图标

#### 8. 数据持久化 (src/lib/crm-database.ts)
- 添加 invoices 存储
- 添加 getInvoices, getInvoice, createInvoice, updateInvoice, deleteInvoice 函数
- 自动生成发票号（INV-YYYYMMDD-序号格式）

### 技术要求
- 保持与现有模块一致的代码风格
- 使用 shadcn/ui 组件（Button, Card, Table, Dialog, Input, Select, Badge等）
- 响应式设计
- TypeScript 严格类型
- 发票详情页添加打印样式（@media print）

### 更新要求
- 更新 README.md 添加 V3.3 发票管理说明
- 添加版本更新日志
