import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, Button, Modal, Form, Input, InputNumber, Descriptions, Space, message } from 'antd'
import { PlusOutlined, EyeOutlined, SendOutlined } from '@ant-design/icons'
import { getASNList, createASN, submitASN, getSupplierOrders } from '../../api'

const SUPPLIER_ID = 1

const ASNList: React.FC = () => {
  const [data, setData] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<any>(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [asnRes, ordersRes] = await Promise.allSettled([
        getASNList({ supplier_id: SUPPLIER_ID }),
        getSupplierOrders({ supplier_id: SUPPLIER_ID }),
      ])
      setData(asnRes.status === 'fulfilled' && Array.isArray(asnRes.value) ? asnRes.value : [])
      setOrders(ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value) ? ordersRes.value : [])
    } catch { setData([]); setOrders([]) }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      const items = (values.items || []).map((item: any) => ({
        material_id: item.material_id,
        material_name: item.material_name,
        quantity: item.quantity,
        batch_no: item.batch_no,
        production_date: item.production_date,
      }))
      await createASN({
        po_id: values.po_id,
        supplier_id: SUPPLIER_ID,
        carrier_name: values.carrier_name,
        carrier_contact: values.carrier_contact,
        tracking_no: values.tracking_no,
        items,
      })
      message.success('ASN 已创建')
      setCreateOpen(false)
      form.resetFields()
      fetchData()
    } catch (e: any) {
      if (e?.errorFields) return
      message.error('创建失败')
    }
  }

  const handleSubmitASN = async (id: number) => {
    try {
      await submitASN(id)
      message.success('ASN 已提交，等待采购方确认')
      fetchData()
    } catch { message.error('提交失败') }
  }

  const statusMap: Record<string, { color: string; text: string }> = {
    draft: { color: 'default', text: '草稿' },
    submitted: { color: 'orange', text: '已提交' },
    confirmed: { color: 'green', text: '已确认' },
    in_transit: { color: 'blue', text: '运输中' },
    delivered: { color: 'cyan', text: '已到货' },
  }

  const columns = [
    { title: 'ASN编号', dataIndex: 'asn_no', key: 'asn_no' },
    { title: '关联订单', dataIndex: 'po_id', key: 'po_id', render: (v: number) => `PO-${String(v).padStart(4, '0')}` },
    { title: '承运商', dataIndex: 'carrier_name', key: 'carrier_name', render: (v: string) => v || '-' },
    { title: '运单号', dataIndex: 'tracking_no', key: 'tracking_no', render: (v: string) => v || '-' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => {
      const s = statusMap[v] || { color: 'default', text: v }
      return <Tag color={s.color}>{s.text}</Tag>
    }},
    { title: '操作', key: 'action', render: (_: any, r: any) => (
      <Space>
        <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => { setDetail(r); setDetailOpen(true) }}>查看</Button>
        {r.status === 'draft' && (
          <Button type="link" icon={<SendOutlined />} size="small" style={{ color: '#1890ff' }}
            onClick={() => handleSubmitASN(r.id)}>提交</Button>
        )}
      </Space>
    )},
  ]

  return (
    <div>
      <Card title="送货计划/ASN (US-307)" extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>创建 ASN</Button>
      }>
        <Table rowKey="id" dataSource={data} columns={columns} loading={loading} pagination={{ pageSize: 10 }}
          expandable={{
            expandedRowRender: (record: any) => {
              const items = record.items || []
              if (!items.length) return <span style={{ color: '#999' }}>暂无明细</span>
              return (
                <Table
                  dataSource={items}
                  columns={[
                    { title: '物料名称', dataIndex: 'material_name', key: 'material_name' },
                    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
                    { title: '批次号', dataIndex: 'batch_no', key: 'batch_no' },
                    { title: '生产日期', dataIndex: 'production_date', key: 'production_date' },
                  ]}
                  pagination={false}
                  size="small"
                  rowKey={(_, idx) => String(idx)}
                />
              )
            }
          }}
        />
      </Card>

      <Modal title="创建 ASN" open={createOpen} onOk={handleCreate} onCancel={() => { setCreateOpen(false); form.resetFields() }} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="po_id" label="采购订单" rules={[{ required: true, message: '请选择采购订单' }]}>
            <InputNumber style={{ width: '100%' }} placeholder="关联的采购订单ID" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Form.Item name="carrier_name" label="承运商">
              <Input placeholder="承运商名称" />
            </Form.Item>
            <Form.Item name="carrier_contact" label="承运商联系方式">
              <Input placeholder="联系电话" />
            </Form.Item>
          </div>
          <Form.Item name="tracking_no" label="运单号">
            <Input placeholder="物流运单号" />
          </Form.Item>
          <Card size="small" title="发货明细" style={{ marginBottom: 8 }}>
            <Form.List name="items" initialValue={[{ material_name: '', quantity: 0, batch_no: '' }]}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item {...restField} name={[name, 'material_name']} rules={[{ required: true, message: '物料名称' }]}>
                        <Input placeholder="物料名称" style={{ width: 150 }} />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'quantity']} rules={[{ required: true, message: '数量' }]}>
                        <InputNumber min={0} placeholder="数量" style={{ width: 100 }} />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'batch_no']}>
                        <Input placeholder="批次号" style={{ width: 120 }} />
                      </Form.Item>
                      <Button type="text" danger onClick={() => remove(name)}>删除</Button>
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>添加物料</Button>
                </>
              )}
            </Form.List>
          </Card>
        </Form>
      </Modal>

      <Modal title="ASN 详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={600}>
        {detail && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="ASN编号">{detail.asn_no}</Descriptions.Item>
            <Descriptions.Item label="状态"><Tag color={statusMap[detail.status]?.color}>{statusMap[detail.status]?.text || detail.status}</Tag></Descriptions.Item>
            <Descriptions.Item label="承运商">{detail.carrier_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="运单号">{detail.tracking_no || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间" span={2}>{detail.created_at ? new Date(detail.created_at).toLocaleString() : '-'}</Descriptions.Item>
          </Descriptions>
        )}
        {detail?.items && detail.items.length > 0 && (
          <Table
            dataSource={detail.items}
            columns={[
              { title: '物料名称', dataIndex: 'material_name' },
              { title: '数量', dataIndex: 'quantity' },
              { title: '批次号', dataIndex: 'batch_no' },
            ]}
            pagination={false}
            size="small"
            rowKey={(_, idx) => String(idx)}
            style={{ marginTop: 16 }}
          />
        )}
      </Modal>
    </div>
  )
}

export default ASNList
