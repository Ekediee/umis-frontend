import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MainContent } from "@/components/layout/main-content";
import { UserDataProvider } from "@/contexts/user-data-context";
import { SessionTimeoutProvider } from "@/components/providers/session-timeout-provider";
import { getUserData, getStudentProfileAction } from "@/app/actions/user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // If the user_data cookie is absent (evicted / partially cleared) but the
  // session token is still valid, fall back to the live API so components
  // always receive populated initialData rather than null.
  const initialUserData = await getUserData() ?? await getStudentProfileAction();

  return (
    <UserDataProvider initialData={initialUserData}>
      <SessionTimeoutProvider>
        <div className="flex h-screen w-full bg-[#1E1E1E] overflow-hidden">
          {/* Sidebar background is white, and it stays on the left */}
          <Sidebar initialUserData={initialUserData} />
          
          {/* Main Content Area overlapping the dark background */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#F4F5F7] dark:bg-black overflow-hidden relative z-10 transition-colors duration-200">
             <Header initialUserData={initialUserData} />
             <MainContent>
                {children}
             </MainContent>
             <MobileNav />
          </div>
        </div>
      </SessionTimeoutProvider>
    </UserDataProvider>
  );
}

