import React, { useEffect, useState } from 'react'
import { Table, Card, Input, Select, Button, Space, Tag, Row, Col, Statistic } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { getInventory, getInventoryStats } from '../api'

const InventoryList: React.FC = () => {
  const [inventory, setInventory] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('原料库存')
  const [stats, setStats] = useState<any>(null)

  useEffect(() => { loadData() }, [])
  const loadData = async () => {
    setLoading(true)
    try {
      const [i, s] = await Promise.all([getInventory({ page: 1, page_size: 20 }), getInventoryStats()])
      setInventory(i.items); setTotal(i.total); setStats(s)
    } finally { setLoading(false) }
  }

  const statusMap: Record<string, { color: string; text: string }> = {
    '正常': { color: 'green', text: '正常' }, '预警': { color: 'orange', text: '预警' },
    '不足': { color: 'red', text: '不足' }, '超储': { color: 'purple', text: '超储' }
  }

  const columns = [
    { title: '物料编码', dataIndex: 'material_code', key: 'material_code', width: 120 },
    { title: '物料名称', dataIndex: 'material_name', key: 'material_name' },
    { title: '库存数量', dataIndex: 'quantity', key: 'quantity', width: 100, render: (v: number, r: any) => `${v} ${r.unit}` },
    { title: '可用数量', dataIndex: 'available_quantity', key: 'available_quantity', width: 100 },
    { title: '冻结数量', dataIndex: 'frozen_quantity', key: 'frozen_quantity', width: 100 },
    { title: '单位成本', dataIndex: 'unit_cost', key: 'unit_cost', width: 100, render: (v: number) => v ? `¥${v}` : '-' },
    { title: '总价值', dataIndex: 'total_value', key: 'total_value', width: 120, render: (v: number) => v ? `¥${v.toLocaleString()}` : '-' },
    { title: '安全库存', dataIndex: 'safe_stock', key: 'safe_stock', width: 100 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (v: string) => <Tag color={statusMap[v]?.color}>{statusMap[v]?.text || v}</Tag> }
  ]

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>库存查询</h2>
      <Card bordered={false} size="small" style={{ marginBottom: 16 }}>
        <Space><Button type={tab === '原料库存' ? 'primary' : 'default'} onClick={() => setTab('原料库存')}>原料库存</Button><Button type={tab === '成品库存' ? 'primary' : 'default'} onClick={() => setTab('成品库存')}>成品库存</Button></Space>
      </Card>
      <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
        <Col span={6}><Card bordered={false} size="small"><Statistic title="库存总量" value={stats?.total_quantity || 0} suffix="吨" loading={loading} /></Card></Col>
        <Col span={6}><Card bordered={false} size="small"><Statistic title="库存价值" value={stats?.total_value || 0} prefix="¥" loading={loading} /></Card></Col>
        <Col span={6}><Card bordered={false} size="small"><Statistic title="正常" value={stats?.normal_count || 0} valueStyle={{ color: '#52C41A' }} /></Card></Col>
        <Col span={6}><Card bordered={false} size="small"><Statistic title="预警" value={stats?.warning_count || 0} valueStyle={{ color: '#FAAD14' }} /></Card></Col>
      </Row>
      <Card bordered={false} size="small" style={{ marginBottom: 16 }}>
        <Space><Input placeholder="搜索物料名称" prefix={<SearchOutlined />} style={{ width: 160 }} /><Button type="primary">查询</Button><Button>重置</Button></Space>
      </Card>
      <Card bordered={false} size="small">
        <Table columns={columns} dataSource={inventory} rowKey="inventory_id" loading={loading} pagination={{ total, showSizeChanger: true, showTotal: (t: number) => `共 ${t} 条` }} />
      </Card>
    </div>
  )
}
export default InventoryList
