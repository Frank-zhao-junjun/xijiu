# V4.1 智能跟进提醒系统

## 1. 功能概述

### 1.1 目标
为 CRM 系统添加智能跟进提醒功能，帮助销售团队自动化跟进流程，确保不会错过任何重要客户接触节点。

### 1.2 解决的问题
- **跟进流程混乱**：跟进日志不清晰，历史沟通找不到
- **错过重要节点**：报价后未反馈、合同签署后未跟进
- **重复性工作**：需要手动创建大量跟进任务

## 2. 功能规格

### 2.1 核心功能

#### 2.1.1 自动跟进提醒规则引擎
支持以下触发条件：
- **商机阶段变更时**：自动创建跟进任务（如阶段从"提案"进入"谈判"时）
- **报价单发送后**：3天/7天未收到客户响应时提醒
- **合同签署后**：回款节点自动提醒
- **客户生日/重要日期**：节假日前的问候提醒
- **商机长期未跟进**：超过X天无活动记录时提醒
- **回款逾期**：超过约定日期未收款时提醒

#### 2.1.2 跟进任务管理
- 自动生成跟进任务（标题、描述、截止日期）
- 支持手动创建自定义跟进任务
- 任务状态管理（待处理、进行中、已完成）
- 优先级设置（高、中、低）
- 关联实体（客户、商机、报价单、合同）

#### 2.1.3 今日待办面板增强
- 显示今日到期任务
- 显示逾期任务（红色高亮）
- 显示即将到期任务（未来7天）
- 一键完成任务或延后

#### 2.1.4 跟进记录自动化
- 记录每次跟进的详细信息（时间、内容、结果）
- 支持快速添加跟进记录
- 跟进历史时间线展示

### 2.2 数据模型

```typescript
// 跟进任务
interface FollowUpTask {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  relatedType: 'customer' | 'opportunity' | 'quote' | 'contract' | 'order' | 'invoice' | 'payment';
  relatedId: string;
  createdAt: Date;
  completedAt?: Date;
  completedNote?: string;
}

// 跟进规则
interface FollowUpRule {
  id: string;
  name: string;
  triggerType: 'stage_change' | 'quote_sent' | 'contract_signed' | 'overdue' | 'custom';
  triggerConfig: {
    entityType: string;
    days?: number;
    stageFrom?: string;
    stageTo?: string;
  };
  action: {
    type: 'create_task' | 'send_notification';
    taskTitle: string;
    taskPriority: 'high' | 'medium' | 'low';
    dueInDays: number;
  };
  enabled: boolean;
}

// 跟进记录
interface FollowUpRecord {
  id: string;
  entityType: 'customer' | 'opportunity' | 'quote' | 'contract';
  entityId: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'other';
  content: string;
  result: 'positive' | 'neutral' | 'negative';
  nextAction?: string;
  nextActionDate?: Date;
  createdAt: Date;
  createdBy: string;
}
```

### 2.3 页面设计

#### 2.3.1 跟进任务列表页 `/follow-up-tasks`
- 筛选条件：状态、优先级、关联实体、日期范围
- 列表展示：任务标题、关联客户、截止日期、优先级、状态
- 操作：标记完成、延后、编辑、删除

#### 2.3.2 今日待办面板增强
- 在仪表盘增加"今日待办"卡片
- 显示任务列表和快速操作按钮
- 支持拖拽排序

#### 2.3.3 跟进规则配置页 `/follow-up-rules`
- 预设规则模板
- 自定义规则创建
- 规则启用/禁用开关

#### 2.3.4 跟进历史时间线
- 在客户/商机详情页增加跟进时间线
- 按时间倒序展示所有跟进记录

## 3. 技术实现

### 3.1 技术栈
- Next.js 16 + TypeScript
- React Context 状态管理
- TailwindCSS + shadcn/ui

### 3.2 文件结构
```
src/
├── app/
│   ├── follow-up-tasks/
│   │   ├── page.tsx          # 跟进任务列表页
│   │   └── [id]/
│   │       └── page.tsx      # 任务详情页
│   ├── follow-up-rules/
│   │   └── page.tsx          # 跟进规则配置页
│   └── components/
│       ├── follow-up/
│       │   ├── task-list.tsx
│       │   ├── task-card.tsx
│       │   ├── task-form.tsx
│       │   ├── rules-list.tsx
│       │   ├── follow-up-timeline.tsx
│       │   └── follow-up-record-form.tsx
├── lib/
│   ├── crm-context.tsx       # 更新以包含跟进任务和规则
│   └── follow-up-engine.ts   # 跟进规则引擎
└── types/
    └── index.ts              # 更新类型定义
```

## 4. 实施步骤

### 4.1 第一阶段：数据模型和基础组件
1. 扩展类型定义（FollowUpTask, FollowUpRule, FollowUpRecord）
2. 更新 CRM Context 添加跟进相关状态
3. 创建跟进任务基础组件

### 4.2 第二阶段：跟进任务管理
1. 实现跟进任务列表页
2. 实现任务创建/编辑表单
3. 实现任务状态管理

### 4.3 第三阶段：跟进规则引擎
1. 实现规则引擎核心逻辑
2. 创建规则配置页面
3. 集成自动任务生成

### 4.4 第四阶段：UI 集成
1. 增强仪表盘今日待办
2. 添加跟进时间线组件
3. 添加快捷跟进入口

## 5. 优先级建议

**P0 - 必须实现**：
- 跟进任务 CRUD
- 今日待办面板
- 逾期提醒

**P1 - 重要功能**：
- 跟进规则引擎
- 跟进记录管理
- 跟进时间线

**P2 - 增强功能**：
- 规则模板
- 批量操作
- 数据导出

## 6. 成功指标

- 跟进任务完成率 ≥ 80%
- 逾期任务占比 ≤ 10%
- 用户每日平均查看提醒次数 ≥ 2 次
