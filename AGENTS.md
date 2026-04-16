# 简易 CRM 系统 - 设计文档

## 项目概览

基于 Next.js 16 + shadcn/ui 的简易客户关系管理系统，采用 **DDD（领域驱动设计）** 架构，支持客户管理、销售线索管理、商机管理和联系人管理。集成 Supabase PostgreSQL 数据库实现数据持久化。

---

## 目录

1. [DDD 架构设计](#1-ddd-架构设计)
2. [限界上下文划分](#2-限界上下文划分)
3. [领域模型](#3-领域模型)
4. [销售流程设计](#4-销售流程设计)
5. [数据库 Schema](#5-数据库-schema)
6. [API 设计](#6-api-设计)
7. [页面结构](#7-页面结构)
8. [部署方案](#8-部署方案)

---

## 1. DDD 架构设计

### 1.1 分层架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      表示层 (Presentation)                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐          │
│  │  页面   │  │ 组件   │  │ Hooks  │  │ Context │          │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘          │
│       └────────────┴────────────┴────────────┘                 │
│                           │                                     │
├───────────────────────────┼─────────────────────────────────────┤
│                      应用层 (Application)                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    用例 (Use Cases)                      │    │
│  │  CreateLead  │  QualifyLead  │  ChangeStage  │  ...    │    │
│  └──────────────────────────────┬────────────────────────────┘    │
│                                 │                                │
├─────────────────────────────────┼────────────────────────────────┤
│                        领域层 (Domain)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   聚合根     │  │   领域服务   │  │   领域事件   │         │
│  │ Customer     │  │ SalesDomain  │  │ LeadCreated  │         │
│  │ SalesLead    │  │ Service      │  │ LeadQualified│         │
│  │ Opportunity  │  │              │  │ StageChanged │         │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘         │
│         │                 │                                     │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────────────┐         │
│  │   值对象     │  │   实体       │  │   仓储接口   │         │
│  │ Money        │  │ Contact      │  │ ICustomer    │         │
│  │ Percentage   │  │              │  │ ILead        │         │
│  │ Stage        │  │              │  │ IOpportunity │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                     基础设施层 (Infrastructure)                 │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │          Supabase 仓储实现 (Repository Impl)               │  │
│  │  SupabaseCustomerRepo  │  SupabaseLeadRepo  │  ...        │  │
│  └─────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 目录结构 (DDD Style)

```
src/
├── domain/                          # 领域层 (核心业务逻辑)
│   ├── entities/                    # 实体
│   │   └── Contact.ts              # 联系人实体
│   │
│   ├── value-objects/              # 值对象
│   │   ├── Money.ts               # 货币值对象
│   │   ├── Percentage.ts           # 百分比值对象
│   │   ├── CustomerStatus.ts       # 客户状态
│   │   ├── LeadStatus.ts           # 线索状态
│   │   ├── OpportunityStage.ts     # 机会阶段（含转换规则）
│   │   ├── LeadSource.ts           # 线索来源
│   │   ├── ContactInfo.ts          # 联系方式
│   │   ├── PersonName.ts           # 人名
│   │   └── Address.ts              # 地址
│   │
│   ├── aggregates/                 # 聚合根
│   │   ├── CustomerAggregate.ts    # 客户聚合根
│   │   ├── SalesLeadAggregate.ts   # 销售线索聚合根
│   │   └── SalesOpportunityAggregate.ts  # 商机聚合根
│   │
│   ├── repositories/               # 仓储接口
│   │   ├── ICustomerRepository.ts
│   │   ├── ISalesLeadRepository.ts
│   │   ├── ISalesOpportunityRepository.ts
│   │   └── IActivityRepository.ts
│   │
│   ├── services/                   # 领域服务
│   │   └── SalesDomainService.ts   # 销售领域服务（核心业务逻辑）
│   │
│   ├── events/                     # 领域事件
│   │   ├── DomainEvent.ts
│   │   ├── LeadEvents.ts           # 线索相关事件
│   │   ├── OpportunityEvents.ts    # 机会相关事件
│   │   └── CustomerEvents.ts       # 客户相关事件
│   │
│   └── exceptions/                 # 领域异常
│       └── DomainException.ts
│
├── application/                     # 应用层 (用例编排) - 预留
│   └── use-cases/
│
├── infrastructure/                  # 基础设施层 - 预留
│   └── persistence/
│
├── presentation/                    # 表示层
│   ├── pages/
│   │   ├── dashboard/              # 仪表盘
│   │   ├── customers/               # 客户管理
│   │   ├── leads/                  # 销售线索
│   │   ├── opportunities/           # 商机
│   │   └── contacts/                # 联系人
│   │
│   └── components/
│
└── lib/                             # 共享库
    ├── crm-context.tsx             # 全局状态
    └── crm-types.ts                # 类型定义
```

---

## 2. 限界上下文划分

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CRM 系统                                       │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │
│  │   客户上下文      │  │   销售上下文      │  │   活动上下文      │       │
│  │  (Customer)      │  │  (Sales)         │  │  (Activity)      │       │
│  │                  │  │                  │  │                  │       │
│  │  · 客户          │  │  · 销售线索      │  │  · 活动记录      │       │
│  │  · 联系人        │  │  · 商机      │  │  · 审计日志      │       │
│  │  · 客户归属      │  │  · 销售漏斗      │  │                  │       │
│  │                  │  │  · 阶段转换      │  │                  │       │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘       │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     共享内核 (Shared Kernel)                       │   │
│  │  · 客户ID引用  · 人员ID引用  · 金额值对象  · 日期值对象           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 领域模型

### 3.1 聚合根

#### CustomerAggregate (客户聚合根)

| 属性 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识 |
| name | string | 客户姓名 |
| company | string | 公司名称 |
| status | CustomerStatus | 状态 (active/inactive/prospect) |
| industry | string | 行业 |
| contactInfo | ContactInfo | 联系方式 |
| address | Address | 地址 |

#### SalesLeadAggregate (销售线索聚合根)

| 属性 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识 |
| title | string | 线索标题 |
| source | LeadSource | 来源 (referral/website/cold_call/event等) |
| customerId | string | 关联客户ID |
| estimatedValue | Money | 预估金额 |
| probability | Percentage | 转化概率 (默认10%) |
| status | LeadStatus | 状态 (new/contacted/qualified/disqualified) |

**核心方法**：
- `qualify(data)` - 将线索转为商机
- `disqualify(reason)` - 放弃线索
- `markContacted()` - 标记为已联系

#### SalesOpportunityAggregate (商机聚合根)

| 属性 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识 |
| title | string | 机会标题 |
| customerId | string | 关联客户ID |
| value | Money | 机会金额 |
| stage | OpportunityStage | 阶段 |
| probability | Percentage | 成交概率 |
| expectedCloseDate | Date | 预计成交日期 |
| sourceLeadId | string | 来源线索ID (可选) |

**核心方法**：
- `changeStage(newStage)` - 变更阶段（带验证）
- `closeWon()` - 成交
- `closeLost(reason)` - 失败

### 3.2 值对象

#### OpportunityStage (机会阶段)

```typescript
// 阶段定义
type OpportunityStageType = 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

// 转换规则
const VALID_TRANSITIONS: Record<OpportunityStageType, OpportunityStageType[]> = {
  qualified: ['proposal', 'closed_lost'],    // 机会 → 提案 或 失败
  proposal: ['negotiation', 'closed_lost'],  // 提案 → 谈判 或 失败
  negotiation: ['closed_won', 'closed_lost'], // 谈判 → 成交 或 失败
  closed_won: [],                             // 终态
  closed_lost: [],                            // 终态
};

// 默认概率
const DEFAULT_PROBABILITY = {
  qualified: 30,     // 30%
  proposal: 50,      // 50%
  negotiation: 80,  // 80%
  closed_won: 100,  // 100%
  closed_lost: 0,   // 0%
};
```

---

## 4. 销售流程设计

### 4.1 线索到机会的完整流程

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           销售全流程                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        销售线索管理 (Lead)                            │   │
│  │                                                                      │   │
│  │   创建线索 ──▶ 联系客户 ──▶ Qualified ──▶ 转为机会 ──▶ 放弃         │   │
│  │      │           │             │            │                        │   │
│  │      ▼           ▼             ▼            ▼                        │   │
│  │   LeadStatus   LeadStatus   LeadStatus    触发事件                   │   │
│  │   - new       - contacted  - qualified    LeadQualified              │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                        │                                   │
│                                        ▼                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        销售漏斗 (Pipeline)                            │   │
│  │                                                                      │   │
│  │  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐          │   │
│  │  │Qualified │──▶│ Proposal │──▶│Negotiat. │──▶│ Closed  │          │   │
│  │  │ (机会)   │   │  (提案)  │   │  (谈判)  │   │  Won    │          │   │
│  │  │  30%    │   │   50%    │   │   80%    │   │ (成交)   │          │   │
│  │  └──────────┘   └──────────┘   └────┬─────┘   └──────────┘          │   │
│  │                                        │                             │   │
│  │                                        ▼                             │   │
│  │                                 ┌──────────┐                         │   │
│  │                                 │  Closed  │                         │   │
│  │                                 │  Lost    │                         │   │
│  │                                 │  (失败)  │                         │   │
│  │                                 └──────────┘                         │   │
│  │                                                                      │   │
│  │  阶段转换规则:                                                        │   │
│  │  · qualified → proposal → negotiation → closed_won                    │   │
│  │  · 任一阶段可 → closed_lost                                          │   │
│  │  · closed_won/closed_lost 为终态，不可转换                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 领域事件

| 事件 | 触发时机 | 说明 |
|------|---------|------|
| `LeadCreated` | 创建线索 | 记录活动日志 |
| `LeadQualified` | 线索Qualified | 创建商机 |
| `LeadDisqualified` | 放弃线索 | 记录放弃原因 |
| `OpportunityCreated` | 创建机会 | 记录活动日志 |
| `OpportunityStageChanged` | 阶段变更 | 记录阶段转换 |
| `OpportunityClosedWon` | 成交 | 更新统计数据 |
| `OpportunityClosedLost` | 失败 | 记录失败原因 |

---

## 5. 数据库 Schema

### 5.1 线索表 (leads)

```sql
CREATE TABLE leads (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  source VARCHAR(50) NOT NULL,                    -- referral, website, cold_call, event, advertisement, other
  customer_id VARCHAR(36) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  contact_id VARCHAR(36) REFERENCES contacts(id) ON DELETE SET NULL,
  contact_name VARCHAR(255),
  estimated_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  probability INTEGER NOT NULL DEFAULT 10,
  status VARCHAR(20) NOT NULL DEFAULT 'new',       -- new, contacted, qualified, disqualified
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

### 5.2 商机表 (opportunities)

```sql
CREATE TABLE opportunities (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  customer_id VARCHAR(36) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  contact_id VARCHAR(36) REFERENCES contacts(id) ON DELETE SET NULL,
  contact_name VARCHAR(255),
  value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  stage VARCHAR(20) NOT NULL DEFAULT 'qualified',  -- qualified, proposal, negotiation, closed_won, closed_lost
  probability INTEGER NOT NULL DEFAULT 30,
  expected_close_date DATE,
  description TEXT,
  notes TEXT,
  source_lead_id VARCHAR(36) REFERENCES leads(id) ON DELETE SET NULL,  -- 来源线索
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

### 5.3 客户表 (customers)

```sql
CREATE TABLE customers (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(128) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'prospect',  -- active, inactive, prospect
  industry VARCHAR(100),
  website VARCHAR(500),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

### 5.4 联系人表 (contacts)

```sql
CREATE TABLE contacts (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(64) NOT NULL,
  last_name VARCHAR(64) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  position VARCHAR(128),
  customer_id VARCHAR(36) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

---

## 6. API 设计

### 6.1 API 端点

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/crm?type=leads` | 获取销售线索列表 |
| GET | `/api/crm?type=opportunities` | 获取商机列表 |
| POST | `/api/crm` { action: 'createLead' } | 创建线索 |
| POST | `/api/crm` { action: 'qualifyLead' } | 线索Qualified |
| POST | `/api/crm` { action: 'disqualifyLead' } | 放弃线索 |
| PUT | `/api/crm` { action: 'changeStage' } | 变更机会阶段 |

### 6.2 Qualify Lead 请求

```json
POST /api/crm
{
  "action": "qualifyLead",
  "data": {
    "leadId": "lead_xxx",
    "opportunityTitle": "ERP系统采购项目",
    "value": 500000,
    "contactId": "contact_xxx",
    "expectedCloseDate": "2024-06-30",
    "notes": "客户决策链较长"
  }
}
```

### 6.3 Change Stage 请求

```json
PUT /api/crm
{
  "action": "changeStage",
  "id": "opp_xxx",
  "data": {
    "stage": "proposal",
    "reason": ""  // 仅 closed_lost 时需要
  }
}
```

---

## 7. 页面结构

| 页面 | URL | 功能 |
|------|-----|------|
| 仪表盘 | `/` | 数据总览、销售漏斗、最近活动 |
| 客户管理 | `/customers` | 客户列表、详情、新建、编辑 |
| **销售线索** | `/leads` | 线索列表、新建 Qualified 转为机会 |
| 商机 | `/opportunities` | 机会列表、阶段管理、详情 |
| 联系人 | `/contacts` | 联系人列表、新建、编辑 |

---

## 8. 部署方案

### 8.1 部署架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      Coze 平台 (PaaS)                            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   托管的 Next.js 应用                        ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        ││
│  │  │  Dev 环境   │  │  Prod 环境  │  │   预览环境   │        ││
│  │  │  Port 5000  │  │  Port 5000  │  │   Port 5000 │        ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘        ││
│  └────────────────────────────┬────────────────────────────────┘│
└──────────────────────────────┼──────────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐
│       Supabase Cloud          │  │        CDN (自动)            │
│  ┌──────────────────────────┐ │  │                              │
│  │  PostgreSQL 数据库        │ │  │   静态资源缓存               │
│  │  - 线索表 (leads)         │ │  │   全球加速                   │
│  │  - 机会表 (opportunities) │ │  │                              │
│  │  - 客户表 (customers)     │ │  │                              │
│  │  - 联系人表 (contacts)    │ │  │                              │
│  │  - 活动表 (activities)    │ │  │                              │
│  └──────────────────────────┘ │  │                              │
└──────────────────────────────┘  └──────────────────────────────┘
```

### 8.2 环境配置

| 环境 | 变量 | 说明 |
|------|------|------|
| Dev/Prod | `COZE_SUPABASE_URL` | Supabase 项目 URL |
| Dev/Prod | `COZE_SUPABASE_ANON_KEY` | Supabase 匿名密钥 |

---

## 更新日志

| 版本 | 日期 | 内容 |
|------|------|------|
| V1.0 | 2024-03 | 初始版本，基础 CRUD 功能 |
| V2.0 | 2024-04 | UI/UX PRO MAX 界面优化 |
| V2.1 | 2024-04 | 删除/编辑功能详细方案 |
| V2.2 | 2024-04 | **DDD 重构**，分离线索与机会，阶段转换验证 |
| V2.3 | 2024-04 | **报价单版本管理**：同一机会的报价单支持版本递增，新建版本需填写修订原因 |
| V4.0 | 2026-04-15 | **高级数据分析报表**：销售漏斗、团队排名、收入预测、转化分析 |

---

## Ralph 方法开发记录 (V4.0)

### 功能点选择
基于 GitHub 搜索和竞品分析，选择「高级数据分析报表」作为 V4.0 核心功能：
- 用户价值：高 - 数据驱动决策是管理者核心需求
- 技术可行性：高 - 已有仪表盘基础，可复用 recharts
- ROI：高 - 直接提升销售管理效率

### 技术选型
- **图表库**: recharts 2.15.4
- **数据展示**: 水平柱状图 (Funnel)、折线图 (Forecast)、柱状图 (Ranking/Conversion)
- **时间筛选**: 月/季度/年/全部

### 文件结构
```
src/
├── app/reports/
│   ├── page.tsx          # 报表首页
│   ├── layout.tsx       # 统一布局
│   ├── funnel/           # 销售漏斗
│   ├── team-ranking/    # 团队排名
│   ├── forecast/        # 收入预测
│   └── conversion/       # 转化分析
└── components/reports/
    ├── funnel-chart.tsx
    ├── team-ranking.tsx
    ├── forecast-chart.tsx
    └── conversion-chart.tsx
```
