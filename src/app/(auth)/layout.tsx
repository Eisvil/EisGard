import "@/styles/globals.css";
import "@/styles/components.css";
import "@/styles/layout.css";
import "@/styles/responsive.css";
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-layout-wrapper">
      <a href="/" className="auth-back-link">
        ← Живое Городище
      </a>
      {children}
    </div>
  );
}
