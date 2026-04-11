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
      setInspections(i.items); setTotal(i.total); setStats(s)
    } finally { setLoading(false) }
  }

  const getTag = (status: string, result?: string) => {
    if (status === '已判定') return result === '合格' ? <Tag color="green">合格</Tag> : <Tag color="red">不合格</Tag>
    const m: Record<string, { color: string; text: string }> = { '待检': { color: 'orange', text: '待检' }, '检验中': { color: 'blue', text: '检验中' }, '已判定': { color: 'green', text: '已判定' } }
    return <Tag color={m[status]?.color}>{m[status]?.text || status}</Tag>
  }

  const columns = [
    { title: '质检单号', dataIndex: 'inspection_number', key: 'inspection_number', width: 160 },
    { title: '批次号', dataIndex: 'batch_number', key: 'batch_number', width: 160 },
    { title: '物料名称', dataIndex: 'material_name', key: 'material_name' },
    { title: '质检类型', dataIndex: 'inspection_type', key: 'inspection_type', width: 100 },
    { title: '抽样数量', dataIndex: 'sample_size', key: 'sample_size', width: 80 },
    { title: '主检员', dataIndex: 'inspector', key: 'inspector', width: 100 },
    { title: '判定结果', key: 'judgment', width: 100, render: (_: any, r: any) => getTag(r.status, r.judgment_result) },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
    { title: '创建时间', dataIndex: 'create_time', key: 'create_time', width: 160 },
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
        <Table columns={columns} dataSource={inspections} rowKey="inspection_id" loading={loading} pagination={{ total, showSizeChanger: true, showTotal: (t: number) => `共 ${t} 条` }} />
      </Card>
    </div>
  )
}
export default InspectionList
