import React, { useState } from 'react'
import { Card, Table, Tag, Button, Space, Modal, Form, Input, Select, DatePicker, message, Row, Col } from 'antd'
import { PlusOutlined, ThunderboltOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getSourcingProjects, createSourcingProject } from '../../api'
import { useRequest } from 'ahooks'

const { RangePicker } = DatePicker

interface SourcingProject {
  id: number; project_name: string; sourcing_type: string; status: string;
  budget: number; invited_count: number; accepted_count: number; created_at: string;
}

const SourcingList: React.FC = () => {
  const navigate = useNavigate()
  const [createVisible, setCreateVisible] = useState(false)
  const [form] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()

  const { data, loading, refresh } = useRequest(getSourcingProjects) as any
  const projects: SourcingProject[] = Array.isArray(data) ? data : []

  const statusMap: Record<string, { color: string; text: string }> = {
    draft: { color: 'default', text: '草稿' },
    open: { color: 'processing', text: '进行中' },
    evaluation: { color: 'warning', text: '评审中' },
    awarded: { color: 'success', text: '已授标' },
    closed: { color: 'default', text: '已关闭' },
  }

  const handleCreate = async (values: any) => {
    try {
      const payload = {
        project_name: values.project_name,
        sourcing_type: values.sourcing_type,
        materials_summary: values.materials_summary,
        budget: values.budget,
        deadline: values.deadline,
        invited_supplier_ids: values.invited_supplier_ids || [],
      }
      const res = await createSourcingProject(payload) as any
      messageApi.success('寻源项目创建成功')
      setCreateVisible(false)
      form.resetFields()
      refresh()
      if (res?.id) navigate(`/buyer/sourcing/${res.id}`)
    } catch { messageApi.error('创建失败') }
  }

  const columns = [
    { title: '项目名称', dataIndex: 'project_name', key: 'project_name', render: (text: string, r: SourcingProject) => <a onClick={() => navigate(`/buyer/sourcing/${r.id}`)}>{text}</a> },
    { title: '类型', dataIndex: 'sourcing_type', key: 'sourcing_type', render: (t: string) => <Tag>{t}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => {
      const m = statusMap[s] || { color: 'default', text: s }
      return <Tag color={m.color}>{m.text}</Tag>
    }},
    { title: '预算(元)', dataIndex: 'budget', key: 'budget', render: (v: number) => v ? v.toLocaleString() : '-' },
    { title: '邀请供应商', key: 'invited', render: (_: any, r: SourcingProject) => `${r.accepted_count || 0}/${r.invited_count || 0}` },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (t: string) => t?.slice(0, 10) },
    { title: '操作', key: 'action', render: (_: any, r: SourcingProject) => <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/buyer/sourcing/${r.id}`)}>查看</Button> },
  ]

  return (
    <div>
      {contextHolder}
      <Card title={<span><ThunderboltOutlined style={{ color: '#3E5BF2', marginRight: 8 }} />寻源项目</span>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateVisible(true)}>新建寻源</Button>}
        style={{ borderRadius: 8 }}>
        <Table columns={columns} dataSource={projects} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="新建寻源项目" open={createVisible} onCancel={() => setCreateVisible(false)} onOk={() => form.submit()} width={600}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="project_name" label="项目名称" rules={[{ required: true }]}>
            <Input placeholder="如：2026年红缨子糯高粱采购寻源" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="sourcing_type" label="寻源类型" rules={[{ required: true }]}>
                <Select placeholder="选择类型">
                  <Select.Option value="RFQ">RFQ - 询价采购</Select.Option>
                  <Select.Option value="RFP">RFP - 提案征集</Select.Option>
                  <Select.Option value="RFI">RFI - 信息征集</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="budget" label="预算金额(元)">
                <Input type="number" placeholder="如：5000000" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="materials_summary" label="采购物料说明">
            <Input.TextArea rows={2} placeholder="如：红缨子糯高粱，一级品质，符合GB/T8231" />
          </Form.Item>
          <Form.Item name="deadline" label="投标截止时间">
            <DatePicker style={{ width: '100%' }} showTime placeholder="选择截止时间" />
          </Form.Item>
          <Form.Item name="invited_supplier_ids" label="邀请供应商">
            <Select mode="multiple" placeholder="从合格供应商中选择（可跳过）">
              <Select.Option value={1}>贵州红缨子高粱种植基地</Select.Option>
              <Select.Option value={2}>阿姆斯壮酿酒原料公司</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SourcingList
