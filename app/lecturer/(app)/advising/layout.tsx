import type { Metadata } from "next";

export const metadata: Metadata = { title: "Course advising" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
