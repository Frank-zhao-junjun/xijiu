// CRM API 路由 - 处理所有 CRUD 操作 (支持线索管理)

import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/crm-database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    
    if (type === 'stats') {
      const stats = await db.getDashboardStats();
      return NextResponse.json(stats);
    }
    
    if (type === 'activities') {
      const limit = parseInt(searchParams.get('limit') || '50');
      const activities = await db.getRecentActivities(limit);
      return NextResponse.json(activities);
    }
    
    // 通知 (V3.0)
    if (type === 'notifications') {
      const notifications = await db.getAllNotifications();
      return NextResponse.json(notifications);
    }
    
    if (type === 'unreadNotifications') {
      const notifications = await db.getUnreadNotifications();
      return NextResponse.json(notifications);
    }
    
    // 跟进记录 (V3.0)
    if (type === 'followUps') {
      const entityType = searchParams.get('entityType');
      const entityId = searchParams.get('entityId');
      const filter = searchParams.get('filter');
      
      if (filter === 'overdue') {
        const followUps = await db.getOverdueFollowUps();
        return NextResponse.json(followUps);
      }
      if (filter === 'upcoming') {
        const hours = parseInt(searchParams.get('hours') || '24');
        const followUps = await db.getUpcomingFollowUps(hours);
        return NextResponse.json(followUps);
      }
      if (entityType && entityId) {
        const followUps = await db.getFollowUpsByEntity(entityType, entityId);
        return NextResponse.json(followUps);
      }
      const followUps = await db.getAllFollowUps();
      return NextResponse.json(followUps);
    }
    
    // 逾期提醒检查 (V3.0)
    if (type === 'checkOverdue') {
      const created = await db.generateOverdueNotifications();
      return NextResponse.json({ created });
    }
    
    // 今日待办 (V4.0)
    if (type === 'todayTodos') {
      const overdueDays = parseInt(searchParams.get('overdueDays') || '7');
      const todos = await db.getTodayTodos(overdueDays);
      return NextResponse.json(todos);
    }
    
    // Tasks (任务管理 V4.1)
    if (type === 'tasks') {
      const tasks = await db.getAllTasks();
      return NextResponse.json(tasks);
    }
    
    if (type === 'contacts') {
      const customerId = searchParams.get('customerId');
      if (customerId) {
        const contacts = await db.getContactsByCustomerId(customerId);
        return NextResponse.json(contacts);
      }
      const contacts = await db.getAllContacts();
      return NextResponse.json(contacts);
    }
    
    // 销售线索 (leads) - 新增
    if (type === 'leads') {
      const customerId = searchParams.get('customerId');
      const status = searchParams.get('status');
      
      let leads = customerId 
        ? await db.getLeadsByCustomerId(customerId)
        : await db.getAllLeads();
      
      // 过滤状态
      if (status && status !== 'all') {
        leads = leads.filter(l => l.status === status);
      }
      
      return NextResponse.json(leads);
    }
    
    // 商机 (opportunities)
    if (type === 'opportunities') {
      const customerId = searchParams.get('customerId');
      const excludeLead = searchParams.get('excludeLead') === 'true';
      
      if (customerId) {
        const opportunities = await db.getOpportunitiesByCustomerId(customerId);
        return NextResponse.json(opportunities);
      }
      
      const opportunities = await db.getAllOpportunities(excludeLead);
      return NextResponse.json(opportunities);
    }
    
    // 产品管理 (products) - V3.2 新增
    if (type === 'products') {
      // 注意: 产品管理功能需要数据库表支持
      // 目前返回空数组，前端将使用本地状态
      console.log('[Products API] Products table not yet created in database');
      return NextResponse.json([]);
    }
    
    // 默认返回所有客户
    const customers = await db.getAllCustomers();
    return NextResponse.json(customers);
  } catch (error) {
    console.error('CRM API GET error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;
    
    switch (action) {
      // Customer
      case 'createCustomer': {
        const customer = await db.createCustomer(data);
        // 记录活动
        await db.createActivity({
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'created',
          entity_type: 'customer',
          entity_id: customer.id,
          entity_name: customer.name,
          description: `创建客户 ${customer.name}`,
          timestamp: new Date(),
        });
        return NextResponse.json(customer);
      }
      
      // Contact
      case 'createContact': {
        const contact = await db.createContact(data);
        await db.createActivity({
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'created',
          entity_type: 'contact',
          entity_id: contact.id,
          entity_name: `${contact.first_name} ${contact.last_name}`,
          description: `添加联系人 ${contact.first_name} ${contact.last_name}`,
          timestamp: new Date(),
        });
        return NextResponse.json(contact);
      }
      
      // Lead (线索)
      case 'createLead': {
        const lead = await db.createLead({
          id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          title: data.title,
          source: data.source,
          customer_id: data.customerId,
          customer_name: data.customerName,
          contact_id: data.contactId,
          contact_name: data.contactName,
          estimated_value: data.estimatedValue,
          notes: data.notes,
        });
        await db.createActivity({
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'created',
          entity_type: 'lead',
          entity_id: lead.id,
          entity_name: lead.title,
          description: `创建销售线索 "${lead.title}"，预估金额 ¥${Number(lead.estimated_value).toLocaleString()}`,
          timestamp: new Date(),
        });
        // 触发工作流: 线索创建
        db.executeWorkflowEngine({
          triggerType: 'lead_created',
          entityType: 'lead',
          entityId: lead.id,
          entityName: lead.title,
        }).catch(() => { /* 静默处理工作流错误 */ });
        return NextResponse.json(lead);
      }
      
      // Lead Qualified (线索转为机会)
      case 'qualifyLead': {
        const lead = await db.getLeadById(data.leadId);
        if (!lead) {
          return NextResponse.json({ error: '线索不存在' }, { status: 404 });
        }
        
        // 更新线索状态
        await db.updateLead(data.leadId, { status: 'qualified' });
        
        // 创建商机
        const opportunity = await db.createOpportunity({
          id: `opp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          title: data.opportunityTitle || lead.title,
          customer_id: lead.customer_id,
          customer_name: lead.customer_name,
          contact_id: data.contactId || lead.contact_id,
          contact_name: data.contactName || lead.contact_name,
          value: data.value || lead.estimated_value,
          stage: 'qualified',
          probability: 20,
          expected_close_date: data.expectedCloseDate,
          description: data.notes || lead.notes,
          source_lead_id: lead.id,
        });
        
        // 记录活动
        await db.createActivity({
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'qualified',
          entity_type: 'lead',
          entity_id: lead.id,
          entity_name: lead.title,
          description: `销售线索 "${lead.title}" 已Qualified，转为商机`,
          timestamp: new Date(),
        });
        
        await db.createActivity({
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'created',
          entity_type: 'opportunity',
          entity_id: opportunity.id,
          entity_name: opportunity.title,
          description: `创建商机 "${opportunity.title}"，金额 ¥${Number(opportunity.value).toLocaleString()}`,
          timestamp: new Date(),
        });
        
        return NextResponse.json({ lead, opportunity });
      }
      
      // Lead Disqualify (放弃线索)
      case 'disqualifyLead': {
        const lead = await db.getLeadById(data.leadId);
        if (!lead) {
          return NextResponse.json({ error: '线索不存在' }, { status: 404 });
        }
        
        await db.updateLead(data.leadId, { 
          status: 'disqualified',
          notes: lead.notes ? `${lead.notes}\n放弃原因: ${data.reason || '未说明'}` : `放弃原因: ${data.reason || '未说明'}`,
        });
        
        await db.createActivity({
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'disqualified',
          entity_type: 'lead',
          entity_id: lead.id,
          entity_name: lead.title,
          description: `销售线索 "${lead.title}" 已被放弃${data.reason ? `，原因: ${data.reason}` : ''}`,
          timestamp: new Date(),
        });
        
        return NextResponse.json({ success: true });
      }
      
      // Opportunity
      case 'createOpportunity': {
        const opportunity = await db.createOpportunity({
          id: `opp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          title: data.title,
          customer_id: data.customerId,
          customer_name: data.customerName,
          contact_id: data.contactId,
          contact_name: data.contactName,
          value: data.value,
          stage: data.stage || 'qualified',
          probability: data.probability || 30,
          expected_close_date: data.expectedCloseDate,
          description: data.description,
        });
        await db.createActivity({
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'created',
          entity_type: 'opportunity',
          entity_id: opportunity.id,
          entity_name: opportunity.title,
          description: `创建商机 "${opportunity.title}"，金额 ¥${Number(opportunity.value).toLocaleString()}`,
          timestamp: new Date(),
        });
        // 触发工作流: 商机创建
        db.executeWorkflowEngine({
          triggerType: 'opportunity_created',
          entityType: 'opportunity',
          entityId: opportunity.id,
          entityName: opportunity.title,
        }).catch(() => { /* 静默处理工作流错误 */ });
        return NextResponse.json(opportunity);
      }
      
      // Activity
      case 'createActivity': {
        const activity = await db.createActivity(data);
        return NextResponse.json(activity);
      }
      
      // FollowUp (V3.0)
      case 'createFollowUp': {
        const followUp = await db.createFollowUp({
          id: `fu_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          entity_type: data.entityType,
          entity_id: data.entityId,
          entity_name: data.entityName,
          type: data.type || 'note',
          content: data.content,
          scheduled_at: data.scheduledAt || null,
          completed_at: data.completedAt || null,
        });
        await db.createActivity({
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'follow_up',
          entity_type: data.entityType,
          entity_id: data.entityId,
          entity_name: data.entityName,
          description: `添加跟进记录: ${data.content?.substring(0, 50)}`,
          timestamp: new Date(),
        });

        // 自动流转：如果跟进对象是线索且状态为「新建」，自动变为「已联系」
        if (data.entityType === 'lead') {
          try {
            const lead = await db.getLeadById(data.entityId);
            if (lead && lead.status === 'new') {
              await db.updateLead(data.entityId, { status: 'contacted' });
              await db.createActivity({
                id: `act_${Date.now()}_auto_${Math.random().toString(36).substring(2, 9)}`,
                type: 'updated',
                entity_type: 'lead',
                entity_id: data.entityId,
                entity_name: data.entityName,
                description: `线索首次跟进，状态自动从「新建」变为「已联系」`,
                timestamp: new Date(),
              });
            }
          } catch { /* 静默处理，不影响跟进记录创建 */ }
        }

        return NextResponse.json(followUp);
      }
      
      // Complete FollowUp (V3.0)
      case 'completeFollowUp': {
        const followUp = await db.completeFollowUp(data.followUpId);
        return NextResponse.json(followUp);
      }
      
      // Notification (V3.0)
      case 'createNotification': {
        const notification = await db.createNotification({
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: data.type,
          title: data.title,
          message: data.message,
          entity_type: data.entityType || null,
          entity_id: data.entityId || null,
          is_read: false,
        });
        return NextResponse.json(notification);
      }
      
      // Task (任务管理 V4.1)
      case 'addTask': {
        const task = await db.createTask({
          title: data.title,
          description: data.description,
          type: data.type || 'other',
          priority: data.priority || 'medium',
          status: data.status || 'pending',
          assigneeId: data.assigneeId,
          assigneeName: data.assigneeName,
          relatedType: data.relatedType,
          relatedId: data.relatedId,
          relatedName: data.relatedName,
          dueDate: data.dueDate,
        });
        await db.createActivity({
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'created',
          entity_type: 'lead',
          entity_id: task.id,
          entity_name: task.title,
          description: `创建任务 "${task.title}"`,
          timestamp: new Date(),
        });
        return NextResponse.json(task);
      }
      
      // Product (产品管理 V3.2) - 注意: 需要数据库表支持
      case 'addProduct': {
        console.log('[Products API] addProduct called but products table not available');
        // 返回成功响应，前端将使用本地状态
        return NextResponse.json({ 
          id: data.id || `prod_${Date.now()}`,
          name: data.name,
          sku: data.sku,
          category: data.category,
          description: data.description,
          unitPrice: data.unitPrice,
          unit: data.unit,
          cost: data.cost,
          stock: data.stock || 0,
          isActive: data.isActive !== false,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          _note: 'Product created in local state (database table pending)'
        });
      }
      
      // Update Product (产品管理 V3.2)
      case 'updateProduct': {
        console.log('[Products API] updateProduct called but products table not available');
        return NextResponse.json({ 
          id: data?.id || (body as Record<string, unknown>)?.id,
          ...data,
          updatedAt: new Date().toISOString(),
          _note: 'Product updated in local state (database table pending)'
        });
      }
      
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('CRM API POST error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, data } = body;
    
    switch (action) {
      // Customer
      case 'updateCustomer': {
        const customer = await db.updateCustomer(id, data);
        await db.createActivity({
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'updated',
          entity_type: 'customer',
          entity_id: customer.id,
          entity_name: customer.name,
          description: `更新客户 ${customer.name}`,
          timestamp: new Date(),
        });
        return NextResponse.json(customer);
      }
      
      // Contact
      case 'updateContact': {
        const contact = await db.updateContact(id, data);
        return NextResponse.json(contact);
      }
      
      // Lead (线索)
      case 'updateLead': {
        const lead = await db.updateLead(id, data);
        return NextResponse.json(lead);
      }
      
      // Opportunity (机会)
      case 'updateOpportunity': {
        const oldOpp = await db.getOpportunityById(id);
        const opportunity = await db.updateOpportunity(id, data);
        
        // 如果阶段变更，记录活动
        if (oldOpp && data.stage && oldOpp.stage !== data.stage) {
          const stageLabels: Record<string, string> = {
            qualified: '商机确认',
            discovery: '需求调研',
            proposal: '方案报价',
            negotiation: '商务洽谈',
            contract: '合同签署',
            closed_won: '成交',
            closed_lost: '失败',
          };
          
          await db.createActivity({
            id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            type: data.stage === 'closed_won' ? 'closed_won' : data.stage === 'closed_lost' ? 'closed_lost' : 'stage_change',
            entity_type: 'opportunity',
            entity_id: opportunity.id,
            entity_name: opportunity.title,
            description: data.stage === 'closed_won' 
              ? `商机 "${opportunity.title}" 成交！金额: ¥${Number(opportunity.value).toLocaleString()}`
              : data.stage === 'closed_lost'
              ? `商机 "${opportunity.title}" 失败${data.reason ? `，原因: ${data.reason}` : ''}`
              : `商机 "${opportunity.title}" 从 ${stageLabels[oldOpp.stage]} 变更为 ${stageLabels[data.stage]}`,
            timestamp: new Date(),
          });
        }
        
        return NextResponse.json(opportunity);
      }
      
      // Stage Change (阶段变更) - 专门的端点
      case 'changeStage': {
        const opportunity = await db.getOpportunityById(id);
        if (!opportunity) {
          return NextResponse.json({ error: '机会不存在' }, { status: 404 });
        }
        
        // 验证阶段转换
        const validTransitions: Record<string, string[]> = {
          qualified: ['discovery', 'closed_lost'],
          discovery: ['proposal', 'closed_lost'],
          proposal: ['negotiation', 'closed_lost'],
          negotiation: ['contract', 'closed_lost'],
          contract: ['closed_won', 'closed_lost'],
          closed_won: [],
          closed_lost: [],
        };
        
        if (!validTransitions[opportunity.stage]?.includes(data.stage)) {
          return NextResponse.json({ 
            error: `不能从 "${opportunity.stage}" 阶段直接转换到 "${data.stage}" 阶段` 
          }, { status: 400 });
        }
        
        const stageLabels: Record<string, string> = {
          qualified: '商机确认',
          discovery: '需求调研',
          proposal: '方案报价',
          negotiation: '商务洽谈',
          contract: '合同签署',
          closed_won: '成交',
          closed_lost: '失败',
        };
        
        const defaultProbabilities: Record<string, number> = {
          qualified: 20,
          discovery: 30,
          proposal: 45,
          negotiation: 65,
          contract: 85,
          closed_won: 100,
          closed_lost: 0,
        };
        
        const updated = await db.updateOpportunity(id, {
          stage: data.stage,
          probability: defaultProbabilities[data.stage],
          notes: data.stage === 'closed_lost' && data.reason 
            ? `${opportunity.description || ''}\n失败原因: ${data.reason}`.trim()
            : opportunity.description,
        });
        
        await db.createActivity({
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: data.stage === 'closed_won' ? 'closed_won' : data.stage === 'closed_lost' ? 'closed_lost' : 'stage_change',
          entity_type: 'opportunity',
          entity_id: updated.id,
          entity_name: updated.title,
          description: data.stage === 'closed_won' 
            ? `商机 "${updated.title}" 成交！金额: ¥${Number(updated.value).toLocaleString()}`
            : data.stage === 'closed_lost'
            ? `商机 "${updated.title}" 失败${data.reason ? `，原因: ${data.reason}` : ''}`
            : `商机 "${updated.title}" 从 ${stageLabels[opportunity.stage]} 变更为 ${stageLabels[data.stage]}`,
          timestamp: new Date(),
        });

        // 阶段变更通知 (V3.0)
        if (data.stage === 'closed_won' || data.stage === 'closed_lost') {
          await db.createNotification({
            id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            type: 'stage_change',
            title: data.stage === 'closed_won' ? '机会成交' : '机会失败',
            message: data.stage === 'closed_won' 
              ? `商机 "${updated.title}" 已成交，金额 ¥${Number(updated.value).toLocaleString()}`
              : `商机 "${updated.title}" 已失败${data.reason ? `，原因: ${data.reason}` : ''}`,
            entity_type: 'opportunity',
            entity_id: updated.id,
            is_read: false,
          });
        }

        // 触发工作流: 商机阶段变更
        db.executeWorkflowEngine({
          triggerType: 'opportunity_stage_changed',
          entityType: 'opportunity',
          entityId: updated.id,
          entityName: updated.title,
          data: { oldStage: opportunity.stage, newStage: data.stage },
        }).catch(() => { /* 静默处理工作流错误 */ });
        
        return NextResponse.json(updated);
      }
      
      // Mark Notification Read (V3.0)
      case 'markNotificationRead': {
        await db.markNotificationRead(id);
        return NextResponse.json({ success: true });
      }
      
      // Mark All Notifications Read (V3.0)
      case 'markAllNotificationsRead': {
        await db.markAllNotificationsRead();
        return NextResponse.json({ success: true });
      }
      
      // Task (任务管理 V4.1)
      case 'updateTask': {
        const task = await db.updateTask(id, data);
        return NextResponse.json(task);
      }
      
      // Payment Plan (回款管理 V3.3)
      case 'addPaymentPlan': {
        const plan = await db.createPaymentPlan({
          id: data.id,
          plan_number: data.planNumber,
          contract_id: data.contractId || null,
          contract_number: data.contractNumber || null,
          customer_id: data.customerId || null,
          customer_name: data.customerName || null,
          opportunity_id: data.opportunityId || null,
          opportunity_name: data.opportunityName || null,
          title: data.title,
          total_amount: data.totalAmount,
          paid_amount: 0,
          pending_amount: data.totalAmount,
          due_date: data.dueDate,
          status: 'pending',
          payment_method: data.paymentMethod || null,
          installments: JSON.stringify(data.installments || []),
          overdue_days: data.overdueDays || 0,
          is_overdue: data.isOverdue || false,
          created_at: data.createdAt,
          updated_at: data.updatedAt,
        });
        await db.createActivity({
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'created',
          entity_type: 'lead',
          entity_id: plan.id,
          entity_name: plan.title,
          description: `创建回款计划 "${plan.title}"，金额 ¥${Number((plan as unknown as Record<string, unknown>).total_amount || (plan as unknown as Record<string, unknown>).totalAmount || 0).toLocaleString()}`,
          timestamp: new Date(),
        });
        return NextResponse.json(plan);
      }
      
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('CRM API PUT error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    
    switch (action) {
      // Customer (级联删除)
      case 'deleteCustomer': {
        const customer = await db.getCustomerById(id);
        if (customer) {
          await db.deleteCustomer(id);
          await db.createActivity({
            id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            type: 'deleted',
            entity_type: 'customer',
            entity_id: id,
            entity_name: customer.name,
            description: `删除客户 ${customer.name}`,
            timestamp: new Date(),
          });
        }
        return NextResponse.json({ success: true });
      }
      
      case 'deleteContact': {
        await db.deleteContact(id);
        return NextResponse.json({ success: true });
      }
      
      // Lead
      case 'deleteLead': {
        const lead = await db.getLeadById(id);
        if (lead) {
          await db.deleteLead(id);
          await db.createActivity({
            id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            type: 'deleted',
            entity_type: 'lead',
            entity_id: id,
            entity_name: lead.title,
            description: `删除销售线索 ${lead.title}`,
            timestamp: new Date(),
          });
        }
        return NextResponse.json({ success: true });
      }
      
      // Opportunity
      case 'deleteOpportunity': {
        const opportunity = await db.getOpportunityById(id);
        if (opportunity) {
          await db.deleteOpportunity(id);
          await db.createActivity({
            id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            type: 'deleted',
            entity_type: 'opportunity',
            entity_id: id,
            entity_name: opportunity.title,
            description: `删除商机 ${opportunity.title}`,
            timestamp: new Date(),
          });
        }
        return NextResponse.json({ success: true });
      }
      
      // Payment Plan (回款管理 V3.3)
      case 'deletePaymentPlan': {
        await db.deletePaymentPlan(id);
        return NextResponse.json({ success: true });
      }
      
      // Task (任务管理 V4.1)
      case 'deleteTask': {
        await db.deleteTask(id);
        return NextResponse.json({ success: true });
      }
      
      // Product (产品管理 V3.2) - 注意: 需要数据库表支持
      case 'deleteProduct': {
        console.log('[Products API] deleteProduct called but products table not available');
        // 返回成功响应，前端将使用本地状态
        return NextResponse.json({ success: true, _note: 'Product deleted in local state (database table pending)' });
      }
      
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('CRM API DELETE error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
