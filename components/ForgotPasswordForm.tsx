"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { User, Lock, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle2, Mail, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requestPasswordResetAction, verifyOtpResetPasswordAction } from "@/app/actions/auth";
import { toast } from "sonner";

// ─── 6-Box OTP Input ────────────────────────────────────────────────────────

const OTP_LENGTH = 6;

interface OtpInputProps {
  value: string[];
  onChange: (value: string[]) => void;
}

function OtpInput({ value, onChange }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...value];
    next[index] = digit;
    onChange(next);
    if (digit && index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (value[index]) {
        const next = [...value];
        next[index] = "";
        onChange(next);
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted.length) return;
    const next = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    onChange(next);
    refs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  return (
    <div className="flex gap-2 justify-between" onPaste={handlePaste}>
      {Array.from({ length: OTP_LENGTH }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          className="w-full aspect-square text-center text-[18px] font-semibold border border-gray-200 rounded-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] transition-all bg-white caret-transparent"
        />
      ))}
    </div>
  );
}

// ─── Resend Cooldown Hook ───────────────────────────────────────────────────

const RESEND_COOLDOWN = 60;

function useResendCooldown() {
  const [seconds, setSeconds] = useState(0);

  const start = useCallback(() => {
    setSeconds(RESEND_COOLDOWN);
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  return { seconds, canResend: seconds === 0, start };
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ForgotPasswordForm() {
  const [step, setStep] = useState<"request" | "otp" | "success">("request");
  const [matricNo, setMatricNo] = useState("");
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { seconds, canResend, start: startCooldown } = useResendCooldown();

  // ── Step 1: Send OTP ──
  const handleRequestSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const user_name = formData.get("user_name") as string;
    const emailValue = (formData.get("email") as string)?.trim().toLowerCase();
    setMatricNo(user_name);
    setEmail(emailValue);

    startTransition(async () => {
      const res = await requestPasswordResetAction(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message || "OTP sent to your registered email.");
        setOtpDigits(Array(OTP_LENGTH).fill(""));
        startCooldown();
        setStep("otp");
      }
    });
  };

  // ── Resend OTP ──
  const handleResend = () => {
    if (!canResend || isPending) return;
    const formData = new FormData();
    formData.set("user_name", matricNo);
    formData.set("email", email);

    startTransition(async () => {
      const res = await requestPasswordResetAction(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("A new OTP has been sent to your registered email.");
        setOtpDigits(Array(OTP_LENGTH).fill(""));
        startCooldown();
      }
    });
  };

  // ── Step 2: Verify OTP + Reset Password ──
  const handleOtpSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const otp = otpDigits.join("");
    if (otp.length < OTP_LENGTH) {
      toast.error("Please fill in all 6 digits of the OTP.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    formData.set("otp", otp);
    formData.set("user_name", matricNo);

    startTransition(async () => {
      const res = await verifyOtpResetPasswordAction(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message || "Password reset successful!");
        setStep("success");
      }
    });
  };

  // ── Step 3: Success ──
  if (step === "success") {
    return (
      <div className="flex flex-col items-center text-center py-4">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
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

  // ── Step 2: OTP + New Password ──
  if (step === "otp") {
    return (
      <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4 lg:gap-5">
        {/* Info banner */}
        <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-900 leading-relaxed">
          A one-time passcode has been sent to the email registered for{" "}
          <strong>{matricNo}</strong>. Enter the 6-digit code below along with your new password.
        </div>

        {/* 6-box OTP */}
        <div>
          <label className="block text-[13px] lg:text-[14px] font-medium text-gray-900 mb-3">
            One-Time Passcode <span className="text-blue-600">*</span>
          </label>
          <OtpInput value={otpDigits} onChange={setOtpDigits} />
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
              type={showNewPass ? "text" : "password"}
              name="new_password"
              required
              placeholder="••••••••••"
              className="block w-full pl-[42px] pr-[42px] py-3 lg:py-3.5 text-[14px] lg:text-[15px] border border-gray-200 rounded-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] transition-all bg-white"
            />
            <button
              type="button"
              onClick={() => setShowNewPass(!showNewPass)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showNewPass ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
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
              type={showConfirmPass ? "text" : "password"}
              name="new_password_confirmation"
              required
              placeholder="••••••••••"
              className="block w-full pl-[42px] pr-[42px] py-3 lg:py-3.5 text-[14px] lg:text-[15px] border border-gray-200 rounded-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] transition-all bg-white"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPass(!showConfirmPass)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showConfirmPass ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
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
              Verifying...
            </>
          ) : (
            "Reset Password"
          )}
        </Button>

        {/* Resend OTP + Back */}
        <div className="flex items-center justify-between mt-1">
          <button
            type="button"
            onClick={() => setStep("request")}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend || isPending}
            className="flex items-center gap-1.5 text-xs font-medium text-[#1849D6] hover:text-[#133BB0] disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending && canResend ? "animate-spin" : ""}`} />
            {canResend ? "Resend OTP" : `Resend in ${seconds}s`}
          </button>
        </div>
      </form>
    );
  }

  // ── Step 1: Enter Matric + Email ──
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
        <p className="mt-1.5 text-[11px] text-gray-400 pl-1">
          Must end in <span className="font-semibold text-gray-500">@student.babcock.edu.ng</span> or{" "}
          <span className="font-semibold text-gray-500">@pg.babcock.edu.ng</span>
        </p>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-[#1849D6] hover:bg-[#133BB0] text-white py-3 lg:py-[14px] rounded-[14px] text-[15px] font-medium transition-all flex items-center justify-center h-auto disabled:opacity-70 mt-2"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending OTP...
          </>
        ) : (
          "Send OTP"
        )}
      </Button>

      <div className="flex items-center justify-center mt-2">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-[13px] lg:text-[14px] font-medium text-gray-600 hover:text-[#1849D6] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Remember password? Back to Login
        </Link>
      </div>
    </form>
  );
}
