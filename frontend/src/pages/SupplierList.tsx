import React, { useEffect, useState } from 'react'
import { Table, Card, Input, Select, Button, Space, Tag, Rate, Row, Col, Statistic } from 'antd'
import { SearchOutlined, PlusOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons'
import { getSuppliers, getSupplierStats } from '../api'

const SupplierList: React.FC = () => {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => { loadData() }, [])
  const loadData = async () => {
    setLoading(true)
    try {
      const [s, st] = await Promise.all([getSuppliers({ page: 1, page_size: 20 }), getSupplierStats()])
      setSuppliers(s.items); setTotal(s.total); setStats(st)
    } finally { setLoading(false) }
  }

  const statusMap: Record<string, { color: string; text: string }> = {
    '合作中': { color: 'green', text: '合作中' }, '待审核': { color: 'orange', text: '待审核' },
    '暂停': { color: 'red', text: '暂停' }
  }
  const levelMap: Record<string, number> = { A: 5, B: 3, C: 1 }

  const columns = [
    { title: '供应商编码', dataIndex: 'supplier_code', key: 'supplier_code', width: 120 },
    { title: '供应商名称', dataIndex: 'name', key: 'name', width: 200 },
    { title: '类型', dataIndex: 'type', key: 'type', width: 120 },
    { title: '主营品类', dataIndex: 'category', key: 'category', width: 150 },
    { title: '联系人', dataIndex: 'contact_person', key: 'contact_person', width: 100 },
    { title: '联系电话', dataIndex: 'contact_phone', key: 'contact_phone', width: 130 },
    { title: '信用评级', dataIndex: 'credit_level', key: 'credit_level', width: 120, render: (v: string) => <Rate disabled defaultValue={levelMap[v] || 1} style={{ fontSize: 12 }} /> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (v: string) => <Tag color={statusMap[v]?.color}>{statusMap[v]?.text || v}</Tag> },
    { title: '操作', key: 'action', width: 120, render: () => <Space><Button type="link" size="small" icon={<EyeOutlined />}>查看</Button><Button type="link" size="small" icon={<EditOutlined />}>编辑</Button></Space> }
  ]

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>供应商列表</h2>
      <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
        <Col span={6}><Card bordered={false} size="small"><Statistic title="供应商总数" value={stats?.total || 0} loading={loading} /></Card></Col>
        <Col span={6}><Card bordered={false} size="small"><Statistic title="合作中" value={stats?.active || 0} valueStyle={{ color: '#52C41A' }} /></Card></Col>
        <Col span={6}><Card bordered={false} size="small"><Statistic title="待审核" value={stats?.pending || 0} valueStyle={{ color: '#FAAD14' }} /></Card></Col>
        <Col span={6}><Card bordered={false} size="small"><Statistic title="已暂停" value={stats?.suspended || 0} valueStyle={{ color: '#FF4D4F' }} /></Card></Col>
      </Row>
      <Card bordered={false} size="small" style={{ marginBottom: 16 }}>
        <Space><Input placeholder="搜索供应商名称" prefix={<SearchOutlined />} style={{ width: 160 }} /><Button type="primary">查询</Button><Button>重置</Button><Button type="primary" icon={<PlusOutlined />}>新增供应商</Button></Space>
      </Card>
      <Card bordered={false} size="small">
        <Table columns={columns} dataSource={suppliers} rowKey="supplier_id" loading={loading} pagination={{ total, showSizeChanger: true, showTotal: (t: number) => `共 ${t} 条` }} />
      </Card>
    </div>
  )
}
export default SupplierList
