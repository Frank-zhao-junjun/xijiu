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
