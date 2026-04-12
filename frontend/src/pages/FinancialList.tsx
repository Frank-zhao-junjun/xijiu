import React, { useEffect, useState } from 'react'
import { Table, Card, Input, Select, Button, Space, Tag, Row, Col, Statistic, Tabs, Modal, message, Timeline } from 'antd'
import { SearchOutlined, DollarOutlined, FileTextOutlined, CreditCardOutlined, CheckCircleOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { 
  getStatements, getStatementStats, confirmStatement,
  getInvoices, getInvoiceStats,
  getPayments, getPaymentStats, approvePayment, confirmPayment,
  SettlementStatement, Invoice, Payment
} from '../api'

const { Option } = Select

// 结算单状态
const statementStatusMap: Record<string, { color: string; text: string }> = {
  draft: { color: 'default', text: '草稿' },
  confirmed: { color: 'blue', text: '已确认' },
  paid: { color: 'green', text: '已付款' },
  partial: { color: 'orange', text: '部分付款' },
}

// 发票状态
const invoiceStatusMap: Record<string, { color: string; text: string }> = {
  issued: { color: 'blue', text: '已开票' },
  verified: { color: 'green', text: '已认证' },
  void: { color: 'red', text: '已作废' },
}

// 付款状态
const paymentStatusMap: Record<string, { color: string; text: string }> = {
  applied: { color: 'orange', text: '申请中' },
  approved: { color: 'blue', text: '已批准' },
  paid: { color: 'green', text: '已付款' },
  rejected: { color: 'red', text: '已拒绝' },
}

const FinancialList: React.FC = () => {
  const [activeTab, setActiveTab] = useState('statements')
  const [statements, setStatements] = useState<SettlementStatement[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [statementStats, setStatementStats] = useState<any>(null)
  const [invoiceStats, setInvoiceStats] = useState<any>(null)
  const [paymentStats, setPaymentStats] = useState<any>(null)

  useEffect(() => {
    loadStatements()
    loadStatementStats()
    loadInvoices()
    loadInvoiceStats()
    loadPayments()
    loadPaymentStats()
  }, [])

  const loadStatements = async () => {
    setLoading(true)
    try {
      const res = await getStatements()
      setStatements(res)
    } catch (err) {
      message.error('加载结算单失败')
    } finally {
      setLoading(false)
    }
  }

  const loadStatementStats = async () => {
    try {
      const res = await getStatementStats()
      setStatementStats(res)
    } catch (err) {
      console.error('加载统计失败', err)
    }
  }

  const loadInvoices = async () => {
    try {
      const res = await getInvoices()
      setInvoices(res)
    } catch (err) {
      message.error('加载发票失败')
    }
  }

  const loadInvoiceStats = async () => {
    try {
      const res = await getInvoiceStats()
      setInvoiceStats(res)
    } catch (err) {
      console.error('加载统计失败', err)
    }
  }

  const loadPayments = async () => {
    try {
      const res = await getPayments()
      setPayments(res)
    } catch (err) {
      message.error('加载付款记录失败')
    } finally {
      setLoading(false)
    }
  }

  const loadPaymentStats = async () => {
    try {
      const res = await getPaymentStats()
      setPaymentStats(res)
    } catch (err) {
      console.error('加载统计失败', err)
    }
  }

  const handleConfirmStatement = async (id: number) => {
    try {
      await confirmStatement(id)
      message.success('结算单已确认')
      loadStatements()
    } catch (err) {
      message.error('操作失败')
    }
  }

  const handleApprovePayment = async (id: number) => {
    try {
      await approvePayment(id)
      message.success('付款申请已批准')
      loadPayments()
      loadPaymentStats()
    } catch (err) {
      message.error('操作失败')
    }
  }

  const handleConfirmPayment = async (id: number) => {
    try {
      await confirmPayment(id)
      message.success('付款已完成')
      loadPayments()
      loadPaymentStats()
    } catch (err) {
      message.error('操作失败')
    }
  }

  // 结算单列
  const statementColumns: ColumnsType<SettlementStatement> = [
    { title: '结算单号', dataIndex: 'statement_no', key: 'statement_no', width: 160 },
    { title: '供应商', dataIndex: 'supplier_name', key: 'supplier_name', width: 150 },
    { title: '结算周期', key: 'period', width: 200, render: (_, r) => `${new Date(r.period_start).toLocaleDateString()} ~ ${new Date(r.period_end).toLocaleDateString()}` },
    { title: '结算金额', dataIndex: 'total_amount', key: 'total_amount', width: 120, render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '已付金额', dataIndex: 'paid_amount', key: 'paid_amount', width: 120, render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (v: string) => <Tag color={statementStatusMap[v]?.color}>{statementStatusMap[v]?.text || v}</Tag> },
    { title: '确认时间', dataIndex: 'confirmed_at', key: 'confirmed_at', width: 170, render: (v: string) => v ? new Date(v).toLocaleString('zh-CN') : '-' },
    { title: '操作', key: 'action', width: 120, render: (_, r) => r.status === 'draft' ? (
      <Button type="link" onClick={() => handleConfirmStatement(r.id)}>确认</Button>
    ) : <span style={{ color: '#999' }}>-</span> },
  ]

  // 发票列
  const invoiceColumns: ColumnsType<Invoice> = [
    { title: '发票号', dataIndex: 'invoice_no', key: 'invoice_no', width: 160 },
    { title: '供应商', dataIndex: 'supplier_name', key: 'supplier_name', width: 150 },
    { title: '金额', dataIndex: 'amount', key: 'amount', width: 120, render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '税额', dataIndex: 'tax_amount', key: 'tax_amount', width: 100, render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '价税合计', dataIndex: 'total_amount', key: 'total_amount', width: 120, render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '发票类型', dataIndex: 'invoice_type', key: 'invoice_type', width: 100, render: (v: string) => v === 'VAT_SPECIAL' ? '专用发票' : '普通发票' },
    { title: '开票日期', dataIndex: 'invoice_date', key: 'invoice_date', width: 120, render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (v: string) => <Tag color={invoiceStatusMap[v]?.color}>{invoiceStatusMap[v]?.text || v}</Tag> },
  ]

  // 付款列
  const paymentColumns: ColumnsType<Payment> = [
    { title: '付款单号', dataIndex: 'payment_no', key: 'payment_no', width: 160 },
    { title: '供应商', dataIndex: 'supplier_name', key: 'supplier_name', width: 150 },
    { title: '付款金额', dataIndex: 'amount', key: 'amount', width: 120, render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '付款方式', dataIndex: 'payment_method', key: 'payment_method', width: 100, render: (v: string) => v === 'bank_transfer' ? '银行转账' : v },
    { title: '预计付款', dataIndex: 'expected_date', key: 'expected_date', width: 120, render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
    { title: '实际付款', dataIndex: 'actual_date', key: 'actual_date', width: 120, render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (v: string) => <Tag color={paymentStatusMap[v]?.color}>{paymentStatusMap[v]?.text || v}</Tag> },
    { title: '操作', key: 'action', width: 150, render: (_, r) => (
      <Space>
        {r.status === 'applied' && <Button type="link" onClick={() => handleApprovePayment(r.id)}>批准</Button>}
        {r.status === 'approved' && <Button type="link" onClick={() => handleConfirmPayment(r.id)}>确认付款</Button>}
      </Space>
    )},
  ]

  const tabItems = [
    {
      key: 'statements',
      label: <span><FileTextOutlined /> 结算单</span>,
      children: (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}><Card bordered={false} size="small"><Statistic title="待对账" value={statementStats?.draft_count || 0} suffix="单" prefix="¥" valueStyle={{ color: '#FAAD14' }} /></Card></Col>
            <Col span={6}><Card bordered={false} size="small"><Statistic title="待付款" value={statementStats?.confirmed_count || 0} suffix="单" prefix="¥" valueStyle={{ color: '#1890FF' }} /></Card></Col>
            <Col span={6}><Card bordered={false} size="small"><Statistic title="已付款" value={statementStats?.paid_count || 0} suffix="单" prefix="¥" valueStyle={{ color: '#52C41A' }} /></Card></Col>
          </Row>
          <Table columns={statementColumns} dataSource={statements} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
        </>
      ),
    },
    {
      key: 'invoices',
      label: <span><DollarOutlined /> 发票</span>,
      children: (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}><Card bordered={false} size="small"><Statistic title="待认证" value={invoiceStats?.issued_count || 0} suffix="张" valueStyle={{ color: '#FAAD14' }} /></Card></Col>
            <Col span={6}><Card bordered={false} size="small"><Statistic title="已认证" value={invoiceStats?.verified_count || 0} suffix="张" valueStyle={{ color: '#52C41A' }} /></Card></Col>
          </Row>
          <Table columns={invoiceColumns} dataSource={invoices} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
        </>
      ),
    },
    {
      key: 'payments',
      label: <span><CreditCardOutlined /> 付款</span>,
      children: (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}><Card bordered={false} size="small"><Statistic title="申请中" value={paymentStats?.applied_count || 0} suffix="笔" valueStyle={{ color: '#FAAD14' }} /></Card></Col>
            <Col span={6}><Card bordered={false} size="small"><Statistic title="待付款" value={paymentStats?.approved_count || 0} suffix="笔" valueStyle={{ color: '#1890FF' }} /></Card></Col>
            <Col span={6}><Card bordered={false} size="small"><Statistic title="已付款" value={paymentStats?.paid_count || 0} suffix="笔" valueStyle={{ color: '#52C41A' }} /></Card></Col>
          </Row>
          <Table columns={paymentColumns} dataSource={payments} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
        </>
      ),
    },
  ]

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>财务管理</h2>
      <Card bordered={false}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>
    </div>
  )
}

export default FinancialList
