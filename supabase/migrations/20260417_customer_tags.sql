-- 客户标签系统 (V4.2)

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#6B7280',
    icon VARCHAR(50) DEFAULT 'tag',
    description TEXT,
    usage_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- 客户标签关联表
CREATE TABLE IF NOT EXISTS customer_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(customer_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_tags_customer_id ON customer_tags(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_tags_tag_id ON customer_tags(tag_id);

-- 开启 RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to tags" ON tags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to customer_tags" ON customer_tags FOR ALL USING (true) WITH CHECK (true);
