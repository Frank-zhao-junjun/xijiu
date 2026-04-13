import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, Descriptions, Modal, Button, Space, Statistic, Row, Col } from 'antd'
import { EyeOutlined, LineChartOutlined } from '@ant-design/icons'
import { getOrders } from '../../api'

const ForecastList: React.FC = () => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<any>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getOrders() as any
      // 使用采购订单模拟预测数据（ERP同步后展示）
      setData(Array.isArray(res) ? res : [])
    } catch { setData([]) }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const statusMap: Record<string, { color: string; text: string }> = {
    draft: { color: 'default', text: '草稿' },
    confirmed: { color: 'blue', text: '已确认' },
    partial: { color: 'orange', text: '部分响应' },
    completed: { color: 'green', text: '已完成' },
  }

  const columns = [
    { title: '预测编号', dataIndex: 'order_no', key: 'order_no', render: (v: string) => v || '-' },
    { title: '物料/品类', dataIndex: 'material_name', key: 'material_name', render: (v: string) => v || '高粱/小麦' },
    { title: '预测数量', dataIndex: 'quantity', key: 'quantity', render: (v: number) => v ? `${v} 吨` : '-' },
    { title: '需求月份', dataIndex: 'expected_date', key: 'expected_date', render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => {
      const s = statusMap[v] || { color: 'blue', text: v || '已发布' }
      return <Tag color={s.color}>{s.text}</Tag>
    }},
    { title: '来源', key: 'source', render: () => <Tag color="purple">ERP同步</Tag> },
    { title: '操作', key: 'action', render: (_: any, r: any) => (
      <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => { setDetail(r); setDetailOpen(true) }}>查看</Button>
    )},
  ]

  return (
    <div>
      <Card title="采购预测 (US-301)" extra={<Tag color="purple">数据由 ERP/计划系统同步</Tag>}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}><Statistic title="预测总数" value={data.length} /></Col>
          <Col span={6}><Statistic title="已响应" value={data.filter((d: any) => d.status === 'confirmed' || d.status === 'partial').length} /></Col>
          <Col span={6}><Statistic title="待响应" value={data.filter((d: any) => d.status === 'draft' || d.status === 'pending').length} /></Col>
        </Row>
        <Table rowKey="id" dataSource={data} columns={columns} loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="预测详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={600}>
        {detail && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="预测编号">{detail.order_no || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态"><Tag color="blue">{detail.status || '已发布'}</Tag></Descriptions.Item>
            <Descriptions.Item label="物料">{detail.material_name || '高粱/小麦'}</Descriptions.Item>
            <Descriptions.Item label="数量">{detail.quantity ? `${detail.quantity} 吨` : '-'}</Descriptions.Item>
            <Descriptions.Item label="需求日期">{detail.expected_date ? new Date(detail.expected_date).toLocaleDateString() : '-'}</Descriptions.Item>
            <Descriptions.Item label="数据来源"><Tag color="purple">ERP同步</Tag></Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default ForecastList
