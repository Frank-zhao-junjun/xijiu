import React, { useEffect, useState } from 'react'
import { Table, Tag, Button, Modal, Form, Input, Select, Card, Space, message, Descriptions, Collapse, InputNumber } from 'antd'
import { FileTextOutlined, UploadOutlined } from '@ant-design/icons'
import { getQualificationProjects, getQuestionnaire, submitQualification } from '../../api'

const SUPPLIER_ID = 1 // Demo supplier ID

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
      const q = await getQuestionnaire(project.id, { params: { supplier_id: SUPPLIER_ID } }) as any
      setQuestionnaire(q)
      // Flatten sections/fields into form values
      const initialValues: Record<string, string> = {}
      if (q?.sections && Array.isArray(q.sections)) {
        q.sections.forEach((section: any) => {
          if (section.fields && Array.isArray(section.fields)) {
            section.fields.forEach((field: any) => {
              initialValues[field.id] = ''
            })
          }
        })
      }
      form.setFieldsValue(initialValues)
      setFillOpen(true)
    } catch {
      // If questionnaire fetch fails, show generic form
      setQuestionnaire(null)
      setFillOpen(true)
    }
  }

  const handleSubmit = async () => {
    if (!currentProject) return
    try {
      const values = await form.validateFields()
      await submitQualification(currentProject.id, {
        supplier_id: SUPPLIER_ID,
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
    pending_response: { color: 'blue', text: '待填写' },
    in_progress: { color: 'orange', text: '评审中' },
    supplement_materials: { color: 'gold', text: '待补充材料' },
    approved: { color: 'green', text: '已通过' },
    rejected: { color: 'red', text: '已驳回' },
  }

  const columns = [
    { title: '项目名称', dataIndex: 'project_name', key: 'project_name' },
    { title: '品类范围', dataIndex: 'target_categories', key: 'target_categories', ellipsis: true },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => {
      const s = statusMap[v] || { color: 'default', text: v }
      return <Tag color={s.color}>{s.text}</Tag>
    }},
    { title: '截止日期', dataIndex: 'deadline', key: 'deadline', render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
    { title: '受邀/已提交', key: 'counts', render: (_: any, r: any) => `${r.invited_count || 0} / ${r.accepted_count || 0}` },
    { title: '操作', key: 'action', render: (_: any, r: any) => (
      <Space>
        {(r.status === 'pending_response' || r.status === 'supplement_materials') && (
          <Button type="primary" icon={<FileTextOutlined />} size="small" onClick={() => handleFill(r)}>填写问卷</Button>
        )}
      </Space>
    )},
  ]

  // Render a field based on its type from the questionnaire definition
  const renderField = (field: any) => {
    if (field.type === 'select') {
      return (
        <Select placeholder={field.placeholder || '请选择'}>
          {(field.options || []).map((o: any) => {
            const val = typeof o === 'string' ? o : o.value
            const label = typeof o === 'string' ? o : o.label
            return <Select.Option key={val} value={val}>{label}</Select.Option>
          })}
        </Select>
      )
    }
    if (field.type === 'textarea') {
      return <Input.TextArea rows={3} placeholder={field.placeholder || '请输入'} />
    }
    if (field.type === 'number') {
      return <InputNumber style={{ width: '100%' }} placeholder={field.placeholder || '请输入'} />
    }
    if (field.type === 'file') {
      return (
        <div>
          <Button icon={<UploadOutlined />}>上传文件</Button>
          {field.note && <span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>{field.note}</span>}
        </div>
      )
    }
    return <Input placeholder={field.placeholder || '请输入'} />
  }

  return (
    <div>
      <Card title="资格评审 (US-105~107)">
        <Table rowKey="id" dataSource={data} columns={columns} loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title={`填写资格问卷 - ${currentProject?.project_name || ''}`}
        open={fillOpen}
        onOk={handleSubmit}
        onCancel={() => { setFillOpen(false); form.resetFields() }}
        width={720}
        okText="提交问卷"
      >
        <Form form={form} layout="vertical">
          {questionnaire?.sections && Array.isArray(questionnaire.sections) ? (
            <Collapse
              defaultActiveKey={questionnaire.sections.map((s: any) => s.id)}
              items={questionnaire.sections.map((section: any) => ({
                key: section.id,
                label: section.title,
                children: (section.fields || []).map((field: any) => (
                  <Form.Item
                    key={field.id}
                    name={field.id}
                    label={field.label}
                    rules={field.required ? [{ required: true, message: '请填写' }] : undefined}
                  >
                    {renderField(field)}
                  </Form.Item>
                ))
              }))}
            />
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
            </>
          )}
        </Form>
      </Modal>
    </div>
  )
}

export default SupplierQualification
