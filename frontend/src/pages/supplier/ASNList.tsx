import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, Button, Modal, Form, Input, InputNumber, DatePicker, Descriptions, Space, message } from 'antd'
import { PlusOutlined, EyeOutlined, SendOutlined } from '@ant-design/icons'
import { getShipmentNotes, createASN } from '../../api'

const ASNList: React.FC = () => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<any>(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getShipmentNotes() as any
      setData(Array.isArray(res) ? res : [])
    } catch { setData([]) }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      await createASN({
        ...values,
        supplier_id: 1,
        total_quantity: values.total_quantity || 0,
      })
      message.success('ASN 已创建')
      setCreateOpen(false)
      form.resetFields()
      fetchData()
    } catch (e: any) {
      if (e?.errorFields) return
      message.error('创建失败')
    }
  }

  const statusMap: Record<string, { color: string; text: string }> = {
    draft: { color: 'default', text: '草稿' },
    pending: { color: 'orange', text: '待确认' },
    approved: { color: 'green', text: '已确认' },
    rejected: { color: 'red', text: '已拒绝' },
    shipped: { color: 'blue', text: '已发货' },
    arrived: { color: 'cyan', text: '已到货' },
  }

  const columns = [
    { title: 'ASN编号', dataIndex: 'shipment_no', key: 'shipment_no' },
    { title: '承运商', dataIndex: 'carrier_name', key: 'carrier_name', render: (v: string) => v || '-' },
    { title: '车牌号', dataIndex: 'vehicle_no', key: 'vehicle_no', render: (v: string) => v || '-' },
    { title: '预计到达', dataIndex: 'expected_arrival', key: 'expected_arrival', render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
    { title: '数量', dataIndex: 'total_quantity', key: 'total_quantity' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => {
      const s = statusMap[v] || { color: 'default', text: v }
      return <Tag color={s.color}>{s.text}</Tag>
    }},
    { title: '操作', key: 'action', render: (_: any, r: any) => (
      <Space>
        <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => { setDetail(r); setDetailOpen(true) }}>查看</Button>
      </Space>
    )},
  ]

  return (
    <div>
      <Card title="送货计划/ASN (US-307)" extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>创建 ASN</Button>
      }>
        <Table rowKey="id" dataSource={data} columns={columns} loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="创建 ASN" open={createOpen} onOk={handleCreate} onCancel={() => { setCreateOpen(false); form.resetFields() }} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="purchase_order_id" label="采购订单ID" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} placeholder="关联的采购订单" />
          </Form.Item>
          <Form.Item name="carrier_name" label="承运商">
            <Input placeholder="承运商名称" />
          </Form.Item>
          <Form.Item name="tracking_no" label="运单号">
            <Input placeholder="物流运单号" />
          </Form.Item>
          <Form.Item name="vehicle_no" label="车牌号">
            <Input placeholder="如：贵A12345" />
          </Form.Item>
          <Form.Item name="driver_name" label="司机姓名">
            <Input placeholder="司机姓名" />
          </Form.Item>
          <Form.Item name="driver_phone" label="司机电话">
            <Input placeholder="联系电话" />
          </Form.Item>
          <Form.Item name="expected_arrival" label="预计到达日期">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="shipping_address" label="发货地址">
            <Input placeholder="发货地址" />
          </Form.Item>
          <Form.Item name="total_quantity" label="总数量">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="发货总数量" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="ASN 详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={600}>
        {detail && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="ASN编号">{detail.shipment_no}</Descriptions.Item>
            <Descriptions.Item label="状态"><Tag color={statusMap[detail.status]?.color}>{statusMap[detail.status]?.text || detail.status}</Tag></Descriptions.Item>
            <Descriptions.Item label="承运商">{detail.carrier_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="运单号">{detail.tracking_no || '-'}</Descriptions.Item>
            <Descriptions.Item label="车牌号">{detail.vehicle_no || '-'}</Descriptions.Item>
            <Descriptions.Item label="司机">{detail.driver_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="预计到达">{detail.expected_arrival ? new Date(detail.expected_arrival).toLocaleDateString() : '-'}</Descriptions.Item>
            <Descriptions.Item label="总数量">{detail.total_quantity || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default ASNList
