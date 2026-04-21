import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MainContent } from "@/components/layout/main-content";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-[#1E1E1E] overflow-hidden">
      {/* Sidebar background is white, and it stays on the left */}
      <Sidebar />
      
      {/* Main Content Area overlapping the dark background */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F4F5F7] overflow-hidden relative md:shadow-[-10px_0_30px_rgba(0,0,0,0.1)] z-10">
         <Header />
         <MainContent>
            {children}
         </MainContent>
         <MobileNav />
      </div>
    </div>
  );
}
