import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, Button, Modal, Form, InputNumber, Input, Descriptions, Space, message, List, Typography } from 'antd'
import { LineChartOutlined } from '@ant-design/icons'
import { getForecasts, getForecastDetail, submitCapacityResponse } from '../../api'

const SUPPLIER_ID = 1

const CapacityResponse: React.FC = () => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [responseOpen, setResponseOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<any>(null)
  const [forecastDetail, setForecastDetail] = useState<any>(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getForecasts({ supplier_id: SUPPLIER_ID }) as any
      setData(Array.isArray(res) ? res : [])
    } catch { setData([]) }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleResponse = async (item: any) => {
    setCurrentItem(item)
    try {
      const detail = await getForecastDetail(item.id, { supplier_id: SUPPLIER_ID }) as any
      setForecastDetail(detail)
      // Initialize form with forecast items
      const initialValues: Record<string, any> = {}
      if (detail?.items && Array.isArray(detail.items)) {
        detail.items.forEach((fi: any, idx: number) => {
          initialValues[`qty_${idx}`] = fi.quantity || fi.predicted_qty || 0
          initialValues[`date_${idx}`] = fi.expected_month || fi.expected_date || ''
        })
      }
      form.setFieldsValue(initialValues)
    } catch {
      setForecastDetail(null)
    }
    setResponseOpen(true)
  }

  const handleSubmit = async () => {
    if (!currentItem || !forecastDetail) return
    try {
      const values = await form.validateFields()
      const items = (forecastDetail.items || []).map((fi: any, idx: number) => ({
        material_id: fi.material_id || idx,
        material_name: fi.material_name || '',
        committed_qty: values[`qty_${idx}`] || 0,
        committed_date: values[`date_${idx}`] || '',
        risk_level: values[`risk_${idx}`] || 'low',
      }))
      await submitCapacityResponse(currentItem.id, {
        forecast_id: currentItem.id,
        supplier_id: SUPPLIER_ID,
        items,
        risk_summary: values.risk_summary,
      })
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
    draft: { color: 'default', text: '草稿' },
    published: { color: 'blue', text: '待响应' },
    confirmed: { color: 'green', text: '已响应' },
    expired: { color: 'red', text: '已过期' },
  }

  const columns = [
    { title: '预测周期', dataIndex: 'forecast_period', key: 'forecast_period' },
    { title: '开始日期', dataIndex: 'period_start', key: 'period_start', render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
    { title: '结束日期', dataIndex: 'period_end', key: 'period_end', render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => {
      const s = statusMap[v] || { color: 'default', text: v }
      return <Tag color={s.color}>{s.text}</Tag>
    }},
    { title: '已响应', dataIndex: 'has_responded', key: 'has_responded', render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? '是' : '否'}</Tag> },
    { title: '操作', key: 'action', render: (_: any, r: any) => (
      <Space>
        {r.status === 'published' && !r.has_responded && (
          <Button type="primary" size="small" icon={<LineChartOutlined />} onClick={() => handleResponse(r)}>提交产能响应</Button>
        )}
        {r.has_responded && (
          <Button size="small" onClick={() => handleResponse(r)}>查看/修改</Button>
        )}
      </Space>
    )},
  ]

  return (
    <div>
      <Card title="产能响应 (US-302)" extra={<Tag color="purple">预测数据由 ERP 同步</Tag>}>
        <Table rowKey="id" dataSource={data} columns={columns} loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title="提交产能响应"
        open={responseOpen}
        onOk={handleSubmit}
        onCancel={() => { setResponseOpen(false); form.resetFields() }}
        width={720}
        okText="提交响应"
      >
        {currentItem && (
          <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="预测周期">{currentItem.forecast_period}</Descriptions.Item>
            <Descriptions.Item label="状态">{statusMap[currentItem.status]?.text || currentItem.status}</Descriptions.Item>
          </Descriptions>
        )}

        {forecastDetail?.items && forecastDetail.items.length > 0 ? (
          <div style={{ marginBottom: 16 }}>
            <Typography.Text strong>物料预测明细：</Typography.Text>
            <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
              {forecastDetail.items.map((fi: any, idx: number) => (
                <Card key={idx} size="small" style={{ marginBottom: 8 }} title={fi.material_name || `物料${idx + 1}`}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <Form.Item name={`qty_${idx}`} label="可供应数量" rules={[{ required: true, message: '请输入' }]}>
                      <InputNumber min={0} style={{ width: '100%' }} placeholder="可供应数量" />
                    </Form.Item>
                    <Form.Item name={`date_${idx}`} label="承诺交期">
                      <Input placeholder="如：2026-05" />
                    </Form.Item>
                    <Form.Item name={`risk_${idx}`} label="风险等级" initialValue="low">
                      <Input placeholder="low/medium/high" />
                    </Form.Item>
                  </div>
                </Card>
              ))}
              <Form.Item name="risk_summary" label="整体风险说明">
                <Input.TextArea rows={2} placeholder="供应风险或不确定因素（可选）" />
              </Form.Item>
            </Form>
          </div>
        ) : (
          <Form form={form} layout="vertical">
            <Form.Item name="capacity_quantity" label="可供应数量（吨）" rules={[{ required: true, message: '请输入可供应数量' }]}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="可供应数量" />
            </Form.Item>
            <Form.Item name="delivery_commitment" label="交期承诺" rules={[{ required: true, message: '请输入交期承诺' }]}>
              <Input placeholder="如：下单后7天内交货" />
            </Form.Item>
            <Form.Item name="risk_summary" label="风险说明">
              <Input.TextArea rows={2} placeholder="供应风险或不确定因素（可选）" />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  )
}

export default CapacityResponse
