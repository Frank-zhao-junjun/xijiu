import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import PurchaseOrderList from './pages/PurchaseOrderList'
import PurchaseOrderDetail from './pages/PurchaseOrderDetail'
import SupplierList from './pages/SupplierList'
import ReceiptList from './pages/ReceiptList'
import InventoryList from './pages/InventoryList'
import InspectionList from './pages/InspectionList'

const theme = { token: { colorPrimary: '#3E5BF2', borderRadius: 4 } }

function App() {
  return (
    <ConfigProvider theme={theme} locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="orders" element={<PurchaseOrderList />} />
            <Route path="orders/:id" element={<PurchaseOrderDetail />} />
            <Route path="suppliers" element={<SupplierList />} />
            <Route path="receipts" element={<ReceiptList />} />
            <Route path="inventory" element={<InventoryList />} />
            <Route path="inspections" element={<InspectionList />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  )
}
export default App
