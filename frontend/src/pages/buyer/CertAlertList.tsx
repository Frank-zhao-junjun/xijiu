import React, { useEffect, useState } from 'react'
import { Table, Tag, Button, Card, Space, Modal, Descriptions } from 'antd'
import { EyeOutlined, AlertOutlined } from '@ant-design/icons'
import { getSupplierAlerts, resolveAlert, triggerCertExpiryCheck } from '../../api'
import { message } from 'antd'

const CertAlertList: React.FC = () => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<any>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getSupplierAlerts() as any
      setData(Array.isArray(res) ? res : [])
    } catch { setData([]) }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleCheck = async () => {
    try {
      await triggerCertExpiryCheck()
      message.success('资质到期检查完成')
      fetchData()
    } catch { message.error('检查失败') }
  }

  const handleResolve = async (id: number) => {
    try {
      await resolveAlert(id, { resolution_note: '已处理' })
      message.success('预警已处理')
      fetchData()
    } catch { message.error('处理失败') }
  }

  const levelMap: Record<string, { color: string; text: string }> = {
    critical: { color: 'red', text: '紧急' },
    warning: { color: 'orange', text: '警告' },
    info: { color: 'blue', text: '提醒' },
  }

  const columns = [
    { title: '供应商', dataIndex: 'supplier_name', key: 'supplier_name' },
    { title: '资质名称', dataIndex: 'cert_name', key: 'cert_name' },
    { title: '级别', dataIndex: 'level', key: 'level', render: (v: string) => {
      const l = levelMap[v] || { color: 'default', text: v }
      return <Tag color={l.color}>{l.text}</Tag>
    }},
    { title: '到期日期', dataIndex: 'expiry_date', key: 'expiry_date', render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={v === 'active' ? 'red' : 'green'}>{v === 'active' ? '待处理' : '已处理'}</Tag> },
    { title: '操作', key: 'action', render: (_: any, r: any) => (
      <Space>
        <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => { setDetail(r); setDetailOpen(true) }}>查看</Button>
        {r.status === 'active' && (
          <Button type="link" size="small" onClick={() => handleResolve(r.id)}>标记已处理</Button>
        )}
      </Space>
    )},
  ]

  return (
    <div>
      <Card title="资质过期预警 (US-108)" extra={
        <Button icon={<AlertOutlined />} onClick={handleCheck}>触发到期检查</Button>
      }>
        <Table rowKey="id" dataSource={data} columns={columns} loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="预警详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null}>
        {detail && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="供应商">{detail.supplier_name}</Descriptions.Item>
            <Descriptions.Item label="资质名称">{detail.cert_name}</Descriptions.Item>
            <Descriptions.Item label="级别"><Tag color={levelMap[detail.level]?.color}>{levelMap[detail.level]?.text}</Tag></Descriptions.Item>
            <Descriptions.Item label="到期日期">{detail.expiry_date ? new Date(detail.expiry_date).toLocaleDateString() : '-'}</Descriptions.Item>
            <Descriptions.Item label="状态"><Tag color={detail.status === 'active' ? 'red' : 'green'}>{detail.status === 'active' ? '待处理' : '已处理'}</Tag></Descriptions.Item>
            {detail.message && <Descriptions.Item label="预警信息">{detail.message}</Descriptions.Item>}
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default CertAlertList
