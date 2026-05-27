import '@/styles/globals.css';
import '@/styles/components.css';
import '@/styles/layout.css';
import '@/styles/responsive.css';
import type { ReactNode } from 'react';

export default function CabinetLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
