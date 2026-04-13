import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, Button, Modal, Form, Input, InputNumber, Descriptions, Space, message } from 'antd'
import { EyeOutlined, LineChartOutlined } from '@ant-design/icons'
import { getForecasts, submitCapacityResponse } from '../../api'

const DEMO_SUPPLIER_ID = 1

const CapacityResponse: React.FC = () => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [responseOpen, setResponseOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<any>(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getForecasts({ supplier_id: DEMO_SUPPLIER_ID, status: 'published' }) as any
      const rows = res?.data ?? res
      setData(Array.isArray(rows) ? rows : [])
    } catch { setData([]) }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleResponse = (item: any) => {
    setCurrentItem(item)
    setResponseOpen(true)
  }

  const handleSubmit = async () => {
    if (!currentItem) return
    try {
      const values = await form.validateFields()
      await submitCapacityResponse(currentItem.id, {
        supplier_id: DEMO_SUPPLIER_ID,
        response_data: [
          {
            committed_qty: values.capacity_quantity,
            delivery_commitment: values.delivery_commitment,
          },
        ],
        risk_summary: values.risk_notes || '',
      })
      message.success('产能响应已提交')
      setResponseOpen(false)
      form.resetFields()
      fetchData()
    } catch (e: any) {
      if (e?.errorFields) return
      message.error(e?.response?.data?.detail || '提交失败')
    }
  }

  const statusMap: Record<string, { color: string; text: string }> = {
    pending: { color: 'orange', text: '待响应' },
    responded: { color: 'green', text: '已响应' },
    draft: { color: 'default', text: '待响应' },
    confirmed: { color: 'green', text: '已响应' },
  }

  const columns = [
    { title: '预测期间', dataIndex: 'forecast_period', key: 'forecast_period' },
    { title: '物料', key: 'mat', render: (_: unknown, r: any) => {
      const it = r.items_data
      return Array.isArray(it) && it[0]?.material_name ? it[0].material_name : '—'
    }},
    { title: '预测数量', key: 'qty', render: (_: unknown, r: any) => {
      const it = r.items_data
      if (!Array.isArray(it)) return '—'
      const q = it.reduce((s: number, x: any) => s + (Number(x.quantity) || 0), 0)
      return q ? `${q} 吨` : '—'
    }},
    { title: '周期', key: 'p', render: (_: unknown, r: any) => `${r.period_start ? new Date(r.period_start).toLocaleDateString() : '—'} ~ ${r.period_end ? new Date(r.period_end).toLocaleDateString() : '—'}` },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => {
      const s = statusMap[v] || { color: 'orange', text: '待响应' }
      return <Tag color={s.color}>{s.text}</Tag>
    }},
    { title: '操作', key: 'action', render: (_: any, r: any) => (
      <Space>
        {(r.status === 'published') && (
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
            <Descriptions.Item label="预测期间">{currentItem.forecast_period}</Descriptions.Item>
            <Descriptions.Item label="周期">{currentItem.period_start ? new Date(currentItem.period_start).toLocaleDateString() : '—'} ~ {currentItem.period_end ? new Date(currentItem.period_end).toLocaleDateString() : '—'}</Descriptions.Item>
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
