'use client';

import { CRMProvider } from '@/lib/crm-context';
import { ReportsLayout } from '@/components/crm/layout';

export default function ReportsLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CRMProvider>
      <ReportsLayout>{children}</ReportsLayout>
    </CRMProvider>
  );
}
