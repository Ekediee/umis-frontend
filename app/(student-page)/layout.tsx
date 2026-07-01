import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MainContent } from "@/components/layout/main-content";
import { UserDataProvider } from "@/contexts/user-data-context";

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
      <div className="flex-1 flex flex-col min-w-0 bg-[#F4F5F7] dark:bg-black overflow-hidden relative z-10 transition-colors duration-200">
         <Header />
         <MainContent>
            <UserDataProvider>{children}</UserDataProvider>
         </MainContent>
         <MobileNav />
      </div>
    </div>
  );
}
