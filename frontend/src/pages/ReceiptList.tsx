import React, { useEffect, useState } from 'react'
import { Table, Card, Input, Select, Button, Space, Tag, Row, Col, Statistic } from 'antd'
import { SearchOutlined, EyeOutlined } from '@ant-design/icons'
import { getWaybills } from '../api'

const ReceiptList: React.FC = () => {
  const [waybills, setWaybills] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])
  const loadData = async () => {
    setLoading(true)
    try {
      const res: any = await getWaybills({ page: 1, page_size: 20 })
      const data = Array.isArray(res) ? res : []
      setWaybills(data); setTotal(data.length)
    } finally { setLoading(false) }
  }

  const statusMap: Record<string, { color: string; text: string }> = {
    '待发货': { color: 'default', text: '待发货' }, '在途': { color: 'blue', text: '在途' },
    '已到达': { color: 'orange', text: '已到达' }, '已签收': { color: 'green', text: '已签收' }
  }

  const columns = [
    { title: '运单编号', dataIndex: 'waybill_number', key: 'waybill_number', width: 160 },
    { title: '订单编号', dataIndex: 'order_number', key: 'order_number', width: 160 },
    { title: '承运商', dataIndex: 'carrier_name', key: 'carrier_name', width: 120 },
    { title: '车牌号', dataIndex: 'vehicle_number', key: 'vehicle_number', width: 100 },
    { title: '司机', dataIndex: 'driver_name', key: 'driver_name', width: 80 },
    { title: '货物类型', dataIndex: 'cargo_type', key: 'cargo_type', width: 100 },
    { title: '数量', dataIndex: 'total_quantity', key: 'total_quantity', width: 80 },
    { title: '出发时间', dataIndex: 'departure_time', key: 'departure_time', width: 160 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (v: string) => <Tag color={statusMap[v]?.color}>{statusMap[v]?.text || v}</Tag> },
    { title: '操作', key: 'action', width: 100, render: () => <Button type="link" icon={<EyeOutlined />}>查看</Button> }
  ]

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>入库单列表</h2>
      <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
        <Col span={6}><Card bordered={false} size="small"><Statistic title="运单总数" value={total} loading={loading} /></Card></Col>
        <Col span={6}><Card bordered={false} size="small"><Statistic title="待发货" value={waybills.filter(w => w.status === '待发货').length} valueStyle={{ color: '#6E6E73' }} /></Card></Col>
        <Col span={6}><Card bordered={false} size="small"><Statistic title="在途" value={waybills.filter(w => w.status === '在途').length} valueStyle={{ color: '#3E5BF2' }} /></Card></Col>
        <Col span={6}><Card bordered={false} size="small"><Statistic title="已到达" value={waybills.filter(w => w.status === '已到达').length} valueStyle={{ color: '#FAAD14' }} /></Card></Col>
      </Row>
      <Card bordered={false} size="small" style={{ marginBottom: 16 }}>
        <Space><Input placeholder="搜索运单编号" prefix={<SearchOutlined />} style={{ width: 160 }} /><Button type="primary">查询</Button><Button>重置</Button></Space>
      </Card>
      <Card bordered={false} size="small">
        <Table columns={columns} dataSource={waybills} rowKey="waybill_id" loading={loading} pagination={{ total, showSizeChanger: true, showTotal: (t: number) => `共 ${t} 条` }} />
      </Card>
    </div>
  )
}
export default ReceiptList
