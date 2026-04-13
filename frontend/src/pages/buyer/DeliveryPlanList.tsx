import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, Button, Modal, Descriptions, Space } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { getOrders } from '../../api'

const DeliveryPlanList: React.FC = () => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<any>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getOrders() as any
      setData(Array.isArray(res) ? res : [])
    } catch { setData([]) }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const statusMap: Record<string, { color: string; text: string }> = {
    pending: { color: 'orange', text: '待确认' },
    confirmed: { color: 'green', text: '已确认' },
    adjusted: { color: 'blue', text: '已调整' },
  }

  const columns = [
    { title: '要货计划编号', dataIndex: 'order_no', key: 'order_no' },
    { title: '物料', dataIndex: 'material_name', key: 'material_name', render: (v: string) => v || '-' },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', render: (v: number) => v || '-' },
    { title: '需求日期', dataIndex: 'expected_date', key: 'expected_date', render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => {
      const s = statusMap[v] || { color: 'orange', text: '待确认' }
      return <Tag color={s.color}>{s.text}</Tag>
    }},
    { title: '来源', key: 'source', render: () => <Tag color="purple">ERP同步</Tag> },
    { title: '操作', key: 'action', render: (_: any, r: any) => (
      <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => { setDetail(r); setDetailOpen(true) }}>查看</Button>
    )},
  ]

  return (
    <div>
      <Card title="要货计划 (US-305)" extra={<Tag color="purple">数据由 ERP/计划系统同步</Tag>}>
        <Table rowKey="id" dataSource={data} columns={columns} loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="要货计划详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={600}>
        {detail && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="计划编号">{detail.order_no || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态"><Tag color="orange">{detail.status || '待确认'}</Tag></Descriptions.Item>
            <Descriptions.Item label="物料">{detail.material_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="数量">{detail.quantity || '-'}</Descriptions.Item>
            <Descriptions.Item label="需求日期">{detail.expected_date ? new Date(detail.expected_date).toLocaleDateString() : '-'}</Descriptions.Item>
            <Descriptions.Item label="来源"><Tag color="purple">ERP同步</Tag></Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default DeliveryPlanList
