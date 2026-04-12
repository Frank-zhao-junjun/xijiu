import React from 'react'
import { Card, Descriptions, Tag, Button, Space, Table, message, Empty, Steps } from 'antd'
import { ThunderboltOutlined, TrophyOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useParams } from 'react-router-dom'
import { getSourcingProject, openBids, awardProject, getBidComparison } from '../../api'
import { useRequest } from 'ahooks'

interface Invitation { invitation_id: number; supplier_name: string; status: string; responded_at?: string }
interface Bid { bid_id: number; supplier_id: number; supplier_name: string; round_number: number; total_amount: number; delivery_days: number; payment_terms: string }

interface SourcingDetailType {
  id: number; project_name: string; sourcing_type: string; budget: number;
  deadline: string; status: string; invited_suppliers: Invitation[]; bids: Bid[];
}

const SourcingDetail: React.FC = () => {
  const { id } = useParams()
  const [messageApi, contextHolder] = message.useMessage()

  const sourcingDetail = useRequest(
    () => getSourcingProject(Number(id)) as Promise<SourcingDetailType>,
    { refreshDeps: [id] }
  )
  const { data: detail, refresh } = sourcingDetail

  const comparisonDetail = useRequest(
    () => getBidComparison(Number(id)) as any,
    { ready: !!(detail?.bids?.length) }
  )
  const comparison = comparisonDetail.data

  const statusMap: Record<string, { color: string; text: string }> = {
    draft: { color: 'default', text: '草稿' },
    open: { color: 'processing', text: '进行中' },
    evaluation: { color: 'warning', text: '评审中' },
    awarded: { color: 'success', text: '已授标' },
    closed: { color: 'default', text: '已关闭' },
  }

  const handleOpenBids = async () => {
    try {
      await openBids(Number(id)) as any
      messageApi.success('已开标，报价已解密可见')
      refresh()
    } catch { messageApi.error('开标失败') }
  }

  const handleAward = async (supplierId: number, amount: number) => {
    try {
      await awardProject(Number(id), supplierId, amount) as any
      messageApi.success('授标成功，中标供应商已收到通知')
      refresh()
    } catch { messageApi.error('授标失败') }
  }

  const invColumns = [
    { title: '供应商', dataIndex: 'supplier_name', key: 'supplier_name' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => {
      const m: Record<string, string> = { pending: '待回复', accepted: '已接受', declined: '已谢绝' }
      return <Tag color={s === 'accepted' ? 'green' : s === 'declined' ? 'red' : 'default'}>{m[s] || s}</Tag>
    }},
    { title: '回复时间', dataIndex: 'responded_at', key: 'responded_at', render: (t: string) => t?.slice(0, 16) || '-' },
  ]

  const bidColumns = [
    { title: '供应商', dataIndex: 'supplier_name', key: 'supplier_name' },
    { title: '轮次', dataIndex: 'round_number', key: 'round_number' },
    { title: '总价(元)', dataIndex: 'total_amount', key: 'total_amount', render: (v: number) => v?.toLocaleString() },
    { title: '交期(天)', dataIndex: 'delivery_days', key: 'delivery_days' },
    { title: '付款条件', dataIndex: 'payment_terms', key: 'payment_terms' },
    { title: '操作', key: 'action', render: (_: any, r: Bid) =>
      detail?.status !== 'awarded' ? <Button type="primary" size="small" onClick={() => handleAward(r.supplier_id, r.total_amount)}>授标</Button> : null
    },
  ]

  if (!detail) return null

  const stepIndex = ['draft', 'open', 'evaluation', 'awarded', 'closed'].indexOf(detail.status || 'draft')
  const acceptedCount = (detail.invited_suppliers || []).filter((i: Invitation) => i.status === 'accepted').length

  return (
    <div>
      {contextHolder}
      <Card style={{ borderRadius: 8, marginBottom: 16 }}>
        <Space style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>{detail.project_name}</span>
          <Tag color={statusMap[detail.status]?.color}>{statusMap[detail.status]?.text}</Tag>
        </Space>
        <Steps current={stepIndex} items={[
          { title: '创建项目', icon: <ThunderboltOutlined /> },
          { title: '供应商响应' },
          { title: '投标截止' },
          { title: '开标评审' },
          { title: '授标', icon: <TrophyOutlined /> },
        ]} style={{ marginBottom: 16 }} />
        <Descriptions size="small" column={4}>
          <Descriptions.Item label="类型">{detail.sourcing_type}</Descriptions.Item>
          <Descriptions.Item label="预算">{detail.budget?.toLocaleString()} 元</Descriptions.Item>
          <Descriptions.Item label="截止时间">{detail.deadline?.slice(0, 16)}</Descriptions.Item>
          <Descriptions.Item label="已接受">{acceptedCount} 家</Descriptions.Item>
        </Descriptions>
        <Space style={{ marginTop: 12 }}>
          {detail.status === 'open' && acceptedCount > 0 && (
            <Button type="primary" onClick={handleOpenBids}>开标</Button>
          )}
        </Space>
      </Card>

      <Card title="邀请供应商" style={{ borderRadius: 8, marginBottom: 16 }}>
        {(detail.invited_suppliers?.length ?? 0) > 0 ? (
          <Table columns={invColumns} dataSource={detail.invited_suppliers} rowKey="invitation_id" pagination={false} size="small" />
        ) : <Empty description="暂未邀请供应商" />}
      </Card>

      <Card title="投标报价" style={{ borderRadius: 8 }}>
        {(detail.bids?.length ?? 0) > 0 ? (
          <>
            <Table columns={bidColumns} dataSource={detail.bids} rowKey="bid_id" pagination={false} size="small" />
            <div style={{ marginTop: 12, color: '#52c41a', fontSize: 13 }}>
              <CheckCircleOutlined /> 最低报价：¥{((comparison as any)?.lowest_amount || 0).toLocaleString()}
            </div>
          </>
        ) : <Empty description="暂无投标记录（开标后可见）" />}
      </Card>
    </div>
  )
}

export default SourcingDetail
