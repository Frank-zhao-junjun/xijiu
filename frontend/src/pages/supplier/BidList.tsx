import React, { useState } from 'react'
import { Card, Table, Tag, Button, Space, Modal, Form, Input, InputNumber, message } from 'antd'
import { SwapOutlined, SendOutlined } from '@ant-design/icons'
import { getSupplierInvitations, submitBid } from '../../api'
import { useRequest } from 'ahooks'

interface Invitation {
  invitation_id: number; sourcing_id: number; project_name: string;
  sourcing_type: string; status: string; budget?: number; deadline?: string;
}

const BidList: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage()
  const [bidVisible, setBidVisible] = useState(false)
  const [activeProject, setActiveProject] = useState<Invitation | null>(null)
  const [bidItems, setBidItems] = useState<any[]>([{ material: '', unit_price: 0, quantity: 0, subtotal: 0 }])
  const [form] = Form.useForm()
  const SUPPLIER_ID = 1

  const { data, loading } = useRequest(() => getSupplierInvitations(SUPPLIER_ID) as any) as any
  const invitations: Invitation[] = Array.isArray(data) ? data : []
  const acceptedProjects = invitations.filter((i: Invitation) => i.status === 'accepted')

  const handleOpenBid = (project: Invitation) => {
    setActiveProject(project)
    setBidVisible(true)
  }

  const updateBidItem = (index: number, field: string, value: any) => {
    const items = [...bidItems]
    items[index][field] = value
    if (field === 'unit_price' || field === 'quantity') {
      items[index].subtotal = (items[index].unit_price || 0) * (items[index].quantity || 0)
    }
    setBidItems(items)
  }

  const handleSubmitBid = async () => {
    if (!activeProject) return
    const values = form.getFieldsValue()
    try {
      await submitBid(activeProject.sourcing_id, {
        supplier_id: SUPPLIER_ID,
        round_number: 1,
        bid_data: bidItems.filter((i: any) => i.material),
        delivery_days: values.delivery_days,
        payment_terms: values.payment_terms,
      }) as any
      messageApi.success('投标提交成功')
      setBidVisible(false)
      form.resetFields()
      setBidItems([{ material: '', unit_price: 0, quantity: 0, subtotal: 0 }])
    } catch { messageApi.error('投标提交失败') }
  }

  const columns = [
    { title: '项目名称', dataIndex: 'project_name', key: 'project_name' },
    { title: '类型', dataIndex: 'sourcing_type', key: 'sourcing_type', render: (t: string) => <Tag>{t}</Tag> },
    { title: '预算', dataIndex: 'budget', key: 'budget', render: (v?: number) => v ? v.toLocaleString() + ' 元' : '-' },
    { title: '截止时间', dataIndex: 'deadline', key: 'deadline', render: (t?: string) => t?.slice(0, 16) },
    { title: '操作', key: 'action', render: (_: any, r: Invitation) => (
      <Button type="primary" size="small" icon={<SendOutlined />} onClick={() => handleOpenBid(r)}>投标</Button>
    )},
  ]

  return (
    <div>
      {contextHolder}
      <Card title={<span><SwapOutlined style={{ color: '#FA8C16', marginRight: 8 }} />投标管理</span>} style={{ borderRadius: 8 }}>
        <Table columns={columns} dataSource={acceptedProjects} rowKey="invitation_id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title={`投标 - ${activeProject?.project_name}`} open={bidVisible}
        onCancel={() => setBidVisible(false)} onOk={handleSubmitBid} width={700} okText="提交投标">
        <Form form={form} layout="vertical">
          <div style={{ marginBottom: 12, fontWeight: 600, fontSize: 13 }}>报价明细</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: 8, textAlign: 'left', width: '40%' }}>物料名称</th>
                <th style={{ padding: 8, textAlign: 'right', width: '20%' }}>单价(元)</th>
                <th style={{ padding: 8, textAlign: 'right', width: '15%' }}>数量</th>
                <th style={{ padding: 8, textAlign: 'right', width: '20%' }}>小计(元)</th>
                <th style={{ padding: 8, width: '5%' }}></th>
              </tr>
            </thead>
            <tbody>
              {bidItems.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: 4 }}><Input size="small" value={item.material} onChange={e => updateBidItem(idx, 'material', e.target.value)} placeholder="如：糯高粱" /></td>
                  <td style={{ padding: 4 }}><InputNumber size="small" style={{ width: '100%' }} value={item.unit_price} onChange={v => updateBidItem(idx, 'unit_price', v)} min={0} /></td>
                  <td style={{ padding: 4 }}><InputNumber size="small" style={{ width: '100%' }} value={item.quantity} onChange={v => updateBidItem(idx, 'quantity', v)} min={0} /></td>
                  <td style={{ padding: 8, textAlign: 'right', fontWeight: 600 }}>{item.subtotal.toLocaleString()}</td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button size="small" onClick={() => setBidItems([...bidItems, { material: '', unit_price: 0, quantity: 0, subtotal: 0 }])} style={{ marginBottom: 16 }}>+ 添加物料行</Button>
          <div style={{ textAlign: 'right', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
            报价总计：¥{bidItems.reduce((s, i) => s + (i.subtotal || 0), 0).toLocaleString()}
          </div>
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item label="交期（天）" name="delivery_days" style={{ flex: 1, marginBottom: 0 }}>
              <InputNumber style={{ width: '100%' }} placeholder="如：30" />
            </Form.Item>
            <Form.Item label="付款条件" name="payment_terms" style={{ flex: 2, marginBottom: 0 }}>
              <Input placeholder="如：到货后30天付款" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  )
}

export default BidList
