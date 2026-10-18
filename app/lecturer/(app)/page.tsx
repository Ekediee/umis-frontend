import { Suspense } from "react";
import { TodayView } from "@/components/lecturer/today/today-view";

export default function TodayPage() {
  return (
    <Suspense>
      <TodayView />
    </Suspense>
  );
}
