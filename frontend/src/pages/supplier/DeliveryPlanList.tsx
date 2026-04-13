import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, Button, Modal, Form, Input, Descriptions, Space, message } from 'antd'
import { EyeOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { getDeliveryPlans, confirmDeliveryPlan } from '../../api'

const DEMO_SUPPLIER_ID = 1

const SupplierDeliveryPlan: React.FC = () => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<any>(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getDeliveryPlans({ supplier_id: DEMO_SUPPLIER_ID }) as any
      const rows = res?.data ?? res
      setData(Array.isArray(rows) ? rows : [])
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
        supplier_id: currentItem.supplier_id || DEMO_SUPPLIER_ID,
        confirmed: values.confirmed === 'yes',
        adjustment_notes: values.adjustment_notes || '',
      })
      message.success(values.confirmed === 'yes' ? '已确认' : '已提交调整建议')
      setConfirmOpen(false)
      form.resetFields()
      fetchData()
    } catch (e: any) {
      if (e?.errorFields) return
      message.error(e?.response?.data?.detail || '操作失败')
    }
  }

  const statusMap: Record<string, { color: string; text: string }> = {
    pending: { color: 'orange', text: '待确认' },
    confirmed: { color: 'green', text: '已确认' },
    adjusted: { color: 'blue', text: '已调整' },
    draft: { color: 'default', text: '待确认' },
  }

  const columns = [
    { title: '计划ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '采购订单', dataIndex: 'po_id', key: 'po_id' },
    { title: '要货日期', dataIndex: 'required_date', key: 'required_date', render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
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
            <Descriptions.Item label="计划ID">{currentItem.id}</Descriptions.Item>
            <Descriptions.Item label="采购订单">{currentItem.po_id}</Descriptions.Item>
            <Descriptions.Item label="要货日期">{currentItem.required_date ? new Date(currentItem.required_date).toLocaleDateString() : '-'}</Descriptions.Item>
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
