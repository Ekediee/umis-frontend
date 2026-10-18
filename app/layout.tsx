import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Babcock University | Pulse Student Portal",
  description: "Babcock University Student Information System",
  manifest: "/manifest.json",
  applicationName: "Pulse",
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pulse",
  },
  // The app has its own light and dark themes: tells forced-dark browsers not to repaint it
  other: { "color-scheme": "light dark" },
  formatDetection: {
    telephone: false,
  },
};

// viewport-fit=cover lets the installed app use the full iPhone screen; pb-safe keeps
// bars and sheets clear of the home indicator. Theme colour follows light/dark.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
};

import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { NotificationProvider } from "@/components/providers/notification-provider";
import { AILiveChat } from "@/components/shared/ai-live-chat";
import { StudentOnly } from "@/components/shared/student-only";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.className} bg-[#F8F9FB] dark:bg-gray-900 text-gray-900 dark:text-gray-100 antialiased transition-colors duration-200`}>
        <ThemeProvider defaultTheme="system" storageKey="pulse-theme">
          <NotificationProvider>
            {children}
            <StudentOnly>
              <AILiveChat />
            </StudentOnly>
            <Toaster
              position="top-center"
              richColors
              toastOptions={{
                // Toast buttons use the app's button styles (components/student/ui.tsx), compact for a toast;
                // "!" beats sonner's own [data-button] rules
                classNames: {
                  actionButton:
                    "!h-8 !px-3.5 !rounded-[8px] !text-[12px] !font-semibold !bg-[#003cbb] hover:!bg-[#002e8f] dark:!bg-[#2563eb] dark:hover:!bg-[#1d4ed8] !text-white transition-colors active:scale-[0.98]",
                  cancelButton:
                    "!h-8 !px-3.5 !rounded-[8px] !text-[12px] !font-semibold !bg-white dark:!bg-gray-900 !border !border-gray-200 dark:!border-gray-700 !text-gray-800 dark:!text-gray-200 hover:!bg-gray-50 dark:hover:!bg-gray-800 transition-colors",
                },
              }}
            />
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
