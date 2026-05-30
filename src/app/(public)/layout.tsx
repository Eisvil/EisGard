import "@/styles/globals.css";
import "@/styles/components.css";
import "@/styles/layout.css";
import "@/styles/map.css";
import "@/styles/responsive.css";
import { ScrollToTop } from '@/components/features/ScrollToTop';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ScrollToTop />
    </>
  );
}
