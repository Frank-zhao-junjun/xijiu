import React, { useEffect, useState } from 'react'
import { Table, Card, Input, Select, Button, Space, Tag, Row, Col, Statistic, DatePicker } from 'antd'
import { SearchOutlined, EyeOutlined } from '@ant-design/icons'
import { getInspections, getInspectionStats } from '../api'

const { RangePicker } = DatePicker

const InspectionList: React.FC = () => {
  const [inspections, setInspections] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => { loadData() }, [])
  const loadData = async () => {
    setLoading(true)
    try {
      const [i, s] = await Promise.all([getInspections({ page: 1, page_size: 20 }), getInspectionStats()])
      const data = Array.isArray(i) ? i : []
      setInspections(data); setTotal(data.length); setStats(s)
    } finally { setLoading(false) }
  }

  const getTag = (status: string, result?: string) => {
    if (status === '已判定') return result === '合格' ? <Tag color="green">合格</Tag> : <Tag color="red">不合格</Tag>
    const m: Record<string, { color: string; text: string }> = { '待检': { color: 'orange', text: '待检' }, '检验中': { color: 'blue', text: '检验中' }, '已判定': { color: 'green', text: '已判定' } }
    return <Tag color={m[status]?.color}>{m[status]?.text || status}</Tag>
  }

  const columns = [
    { title: '批次号', dataIndex: 'batch_no', key: 'batch_no', width: 160 },
    { title: '产量', dataIndex: 'quantity', key: 'quantity', width: 100 },
    { title: '合格数量', dataIndex: 'qualified_quantity', key: 'qualified_quantity', width: 100 },
    { title: '合格率', dataIndex: 'quality_rate', key: 'quality_rate', width: 80, render: (v: number) => `${v}%` },
    { title: '操作员', dataIndex: 'operator', key: 'operator', width: 100 },
    { title: '生产日期', dataIndex: 'production_date', key: 'production_date', width: 160 },
    { title: '操作', key: 'action', width: 100, render: () => <Button type="link" icon={<EyeOutlined />}>查看</Button> }
  ]

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>质检单列表</h2>
      <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
        <Col span={6}><Card bordered={false} size="small"><Statistic title="质检总数" value={stats?.total || 0} loading={loading} /></Card></Col>
        <Col span={6}><Card bordered={false} size="small"><Statistic title="待检验" value={stats?.pending || 0} valueStyle={{ color: '#FAAD14' }} /></Card></Col>
        <Col span={6}><Card bordered={false} size="small"><Statistic title="检验中" value={stats?.testing || 0} valueStyle={{ color: '#1890FF' }} /></Card></Col>
        <Col span={6}><Card bordered={false} size="small"><Statistic title="已合格" value={stats?.passed || 0} valueStyle={{ color: '#52C41A' }} /></Card></Col>
      </Row>
      <Card bordered={false} size="small" style={{ marginBottom: 16 }}>
        <Space><Input placeholder="搜索质检单号" prefix={<SearchOutlined />} style={{ width: 160 }} /><Input placeholder="批次号" style={{ width: 140 }} /><RangePicker style={{ width: 280 }} /><Button type="primary">查询</Button><Button>重置</Button></Space>
      </Card>
      <Card bordered={false} size="small">
        <Table columns={columns} dataSource={inspections} rowKey="id" loading={loading} pagination={{ total, showSizeChanger: true, showTotal: (t: number) => `共 ${t} 条` }} />
      </Card>
    </div>
  )
}
export default InspectionList
