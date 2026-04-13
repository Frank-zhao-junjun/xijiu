import React, { useState } from 'react'
import { Card, Form, Input, Button, Steps, Result, Descriptions, Tag, message } from 'antd'
import { UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined } from '@ant-design/icons'
import { registerSupplier, validateInvitationCode, getRegistrationStatus } from '../../api'

const SupplierRegistration: React.FC = () => {
  const [step, setStep] = useState(0) // 0:验证邀请码, 1:填写信息, 2:完成
  const [invitationInfo, setInvitationInfo] = useState<any>(null)
  const [registrationResult, setRegistrationResult] = useState<any>(null)
  const [statusData, setStatusData] = useState<any>(null)
  const [form] = Form.useForm()
  const [codeForm] = Form.useForm()

  // 验证邀请码
  const handleValidateCode = async () => {
    try {
      const values = await codeForm.validateFields()
      const res = await validateInvitationCode(values.code) as any
      if (res.valid) {
        setInvitationInfo(res)
        form.setFieldsValue({ invitation_code: values.code })
        setStep(1)
      } else {
        message.error(res.message || '邀请码无效')
      }
    } catch (e: any) {
      if (e?.errorFields) return
      message.error('验证失败')
    }
  }

  // 提交注册
  const handleRegister = async () => {
    try {
      const values = await form.validateFields()
      const res = await registerSupplier(values) as any
      setRegistrationResult(res)
      setStep(2)
      message.success('注册成功')
    } catch (e: any) {
      if (e?.errorFields) return
      message.error('注册失败')
    }
  }

  // 查询注册状态
  const handleCheckStatus = async () => {
    try {
      const email = form.getFieldValue('email')
      if (!email) { message.warning('请输入邮箱后查询'); return }
      const res = await getRegistrationStatus(email) as any
      setStatusData(res)
    } catch { message.error('查询失败') }
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <Card title="供应商自助注册 (US-102)">
        <Steps current={step} items={[{ title: '验证邀请码' }, { title: '填写信息' }, { title: '完成' }]} style={{ marginBottom: 24 }} />

        {step === 0 && (
          <>
            <Form form={codeForm} layout="vertical" style={{ maxWidth: 400, margin: '0 auto' }}>
              <Form.Item name="code" label="邀请码" rules={[{ required: true, message: '请输入邀请码' }]}>
                <Input.Search placeholder="请输入8位邀请码" maxLength={8} enterButton="验证" onSearch={handleValidateCode} size="large" style={{ textTransform: 'uppercase' }} />
              </Form.Item>
            </Form>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Button type="link" onClick={handleCheckStatus}>查询已有注册状态</Button>
            </div>
            {statusData && (
              <Card size="small" style={{ marginTop: 16 }}>
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="公司名称">{statusData.company_name || '-'}</Descriptions.Item>
                  <Descriptions.Item label="状态"><Tag color={statusData.status === 'approved' ? 'green' : statusData.status === 'rejected' ? 'red' : 'orange'}>{statusData.status}</Tag></Descriptions.Item>
                </Descriptions>
              </Card>
            )}
          </>
        )}

        {step === 1 && (
          <Form form={form} layout="vertical">
            <Form.Item name="invitation_code" label="邀请码" rules={[{ required: true }]}>
              <Input disabled />
            </Form.Item>
            <Form.Item name="company_name" label="公司名称" rules={[{ required: true, message: '请输入公司名称' }]}>
              <Input prefix={<HomeOutlined />} placeholder="公司全称" />
            </Form.Item>
            <Form.Item name="contact_person" label="联系人" rules={[{ required: true, message: '请输入联系人' }]}>
              <Input prefix={<UserOutlined />} placeholder="联系人姓名" />
            </Form.Item>
            <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}>
              <Input prefix={<MailOutlined />} placeholder="name@company.com" />
            </Form.Item>
            <Form.Item name="phone" label="电话" rules={[{ required: true, message: '请输入电话' }]}>
              <Input prefix={<PhoneOutlined />} placeholder="手机号码" />
            </Form.Item>
            <Form.Item name="business_scope" label="经营范围">
              <Input.TextArea rows={2} placeholder="主营业务描述" />
            </Form.Item>
            <Form.Item name="registered_capital" label="注册资本">
              <Input placeholder="如：500万元" />
            </Form.Item>
            <Form.Item name="address" label="地址">
              <Input placeholder="公司注册地址" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={handleRegister} size="large" block>提交注册</Button>
            </Form.Item>
          </Form>
        )}

        {step === 2 && (
          <Result status="success" title="注册提交成功" subTitle="您的注册信息已提交，请等待采购方审核。" extra={[
            <Button key="back" onClick={() => { setStep(0); form.resetFields(); codeForm.resetFields() }}>返回</Button>
          ]} />
        )}
      </Card>
    </div>
  )
}

export default SupplierRegistration
