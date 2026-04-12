import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import Layout from './components/Layout'

// 采购端页面
import BuyerHome from './pages/buyer/BuyerHome'
import SourcingList from './pages/buyer/SourcingList'
import SourcingDetail from './pages/buyer/SourcingDetail'
import ContractList from './pages/buyer/ContractList'
import PurchaseOrderList from './pages/PurchaseOrderList'
import SupplierList from './pages/SupplierList'
import ReceiptList from './pages/ReceiptList'
import InventoryList from './pages/InventoryList'
import InspectionList from './pages/InspectionList'

// 供应商端页面
import SupplierHome from './pages/supplier/SupplierHome'
import InvitationList from './pages/supplier/InvitationList'
import BidList from './pages/supplier/BidList'
import SupplierContractList from './pages/supplier/ContractList'
import SupplierOrderList from './pages/supplier/OrderList'

const theme = { token: { colorPrimary: '#3E5BF2', borderRadius: 4 } }

function App() {
  return (
    <ConfigProvider theme={theme} locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* 根路径默认跳转采购端 */}
            <Route index element={<Navigate to="/buyer" replace />} />

            {/* 采购端 */}
            <Route path="buyer">
              <Route index element={<BuyerHome />} />
              <Route path="sourcing" element={<SourcingList />} />
              <Route path="sourcing/:id" element={<SourcingDetail />} />
              <Route path="contracts" element={<ContractList />} />
              <Route path="orders" element={<PurchaseOrderList />} />
              <Route path="suppliers" element={<SupplierList />} />
              <Route path="receipts" element={<ReceiptList />} />
              <Route path="inventory" element={<InventoryList />} />
              <Route path="inspections" element={<InspectionList />} />
            </Route>

            {/* 供应商端 */}
            <Route path="supplier">
              <Route index element={<SupplierHome />} />
              <Route path="invitations" element={<InvitationList />} />
              <Route path="bids" element={<BidList />} />
              <Route path="contracts" element={<SupplierContractList />} />
              <Route path="orders" element={<SupplierOrderList />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App
