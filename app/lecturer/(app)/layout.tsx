import { LecturerProvider } from "@/components/lecturer/shell/lecturer-provider";
import { AppShell } from "@/components/lecturer/shell/app-shell";

export default function LecturerAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <LecturerProvider>
      <AppShell>{children}</AppShell>
    </LecturerProvider>
  );
}
