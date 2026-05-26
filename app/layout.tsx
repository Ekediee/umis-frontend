import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Babcock University | Pulse Student Portal",
  description: "Babcock University Student Information System",
  manifest: "/manifest.json",
  icons: {
    icon: '/images/bu_logo.png',
    apple: '/images/bu_logo.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pulse Portal",
  },
  formatDetection: {
    telephone: false,
  },
};

import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { NotificationProvider } from "@/components/providers/notification-provider";
import { AILiveChat } from "@/components/shared/ai-live-chat";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.className} bg-[#F8F9FB] dark:bg-gray-900 rounded-[32px] text-gray-900 dark:text-gray-100 antialiased overflow-y-auto transition-colors duration-200`}>
        <ThemeProvider defaultTheme="system" storageKey="pulse-theme">
          <NotificationProvider>
            {children}
            <AILiveChat />
            <Toaster position="top-center" richColors />
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
