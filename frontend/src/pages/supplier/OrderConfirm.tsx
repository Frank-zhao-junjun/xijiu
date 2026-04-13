import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, Button, Modal, Form, Input, Descriptions, Space, message } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons'
import { getOrders, confirmOrder, rejectOrder } from '../../api'

const SupplierOrderConfirm: React.FC = () => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<any>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<any>(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getOrders() as any
      setData(Array.isArray(res) ? res : [])
    } catch { setData([]) }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleConfirm = async (id: number) => {
    try {
      await confirmOrder(id)
      message.success('订单已确认')
      fetchData()
    } catch { message.error('确认失败') }
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    try {
      const values = await form.validateFields()
      await rejectOrder(rejectTarget.id, values.reason)
      message.success('订单已拒绝')
      setRejectOpen(false)
      form.resetFields()
      fetchData()
    } catch (e: any) {
      if (e?.errorFields) return
      message.error('拒绝失败')
    }
  }

  const statusMap: Record<string, { color: string; text: string }> = {
    pending: { color: 'orange', text: '待确认' },
    confirmed: { color: 'green', text: '已确认' },
    rejected: { color: 'red', text: '已拒绝' },
    draft: { color: 'default', text: '待确认' },
    shipped: { color: 'blue', text: '已发货' },
  }

  const columns = [
    { title: '订单编号', dataIndex: 'order_no', key: 'order_no' },
    { title: '物料', dataIndex: 'material_name', key: 'material_name', render: (v: string) => v || '-' },
    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
    { title: '金额', dataIndex: 'total_amount', key: 'total_amount', render: (v: number) => v ? `¥${v.toLocaleString()}` : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => {
      const s = statusMap[v] || { color: 'default', text: v }
      return <Tag color={s.color}>{s.text}</Tag>
    }},
    { title: '操作', key: 'action', render: (_: any, r: any) => (
      <Space>
        <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => { setDetail(r); setDetailOpen(true) }}>查看</Button>
        {(r.status === 'pending' || r.status === 'draft') && (
          <>
            <Button type="link" icon={<CheckCircleOutlined />} size="small" style={{ color: '#52c41a' }}
              onClick={() => handleConfirm(r.id)}>确认</Button>
            <Button type="link" danger icon={<CloseCircleOutlined />} size="small"
              onClick={() => { setRejectTarget(r); setRejectOpen(true) }}>拒绝</Button>
          </>
        )}
      </Space>
    )},
  ]

  return (
    <div>
      <Card title="订单确认 (US-303)" extra={<Tag color="purple">订单由 ERP 同步</Tag>}>
        <Table rowKey="id" dataSource={data} columns={columns} loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="订单详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={600}>
        {detail && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="订单编号">{detail.order_no}</Descriptions.Item>
            <Descriptions.Item label="状态"><Tag color={statusMap[detail.status]?.color}>{statusMap[detail.status]?.text || detail.status}</Tag></Descriptions.Item>
            <Descriptions.Item label="物料">{detail.material_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="数量">{detail.quantity || '-'}</Descriptions.Item>
            <Descriptions.Item label="金额">{detail.total_amount ? `¥${detail.total_amount.toLocaleString()}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="需求日期">{detail.expected_date ? new Date(detail.expected_date).toLocaleDateString() : '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal title="拒绝订单" open={rejectOpen} onOk={handleReject} onCancel={() => { setRejectOpen(false); form.resetFields() }}>
        <Form form={form} layout="vertical">
          <Form.Item name="reason" label="拒绝原因" rules={[{ required: true, message: '请输入拒绝原因' }]}>
            <Input.TextArea rows={3} placeholder="请说明拒绝原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SupplierOrderConfirm
