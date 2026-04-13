import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, List, Tag, Progress } from 'antd'
import { ShoppingCartOutlined, CheckCircleOutlined, DollarOutlined, InboxOutlined, TeamOutlined, AlertOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { getDashboardMetrics, getAlerts, getTodos, getFulfillmentStatus } from '../api'

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [todos, setTodos] = useState<any[]>([])
  const [fulfillment, setFulfillment] = useState<any[]>([])

  useEffect(() => {
    Promise.allSettled([getDashboardMetrics(), getAlerts(), getTodos(), getFulfillmentStatus()]).then((results) => {
      const m = results[0].status === 'fulfilled' ? results[0].value : null
      const a = results[1].status === 'fulfilled' ? results[1].value : null
      const t = results[2].status === 'fulfilled' ? results[2].value : []
      const f = results[3].status === 'fulfilled' ? results[3].value : []
      setMetrics(m)
      // alerts API returns { low_stock_materials: [...], low_stock_products: [...] }
      const alertData: any[] = []
      if (a?.low_stock_materials) alertData.push(...a.low_stock_materials.map((item: any) => ({ ...item, title: `${item.name} 库存不足`, description: `当前库存 ${item.stock_quantity}，安全库存 ${item.reorder_point}`, level: 'warning', time: '刚刚' })))
      if (a?.low_stock_products) alertData.push(...a.low_stock_products.map((item: any) => ({ ...item, title: `${item.name} 库存偏低`, description: `当前库存 ${item.stock_quantity}`, level: 'error', time: '刚刚' })))
      if (alertData.length === 0) alertData.push({ title: '暂无预警', description: '所有物料和产品库存正常', level: 'info' as const, time: '-' })
      setAlerts(alertData)
      setTodos(t); setFulfillment(f)
    })
  }, [])

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>数据中台</h2>
      <Row gutter={[8, 8]} style={{ marginBottom: 8 }}>
        <Col span={6}><Card bordered={false} size="small"><Statistic title="采购订单总数" value={metrics?.total_orders || 0} prefix={<ShoppingCartOutlined style={{ color: '#3E5BF2' }} />} /></Card></Col>
        <Col span={6}><Card bordered={false} size="small"><Statistic title="待处理订单" value={metrics?.pending_orders || 0} prefix={<CheckCircleOutlined style={{ color: '#FAAD14' }} />} /></Card></Col>
        <Col span={6}><Card bordered={false} size="small"><Statistic title="订单总金额" value={metrics?.total_amount || 0} prefix={<DollarOutlined style={{ color: '#52C41A' }} />} suffix="元" /></Card></Col>
        <Col span={6}><Card bordered={false} size="small"><Statistic title="合作供应商" value={metrics?.supplier_count || 0} prefix={<TeamOutlined style={{ color: '#1890FF' }} />} /></Card></Col>
      </Row>
      <Row gutter={[8, 8]} style={{ marginBottom: 8 }}>
        <Col span={6}><Card bordered={false} size="small"><Statistic title="库存总量" value={metrics?.inventory_quantity || 0} suffix="吨" prefix={<InboxOutlined style={{ color: '#722ED1' }} />} /></Card></Col>
        <Col span={6}><Card bordered={false} size="small"><Statistic title="库存价值" value={metrics?.inventory_value || 0} prefix={<DollarOutlined />} suffix="元" /></Card></Col>
        <Col span={6}><Card bordered={false} size="small"><Statistic title="待检批次" value={metrics?.inspection_pending || 0} prefix={<SafetyCertificateOutlined style={{ color: '#FA8C16' }} />} /></Card></Col>
        <Col span={6}><Card bordered={false} size="small"><Statistic title="已合格批次" value={metrics?.inspection_passed || 0} prefix={<CheckCircleOutlined style={{ color: '#52C41A' }} />} /></Card></Col>
      </Row>
      <Row gutter={[8, 8]}>
        <Col span={16}>
          <Card title="订单履约状态" bordered={false} size="small">
            {fulfillment.map((item, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>{item.status}</span><span>{item.count} 单 ({item.percentage}%)</span></div>
                <Progress percent={item.percentage} showInfo={false} strokeColor={['#FAAD14','#1890FF','#52C41A','#722ED1','#3E5BF2','#13C2C2'][i]} size="small" />
              </div>
            ))}
          </Card>
        </Col>
        <Col span={8}>
          <Card title="预警信息" bordered={false} size="small">
            <List size="small" dataSource={alerts} renderItem={(item) => (
              <List.Item style={{ padding: '8px 0' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%' }}>
                  <AlertOutlined style={{ color: item.level === 'error' ? '#FF4D4F' : '#FAAD14', marginTop: 4 }} />
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 500, fontSize: 13 }}>{item.title}</div><div style={{ color: '#6E6E73', fontSize: 12 }}>{item.description}</div><div style={{ color: '#A0A0A5', fontSize: 11, marginTop: 4 }}>{item.time}</div></div>
                </div>
              </List.Item>
            )} />
          </Card>
        </Col>
      </Row>
      <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
        <Col span={24}>
          <Card title="待办事项" bordered={false} size="small">
            <List size="small" dataSource={todos} renderItem={(item) => (
              <List.Item style={{ padding: '8px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                  <div style={{ width: 16, height: 16, border: '1.5px solid #E5E5EA', borderRadius: 2, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}><span style={{ marginRight: 8 }}>{item.title}</span><Tag color={item.priority === 'urgent' ? 'red' : item.priority === 'pending' ? 'orange' : 'blue'}>{item.priority === 'urgent' ? '紧急' : item.priority === 'pending' ? '待处理' : '普通'}</Tag></div>
                  <span style={{ color: '#6E6E73', fontSize: 12 }}>{item.time}</span>
                </div>
              </List.Item>
            )} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
export default Dashboard
