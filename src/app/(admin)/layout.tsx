import '@/app/admin.css';
import type { ReactNode } from 'react';
import { AdminSidebar } from '@/components/layouts/AdminSidebar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 min-w-0 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
