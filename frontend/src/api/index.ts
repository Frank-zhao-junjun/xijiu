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
export const getOrderById = (id) => api.get(`/purchase-orders/${id}`)
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
