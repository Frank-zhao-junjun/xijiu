import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, Button, Modal, Descriptions, Space } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { getDeliveryPlans } from '../../api'

const DeliveryPlanList: React.FC = () => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<any>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getDeliveryPlans() as any
      const rows = res?.data ?? res
      setData(Array.isArray(rows) ? rows : [])
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
    { title: '计划ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '采购订单', dataIndex: 'po_id', key: 'po_id' },
    { title: '供应商', dataIndex: 'supplier_name', key: 'supplier_name' },
    { title: '要货日期', dataIndex: 'required_date', key: 'required_date', render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => {
      const s = statusMap[v] || { color: 'orange', text: '待确认' }
      return <Tag color={s.color}>{s.text}</Tag>
    }},
    { title: '来源', key: 'source', render: () => <Tag color="purple">协同发布</Tag> },
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
            <Descriptions.Item label="计划ID">{detail.id}</Descriptions.Item>
            <Descriptions.Item label="采购订单">{detail.po_id}</Descriptions.Item>
            <Descriptions.Item label="状态"><Tag color="orange">{detail.status || '待确认'}</Tag></Descriptions.Item>
            <Descriptions.Item label="要货日期">{detail.required_date ? new Date(detail.required_date).toLocaleDateString() : '-'}</Descriptions.Item>
            <Descriptions.Item label="明细" span={2}><pre style={{ margin: 0, fontSize: 12 }}>{JSON.stringify(detail.items_data || [], null, 2)}</pre></Descriptions.Item>
            <Descriptions.Item label="来源"><Tag color="purple">协同发布</Tag></Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default DeliveryPlanList
