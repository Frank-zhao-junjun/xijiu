import api from './request'

// Dashboard API
export const getDashboardMetrics = () => api.get('/dashboard/stats')
export const getAlerts = () => api.get('/dashboard/inventory-alerts')
export const getTodos = () => Promise.resolve([]) // 暂无
export const getFulfillmentStatus = () => Promise.resolve([]) // 暂无
export const getOrderTrends = (days = 7) => Promise.resolve([]) // 暂无

// Suppliers API
export const getSuppliers = (params = {}) => api.get('/suppliers/', { params })
export const getSupplierStats = () => Promise.resolve({}) // 暂无

// Purchase Orders API (后端使用 purchase-orders)
export const getOrders = (params = {}) => api.get('/purchase-orders/', { params })
export const getOrderById = (id: number | string) => api.get(`/purchase-orders/${id}`)
export const getOrderStats = () => Promise.resolve({}) // 暂无

// Materials/Inventory API (后端使用 materials)
export const getInventory = (params = {}) => api.get('/materials/', { params })
export const getInventoryStats = () => api.get('/dashboard/stats')
export const getInventoryAlerts = () => api.get('/materials/low-stock')

// Inspections API - 使用生产记录代替
export const getInspections = (params = {}) => api.get('/production/records', { params })
export const getInspectionStats = () => api.get('/production/today-stats')

// Waybills API - 暂无
export const getWaybills = (params = {}) => Promise.resolve([])

// Batches API - 使用生产记录
export const getBatches = (params = {}) => api.get('/production/records', { params })

// Products API
export const getProducts = (params = {}) => api.get('/products/', { params })
export const getProductCategories = () => api.get('/products/categories')
export const getProductBrands = () => api.get('/products/brands')

// Sales Orders API
export const getSalesOrders = (params = {}) => api.get('/sales-orders/', { params })

// Warehouses API
export const getWarehouses = (params = {}) => api.get('/warehouses/', { params })

// ============ 寻源与合同 API (Phase 2) ============

// 寻源项目
export const getSourcingProjects = (params = {}) => api.get('/sourcing/projects', { params })
export const getSourcingProject = (id: number | string) => api.get(`/sourcing/projects/${id}`)
export const createSourcingProject = (data: any) => api.post('/sourcing/projects', data)
export const openBids = (id: number | string) => api.post(`/sourcing/projects/${id}/open-bids`)
export const awardProject = (id: number | string, winnerSupplierId: number, amount: number) =>
  api.post(`/sourcing/projects/${id}/award?winner_supplier_id=${winnerSupplierId}&awarded_amount=${amount}`)
export const getBidComparison = (id: number | string) => api.get(`/sourcing/projects/${id}/comparison`)

// 合同
export const getContracts = (params = {}) => api.get('/contracts/', { params })
export const getContract = (id: number | string) => api.get(`/contracts/${id}`)
export const initiateSigning = (id: number | string, sequence = 'supplier_first') =>
  api.post(`/contracts/${id}/sign-initiate?sign_sequence=${sequence}`)
export const signContract = (id: number | string, party: 'supplier' | 'buyer') =>
  api.post(`/contracts/${id}/sign?party=${party}`)
export const getContractTemplates = () => api.get('/contract-templates/')
export const generateContractFromSourcing = (sourcingId: number, templateId: number, supplierId: number, contractName: string) =>
  api.post(`/contracts/generate-from-sourcing/${sourcingId}?template_id=${templateId}&supplier_id=${supplierId}&contract_name=${encodeURIComponent(contractName)}`)

// 供应商端 - 邀请
export const getSupplierInvitations = (supplierId: number) =>
  api.get('/sourcing/projects/invitations', { params: { supplier_id: supplierId } })
export const acceptInvitation = (projectId: number, supplierId: number) =>
  api.post(`/sourcing/projects/${projectId}/accept?supplier_id=${supplierId}`)
export const declineInvitation = (projectId: number, supplierId: number, reason = '') =>
  api.post(`/sourcing/projects/${projectId}/decline?supplier_id=${supplierId}&reason=${encodeURIComponent(reason)}`)

// 供应商端 - 投标
export const getBidForm = (projectId: number, supplierId: number) =>
  api.get(`/sourcing/projects/${projectId}/bid`, { params: { supplier_id: supplierId } })
export const submitBid = (projectId: number, data: any) =>
  api.post(`/sourcing/projects/${projectId}/bid`, data)

// ============ 公告栏 API ============

export interface AnnouncementItem {
  id: number
  title: string
  content: string
  announcement_type: 'announcement' | 'policy' | 'guide'
  priority: number
  is_pinned: boolean
  attachments: { name: string; url: string }[]
  published_by: string
  published_at: string
  valid_from: string
  valid_until: string | null
  view_count: number
  created_at: string
}

export interface AnnouncementListResponse {
  total: number
  page: number
  page_size: number
  items: AnnouncementItem[]
}

export const getAnnouncements = (params?: {
  announcement_type?: string
  keyword?: string
  page?: number
  page_size?: number
}) => api.get<AnnouncementListResponse>('/announcements/', { params })

export const getAnnouncement = (id: number) => api.get<AnnouncementItem>(`/announcements/${id}`)

export const createAnnouncement = (data: {
  title: string
  content: string
  announcement_type: string
  priority?: number
  is_pinned?: boolean
  published_by?: string
  valid_until?: string
}) => api.post('/announcements/', data)

export const updateAnnouncement = (id: number, data: Partial<{
  title: string
  content: string
  announcement_type: string
  priority: number
  is_pinned: boolean
  valid_until: string
}>) => api.put(`/announcements/${id}`, data)

export const deleteAnnouncement = (id: number) => api.delete(`/announcements/${id}`)

export const recordAnnouncementRead = (announcementId: number, userId: number) =>
  api.post(`/announcements/${announcementId}/record-read?user_id=${userId}`)

export const getAnnouncementTypesSummary = () =>
  api.get<{ type: string; label: string; count: number }[]>('/announcements/types/summary')

// ============ 物流与入库 API ============

export interface ShipmentNote {
  id: number
  shipment_no: string
  purchase_order_id: number
  supplier_id: number
  supplier_name?: string
  status: string
  carrier_name?: string
  tracking_no?: string
  vehicle_no?: string
  driver_name?: string
  driver_phone?: string
  expected_arrival?: string
  actual_arrival?: string
  shipping_address?: string
  receiving_warehouse?: string
  total_quantity: number
  created_at: string
}

export interface Receipt {
  id: number
  receipt_no: string
  warehouse_id: number
  warehouse_name?: string
  supplier_id: number
  supplier_name?: string
  purchase_order_id?: number
  status: string
  total_quantity: number
  qualified_quantity: number
  unqualified_quantity: number
  inspector?: string
  inspected_at?: string
  remarks?: string
  items: ReceiptItem[]
  created_at: string
}

export interface ReceiptItem {
  id: number
  material_id?: number
  material_name: string
  quantity: number
  unit: string
  batch_no: string
  production_date?: string
  quality_result: string
  warehouse_location?: string
}

// 运单 API
export const getShipmentNotes = (params?: { status?: string; supplier_id?: number }) =>
  api.get<ShipmentNote[]>('/logistics/shipment-notes/', { params })

export const getShipmentNote = (id: number) =>
  api.get<ShipmentNote>(`/logistics/shipment-notes/${id}`)

export const confirmArrival = (id: number) =>
  api.post(`/logistics/shipment-notes/${id}/arrive`)

// 入库单 API
export const getReceipts = (params?: { status?: string; warehouse_id?: number; supplier_id?: number; keyword?: string }) =>
  api.get<Receipt[]>('/logistics/receipts/', { params })

export const getReceipt = (id: number) =>
  api.get<Receipt>(`/logistics/receipts/${id}`)

export const createReceipt = (data: {
  receipt_no?: string
  asn_id?: number
  warehouse_id: number
  supplier_id: number
  purchase_order_id?: number
  remarks?: string
  items: {
    material_id?: number
    material_name: string
    quantity: number
    unit: string
    batch_no: string
    quality_result: string
    warehouse_location?: string
  }[]
}) => api.post('/logistics/receipts/', data)

export const getReceiptStats = () =>
  api.get('/logistics/receipts/stats/summary')

// ============ 财务管理 API ============

export interface SettlementStatement {
  id: number
  statement_no: string
  supplier_id: number
  supplier_name?: string
  period_start: string
  period_end: string
  total_amount: number
  paid_amount: number
  unpaid_amount: number
  status: string
  confirmed_at?: string
  confirmed_by?: string
  remarks?: string
  created_at: string
}

export interface Invoice {
  id: number
  invoice_no: string
  statement_id?: number
  supplier_id: number
  supplier_name?: string
  amount: number
  tax_amount: number
  total_amount: number
  invoice_type: string
  invoice_date?: string
  status: string
  remarks?: string
  created_at: string
}

export interface Payment {
  id: number
  payment_no: string
  invoice_id?: number
  statement_id?: number
  supplier_id: number
  supplier_name?: string
  amount: number
  payment_method: string
  expected_date?: string
  actual_date?: string
  status: string
  pre_payment: boolean
  remarks?: string
  created_at: string
}

// 结算单 API
export const getStatements = (params?: { status?: string; supplier_id?: number; keyword?: string }) =>
  api.get<SettlementStatement[]>('/financial/statements/', { params })

export const getStatement = (id: number) =>
  api.get<SettlementStatement>(`/financial/statements/${id}`)

export const createStatement = (data: {
  statement_no?: string
  supplier_id: number
  period_start: string
  period_end: string
  total_amount: number
  remarks?: string
}) => api.post('/financial/statements/', data)

export const confirmStatement = (id: number, confirmed_by?: string) =>
  api.post(`/financial/statements/${id}/confirm?confirmed_by=${confirmed_by || ''}`)

export const getStatementStats = () =>
  api.get('/financial/statements/stats/summary')

// 发票 API
export const getInvoices = (params?: { status?: string; supplier_id?: number; keyword?: string }) =>
  api.get<Invoice[]>('/financial/invoices/', { params })

export const getInvoice = (id: number) =>
  api.get<Invoice>(`/financial/invoices/${id}`)

export const createInvoice = (data: {
  invoice_no?: string
  statement_id?: number
  supplier_id: number
  amount: number
  tax_amount: number
  invoice_type?: string
  invoice_date?: string
  remarks?: string
}) => api.post('/financial/invoices/', data)

export const getInvoiceStats = () =>
  api.get('/financial/invoices/stats/summary')

// 付款 API
export const getPayments = (params?: { status?: string; supplier_id?: number; keyword?: string }) =>
  api.get<Payment[]>('/financial/payments/', { params })

export const getPayment = (id: number) =>
  api.get<Payment>(`/financial/payments/${id}`)

export const createPayment = (data: {
  payment_no?: string
  invoice_id?: number
  statement_id?: number
  supplier_id: number
  amount: number
  payment_method?: string
  expected_date?: string
  remarks?: string
}) => api.post('/financial/payments/', data)

export const approvePayment = (id: number) =>
  api.post(`/financial/payments/${id}/approve`)

export const confirmPayment = (id: number) =>
  api.post(`/financial/payments/${id}/pay`)

export const getPaymentStats = () =>
  api.get('/financial/payments/stats/summary')

