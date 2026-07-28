"use client";

import { useState, useTransition } from "react";
import { User, Lock, KeyRound, ArrowLeft, Loader2, CheckCircle2, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requestPasswordResetAction, resetPasswordAction } from "@/app/actions/auth";
import { toast } from "sonner";

export function ForgotPasswordForm() {
  const [step, setStep] = useState<"request" | "reset" | "success">("request");
  const [matricNo, setMatricNo] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleRequestSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const user_name = formData.get("user_name") as string;
    setMatricNo(user_name);

    startTransition(async () => {
      const res = await requestPasswordResetAction(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message || "Reset code sent.");
        setStep("reset");
      }
    });
  };

  const handleResetSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const res = await resetPasswordAction(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message || "Password reset successful!");
        setStep("success");
      }
    });
  };

  if (step === "success") {
    return (
      <div className="flex flex-col items-center text-center py-4">
        <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Password Reset Completed</h3>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          Your password has been updated successfully. You can now log in to your account with your new password.
        </p>
        <Link
          href="/"
          className="w-full bg-[#1849D6] hover:bg-[#133BB0] text-white py-3 rounded-[14px] text-[15px] font-medium text-center block"
        >
          Return to Login
        </Link>
      </div>
    );
  }

  if (step === "reset") {
    return (
      <form onSubmit={handleResetSubmit} className="flex flex-col gap-4 lg:gap-5">
        <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-900 leading-relaxed mb-1">
          Verification instructions sent for <strong>{matricNo}</strong>. Please enter the reset code sent to your registered email along with your new password.
        </div>

        {/* Verification Code */}
        <div>
          <label className="block text-[13px] lg:text-[14px] font-medium text-gray-900 mb-2">
            Reset Code / OTP <span className="text-blue-600">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <KeyRound className="h-[18px] w-[18px] text-gray-400" />
            </div>
            <input
              type="text"
              name="code"
              required
              placeholder="e.g. 123456"
              className="block w-full pl-[42px] pr-4 py-3 lg:py-3.5 text-[14px] lg:text-[15px] border border-gray-200 rounded-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] transition-all bg-white"
            />
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-[13px] lg:text-[14px] font-medium text-gray-900 mb-2">
            New Password <span className="text-blue-600">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-[18px] w-[18px] text-gray-400" />
            </div>
            <input
              type="password"
              name="new_password"
              required
              placeholder="••••••••••"
              className="block w-full pl-[42px] pr-4 py-3 lg:py-3.5 text-[14px] lg:text-[15px] border border-gray-200 rounded-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] transition-all bg-white"
            />
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-[13px] lg:text-[14px] font-medium text-gray-900 mb-2">
            Confirm New Password <span className="text-blue-600">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-[18px] w-[18px] text-gray-400" />
            </div>
            <input
              type="password"
              name="new_password_confirmation"
              required
              placeholder="••••••••••"
              className="block w-full pl-[42px] pr-4 py-3 lg:py-3.5 text-[14px] lg:text-[15px] border border-gray-200 rounded-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] transition-all bg-white"
            />
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-[#1849D6] hover:bg-[#133BB0] text-white py-3 lg:py-[14px] rounded-[14px] text-[15px] font-medium transition-all flex items-center justify-center h-auto disabled:opacity-70"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating Password...
            </>
          ) : (
            "Set New Password"
          )}
        </Button>

        <button
          type="button"
          onClick={() => setStep("request")}
          className="flex items-center justify-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 mt-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to enter matric number
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleRequestSubmit} className="flex flex-col gap-4 lg:gap-5">
      {/* Matric Number */}
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

      {/* Babcock Student Email */}
      <div>
        <label className="block text-[13px] lg:text-[14px] font-medium text-gray-900 mb-2">
          Babcock Student Email <span className="text-blue-600">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Mail className="h-[18px] w-[18px] text-gray-400" />
          </div>
          <input
            type="email"
            name="email"
            required
            placeholder="e.g. john.doe@student.babcock.edu.ng"
            pattern="^[a-zA-Z0-9._%+\-]+@(student|pg)\.babcock\.edu\.ng$"
            title="Please enter a valid Babcock email ending in @student.babcock.edu.ng or @pg.babcock.edu.ng"
            className="block w-full pl-[42px] pr-4 py-3 lg:py-3.5 text-[14px] lg:text-[15px] border border-gray-200 rounded-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] transition-all bg-white"
          />
        </div>
        <p className="mt-1.5 text-[11px] text-gray-400 pl-1">Must end in <span className="font-semibold text-gray-500">@student.babcock.edu.ng</span> or <span className="font-semibold text-gray-500">@pg.babcock.edu.ng</span></p>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-[#1849D6] hover:bg-[#133BB0] text-white py-3 lg:py-[14px] rounded-[14px] text-[15px] font-medium transition-all flex items-center justify-center h-auto disabled:opacity-70 mt-2"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending Instructions...
          </>
        ) : (
          "Send Reset Instructions"
        )}
      </Button>

      <div className="flex items-center justify-center mt-2">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-[13px] lg:text-[14px] font-medium text-gray-600 hover:text-[#1D4ED8] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Remember password? Back to Login
        </Link>
      </div>
    </form>
  );
}
