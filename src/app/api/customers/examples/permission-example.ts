/**
 * 权限检查使用示例
 * 
 * 这个文件展示了如何在 API 路由中使用权限检查功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { withPermissionGuard } from '@/lib/api-permission';
import * as db from '@/lib/crm-database';

/**
 * 示例 1：在 GET 请求中使用权限检查
 */
export async function GET(request: NextRequest) {
  // 方式 1：使用守卫函数（推荐）
  return withPermissionGuard(request, 'customers.view', async (_userId) => {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('id');
    
    if (customerId) {
      // 获取单个客户
      const customer = await db.getCustomerById(customerId);
      if (!customer) {
        return NextResponse.json({ error: '客户不存在' }, { status: 404 });
      }
      return NextResponse.json(customer);
    }
    
    // 获取所有客户
    const customers = await db.getAllCustomers();
    return NextResponse.json(customers);
  });
}

/**
 * 示例 2：在 POST 请求中使用权限检查
 */
export async function POST(request: NextRequest) {
  return withPermissionGuard(request, 'customers.create', async (_userId) => {
    try {
      const body = await request.json();
      
      // 验证必填字段
      if (!body.name || !body.company) {
        return NextResponse.json(
          { error: '缺少必填字段' },
          { status: 400 }
        );
      }
      
      // 创建客户
      const customer = await db.createCustomer({
        id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        company: body.company,
        status: body.status || 'prospect',
        industry: body.industry || null,
        website: body.website || null,
        address: body.address || null,
        notes: body.notes || null,
      });
      
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
      
      return NextResponse.json(customer, { status: 201 });
    } catch (error) {
      console.error('创建客户失败:', error);
      return NextResponse.json(
        { error: '创建客户失败' },
        { status: 500 }
      );
    }
  });
}

/**
 * 示例 3：在 DELETE 请求中使用权限检查
 */
export async function DELETE(request: NextRequest) {
  return withPermissionGuard(request, 'customers.delete', async (_userId) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const customerId = searchParams.get('id');
      
      if (!customerId) {
        return NextResponse.json(
          { error: '缺少客户ID' },
          { status: 400 }
        );
      }
      
      // 检查客户是否存在
      const customer = await db.getCustomerById(customerId);
      if (!customer) {
        return NextResponse.json(
          { error: '客户不存在' },
          { status: 404 }
        );
      }
      
      // 删除客户
      await db.deleteCustomer(customerId);
      
      // 记录活动
      await db.createActivity({
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: 'deleted',
        entity_type: 'customer',
        entity_id: customerId,
        entity_name: customer.name,
        description: `删除客户 ${customer.name}`,
        timestamp: new Date(),
      });
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('删除客户失败:', error);
      return NextResponse.json(
        { error: '删除客户失败' },
        { status: 500 }
      );
    }
  });
}

/**
 * 示例 4：条件权限检查
 * 只有当用户同时拥有查看和编辑权限时，才允许导出客户数据
 */
export async function PUT(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  
  // 导出操作需要 export 权限
  if (action === 'export') {
    return withPermissionGuard(request, 'customers.export', async (_userId) => {
      const customers = await db.getAllCustomers();
      
      // 生成导出数据（示例）
      const exportData = customers.map(c => ({
        name: c.name,
        email: c.email,
        phone: c.phone,
        company: c.company,
        status: c.status,
      }));
      
      return NextResponse.json({
        success: true,
        data: exportData,
        count: exportData.length,
      });
    });
  }
  
  // 普通编辑操作需要 edit 权限
  return withPermissionGuard(request, 'customers.edit', async (_userId) => {
    try {
      const body = await request.json();
      const { id, ...updates } = body;
      
      if (!id) {
        return NextResponse.json(
          { error: '缺少客户ID' },
          { status: 400 }
        );
      }
      
      const customer = await db.updateCustomer(id, updates);
      
      // 记录活动
      await db.createActivity({
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: 'updated',
        entity_type: 'customer',
        entity_id: id,
        entity_name: customer.name,
        description: `更新客户 ${customer.name}`,
        timestamp: new Date(),
      });
      
      return NextResponse.json(customer);
    } catch (error) {
      console.error('更新客户失败:', error);
      return NextResponse.json(
        { error: '更新客户失败' },
        { status: 500 }
      );
    }
  });
}
