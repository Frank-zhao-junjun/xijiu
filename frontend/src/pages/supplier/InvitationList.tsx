import React from 'react'
import { Card, Table, Tag, Button, Space, message } from 'antd'
import { MessageOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { getSupplierInvitations, acceptInvitation, declineInvitation } from '../../api'
import { useRequest } from 'ahooks'

interface Invitation {
  invitation_id: number; sourcing_id: number; project_name: string;
  sourcing_type: string; status: string; deadline?: string; responded_at?: string;
}

const InvitationList: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage()
  const SUPPLIER_ID = 1

  const { data, loading, refresh } = useRequest(() => getSupplierInvitations(SUPPLIER_ID) as any) as any
  const invitations: Invitation[] = Array.isArray(data) ? data : []

  const handleAccept = async (projectId: number) => {
    try {
      await acceptInvitation(projectId, SUPPLIER_ID) as any
      messageApi.success('已确认参与寻源')
      refresh()
    } catch { messageApi.error('操作失败') }
  }

  const handleDecline = async (projectId: number) => {
    try {
      await declineInvitation(projectId, SUPPLIER_ID, '产能不足') as any
      messageApi.success('已谢绝')
      refresh()
    } catch { messageApi.error('操作失败') }
  }

  const columns = [
    { title: '项目名称', dataIndex: 'project_name', key: 'project_name' },
    { title: '类型', dataIndex: 'sourcing_type', key: 'sourcing_type', render: (t: string) => <Tag>{t}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => {
      const m: Record<string, { color: string; text: string }> = {
        pending: { color: 'orange', text: '待回复' },
        accepted: { color: 'green', text: '已接受' },
        declined: { color: 'red', text: '已谢绝' },
      }
      const m2 = m[s] || { color: 'default', text: s }
      return <Tag color={m2.color}>{m2.text}</Tag>
    }},
    { title: '截止时间', dataIndex: 'deadline', key: 'deadline', render: (t?: string) => t?.slice(0, 16) || '-' },
    { title: '回复时间', dataIndex: 'responded_at', key: 'responded_at', render: (t?: string) => t?.slice(0, 16) || '-' },
    { title: '操作', key: 'action', render: (_: any, r: Invitation) =>
      r.status === 'pending' ? (
        <Space>
          <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleAccept(r.sourcing_id)}>接受</Button>
          <Button size="small" danger icon={<CloseOutlined />} onClick={() => handleDecline(r.sourcing_id)}>谢绝</Button>
        </Space>
      ) : null
    },
  ]

  return (
    <div>
      {contextHolder}
      <Card title={<span><MessageOutlined style={{ color: '#3E5BF2', marginRight: 8 }} />收到的寻源邀请</span>} style={{ borderRadius: 8 }}>
        <Table columns={columns} dataSource={invitations} rowKey="invitation_id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  )
}

export default InvitationList
