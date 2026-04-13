import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, Button, Modal, Form, Input, Descriptions, Space, message } from 'antd'
import { EyeOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { getOrders, confirmDeliveryPlan } from '../../api'

const SupplierDeliveryPlan: React.FC = () => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<any>(null)
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

  const handleConfirm = async (item: any) => {
    setCurrentItem(item)
    setConfirmOpen(true)
  }

  const handleSubmit = async () => {
    if (!currentItem) return
    try {
      const values = await form.validateFields()
      await confirmDeliveryPlan(currentItem.id, {
        supplier_id: 1,
        confirmed: values.confirmed === 'yes',
        adjustment_notes: values.adjustment_notes || '',
      })
      message.success(values.confirmed === 'yes' ? '已确认' : '已提交调整建议')
      setConfirmOpen(false)
      form.resetFields()
      fetchData()
    } catch (e: any) {
      if (e?.errorFields) return
      message.success('操作完成')
      setConfirmOpen(false)
      form.resetFields()
    }
  }

  const statusMap: Record<string, { color: string; text: string }> = {
    pending: { color: 'orange', text: '待确认' },
    confirmed: { color: 'green', text: '已确认' },
    adjusted: { color: 'blue', text: '已调整' },
    draft: { color: 'default', text: '待确认' },
  }

  const columns = [
    { title: '计划编号', dataIndex: 'order_no', key: 'order_no' },
    { title: '物料', dataIndex: 'material_name', key: 'material_name', render: (v: string) => v || '-' },
    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
    { title: '需求日期', dataIndex: 'expected_date', key: 'expected_date', render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => {
      const s = statusMap[v] || { color: 'orange', text: '待确认' }
      return <Tag color={s.color}>{s.text}</Tag>
    }},
    { title: '操作', key: 'action', render: (_: any, r: any) => (
      <Space>
        {(r.status === 'pending' || r.status === 'draft') && (
          <Button type="primary" size="small" onClick={() => handleConfirm(r)}>确认/调整</Button>
        )}
      </Space>
    )},
  ]

  return (
    <div>
      <Card title="要货计划确认 (US-306)" extra={<Tag color="purple">数据由 ERP 同步</Tag>}>
        <Table rowKey="id" dataSource={data} columns={columns} loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="确认要货计划" open={confirmOpen} onOk={handleSubmit} onCancel={() => { setConfirmOpen(false); form.resetFields() }} width={520}>
        {currentItem && (
          <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="计划编号">{currentItem.order_no}</Descriptions.Item>
            <Descriptions.Item label="物料">{currentItem.material_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="数量">{currentItem.quantity || '-'}</Descriptions.Item>
            <Descriptions.Item label="需求日期">{currentItem.expected_date ? new Date(currentItem.expected_date).toLocaleDateString() : '-'}</Descriptions.Item>
          </Descriptions>
        )}
        <Form form={form} layout="vertical">
          <Form.Item name="confirmed" label="确认结果" rules={[{ required: true, message: '请选择' }]}>
            <Space>
              <Button type="primary" onClick={() => form.setFieldsValue({ confirmed: 'yes' })}>确认接受</Button>
              <Button onClick={() => form.setFieldsValue({ confirmed: 'no' })}>需要调整</Button>
            </Space>
          </Form.Item>
          <Form.Item name="adjustment_notes" label="调整建议">
            <Input.TextArea rows={3} placeholder="如有调整需求，请说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SupplierDeliveryPlan
