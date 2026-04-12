import React, { useState } from 'react'
import { Card, Table, Tag, Button, Space, Drawer, Descriptions, Divider, message } from 'antd'
import { TrophyOutlined, EyeOutlined } from '@ant-design/icons'
import { getContracts, getContract, initiateSigning, signContract } from '../../api'
import { useRequest } from 'ahooks'

interface Contract {
  id: number; contract_no: string; contract_name: string; supplier_name?: string;
  contract_amount: number; status: string; supplier_signed: boolean;
  buyer_signed: boolean; content?: string; supplier_signed_at?: string; buyer_signed_at?: string;
}

const ContractList: React.FC = () => {
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [messageApi, contextHolder] = message.useMessage()

  const { data, loading, refresh } = useRequest(getContracts) as any
  const contracts: Contract[] = Array.isArray(data) ? data : []

  const { data: detail, refresh: refreshDetail } = useRequest(
    () => selectedId ? getContract(selectedId) as any : Promise.resolve(null),
    { ready: !!selectedId }
  ) as any

  const statusMap: Record<string, { color: string; text: string }> = {
    draft: { color: 'default', text: '草稿' },
    pending_sign: { color: 'processing', text: '待签署' },
    signed: { color: 'success', text: '已签署' },
    active: { color: 'success', text: '执行中' },
    expired: { color: 'warning', text: '已到期' },
    terminated: { color: 'error', text: '已终止' },
  }

  const columns = [
    { title: '合同编号', dataIndex: 'contract_no', key: 'contract_no', width: 180 },
    { title: '合同名称', dataIndex: 'contract_name', key: 'contract_name' },
    { title: '供应商', dataIndex: 'supplier_name', key: 'supplier_name' },
    { title: '金额(元)', dataIndex: 'contract_amount', key: 'contract_amount', render: (v: number) => v?.toLocaleString() || '-' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => {
      const m = statusMap[s] || { color: 'default', text: s }
      return <Tag color={m.color}>{m.text}</Tag>
    }},
    { title: '签署', key: 'signing', render: (_: any, r: Contract) => (
      <Space>
        <span style={{ fontSize: 12, color: r.supplier_signed ? '#52c41a' : '#999' }}>供应商 {r.supplier_signed ? '✓' : '✗'}</span>
        <span style={{ fontSize: 12, color: r.buyer_signed ? '#52c41a' : '#999' }}>采购方 {r.buyer_signed ? '✓' : '✗'}</span>
      </Space>
    )},
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (t?: string) => t?.slice(0, 10) },
    { title: '操作', key: 'action', render: (_: any, r: Contract) => (
      <Button size="small" icon={<EyeOutlined />} onClick={() => { setSelectedId(r.id); setDetailVisible(true) }}>查看</Button>
    )},
  ]

  return (
    <div>
      {contextHolder}
      <Card title={<span><TrophyOutlined style={{ color: '#FA8C16', marginRight: 8 }} />合同管理</span>} style={{ borderRadius: 8 }}>
        <Table columns={columns} dataSource={contracts} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Drawer title="合同详情" open={detailVisible} onClose={() => setDetailVisible(false)} width={640}>
        {detail && (
          <>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="合同编号">{detail.contract_no}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[detail.status]?.color}>{statusMap[detail.status]?.text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="合同名称" span={2}>{detail.contract_name}</Descriptions.Item>
              <Descriptions.Item label="供应商">{detail.supplier_name}</Descriptions.Item>
              <Descriptions.Item label="金额">{detail.contract_amount?.toLocaleString()} 元</Descriptions.Item>
              <Descriptions.Item label="供应商签署">
                {detail.supplier_signed ? `✓ 已签 (${detail.supplier_signed_at?.slice(0, 16)})` : '✗ 未签'}
              </Descriptions.Item>
              <Descriptions.Item label="采购方签署">
                {detail.buyer_signed ? `✓ 已签 (${detail.buyer_signed_at?.slice(0, 16)})` : '✗ 未签'}
              </Descriptions.Item>
            </Descriptions>
            <Divider>合同正文</Divider>
            <pre style={{ fontSize: 12, background: '#f5f5f5', padding: 12, borderRadius: 4, maxHeight: 300, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
              {detail.content || '暂无正文'}
            </pre>
            <Space style={{ marginTop: 16 }}>
              {detail.status === 'draft' && (
                <Button type="primary" onClick={async () => {
                  await initiateSigning(detail.id, 'supplier_first') as any
                  refreshDetail(); refresh()
                }}>发起签署</Button>
              )}
              {detail.status === 'pending_sign' && (
                <Button onClick={async () => {
                  await signContract(detail.id, 'buyer') as any
                  refreshDetail(); refresh()
                }}>采购方签署</Button>
              )}
            </Space>
          </>
        )}
      </Drawer>
    </div>
  )
}

export default ContractList
