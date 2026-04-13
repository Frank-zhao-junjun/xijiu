import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, Button, Modal, Form, Input, InputNumber, Select, Descriptions, Space, message } from 'antd'
import { PlusOutlined, EyeOutlined } from '@ant-design/icons'
import { getInvoices, createInvoice, getInvoiceStats } from '../../api'

const SUPPLIER_ID = 1

const SupplierInvoice: React.FC = () => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<any>(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getInvoices({ supplier_id: SUPPLIER_ID }) as any
      setData(Array.isArray(res) ? res : [])
    } catch { setData([]) }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      await createInvoice({ ...values, supplier_id: SUPPLIER_ID })
      message.success('发票已创建')
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
    pending: { color: 'orange', text: '待审核' },
    approved: { color: 'green', text: '已通过' },
    rejected: { color: 'red', text: '已驳回' },
    matched: { color: 'cyan', text: '三单匹配' },
  }

  const columns = [
    { title: '发票号', dataIndex: 'invoice_no', key: 'invoice_no' },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v: number) => v ? `¥${v.toLocaleString()}` : '-' },
    { title: '税额', dataIndex: 'tax_amount', key: 'tax_amount', render: (v: number) => v ? `¥${v.toLocaleString()}` : '-' },
    { title: '价税合计', dataIndex: 'total_amount', key: 'total_amount', render: (v: number) => v ? `¥${v.toLocaleString()}` : '-' },
    { title: '发票类型', dataIndex: 'invoice_type', key: 'invoice_type', render: (v: string) => v || '-' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => {
      const s = statusMap[v] || { color: 'default', text: v }
      return <Tag color={s.color}>{s.text}</Tag>
    }},
    { title: '操作', key: 'action', render: (_: any, r: any) => (
      <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => { setDetail(r); setDetailOpen(true) }}>查看</Button>
    )},
  ]

  return (
    <div>
      <Card title="发票管理 (US-403)" extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>创建发票</Button>
      }>
        <Table rowKey="id" dataSource={data} columns={columns} loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="创建发票" open={createOpen} onOk={handleCreate} onCancel={() => { setCreateOpen(false); form.resetFields() }} width={560}>
        <Form form={form} layout="vertical">
          <Form.Item name="statement_id" label="关联结算单ID">
            <InputNumber style={{ width: '100%' }} placeholder="关联结算单" />
          </Form.Item>
          <Form.Item name="invoice_no" label="发票号" rules={[{ required: true }]}>
            <Input placeholder="发票号码" />
          </Form.Item>
          <Form.Item name="amount" label="金额（不含税）" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} prefix="¥" />
          </Form.Item>
          <Form.Item name="tax_amount" label="税额" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} prefix="¥" />
          </Form.Item>
          <Form.Item name="invoice_type" label="发票类型">
            <Select placeholder="请选择">
              <Select.Option value="vat_special">增值税专用发票</Select.Option>
              <Select.Option value="vat_normal">增值税普通发票</Select.Option>
              <Select.Option value="receipt">收据</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="invoice_date" label="开票日期">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="remarks" label="备注">
            <Input.TextArea rows={2} placeholder="发票说明" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="发票详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={600}>
        {detail && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="发票号">{detail.invoice_no}</Descriptions.Item>
            <Descriptions.Item label="状态"><Tag color={statusMap[detail.status]?.color}>{statusMap[detail.status]?.text || detail.status}</Tag></Descriptions.Item>
            <Descriptions.Item label="金额">¥{(detail.amount || 0).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="税额">¥{(detail.tax_amount || 0).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="价税合计">¥{(detail.total_amount || 0).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="发票类型">{detail.invoice_type || '-'}</Descriptions.Item>
            <Descriptions.Item label="开票日期">{detail.invoice_date || '-'}</Descriptions.Item>
            <Descriptions.Item label="关联结算单">{detail.statement_id || '-'}</Descriptions.Item>
            {detail.remarks && <Descriptions.Item label="备注" span={2}>{detail.remarks}</Descriptions.Item>}
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default SupplierInvoice
