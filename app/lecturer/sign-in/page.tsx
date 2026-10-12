import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInFlow } from "@/components/lecturer/auth/sign-in-flow";

export const metadata: Metadata = { title: "Sign in" };

export default function LecturerSignInPage() {
  return (
    <Suspense>
      <SignInFlow />
    </Suspense>
  );
}
