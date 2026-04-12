import React from 'react'
import { Card, Row, Col, Statistic, List, Tag, Button } from 'antd'
import { ThunderboltOutlined, TrophyOutlined, ShoppingCartOutlined, TeamOutlined, RightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

interface SourcingItem { id: number; name: string; type: string; invited: number; accepted: number; bids: number; status: string }

const BuyerHome: React.FC = () => {
  const navigate = useNavigate()

  const quickActions = [
    { icon: <ThunderboltOutlined />, label: '发起寻源', color: '#3E5BF2', path: '/buyer/sourcing' },
    { icon: <TrophyOutlined />, label: '合同管理', color: '#FA8C16', path: '/buyer/contracts' },
    { icon: <ShoppingCartOutlined />, label: '采购订单', color: '#52c41a', path: '/buyer/orders' },
    { icon: <TeamOutlined />, label: '供应商', color: '#722ed1', path: '/buyer/suppliers' },
  ]

  const statusMap: Record<string, { color: string; text: string }> = {
    draft: { color: 'default', text: '草稿' },
    open: { color: 'processing', text: '进行中' },
    evaluation: { color: 'warning', text: '评审中' },
    awarded: { color: 'success', text: '已授标' },
    closed: { color: 'default', text: '已关闭' },
  }

  const projects: SourcingItem[] = [
    { id: 1, name: '2026年红缨子糯高粱采购寻源', type: 'RFQ', invited: 3, accepted: 2, bids: 1, status: 'open' },
    { id: 2, name: '2026年糯高粱采购寻源', type: 'RFQ', invited: 2, accepted: 1, bids: 1, status: 'open' },
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
          <Card title="进行中的寻源项目" style={{ borderRadius: 8 }}
            extra={<Button type="link" onClick={() => navigate('/buyer/sourcing')}>查看全部 <RightOutlined /></Button>}>
            <List size="small" dataSource={projects} renderItem={(item) => (
              <List.Item
                extra={<Tag color={statusMap[item.status]?.color}>{statusMap[item.status]?.text}</Tag>}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/buyer/sourcing/${item.id}`)}
              >
                <List.Item.Meta
                  title={<span style={{ fontSize: 13 }}>{item.name}</span>}
                  description={`类型: ${item.type} | 已邀请 ${item.invited} 家 | 已接受 ${item.accepted} 家 | 已投标 ${item.bids} 份`}
                />
              </List.Item>
            )} />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: 8, marginBottom: 12 }}>
            <Statistic title="进行中寻源" value={2} prefix={<ThunderboltOutlined style={{ color: '#3E5BF2' }} />} valueStyle={{ color: '#3E5BF2' }} />
          </Card>
          <Card style={{ borderRadius: 8, marginBottom: 12 }}>
            <Statistic title="待签署合同" value={1} prefix={<TrophyOutlined style={{ color: '#FA8C16' }} />} valueStyle={{ color: '#FA8C16' }} />
          </Card>
          <Card style={{ borderRadius: 8 }}>
            <Statistic title="合格供应商" value={3} prefix={<TeamOutlined style={{ color: '#722ed1' }} />} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default BuyerHome
