import React, { useEffect, useState } from 'react'
import { Card, Descriptions, Table, Tag, Timeline, Button, Row, Col } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { getOrderById } from '../api'

const PurchaseOrderDetail: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (id) getOrderById(id).then(setOrder).finally(() => setLoading(false)) }, [id])

  const statusMap: Record<string, { color: string; text: string }> = {
    '草稿': { color: 'default', text: '草稿' }, '已提交': { color: 'orange', text: '已提交' },
    '已确认': { color: 'blue', text: '已确认' }, '已发货': { color: 'cyan', text: '已发货' },
    '已到货': { color: 'purple', text: '已到货' }, '已入库': { color: 'green', text: '已入库' }
  }

  const columns = [
    { title: '序号', dataIndex: 'line_number', key: 'line_number', width: 60 },
    { title: '物料名称', dataIndex: 'material_name', key: 'material_name' },
    { title: '规格', dataIndex: 'specification', key: 'specification' },
    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 60 },
    { title: '单价', dataIndex: 'unit_price', key: 'unit_price', render: (v: number) => v ? `¥${v}` : '-' },
    { title: '小计', dataIndex: 'subtotal', key: 'subtotal', render: (v: number) => v ? `¥${v}` : '-' },
    { title: '已发货', dataIndex: 'actual_delivered_qty', key: 'actual_delivered_qty' },
    { title: '已验收', dataIndex: 'accepted_qty', key: 'accepted_qty' }
  ]

  if (loading) return <Card loading />
  if (!order) return <Card>订单不存在</Card>

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')} style={{ marginBottom: 16 }}>返回列表</Button>
      <Row gutter={[8, 8]}>
        <Col span={16}>
          <Card title="订单信息" bordered={false} size="small">
            <Descriptions column={2}>
              <Descriptions.Item label="订单编号">{order.order_number}</Descriptions.Item>
              <Descriptions.Item label="状态"><Tag color={statusMap[order.status]?.color}>{statusMap[order.status]?.text}</Tag></Descriptions.Item>
              <Descriptions.Item label="计划类型">{order.plan_type}</Descriptions.Item>
              <Descriptions.Item label="订单金额">¥{order.total_amount?.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="预计交货日期">{order.expected_delivery_date}</Descriptions.Item>
              <Descriptions.Item label="创建人">{order.created_by}</Descriptions.Item>
            </Descriptions>
          </Card>
          <Card title="订单明细" bordered={false} size="small" style={{ marginTop: 8 }}>
            <Table columns={columns} dataSource={order.line_items || []} rowKey="line_id" pagination={false} size="small" />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="状态变更历史" bordered={false} size="small">
            <Timeline items={(order.status_history || []).map((h: any, i: number) => ({
              color: i === 0 ? 'blue' : 'gray',
              children: <div><div style={{ fontWeight: 500 }}>{h.to_status}</div><div style={{ fontSize: 12, color: '#6E6E73' }}>{h.changed_by} · {h.change_time}</div></div>
            }))} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
export default PurchaseOrderDetail
