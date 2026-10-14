import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Today · Pulse Lecturer", template: "%s · Pulse Lecturer" },
  description: "BU Pulse for lecturers: teach, assess, approve, supervise.",
};

export default function LecturerRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
