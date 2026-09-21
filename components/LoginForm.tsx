"use client";

import { useState, useTransition, useEffect, Suspense } from "react";
import { User, Lock, Eye, Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { loginAction } from "@/app/actions/auth";
import { clearAuthExpiredFlag } from "@/lib/auth-cleanup";
import { toast } from "sonner";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { SSO_ERROR_MESSAGES, isSsoErrorCode, type SsoErrorCode } from "@/lib/auth/sso-errors";

interface LoginFormProps {
  /** Show "Sign in with your Babcock email". Decided on the server from env config. */
  ssoEnabled?: boolean;
}

function LoginFormInner({ ssoEnabled = false }: LoginFormProps) {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [isSsoRedirecting, setIsSsoRedirecting] = useState(false);
  const [ssoError, setSsoError] = useState<SsoErrorCode | null>(null);

  const reason = searchParams.get("reason");
  const isSessionExpired = reason === "idle_timeout" || reason === "session_expired";
  const ssoErrorParam = searchParams.get("sso_error");
  const ssoErrorMessage = ssoError ? SSO_ERROR_MESSAGES[ssoError] : null;

  // Google SSO failures come back as /?sso_error=<code>. Copy a known code into
  // state (adjusting state during render, as React recommends for values derived
  // from props) so the banner survives the URL cleanup below.
  const [seenSsoErrorParam, setSeenSsoErrorParam] = useState<string | null>(null);
  if (ssoErrorParam && ssoErrorParam !== seenSsoErrorParam) {
    setSeenSsoErrorParam(ssoErrorParam);
    if (isSsoErrorCode(ssoErrorParam)) setSsoError(ssoErrorParam);
  }

  useEffect(() => {
    // Clear residual expiration flags on login page
    clearAuthExpiredFlag();
  }, []);

  useEffect(() => {
    // Drop the param so a refresh or shared link doesn't replay the error.
    if (!ssoErrorParam) return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("sso_error");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    } catch {
      // Non-critical: the banner still shows.
    }
  }, [ssoErrorParam]);

  useEffect(() => {
    // Pressing Back from Google can restore this page from the bfcache with the
    // "Redirecting..." state still set; reset it so the form is usable again.
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setIsSsoRedirecting(false);
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSsoRedirecting) return;
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await loginAction(formData);

      // If we get a result back at all it means the server action did NOT
      // redirect (i.e. an error occurred). A successful login triggers a
      // server-side redirect() inside loginAction, so result will be undefined.
      if (result?.error) {
        toast.error(result.error);
      }
    });
  };

  return (
    // method="post" prevents native GET fallback (which exposes credentials in
    // the URL) during the React hydration window before onSubmit is attached.
    <form onSubmit={handleSubmit} method="post" className="flex flex-col gap-4 lg:gap-5">
      {/* Session Expired Banner */}
      {isSessionExpired && (
        <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-900 text-[13px] leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block text-amber-950">Session Expired</span>
            You were automatically signed out after 30 minutes of inactivity. Please log in again to continue.
          </div>
        </div>
      )}
      {/* Google SSO failure banner */}
      {ssoErrorMessage && (
        <div
          role="alert"
          className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200/80 rounded-xl text-red-900 text-[13px] leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block text-red-950">Google sign-in failed</span>
            {ssoErrorMessage}
          </div>
        </div>
      )}
      {/* Username / Matric Number */}
      <div>
        <label className="block text-[13px] lg:text-[14px] font-medium text-gray-900 mb-2">
          Matric Number <span className="text-blue-600">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <User className="h-[18px] w-[18px] text-gray-400" />
          </div>
          <input
            type="text"
            name="user_name"
            required
            placeholder="e.g. 18/0654"
            className="block w-full pl-[42px] pr-4 py-3 lg:py-3.5 text-[14px] lg:text-[15px] border border-gray-200 rounded-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] transition-all bg-white"
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="block text-[13px] lg:text-[14px] font-medium text-gray-900 mb-2">
          Password <span className="text-blue-600">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className="h-[18px] w-[18px] text-gray-400" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            required
            placeholder="••••••••••"
            className="block w-full pl-[42px] pr-[42px] py-3 lg:py-3.5 text-[14px] lg:text-[15px] border border-gray-200 rounded-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] transition-all bg-white"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
          >
            <Eye className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      {/* Options */}
      <div className="flex items-center justify-between mt-1 mb-1 lg:mt-2 lg:mb-2">
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              className="peer appearance-none w-[18px] h-[18px] border border-gray-200 rounded-[4px] checked:bg-[#1D4ED8] checked:border-[#1D4ED8] transition-all cursor-pointer"
            />
            <svg className="absolute w-[10px] h-[10px] text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-[13px] lg:text-[14px] text-gray-700 font-medium group-hover:text-gray-900 transition-colors">Keep me logged in</span>
        </label>

        <Link href="/forgot-password" className="text-[13px] lg:text-[14px] font-medium text-gray-600 hover:text-[#1D4ED8] underline underline-offset-2 transition-colors">
          Forgot password?
        </Link>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isPending || isSsoRedirecting}
        className="w-full bg-[#1849D6] hover:bg-[#133BB0] text-white py-3 lg:py-[14px] rounded-[14px] text-[15px] font-medium transition-all flex items-center justify-center h-auto disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Logging in...
          </>
        ) : (
          "Login"
        )}
      </Button>

      {/* Google SSO (Babcock accounts only — enforced server-side) */}
      {ssoEnabled && (
        <>
          <div className="flex items-center gap-3" role="separator">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-[12px] lg:text-[13px] text-gray-400 font-medium uppercase tracking-wide">or</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <GoogleSignInButton
            pending={isSsoRedirecting}
            onStart={() => {
              setSsoError(null);
              setIsSsoRedirecting(true);
            }}
          />
        </>
      )}
    </form>
  );
}

export function LoginForm({ ssoEnabled = false }: LoginFormProps) {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse bg-gray-50 rounded-2xl" />}>
      <LoginFormInner ssoEnabled={ssoEnabled} />
    </Suspense>
  );
}
