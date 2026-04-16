# 任务管理模块 (Task Management) - V4.1

## 功能概述
为CRM系统添加独立的任务管理模块，支持任务的创建、分配、跟踪和完成管理。

## 数据模型

### Task
```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  type: 'follow_up' | 'meeting' | 'call' | 'email' | 'demo' | 'proposal' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigneeId?: string;
  assigneeName?: string;
  relatedType?: 'customer' | 'lead' | 'opportunity' | 'contract' | 'order';
  relatedId?: string;
  relatedName?: string;
  dueDate: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

## 功能点

### 1. 任务列表页 (/tasks)
- 任务筛选（状态、优先级、类型、负责人）
- 搜索任务
- 任务统计卡片（待办/进行中/已完成/已逾期）
- 列表视图/看板视图切换

### 2. 新建任务 (/tasks/new)
- 任务基本信息（标题、描述、类型、优先级）
- 负责人选择
- 关联对象选择（客户/线索/商机/合同/订单）
- 到期日期选择

### 3. 任务详情页 (/tasks/[id])
- 任务详情展示
- 状态变更操作
- 编辑任务
- 删除任务

### 4. 看板视图
- 按状态分组展示任务卡片
- 拖拽变更状态

## 优先级评估（RICE）

| 维度 | 评分 | 说明 |
|------|------|------|
| Reach | 高 | 所有用户都需任务管理 |
| Impact | 高 | 直接提升销售执行效率 |
| Confidence | 高 | 功能明确，CRUD模式 |
| Effort | 中 | 需要4-6小时 |
| **总分** | **24** | 立即执行 |

## 开发计划
1. 添加Task类型定义
2. 添加Task数据库操作函数
3. 创建任务API路由
4. 创建任务列表页
5. 创建新建/编辑任务页
6. 创建任务详情页
7. 添加看板视图
8. 更新侧边栏菜单
9. 更新README
