'use client';

import { CRMLayout } from '@/components/crm/layout';

export default function CRMpageWrapper({ children }: { children: React.ReactNode }) {
  return <CRMLayout>{children}</CRMLayout>;
}
