import React, { useState } from 'react'
import { Card, Table, Tag, Button, Drawer, Descriptions, Divider, Space, message } from 'antd'
import { TrophyOutlined, CheckOutlined } from '@ant-design/icons'
import { getContracts, getContract, signContract } from '../../api'
import { useRequest } from 'ahooks'

interface Contract {
  id: number; contract_no: string; contract_name: string; supplier_name?: string;
  contract_amount: number; status: string; supplier_signed: boolean;
  buyer_signed: boolean; content?: string; supplier_signed_at?: string; buyer_signed_at?: string;
}

const SupplierContractList: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage()
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)

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
  }

  const handleSign = async () => {
    if (!selectedId) return
    try {
      await signContract(selectedId, 'supplier') as any
      messageApi.success('签署成功')
      refreshDetail()
      refresh()
    } catch { messageApi.error('签署失败') }
  }

  const columns = [
    { title: '合同编号', dataIndex: 'contract_no', key: 'contract_no' },
    { title: '合同名称', dataIndex: 'contract_name', key: 'contract_name' },
    { title: '金额', dataIndex: 'contract_amount', key: 'contract_amount', render: (v: number) => v?.toLocaleString() + ' 元' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => {
      const m = statusMap[s] || { color: 'default', text: s }
      return <Tag color={m.color}>{m.text}</Tag>
    }},
    { title: '我的签署', dataIndex: 'supplier_signed', key: 'supplier_signed', render: (v: boolean) => (
      <span style={{ color: v ? '#52c41a' : '#ff4d4f' }}>{v ? '✓ 已签' : '✗ 未签'}</span>
    )},
    { title: '操作', key: 'action', render: (_: any, r: Contract) => (
      <Button size="small" onClick={() => { setSelectedId(r.id); setDetailVisible(true) }}>查看</Button>
    )},
  ]

  return (
    <div>
      {contextHolder}
      <Card title={<span><TrophyOutlined style={{ color: '#52c41a', marginRight: 8 }} />合同管理</span>} style={{ borderRadius: 8 }}>
        <Table columns={columns} dataSource={contracts} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Drawer title="合同详情" open={detailVisible} onClose={() => setDetailVisible(false)} width={560}>
        {detail && (
          <>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="合同编号">{detail.contract_no}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[detail.status]?.color}>{statusMap[detail.status]?.text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="合同名称" span={2}>{detail.contract_name}</Descriptions.Item>
              <Descriptions.Item label="金额">{detail.contract_amount?.toLocaleString()} 元</Descriptions.Item>
              <Descriptions.Item label="甲方">
                {detail.buyer_signed
                  ? <Tag icon={<CheckOutlined />} color="green">已签</Tag>
                  : <Tag color="orange">待签</Tag>}
              </Descriptions.Item>
            </Descriptions>
            <Divider>合同正文</Divider>
            <pre style={{ fontSize: 12, background: '#f5f5f5', padding: 12, borderRadius: 4, maxHeight: 280, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
              {detail.content || '暂无正文'}
            </pre>
            {detail.status === 'pending_sign' && !detail.supplier_signed && (
              <Space style={{ marginTop: 16 }}>
                <Button type="primary" icon={<CheckOutlined />} onClick={handleSign}>我要签署</Button>
              </Space>
            )}
            {detail.status === 'pending_sign' && detail.supplier_signed && (
              <div style={{ marginTop: 16, color: '#52c41a' }}>✓ 您已完成签署，等待采购方签署</div>
            )}
            {detail.status === 'signed' && <div style={{ marginTop: 16, color: '#52c41a' }}>✓ 合同已生效</div>}
          </>
        )}
      </Drawer>
    </div>
  )
}

export default SupplierContractList
