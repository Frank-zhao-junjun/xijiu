import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, Button, Modal, Form, Input, Select, Space, message, Descriptions } from 'antd'
import { PlusOutlined, EyeOutlined } from '@ant-design/icons'
import { getSupplierCertifications, addSupplierCertification, getSupplierAlerts, resolveAlert } from '../../api'

const SupplierCertification: React.FC = () => {
  const [certs, setCerts] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [form] = Form.useForm()
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<any>(null)
  const supplierId = 1 // 默认供应商ID

  const fetchData = async () => {
    setLoading(true)
    try {
      const [certsRes, alertsRes] = await Promise.allSettled([
        getSupplierCertifications(supplierId),
        getSupplierAlerts()
      ])
      setCerts(certsRes.status === 'fulfilled' ? (Array.isArray(certsRes.value) ? certsRes.value : []) : [])
      setAlerts(alertsRes.status === 'fulfilled' ? (Array.isArray(alertsRes.value) ? alertsRes.value : []) : [])
    } catch { setCerts([]); setAlerts([]) }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleAdd = async () => {
    try {
      const values = await form.validateFields()
      await addSupplierCertification(supplierId, values)
      message.success('资质已添加')
      setAddOpen(false)
      form.resetFields()
      fetchData()
    } catch (e: any) {
      if (e?.errorFields) return
      message.error('添加失败')
    }
  }

  const handleRenew = async (alertId: number) => {
    try {
      await resolveAlert(alertId)
      message.success('已提交重认证')
      fetchData()
    } catch { message.error('操作失败') }
  }

  const certColumns = [
    { title: '资质名称', dataIndex: 'cert_name', key: 'cert_name' },
    { title: '证书编号', dataIndex: 'cert_number', key: 'cert_number' },
    { title: '颁发机构', dataIndex: 'issuing_authority', key: 'issuing_authority' },
    { title: '颁发日期', dataIndex: 'issue_date', key: 'issue_date', render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
    { title: '到期日期', dataIndex: 'expiry_date', key: 'expiry_date', render: (v: string) => {
      if (!v) return '-'
      const isExpiringSoon = new Date(v) < new Date(Date.now() + 30 * 24 * 3600 * 1000)
      return <span style={{ color: isExpiringSoon ? '#ff4d4f' : undefined }}>{new Date(v).toLocaleDateString()}</span>
    }},
    { title: '操作', key: 'action', render: (_: any, r: any) => (
      <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => { setDetail(r); setDetailOpen(true) }}>查看</Button>
    )},
  ]

  const alertColumns = [
    { title: '预警类型', dataIndex: 'alert_type', key: 'alert_type', render: (v: string) => {
      const map: Record<string, { color: string; text: string }> = {
        cert_expiring: { color: 'orange', text: '即将到期' },
        cert_expired: { color: 'red', text: '已过期' },
        qualification_expiring: { color: 'orange', text: '资格即将到期' },
      }
      const info = map[v] || { color: 'default', text: v }
      return <Tag color={info.color}>{info.text}</Tag>
    }},
    { title: '预警信息', dataIndex: 'message', key: 'message', ellipsis: true },
    { title: '剩余天数', dataIndex: 'days_before_expiry', key: 'days_before_expiry', render: (v: number) => v > 0 ? `${v}天` : '已过期' },
    { title: '供应商', dataIndex: 'supplier_name', key: 'supplier_name' },
    { title: '状态', key: 'status', render: (_: any, r: any) => <Tag color={r.is_resolved ? 'green' : 'orange'}>{r.is_resolved ? '已处理' : '待处理'}</Tag> },
    { title: '操作', key: 'action', render: (_: any, r: any) => (
      !r.is_resolved ? <Button type="link" size="small" onClick={() => handleRenew(r.id)}>提交重认证</Button> : <span style={{ color: '#999' }}>-</span>
    )},
  ]

  return (
    <div>
      <Card title="资质管理 (US-108)" style={{ marginBottom: 16 }} extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>添加资质</Button>
      }>
        <Table rowKey="id" dataSource={certs} columns={certColumns} loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      {alerts.filter((a: any) => !a.is_resolved).length > 0 && (
        <Card title="过期预警" style={{ marginBottom: 16 }}>
          <Table rowKey="id" dataSource={alerts.filter((a: any) => !a.is_resolved)} columns={alertColumns} pagination={false} size="small" />
        </Card>
      )}

      <Modal title="添加资质" open={addOpen} onOk={handleAdd} onCancel={() => { setAddOpen(false); form.resetFields() }} width={520}>
        <Form form={form} layout="vertical">
          <Form.Item name="cert_type" label="资质类型" rules={[{ required: true, message: '请选择资质类型' }]}>
            <Select placeholder="请选择">
              <Select.Option value="营业执照">营业执照</Select.Option>
              <Select.Option value="生产许可证">生产许可证</Select.Option>
              <Select.Option value="质量体系认证">质量体系认证</Select.Option>
              <Select.Option value="行业资质">行业资质</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="cert_name" label="资质名称" rules={[{ required: true, message: '请输入资质名称' }]}>
            <Input placeholder="如：食品生产许可证" />
          </Form.Item>
          <Form.Item name="cert_no" label="证书编号">
            <Input placeholder="证书编号" />
          </Form.Item>
          <Form.Item name="issue_date" label="颁发日期">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="expiry_date" label="到期日期" rules={[{ required: true, message: '请输入到期日期' }]}>
            <Input type="date" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="资质详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null}>
        {detail && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="资质名称">{detail.cert_name}</Descriptions.Item>
            <Descriptions.Item label="证书编号">{detail.cert_number || '-'}</Descriptions.Item>
            <Descriptions.Item label="颁发机构">{detail.issuing_authority || '-'}</Descriptions.Item>
            <Descriptions.Item label="颁发日期">{detail.issue_date ? new Date(detail.issue_date).toLocaleDateString() : '-'}</Descriptions.Item>
            <Descriptions.Item label="到期日期">{detail.expiry_date ? new Date(detail.expiry_date).toLocaleDateString() : '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default SupplierCertification
