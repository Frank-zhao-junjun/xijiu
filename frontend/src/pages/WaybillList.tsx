import React, { useEffect, useState } from 'react'
import { Table, Card, Input, Select, Button, Space, Tag, Row, Col, Statistic, Modal, message, Timeline } from 'antd'
import { SearchOutlined, EyeOutlined, CarOutlined, CheckCircleOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { getShipmentNotes, getShipmentNote, confirmArrival, ShipmentNote } from '../api'

const { Option } = Select

const WaybillList: React.FC = () => {
  const [data, setData] = useState<ShipmentNote[]>([])
  const [loading, setLoading] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedNote, setSelectedNote] = useState<ShipmentNote | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getShipmentNotes()
      setData(res)
    } catch (err) {
      message.error('加载运单失败')
    } finally {
      setLoading(false)
    }
  }

  const statusMap: Record<string, { color: string; text: string }> = {
    pending: { color: 'default', text: '待发货' },
    shipped: { color: 'blue', text: '运输中' },
    in_transit: { color: 'cyan', text: '在途' },
    arrived: { color: 'orange', text: '已到达' },
    received: { color: 'green', text: '已签收' },
  }

  const viewDetail = async (record: ShipmentNote) => {
    try {
      const detail = await getShipmentNote(record.id)
      setSelectedNote(detail)
      setDetailVisible(true)
    } catch (err) {
      message.error('加载详情失败')
    }
  }

  const handleArrive = async (id: number) => {
    try {
      await confirmArrival(id)
      message.success('已确认到货')
      loadData()
      setDetailVisible(false)
    } catch (err) {
      message.error('操作失败')
    }
  }

  const columns: ColumnsType<ShipmentNote> = [
    { title: '运单号', dataIndex: 'shipment_no', key: 'shipment_no', width: 160 },
    { title: '供应商', dataIndex: 'supplier_name', key: 'supplier_name', width: 150 },
    { title: '承运商', dataIndex: 'carrier_name', key: 'carrier_name', width: 120 },
    { title: '车牌号', dataIndex: 'vehicle_no', key: 'vehicle_no', width: 100 },
    { title: '司机', dataIndex: 'driver_name', key: 'driver_name', width: 80 },
    { title: '司机电话', dataIndex: 'driver_phone', key: 'driver_phone', width: 120 },
    { title: '预计到达', dataIndex: 'expected_arrival', key: 'expected_arrival', width: 170, render: (v: string) => v ? new Date(v).toLocaleString('zh-CN') : '-' },
    { title: '总数量', dataIndex: 'total_quantity', key: 'total_quantity', width: 100, render: (v: number) => `${v} 吨` },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (v: string) => <Tag color={statusMap[v]?.color}>{statusMap[v]?.text || v}</Tag> },
    { title: '操作', key: 'action', width: 120, render: (_, record) => (
      <Space>
        <Button type="link" icon={<EyeOutlined />} onClick={() => viewDetail(record)}>查看</Button>
        {(record.status === 'shipped' || record.status === 'in_transit') && (
          <Button type="link" icon={<CheckCircleOutlined />} onClick={() => handleArrive(record.id)}>到货</Button>
        )}
      </Space>
    )},
  ]

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>运单管理</h2>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card bordered={false} size="small">
            <Statistic title="运输中" value={data.filter(d => d.status === 'shipped' || d.status === 'in_transit').length} suffix="单" valueStyle={{ color: '#1890FF' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} size="small">
            <Statistic title="已到达待入库" value={data.filter(d => d.status === 'arrived').length} suffix="单" valueStyle={{ color: '#FAAD14' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} size="small">
            <Statistic title="已完成" value={data.filter(d => d.status === 'received').length} suffix="单" valueStyle={{ color: '#52C41A' }} />
          </Card>
        </Col>
      </Row>

      <Card bordered={false} size="small" style={{ marginBottom: 16 }}>
        <Space>
          <Input placeholder="搜索运单号" prefix={<SearchOutlined />} style={{ width: 180 }} />
          <Select placeholder="状态" allowClear style={{ width: 120 }}>
            <Option value="pending">待发货</Option>
            <Option value="shipped">运输中</Option>
            <Option value="in_transit">在途</Option>
            <Option value="arrived">已到达</Option>
            <Option value="received">已签收</Option>
          </Select>
          <Button type="primary">查询</Button>
          <Button>重置</Button>
        </Space>
      </Card>

      <Card bordered={false} size="small">
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="运单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={
          selectedNote && (selectedNote.status === 'shipped' || selectedNote.status === 'in_transit') ? (
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => handleArrive(selectedNote.id)}>
              确认到货
            </Button>
          ) : <Button onClick={() => setDetailVisible(false)}>关闭</Button>
        }
        width={700}
      >
        {selectedNote && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}><b>运单号：</b>{selectedNote.shipment_no}</Col>
              <Col span={12}><b>供应商：</b>{selectedNote.supplier_name}</Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}><b>承运商：</b>{selectedNote.carrier_name}</Col>
              <Col span={12}><b>运单号：</b>{selectedNote.tracking_no || '-'}</Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}><b>车牌号：</b>{selectedNote.vehicle_no}</Col>
              <Col span={12}><b>司机：</b>{selectedNote.driver_name} ({selectedNote.driver_phone})</Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}><b>预计到达：</b>{selectedNote.expected_arrival ? new Date(selectedNote.expected_arrival).toLocaleString('zh-CN') : '-'}</Col>
              <Col span={12}><b>实际到达：</b>{selectedNote.actual_arrival ? new Date(selectedNote.actual_arrival).toLocaleString('zh-CN') : '-'}</Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={24}><b>收货仓库：</b>{selectedNote.receiving_warehouse}</Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}><b>总数量：</b>{selectedNote.total_quantity} 吨</Col>
              <Col span={8}><b>状态：</b><Tag color={statusMap[selectedNote.status]?.color}>{statusMap[selectedNote.status]?.text}</Tag></Col>
            </Row>
            
            <h4 style={{ marginTop: 16 }}>物流轨迹</h4>
            <Timeline
              items={[
                { color: 'green', children: '订单已创建' },
                ...(selectedNote.status !== 'pending' ? [{ color: 'blue' as const, children: '货物已发货' }] : []),
                ...((selectedNote.status === 'shipped' || selectedNote.status === 'in_transit') ? [{ color: 'blue' as const, children: '运输中...' }] : []),
                ...(selectedNote.status === 'arrived' ? [{ color: 'orange' as const, children: '已到达仓库' }] : []),
                ...(selectedNote.status === 'received' ? [{ color: 'green' as const, children: '已入库签收' }] : []),
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}

export default WaybillList
