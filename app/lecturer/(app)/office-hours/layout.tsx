import type { Metadata } from "next";

export const metadata: Metadata = { title: "Office hours" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
