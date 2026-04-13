import React, { useEffect, useState } from 'react'
import { Table, Tag, Button, Modal, Form, Input, Descriptions, Space, Card, message } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons'
import { getPendingAuditRegistrations, getRegistration, auditRegistration } from '../../api'

const RegistrationAudit: React.FC = () => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<any>(null)
  const [auditModalOpen, setAuditModalOpen] = useState(false)
  const [auditTarget, setAuditTarget] = useState<any>(null)
  const [auditAction, setAuditAction] = useState<'approve' | 'reject'>('approve')
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getPendingAuditRegistrations() as any
      setData(Array.isArray(res) ? res : [])
    } catch { setData([]) }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const showDetail = async (id: number) => {
    try {
      const res = await getRegistration(id) as any
      setDetail(res)
      setDetailOpen(true)
    } catch { message.error('获取详情失败') }
  }

  const handleAudit = async () => {
    if (!auditTarget) return
    try {
      const values = await form.validateFields()
      await auditRegistration(auditTarget.id, {
        action: auditAction,
        reason: values.reason || '',
        auditor: '张明远'
      })
      message.success(auditAction === 'approve' ? '已通过' : '已驳回')
      setAuditModalOpen(false)
      form.resetFields()
      fetchData()
    } catch (e: any) {
      if (e?.errorFields) return
      message.error('操作失败')
    }
  }

  const statusMap: Record<string, { color: string; text: string }> = {
    pending: { color: 'orange', text: '待审核' },
    approved: { color: 'green', text: '已通过' },
    rejected: { color: 'red', text: '已驳回' },
    resubmitted: { color: 'blue', text: '已重新提交' },
  }

  const columns = [
    { title: '公司名称', dataIndex: 'company_name', key: 'company_name' },
    { title: '联系人', dataIndex: 'contact_person', key: 'contact_person' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => {
      const s = statusMap[v] || { color: 'default', text: v }
      return <Tag color={s.color}>{s.text}</Tag>
    }},
    { title: '提交时间', dataIndex: 'created_at', key: 'created_at', render: (v: string) => v ? new Date(v).toLocaleString() : '-' },
    { title: '操作', key: 'action', render: (_: any, r: any) => (
      <Space>
        <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => showDetail(r.id)}>查看</Button>
        <Button type="link" icon={<CheckCircleOutlined />} size="small" style={{ color: '#52c41a' }}
          onClick={() => { setAuditTarget(r); setAuditAction('approve'); setAuditModalOpen(true) }}>通过</Button>
        <Button type="link" danger icon={<CloseCircleOutlined />} size="small"
          onClick={() => { setAuditTarget(r); setAuditAction('reject'); setAuditModalOpen(true) }}>驳回</Button>
      </Space>
    )},
  ]

  return (
    <div>
      <Card title="供应商注册审核 (US-103)">
        <Table rowKey="id" dataSource={data} columns={columns} loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="注册详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={600}>
        {detail && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="公司名称">{detail.company_name}</Descriptions.Item>
            <Descriptions.Item label="联系人">{detail.contact_person}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{detail.email}</Descriptions.Item>
            <Descriptions.Item label="电话">{detail.phone}</Descriptions.Item>
            <Descriptions.Item label="经营范围">{detail.business_scope || '-'}</Descriptions.Item>
            <Descriptions.Item label="注册资本">{detail.registered_capital || '-'}</Descriptions.Item>
            <Descriptions.Item label="地址">{detail.address || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态"><Tag color={statusMap[detail.status]?.color}>{statusMap[detail.status]?.text || detail.status}</Tag></Descriptions.Item>
            {detail.reject_reason && <Descriptions.Item label="驳回原因">{detail.reject_reason}</Descriptions.Item>}
          </Descriptions>
        )}
      </Modal>

      <Modal
        title={auditAction === 'approve' ? '通过注册' : '驳回注册'}
        open={auditModalOpen}
        onOk={handleAudit}
        onCancel={() => { setAuditModalOpen(false); form.resetFields() }}
      >
        <Form form={form} layout="vertical">
          {auditAction === 'reject' && (
            <Form.Item name="reason" label="驳回原因" rules={[{ required: true, message: '请输入驳回原因' }]}>
              <Input.TextArea rows={3} placeholder="请说明驳回原因" />
            </Form.Item>
          )}
          {auditAction === 'approve' && (
            <Form.Item name="reason" label="备注">
              <Input.TextArea rows={2} placeholder="审批备注（可选）" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}

export default RegistrationAudit
