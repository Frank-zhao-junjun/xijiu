import React from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout as AntLayout, Menu } from 'antd'
import { DashboardOutlined, FileTextOutlined, TeamOutlined, InboxOutlined, AppstoreOutlined, AuditOutlined } from '@ant-design/icons'

const { Sider, Content } = AntLayout

const Layout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const items = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: '数据中台', onClick: () => navigate('/dashboard') },
    { type: 'group' as const, label: '采购管理', children: [
      { key: 'orders', icon: <FileTextOutlined />, label: '采购订单', onClick: () => navigate('/orders') },
      { key: 'suppliers', icon: <TeamOutlined />, label: '供应商管理', onClick: () => navigate('/suppliers') }
    ]},
    { type: 'group' as const, label: '仓储管理', children: [
      { key: 'receipts', icon: <InboxOutlined />, label: '入库单', onClick: () => navigate('/receipts') },
      { key: 'inventory', icon: <AppstoreOutlined />, label: '库存查询', onClick: () => navigate('/inventory') },
      { key: 'inspections', icon: <AuditOutlined />, label: '质检单', onClick: () => navigate('/inspections') }
    ]}
  ]

  const selected = () => {
    const p = location.pathname
    if (p.startsWith('/dashboard')) return ['dashboard']
    if (p.startsWith('/orders')) return ['orders']
    if (p.startsWith('/suppliers')) return ['suppliers']
    if (p.startsWith('/receipts')) return ['receipts']
    if (p.startsWith('/inventory')) return ['inventory']
    if (p.startsWith('/inspections')) return ['inspections']
    return ['dashboard']
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider width={240} style={{ background: 'var(--sidebar-bg)', position: 'fixed', height: '100vh', left: 0, top: 0 }}>
        <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h1 style={{ color: 'white', fontSize: 16, fontWeight: 600, margin: 0 }}>白酒供应链</h1>
        </div>
        <Menu mode="inline" theme="dark" selectedKeys={selected()} items={items} style={{ background: 'transparent', borderRight: 0 }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#5B75FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 600 }}>张</div>
            <div><div style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>张明远</div><div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>采购主管</div></div>
          </div>
        </div>
      </Sider>
      <AntLayout style={{ marginLeft: 240 }}>
        <Content style={{ padding: 12, minHeight: '100vh' }}><Outlet /></Content>
      </AntLayout>
    </AntLayout>
  )
}
export default Layout
