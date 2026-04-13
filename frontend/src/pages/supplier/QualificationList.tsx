import React, { useEffect, useState } from 'react'
import { Table, Tag, Button, Modal, Form, Input, Select, Card, Space, message, Descriptions } from 'antd'
import { FileTextOutlined, UploadOutlined } from '@ant-design/icons'
import { getQualificationProjects, getQuestionnaire, submitQualification, getQualificationSubmission } from '../../api'

const SupplierQualification: React.FC = () => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [fillOpen, setFillOpen] = useState(false)
  const [currentProject, setCurrentProject] = useState<any>(null)
  const [questionnaire, setQuestionnaire] = useState<any>(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getQualificationProjects() as any
      setData(Array.isArray(res) ? res : [])
    } catch { setData([]) }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleFill = async (project: any) => {
    setCurrentProject(project)
    try {
      const q = await getQuestionnaire(project.id) as any
      setQuestionnaire(q)
      // 初始化表单值
      const initialValues: Record<string, string> = {}
      if (q?.questions && Array.isArray(q.questions)) {
        q.questions.forEach((item: any) => { initialValues[item.key || item.id] = '' })
      }
      form.setFieldsValue(initialValues)
      setFillOpen(true)
    } catch {
      // 如果获取问卷失败，显示通用表单
      setQuestionnaire(null)
      setFillOpen(true)
    }
  }

  const handleSubmit = async () => {
    if (!currentProject) return
    try {
      const values = await form.validateFields()
      await submitQualification(currentProject.id, {
        supplier_id: 1,
        answers: values,
      })
      message.success('问卷已提交')
      setFillOpen(false)
      form.resetFields()
      fetchData()
    } catch (e: any) {
      if (e?.errorFields) return
      message.error('提交失败')
    }
  }

  const statusMap: Record<string, { color: string; text: string }> = {
    draft: { color: 'default', text: '草稿' },
    published: { color: 'blue', text: '待填写' },
    in_review: { color: 'orange', text: '评审中' },
    completed: { color: 'green', text: '已完成' },
  }

  const columns = [
    { title: '项目名称', dataIndex: 'name', key: 'name' },
    { title: '说明', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => {
      const s = statusMap[v] || { color: 'default', text: v }
      return <Tag color={s.color}>{s.text}</Tag>
    }},
    { title: '截止日期', dataIndex: 'deadline', key: 'deadline', render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
    { title: '操作', key: 'action', render: (_: any, r: any) => (
      <Space>
        {r.status === 'published' && (
          <Button type="primary" icon={<FileTextOutlined />} size="small" onClick={() => handleFill(r)}>填写问卷</Button>
        )}
      </Space>
    )},
  ]

  return (
    <div>
      <Card title="资格评审 (US-105~107)">
        <Table rowKey="id" dataSource={data} columns={columns} loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title={`填写资格问卷 - ${currentProject?.name || ''}`}
        open={fillOpen}
        onOk={handleSubmit}
        onCancel={() => { setFillOpen(false); form.resetFields() }}
        width={640}
        okText="提交问卷"
      >
        <Form form={form} layout="vertical">
          {questionnaire?.questions && Array.isArray(questionnaire.questions) ? (
            questionnaire.questions.map((q: any) => (
              <Form.Item key={q.key || q.id} name={q.key || q.id} label={q.label || q.question} rules={[{ required: q.required, message: '请填写' }]}>
                {q.type === 'select' ? (
                  <Select placeholder={q.placeholder || '请选择'}>
                    {(q.options || []).map((o: any) => <Select.Option key={o.value || o} value={o.value || o}>{o.label || o}</Select.Option>)}
                  </Select>
                ) : q.type === 'textarea' ? (
                  <Input.TextArea rows={3} placeholder={q.placeholder || '请输入'} />
                ) : (
                  <Input placeholder={q.placeholder || '请输入'} />
                )}
              </Form.Item>
            ))
          ) : (
            <>
              <Form.Item name="company_qualification" label="企业资质等级" rules={[{ required: true }]}>
                <Select placeholder="请选择">
                  <Select.Option value="AAA">AAA级</Select.Option>
                  <Select.Option value="AA">AA级</Select.Option>
                  <Select.Option value="A">A级</Select.Option>
                  <Select.Option value="B">B级</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="quality_system" label="质量管理体系认证" rules={[{ required: true }]}>
                <Input placeholder="如：ISO 9001, HACCP等" />
              </Form.Item>
              <Form.Item name="production_capacity" label="年产能（吨）" rules={[{ required: true }]}>
                <Input type="number" placeholder="年产能" />
              </Form.Item>
              <Form.Item name="delivery_capability" label="供货能力说明">
                <Input.TextArea rows={2} placeholder="请描述供货能力" />
              </Form.Item>
              <Form.Item name="cert_files" label="资质文件">
                <Button icon={<UploadOutlined />}>上传文件</Button>
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  )
}

export default SupplierQualification
