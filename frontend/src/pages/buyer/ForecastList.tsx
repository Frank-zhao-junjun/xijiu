import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, Descriptions, Modal, Button, Space, Statistic, Row, Col } from 'antd'
import { EyeOutlined, LineChartOutlined } from '@ant-design/icons'
import { getForecasts } from '../../api'

const ForecastList: React.FC = () => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<any>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getForecasts()
      const rows = (res as any)?.data ?? res
      setData(Array.isArray(rows) ? rows : [])
    } catch { setData([]) }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const statusMap: Record<string, { color: string; text: string }> = {
    draft: { color: 'default', text: '草稿' },
    confirmed: { color: 'blue', text: '已确认' },
    partial: { color: 'orange', text: '部分响应' },
    completed: { color: 'green', text: '已完成' },
  }

  const columns = [
    { title: '预测期间', dataIndex: 'forecast_period', key: 'forecast_period', render: (v: string) => v || '-' },
    { title: '物料/品类', key: 'items', render: (_: unknown, r: any) => {
      const items = r.items_data
      if (Array.isArray(items) && items[0]?.material_name) return items[0].material_name
      return '—'
    }},
    { title: '预测数量', key: 'qty', render: (_: unknown, r: any) => {
      const items = r.items_data
      if (!Array.isArray(items) || !items.length) return '—'
      const q = items.reduce((s: number, x: any) => s + (Number(x.quantity) || 0), 0)
      return q ? `${q} 吨` : '—'
    }},
    { title: '周期起止', key: 'period', render: (_: unknown, r: any) => (
      <span>{r.period_start ? new Date(r.period_start).toLocaleDateString() : '—'} ~ {r.period_end ? new Date(r.period_end).toLocaleDateString() : '—'}</span>
    )},
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => {
      const s = statusMap[v] || { color: 'blue', text: v || '已发布' }
      return <Tag color={s.color}>{s.text}</Tag>
    }},
    { title: '来源', key: 'source', render: () => <Tag color="purple">ERP同步</Tag> },
    { title: '操作', key: 'action', render: (_: any, r: any) => (
      <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => { setDetail(r); setDetailOpen(true) }}>查看</Button>
    )},
  ]

  return (
    <div>
      <Card title="采购预测 (US-301)" extra={<Tag color="purple">数据由 ERP/计划系统同步</Tag>}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}><Statistic title="预测总数" value={data.length} /></Col>
          <Col span={6}><Statistic title="已响应" value={data.filter((d: any) => d.status === 'confirmed' || d.status === 'partial').length} /></Col>
          <Col span={6}><Statistic title="待响应" value={data.filter((d: any) => d.status === 'draft' || d.status === 'pending').length} /></Col>
        </Row>
        <Table rowKey="id" dataSource={data} columns={columns} loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="预测详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={600}>
        {detail && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="预测期间">{detail.forecast_period || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态"><Tag color="blue">{detail.status || '—'}</Tag></Descriptions.Item>
            <Descriptions.Item label="周期">{detail.period_start ? new Date(detail.period_start).toLocaleDateString() : '—'} ~ {detail.period_end ? new Date(detail.period_end).toLocaleDateString() : '—'}</Descriptions.Item>
            <Descriptions.Item label="明细" span={2}><pre style={{ margin: 0, fontSize: 12 }}>{JSON.stringify(detail.items_data || [], null, 2)}</pre></Descriptions.Item>
            <Descriptions.Item label="数据来源"><Tag color="purple">协同发布</Tag></Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default ForecastList
