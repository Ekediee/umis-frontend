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
            <AILiveChat />
            <Toaster position="top-center" richColors />
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
