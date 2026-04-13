import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Tag, Space, message, Popconfirm, Card } from 'antd'
import { PlusOutlined, DeleteOutlined, MailOutlined } from '@ant-design/icons'
import { getInvitations, createInvitation, deleteInvitation } from '../../api'

const InvitationList: React.FC = () => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getInvitations() as any
      setData(Array.isArray(res) ? res : [])
    } catch { setData([]) }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      await createInvitation(values)
      message.success('邀请已发送')
      setModalOpen(false)
      form.resetFields()
      fetchData()
    } catch (e: any) {
      if (e?.errorFields) return
      message.error('操作失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteInvitation(id)
      message.success('已删除')
      fetchData()
    } catch { message.error('删除失败') }
  }

  const statusMap: Record<string, { color: string; text: string }> = {
    pending: { color: 'orange', text: '待响应' },
    used: { color: 'green', text: '已注册' },
    expired: { color: 'default', text: '已过期' },
    cancelled: { color: 'red', text: '已取消' },
  }

  const columns = [
    { title: '邀请码', dataIndex: 'invitation_code', key: 'invitation_code', render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '供应商名称', dataIndex: 'invited_supplier_name', key: 'invited_supplier_name' },
    { title: '联系人', dataIndex: 'invited_contact_person', key: 'invited_contact_person' },
    { title: '邮箱', dataIndex: 'invited_email', key: 'invited_email' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => {
      const s = statusMap[v] || { color: 'default', text: v }
      return <Tag color={s.color}>{s.text}</Tag>
    }},
    { title: '有效期至', dataIndex: 'expiry_date', key: 'expiry_date', render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
    { title: '备注', dataIndex: 'notes', key: 'notes', ellipsis: true },
    { title: '操作', key: 'action', render: (_: any, r: any) => (
      <Space>
        <Popconfirm title="确定删除此邀请？" onConfirm={() => handleDelete(r.id)}>
          <Button type="link" danger icon={<DeleteOutlined />} size="small">删除</Button>
        </Popconfirm>
      </Space>
    )},
  ]

  return (
    <div>
      <Card title="供应商注册邀请 (US-101)" extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>发起邀请</Button>
      }>
        <Table rowKey="id" dataSource={data} columns={columns} loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="发起注册邀请" open={modalOpen} onOk={handleCreate} onCancel={() => { setModalOpen(false); form.resetFields() }} width={520}>
        <Form form={form} layout="vertical">
          <Form.Item name="invited_supplier_name" label="供应商名称" rules={[{ required: true, message: '请输入供应商名称' }]}>
            <Input placeholder="请输入供应商名称" />
          </Form.Item>
          <Form.Item name="invited_email" label="邮箱" rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}>
            <Input prefix={<MailOutlined />} placeholder="name@company.com" />
          </Form.Item>
          <Form.Item name="invited_contact_person" label="联系人">
            <Input placeholder="联系人姓名" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} placeholder="邀请说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default InvitationList
