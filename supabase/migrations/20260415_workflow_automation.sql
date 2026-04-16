-- 工作流自动化模块
-- 创建时间: 2026-04-15

-- ============ 工作流表 ============

-- 工作流定义表
CREATE TABLE IF NOT EXISTS workflows (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(50) NOT NULL,
    trigger_config TEXT NOT NULL DEFAULT '{}',
    actions TEXT NOT NULL DEFAULT '[]',
    conditions TEXT DEFAULT '[]',
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_template BOOLEAN DEFAULT false NOT NULL,
    template_name VARCHAR(100),
    execution_count INTEGER DEFAULT 0 NOT NULL,
    success_count INTEGER DEFAULT 0 NOT NULL,
    failure_count INTEGER DEFAULT 0 NOT NULL,
    last_executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS workflows_trigger_type_idx ON workflows(trigger_type);
CREATE INDEX IF NOT EXISTS workflows_is_active_idx ON workflows(is_active);
CREATE INDEX IF NOT EXISTS workflows_is_template_idx ON workflows(is_template);

-- 工作流执行记录表
CREATE TABLE IF NOT EXISTS workflow_executions (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id VARCHAR(36) NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    workflow_name VARCHAR(255) NOT NULL,
    trigger_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(36),
    entity_name VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    input_data TEXT DEFAULT '{}',
    output_data TEXT DEFAULT '{}',
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER
);

CREATE INDEX IF NOT EXISTS workflow_executions_workflow_id_idx ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS workflow_executions_status_idx ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS workflow_executions_started_at_idx ON workflow_executions(started_at);

-- 工作流执行日志表
CREATE TABLE IF NOT EXISTS workflow_execution_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id VARCHAR(36) NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    action_index INTEGER NOT NULL DEFAULT 0,
    action_type VARCHAR(50) NOT NULL,
    action_name VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    input_data TEXT DEFAULT '{}',
    output_data TEXT DEFAULT '{}',
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER
);

CREATE INDEX IF NOT EXISTS workflow_execution_logs_execution_id_idx ON workflow_execution_logs(execution_id);

-- ============ 触发器类型说明 ============
-- customer.created    - 新建客户
-- customer.updated    - 客户信息变更
-- opportunity.created - 新建商机
-- opportunity.stage_changed - 商机阶段变更
-- opportunity.updated - 商机变更
-- contract.created    - 新建合同
-- contract.signed     - 合同签署
-- contract.status_changed - 合同状态变更
-- payment.overdue      - 回款逾期
-- followup.overdue     - 跟进逾期
-- manual              - 手动触发

-- ============ 动作类型说明 ============
-- send_email          - 发送邮件
-- create_task         - 创建任务
-- update_field         - 更新字段
-- add_tag             - 添加标签
-- remove_tag          - 移除标签
-- create_followup     - 创建跟进
-- send_notification   - 发送通知
-- webhook             - 触发 Webhook
