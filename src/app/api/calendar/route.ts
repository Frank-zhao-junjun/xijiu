import { NextRequest, NextResponse } from 'next/server';
import { addDays, format } from 'date-fns';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  type: 'opportunity' | 'task' | 'activity';
  color?: string;
  customerId?: string;
  customerName?: string;
  opportunityId?: string;
  opportunityName?: string;
}

// Mock data for demonstration
function generateMockEvents(): CalendarEvent[] {
  const today = new Date();
  const events: CalendarEvent[] = [];

  // Generate opportunity events
  const opportunityTitles = [
    '跟进：企业数字化转型项目',
    '方案评审：智慧园区建设',
    '商务谈判：数据中心订单',
    '合同签署：智能制造解决方案',
  ];

  opportunityTitles.forEach((title, index) => {
    events.push({
      id: `opp-${index + 1}`,
      title,
      description: `商机跟进日程 - ${title}`,
      startDate: format(addDays(today, index + 1), 'yyyy-MM-dd'),
      endDate: format(addDays(today, index + 1), 'yyyy-MM-dd'),
      type: 'opportunity',
      customerId: `cust-${index + 1}`,
      customerName: ['科技创新集团', '智慧城市发展', '数据云服务', '智能制造科技'][index],
    });
  });

  // Generate task events
  const taskTitles = [
    '准备季度报告',
    '客户拜访计划',
    '产品演示准备',
    '报价单跟进',
    '团队周会',
  ];

  taskTitles.forEach((title, index) => {
    events.push({
      id: `task-${index + 1}`,
      title,
      description: `待办任务 - ${title}`,
      startDate: format(addDays(today, index - 2), 'yyyy-MM-dd'),
      endDate: format(addDays(today, index - 2), 'yyyy-MM-dd'),
      type: 'task',
    });
  });

  // Generate activity events
  const activityTitles = [
    '客户高层会议',
    '产品发布会',
    '行业研讨会',
    '客户培训',
  ];

  activityTitles.forEach((title, index) => {
    events.push({
      id: `act-${index + 1}`,
      title,
      description: `活动日程 - ${title}`,
      startDate: format(addDays(today, index + 3), 'yyyy-MM-dd'),
      endDate: format(addDays(today, index + 3), 'yyyy-MM-dd'),
      type: 'activity',
      customerId: `cust-${index + 5}`,
      customerName: ['创新科技', '云智数据', '未来制造', '智能互联'][index],
    });
  });

  return events;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const type = searchParams.get('type');

  let events = generateMockEvents();

  // Filter by date range
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    events = events.filter((event) => {
      const eventDate = new Date(event.startDate);
      return eventDate >= start && eventDate <= end;
    });
  }

  // Filter by type
  if (type && ['opportunity', 'task', 'activity'].includes(type)) {
    events = events.filter((event) => event.type === type);
  }

  return NextResponse.json({
    success: true,
    data: events,
    total: events.length,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, startDate, endDate, type, customerId, customerName } = body;

    // Validate required fields
    if (!title || !startDate || !endDate || !type) {
      return NextResponse.json(
        { success: false, message: '缺少必填字段' },
        { status: 400 }
      );
    }

    // Validate type
    if (!['opportunity', 'task', 'activity'].includes(type)) {
      return NextResponse.json(
        { success: false, message: '无效的事件类型' },
        { status: 400 }
      );
    }

    // Create new event (in real app, this would save to database)
    const newEvent: CalendarEvent = {
      id: `${type}-${Date.now()}`,
      title,
      description,
      startDate,
      endDate,
      type,
      customerId,
      customerName,
    };

    return NextResponse.json({
      success: true,
      data: newEvent,
      message: '事件创建成功',
    });
  } catch {
    return NextResponse.json(
      { success: false, message: '请求处理失败' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, startDate, endDate, title, description } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: '缺少事件ID' },
        { status: 400 }
      );
    }

    // In real app, this would update the database
    const updatedEvent: CalendarEvent = {
      id,
      title,
      description,
      startDate,
      endDate,
      type: 'opportunity',
    };

    return NextResponse.json({
      success: true,
      data: updatedEvent,
      message: '事件更新成功',
    });
  } catch {
    return NextResponse.json(
      { success: false, message: '请求处理失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { success: false, message: '缺少事件ID' },
      { status: 400 }
    );
  }

  // In real app, this would delete from database
  return NextResponse.json({
    success: true,
    message: '事件删除成功',
  });
}
