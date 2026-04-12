import React from 'react'
import { Card, Row, Col, Statistic, List, Tag, Button } from 'antd'
import { MessageOutlined, SwapOutlined, TrophyOutlined, ShoppingOutlined, RightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const SupplierHome: React.FC = () => {
  const navigate = useNavigate()

  const quickActions = [
    { icon: <MessageOutlined />, label: '收到的邀请', color: '#3E5BF2', path: '/supplier/invitations' },
    { icon: <SwapOutlined />, label: '投标管理', color: '#FA8C16', path: '/supplier/bids' },
    { icon: <TrophyOutlined />, label: '合同管理', color: '#52c41a', path: '/supplier/contracts' },
    { icon: <ShoppingOutlined />, label: '销售订单', color: '#722ed1', path: '/supplier/orders' },
  ]

  const todos = [
    { id: 1, text: '收到「2026年红缨子糯高粱采购寻源」邀请', type: 'invitation', status: 'pending' },
    { id: 2, text: '合同「2026年糯高粱采购合同」待签署', type: 'contract', status: 'pending' },
  ]

  return (
    <div>
      <Row gutter={12} style={{ marginBottom: 20 }}>
        {quickActions.map((action) => (
          <Col span={6} key={action.path}>
            <Card hoverable style={{ cursor: 'pointer', textAlign: 'center', borderRadius: 8 }}
              onClick={() => navigate(action.path)} styles={{ body: { padding: '24px 16px' } }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: `${action.color}18`, margin: '0 auto 12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{ fontSize: 22, color: action.color }}>{action.icon}</div>
              </div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{action.label}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={12}>
        <Col span={16}>
          <Card title="待处理事项" style={{ borderRadius: 8 }}
            extra={<Button type="link" onClick={() => navigate('/supplier/invitations')}>查看全部 <RightOutlined /></Button>}>
            <List size="small" dataSource={todos} renderItem={(item: any) => (
              <List.Item extra={
                item.type === 'invitation'
                  ? <Button size="small" type="primary" onClick={() => navigate('/supplier/invitations')}>查看</Button>
                  : <Button size="small" onClick={() => navigate('/supplier/contracts')}>查看</Button>
              }>
                <List.Item.Meta title={<span style={{ fontSize: 13 }}>{item.text}</span>}
                  description={<Tag color="orange">{item.status === 'pending' ? '待处理' : ''}</Tag>} />
              </List.Item>
            )} />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: 8, marginBottom: 12 }}>
            <Statistic title="待回复邀请" value={1} prefix={<MessageOutlined style={{ color: '#3E5BF2' }} />} valueStyle={{ color: '#3E5BF2' }} />
          </Card>
          <Card style={{ borderRadius: 8, marginBottom: 12 }}>
            <Statistic title="进行中投标" value={0} prefix={<SwapOutlined style={{ color: '#FA8C16' }} />} valueStyle={{ color: '#FA8C16' }} />
          </Card>
          <Card style={{ borderRadius: 8 }}>
            <Statistic title="待签署合同" value={1} prefix={<TrophyOutlined style={{ color: '#52c41a' }} />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default SupplierHome
