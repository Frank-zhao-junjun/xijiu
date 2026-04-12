import React, { useEffect, useState } from 'react'
import { Table, Card, Input, Select, Button, Space, Tag, Row, Col, Statistic, Modal, message } from 'antd'
import { SearchOutlined, EyeOutlined, CheckCircleOutlined, InboxOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { getReceipts, getReceiptStats, Receipt } from '../api'

const { Option } = Select

const ReceiptList: React.FC = () => {
  const [data, setData] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)

  useEffect(() => {
    loadData()
    loadStats()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getReceipts()
      setData(res)
    } catch (err) {
      message.error('加载入库单失败')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const res = await getReceiptStats()
      setStats(res)
    } catch (err) {
      console.error('加载统计失败', err)
    }
  }

  const statusMap: Record<string, { color: string; text: string }> = {
    pending: { color: 'orange', text: '待入库' },
    qualified: { color: 'green', text: '已入库' },
    unqualified: { color: 'red', text: '不合格' },
  }

  const viewDetail = (record: Receipt) => {
    setSelectedReceipt(record)
    setDetailVisible(true)
  }

  const columns: ColumnsType<Receipt> = [
    { title: '入库单号', dataIndex: 'receipt_no', key: 'receipt_no', width: 160 },
    { title: '供应商', dataIndex: 'supplier_name', key: 'supplier_name', width: 150 },
    { title: '仓库', dataIndex: 'warehouse_name', key: 'warehouse_name', width: 120 },
    { title: '总数量', dataIndex: 'total_quantity', key: 'total_quantity', width: 100, render: (v: number) => `${v} 吨` },
    { title: '合格数量', dataIndex: 'qualified_quantity', key: 'qualified_quantity', width: 100, render: (v: number) => `${v} 吨` },
    { title: '不合格', dataIndex: 'unqualified_quantity', key: 'unqualified_quantity', width: 100, render: (v: number) => `${v} 吨` },
    { title: '质检员', dataIndex: 'inspector', key: 'inspector', width: 100 },
    { title: '入库时间', dataIndex: 'inspected_at', key: 'inspected_at', width: 170, render: (v: string) => v ? new Date(v).toLocaleString('zh-CN') : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (v: string) => <Tag color={statusMap[v]?.color}>{statusMap[v]?.text || v}</Tag> },
    { title: '操作', key: 'action', width: 100, render: (_, record) => <Button type="link" icon={<EyeOutlined />} onClick={() => viewDetail(record)}>查看</Button> },
  ]

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>入库单管理</h2>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card bordered={false} size="small">
            <Statistic title="今日入库" value={stats?.today_count || 0} suffix="单" />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} size="small">
            <Statistic title="今日入库量" value={stats?.today_quantity || 0} suffix="吨" />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} size="small">
            <Statistic title="本月入库" value={stats?.month_count || 0} suffix="单" />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} size="small">
            <Statistic title="待入库" value={stats?.pending_receipt_count || 0} suffix="单" valueStyle={{ color: '#FAAD14' }} />
          </Card>
        </Col>
      </Row>

      <Card bordered={false} size="small" style={{ marginBottom: 16 }}>
        <Space>
          <Input placeholder="搜索入库单号" prefix={<SearchOutlined />} style={{ width: 180 }} />
          <Select placeholder="状态" allowClear style={{ width: 120 }}>
            <Option value="pending">待入库</Option>
            <Option value="qualified">已入库</Option>
            <Option value="unqualified">不合格</Option>
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
        title="入库单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={<Button onClick={() => setDetailVisible(false)}>关闭</Button>}
        width={800}
      >
        {selectedReceipt && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}><b>入库单号：</b>{selectedReceipt.receipt_no}</Col>
              <Col span={8}><b>供应商：</b>{selectedReceipt.supplier_name}</Col>
              <Col span={8}><b>仓库：</b>{selectedReceipt.warehouse_name}</Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}><b>总数量：</b>{selectedReceipt.total_quantity} 吨</Col>
              <Col span={8}><b>合格数量：</b>{selectedReceipt.qualified_quantity} 吨</Col>
              <Col span={8}><b>不合格：</b>{selectedReceipt.unqualified_quantity} 吨</Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}><b>质检员：</b>{selectedReceipt.inspector}</Col>
              <Col span={8}><b>入库时间：</b>{selectedReceipt.inspected_at ? new Date(selectedReceipt.inspected_at).toLocaleString('zh-CN') : '-'}</Col>
              <Col span={8}><b>状态：</b><Tag color={statusMap[selectedReceipt.status]?.color}>{statusMap[selectedReceipt.status]?.text}</Tag></Col>
            </Row>
            {selectedReceipt.remarks && (
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={24}><b>备注：</b>{selectedReceipt.remarks}</Col>
              </Row>
            )}
            
            <h4 style={{ marginTop: 16 }}>入库明细</h4>
            <Table 
              size="small"
              dataSource={selectedReceipt.items}
              rowKey="id"
              pagination={false}
              columns={[
                { title: '物料名称', dataIndex: 'material_name', key: 'material_name' },
                { title: '数量', dataIndex: 'quantity', key: 'quantity', render: (v: number) => `${v}` },
                { title: '单位', dataIndex: 'unit', key: 'unit' },
                { title: '批号', dataIndex: 'batch_no', key: 'batch_no' },
                { title: '质检结果', dataIndex: 'quality_result', key: 'quality_result', render: (v: string) => v === 'qualified' ? <Tag color="green">合格</Tag> : <Tag color="red">不合格</Tag> },
                { title: '库位', dataIndex: 'warehouse_location', key: 'warehouse_location' },
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ReceiptList
