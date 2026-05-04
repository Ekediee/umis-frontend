import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Babcock University | UMIS Student Portal",
  description: "University Management Information System",
  icons: {
    icon: '/images/bu_logo.png'
  }
};

import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#F8F9FB] rounded-[32px] text-gray-900 antialiased overflow-y-auto`}>
          {children}
          <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
