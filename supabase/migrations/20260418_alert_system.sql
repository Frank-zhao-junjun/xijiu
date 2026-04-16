-- =====================================================
-- 预警系统数据表
-- =====================================================

-- 预警规则表
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    alert_type VARCHAR(50) NOT NULL,
    target VARCHAR(50) NOT NULL,
    condition JSONB NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'medium',
    is_active BOOLEAN NOT NULL DEFAULT true,
    notify_channels TEXT[] DEFAULT ARRAY['dashboard']::TEXT[],
    email_recipients TEXT[],
    webhook_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 预警记录表
CREATE TABLE IF NOT EXISTS alert_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID REFERENCES alert_rules(id) ON DELETE SET NULL,
    rule_name VARCHAR(255) NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    target VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    current_value DECIMAL(15,2),
    threshold_value DECIMAL(15,2) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_alert_rules_type ON alert_rules(alert_type);
CREATE INDEX IF NOT EXISTS idx_alert_rules_active ON alert_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_alert_records_rule ON alert_records(rule_id);
CREATE INDEX IF NOT EXISTS idx_alert_records_read ON alert_records(is_read);
CREATE INDEX IF NOT EXISTS idx_alert_records_created ON alert_records(created_at DESC);

-- RLS 策略
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_records ENABLE ROW LEVEL SECURITY;

-- 所有人都可以读取预警规则和记录
CREATE POLICY "允许所有人读取预警规则" ON alert_rules FOR SELECT USING (true);
CREATE POLICY "允许所有人读取预警记录" ON alert_records FOR SELECT USING (true);

-- 只有认证用户可以修改
CREATE POLICY "允许认证用户插入预警规则" ON alert_rules FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "允许认证用户更新预警规则" ON alert_rules FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "允许认证用户删除预警规则" ON alert_rules FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "允许认证用户插入预警记录" ON alert_records FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "允许认证用户更新预警记录" ON alert_records FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "允许认证用户删除预警记录" ON alert_records FOR DELETE USING (auth.role() = 'authenticated');
