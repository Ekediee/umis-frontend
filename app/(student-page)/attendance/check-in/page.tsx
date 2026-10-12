"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckInFlow } from "@/components/attendance/check-in";
import { BackLink, PageContainer } from "@/components/student/ui";

/**
 * Landing page for check-in QR codes opened with the phone's own camera app:
 * /attendance/check-in?t=<token>. Signs in first if needed (middleware keeps
 * the link), then checks in straight away.
 */
function CheckInPage() {
  const token = useSearchParams().get("t");
  return (
    <PageContainer className="max-w-[520px]">
      <div className="mb-4">
        <BackLink href="/attendance">Attendance</BackLink>
      </div>
      <div className="rounded-[24px] bg-[#0a0d14] text-white p-5 md:p-7 shadow-xl">
        <h2 className="text-[18px] font-bold mb-5">Check in to class</h2>
        <CheckInFlow initialToken={token} />
      </div>
    </PageContainer>
  );
}

export default function Page() {
  return (
    <Suspense>
      <CheckInPage />
    </Suspense>
  );
}
