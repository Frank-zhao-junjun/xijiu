import React from 'react'
import { Card, Table, Tag } from 'antd'
import { ShoppingOutlined } from '@ant-design/icons'
import { getSalesOrders } from '../../api'
import { useRequest } from 'ahooks'

const SupplierOrderList: React.FC = () => {
  const { data: orders = [], loading } = useRequest(getSalesOrders) as any

  const statusMap: Record<string, { color: string; text: string }> = {
    pending: { color: 'orange', text: '待确认' },
    confirmed: { color: 'processing', text: '已确认' },
    shipped: { color: 'cyan', text: '已发货' },
    delivered: { color: 'green', text: '已送达' },
    cancelled: { color: 'red', text: '已取消' },
  }

  const columns = [
    { title: '订单编号', dataIndex: 'order_no', key: 'order_no' },
    { title: '产品', dataIndex: 'product_name', key: 'product_name' },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', render: (v: number) => v?.toLocaleString() },
    { title: '单价', dataIndex: 'unit_price', key: 'unit_price', render: (v: number) => v ? '¥' + v.toLocaleString() : '-' },
    { title: '总价', dataIndex: 'total_amount', key: 'total_amount', render: (v: number) => v ? '¥' + v.toLocaleString() : '-' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => {
        const m = statusMap[s] || { color: 'default', text: s }
        return <Tag color={m.color}>{m.text}</Tag>
      },
    },
    { title: '客户', dataIndex: 'customer_name', key: 'customer_name' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (t: string) => t?.slice(0, 10) },
  ]

  return (
    <div>
      <Card title={<span><ShoppingOutlined style={{ color: '#722ed1', marginRight: 8 }} />销售订单</span>} style={{ borderRadius: 8 }}>
        <Table columns={columns} dataSource={orders} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  )
}

export default SupplierOrderList
