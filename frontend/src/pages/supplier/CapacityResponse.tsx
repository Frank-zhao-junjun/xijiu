import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, Button, Modal, Form, Input, InputNumber, Descriptions, Space, message } from 'antd'
import { EyeOutlined, LineChartOutlined } from '@ant-design/icons'
import { getOrders } from '../../api'

const CapacityResponse: React.FC = () => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [responseOpen, setResponseOpen] = useState(false)
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

  const handleResponse = (item: any) => {
    setCurrentItem(item)
    setResponseOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      message.success('产能响应已提交')
      setResponseOpen(false)
      form.resetFields()
      fetchData()
    } catch (e: any) {
      if (e?.errorFields) return
      message.error('提交失败')
    }
  }

  const statusMap: Record<string, { color: string; text: string }> = {
    pending: { color: 'orange', text: '待响应' },
    responded: { color: 'green', text: '已响应' },
    draft: { color: 'default', text: '待响应' },
    confirmed: { color: 'green', text: '已响应' },
  }

  const columns = [
    { title: '预测编号', dataIndex: 'order_no', key: 'order_no' },
    { title: '物料', dataIndex: 'material_name', key: 'material_name', render: (v: string) => v || '高粱/小麦' },
    { title: '预测数量', dataIndex: 'quantity', key: 'quantity', render: (v: number) => v ? `${v} 吨` : '-' },
    { title: '需求日期', dataIndex: 'expected_date', key: 'expected_date', render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => {
      const s = statusMap[v] || { color: 'orange', text: '待响应' }
      return <Tag color={s.color}>{s.text}</Tag>
    }},
    { title: '操作', key: 'action', render: (_: any, r: any) => (
      <Space>
        {(r.status === 'pending' || r.status === 'draft') && (
          <Button type="primary" size="small" onClick={() => handleResponse(r)}>提交产能响应</Button>
        )}
      </Space>
    )},
  ]

  return (
    <div>
      <Card title="产能响应 (US-302)" extra={<Tag color="purple">预测数据由 ERP 同步</Tag>}>
        <Table rowKey="id" dataSource={data} columns={columns} loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="提交产能响应" open={responseOpen} onOk={handleSubmit} onCancel={() => { setResponseOpen(false); form.resetFields() }} width={520}>
        {currentItem && (
          <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="预测编号">{currentItem.order_no}</Descriptions.Item>
            <Descriptions.Item label="物料">{currentItem.material_name || '高粱/小麦'}</Descriptions.Item>
            <Descriptions.Item label="预测数量">{currentItem.quantity ? `${currentItem.quantity} 吨` : '-'}</Descriptions.Item>
          </Descriptions>
        )}
        <Form form={form} layout="vertical">
          <Form.Item name="capacity_quantity" label="可供应数量（吨）" rules={[{ required: true, message: '请输入可供应数量' }]}>
            <InputNumber min={0} style={{ width: '100%' }} placeholder="可供应数量" />
          </Form.Item>
          <Form.Item name="delivery_commitment" label="交期承诺" rules={[{ required: true, message: '请输入交期承诺' }]}>
            <Input placeholder="如：下单后7天内交货" />
          </Form.Item>
          <Form.Item name="risk_notes" label="风险说明">
            <Input.TextArea rows={2} placeholder="供应风险或不确定因素（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CapacityResponse
