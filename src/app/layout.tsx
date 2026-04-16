import { CRMLayout } from '@/components/crm/layout';
import './globals.css';

export const metadata = {
  title: 'CRM 销售管理系统',
  description: '面向小团队的销售管理工具',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <CRMLayout>{children}</CRMLayout>
      </body>
    </html>
  );
}
