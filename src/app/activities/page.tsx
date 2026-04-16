import { ActivityTimeline } from '@/components/crm/activity-timeline';

export const metadata = {
  title: '活动追踪 - CRM',
  description: '查看系统中所有活动的追踪记录',
};

export default function ActivitiesPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">活动追踪</h1>
        <p className="text-muted-foreground">
          查看系统中所有客户的创建、更新和删除操作记录
        </p>
      </div>
      
      <ActivityTimeline 
        showFilters={true}
        title="全部活动"
      />
    </div>
  );
}
