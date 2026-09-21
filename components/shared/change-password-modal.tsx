"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, KeyRound, Eye, EyeOff, Loader2, RefreshCw, CheckCircle2, ShieldCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  sendOtpAction,
  verifyOtpAction,
  changePasswordWithTokenAction,
} from "@/app/actions/auth";
import { getUserFriendlyErrorMessage } from "@/lib/utils";
import { toast } from "sonner";

// ─── Constants ───────────────────────────────────────────────────────────────

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;
const OTP_EXPIRATION_SECONDS = 8 * 60; // 8 minutes


// ─── OTP Input ───────────────────────────────────────────────────────────────

interface OtpInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

function OtpInput({ value, onChange, disabled }: OtpInputProps) {
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
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          className="w-full aspect-square text-center text-[18px] font-semibold border border-gray-200 dark:border-gray-700 rounded-[14px] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] transition-all bg-white dark:bg-gray-800 caret-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
      ))}
    </div>
  );
}

// ─── Resend Cooldown Hook ────────────────────────────────────────────────────

function useResendCooldown() {
  const [seconds, setSeconds] = useState(0);

  const start = useCallback(() => setSeconds(RESEND_COOLDOWN), []);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  return { seconds, canResend: seconds === 0, start };
}

// ─── OTP Expiration Hook (8 Minutes) ─────────────────────────────────────────

function useOtpExpirationTimer() {
  const [remainingSeconds, setRemainingSeconds] = useState(OTP_EXPIRATION_SECONDS);

  const reset = useCallback(() => {
    setRemainingSeconds(OTP_EXPIRATION_SECONDS);
  }, []);

  useEffect(() => {
    if (remainingSeconds <= 0) return;
    const id = setTimeout(() => setRemainingSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [remainingSeconds]);

  const isExpired = remainingSeconds <= 0;
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return { remainingSeconds, formattedTime, isExpired, reset };
}


// ─── Types ───────────────────────────────────────────────────────────────────

type Step = "sending" | "otp" | "password" | "submitting_otp" | "submitting_password";

export interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  matricNo: string;
  email: string;
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export function ChangePasswordModal({ isOpen, onClose, matricNo, email }: ChangePasswordModalProps) {
  const [step, setStep] = useState<Step>("sending");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { seconds, canResend, start: startCooldown } = useResendCooldown();
  const { formattedTime, isExpired, reset: resetExpiration } = useOtpExpirationTimer();

  // Mask the email for display: e.g. og*****@student.babcock.edu.ng
  const maskedEmail = email
    ? (() => {
        const [local, domain] = email.split("@");
        if (!local || !domain) return email;
        const visible = local.slice(0, 2);
        return `${visible}${"*".repeat(Math.max(3, local.length - 2))}@${domain}`;
      })()
    : "";

  // Auto-send OTP when modal opens
  const sendOtp = useCallback(async () => {
    setStep("sending");
    setError(null);
    try {
      const res = await sendOtpAction({ user_name: matricNo, email });
      if (res?.error) {
        setError(getUserFriendlyErrorMessage(res.error, "Failed to send OTP. Please try again."));
      } else {
        startCooldown();
        resetExpiration();
      }
      setStep("otp");
    } catch (err) {
      setError("Could not connect to the server. Please check your connection.");
      setStep("otp");
    }
  }, [matricNo, email, startCooldown, resetExpiration]);


  useEffect(() => {
    if (isOpen) {
      // Reset state on each open
      setOtp(Array(OTP_LENGTH).fill(""));
      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");
      setError(null);
      setShowNew(false);
      setShowConfirm(false);
      resetExpiration();
      sendOtp();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Prevent background scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleVerifyOtp = async () => {
    if (isExpired) {
      setError("This OTP has expired (valid for 8 minutes). Please request a new one.");
      return;
    }
    const otpValue = otp.join("");
    if (otpValue.length < OTP_LENGTH) {
      setError("Please enter all 6 digits of the OTP.");
      return;
    }
    setError(null);
    setStep("submitting_otp");


    try {
      const res = await verifyOtpAction({ otp: otpValue, email });

      if (res?.error) {
        setError(getUserFriendlyErrorMessage(res.error, "OTP verification failed. Please try again."));
        setStep("otp");
        return;
      }

      const token = res.reset_token;
      if (!token) {
        setError("Verification succeeded but no reset token was received. Please try again.");
        setStep("otp");
        return;
      }

      setResetToken(token);
      setStep("password");
    } catch (err) {
      setError("Could not connect to the server. Please try again.");
      setStep("otp");
    }
  };



  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError(null);
    setStep("submitting_password");

    const result = await changePasswordWithTokenAction({
      username: matricNo,
      reset_token: resetToken,
      new_password: newPassword,
      new_password_confirmation: confirmPassword,
    });

    if (result?.error) {
      setError(getUserFriendlyErrorMessage(result.error, "Failed to change password. Please try again."));
      setStep("password");
      return;
    }

    toast.success(result?.message || "Password changed successfully!");
    onClose();
  };

  if (!isOpen) return null;

  const isBusy = step === "sending" || step === "submitting_otp" || step === "submitting_password";

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[3px] animate-in fade-in duration-200"
        onClick={!isBusy ? onClose : undefined}
      />

      {/* Modal Card */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-[400px] animate-in zoom-in-95 fade-in duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#eef3fd] dark:bg-[#003cbb]/20 flex items-center justify-center">
              <KeyRound className="w-[18px] h-[18px] text-[#003cbb] dark:text-[#4d82ff]" />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-gray-900 dark:text-gray-100">Change Password</h2>
              <p className="text-[12px] text-gray-500 dark:text-gray-400">
                {step === "password" || step === "submitting_password"
                  ? "Set your new password"
                  : "Verify your identity"}
              </p>
            </div>
          </div>
          {!isBusy && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5">

          {/* Step: Sending OTP */}
          {step === "sending" && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-14 h-14 rounded-full bg-[#eef3fd] dark:bg-[#003cbb]/10 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-[#003cbb] dark:text-[#4d82ff] animate-spin" />
              </div>
              <div>
                <p className="text-[15px] font-medium text-gray-900 dark:text-gray-100">Sending OTP…</p>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
                  We&apos;re sending a one-time code to your registered email.
                </p>
              </div>
            </div>
          )}

          {/* Step: OTP Entry */}
          {(step === "otp" || step === "submitting_otp") && (
            <div className="flex flex-col gap-5">
              <div className="text-center">
                <p className="text-[14px] text-gray-600 dark:text-gray-400 leading-relaxed">
                  A 6-digit code was sent to{" "}
                  <span className="font-medium text-gray-900 dark:text-gray-100">{maskedEmail}</span>.
                  Enter it below to continue.
                </p>
                <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
                  <Clock className="w-3.5 h-3.5" />
                  {isExpired ? (
                    <span className="text-red-600 dark:text-red-400 font-semibold">OTP expired</span>
                  ) : (
                    <span>
                      Expires in <span className="font-semibold tabular-nums">{formattedTime}</span>
                    </span>
                  )}
                </div>
              </div>

              <OtpInput
                value={otp}
                onChange={setOtp}
                disabled={step === "submitting_otp" || isExpired}
              />

              {isExpired ? (
                <p className="text-[13px] text-red-500 dark:text-red-400 text-center -mt-1">
                  Your OTP has expired (valid for 8 minutes). Please request a new code.
                </p>
              ) : error ? (
                <p className="text-[13px] text-red-500 dark:text-red-400 text-center -mt-1">{error}</p>
              ) : null}

              <Button
                onClick={isExpired ? sendOtp : handleVerifyOtp}
                disabled={step === "submitting_otp"}
                className="w-full bg-[#1849D6] hover:bg-[#133BB0] text-white py-3 rounded-[14px] text-[15px] font-medium transition-all flex items-center justify-center h-auto disabled:opacity-70"
              >
                {step === "submitting_otp" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying…
                  </>
                ) : isExpired ? (
                  "Resend New OTP"
                ) : (
                  "Verify OTP"
                )}
              </Button>

              <div className="flex items-center justify-center">
                {canResend || isExpired ? (
                  <button
                    type="button"
                    onClick={sendOtp}
                    className="flex items-center gap-1.5 text-[13px] font-medium text-[#1849D6] dark:text-[#4d82ff] hover:underline"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Resend OTP
                  </button>
                ) : (
                  <span className="text-[13px] text-gray-400 dark:text-gray-500">
                    Resend in{" "}
                    <span className="font-medium text-gray-600 dark:text-gray-300 tabular-nums">
                      {seconds}s
                    </span>
                  </span>
                )}
              </div>
            </div>
          )}


          {/* Step: New Password */}
          {(step === "password" || step === "submitting_password") && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                <p className="text-[13px] text-green-700 dark:text-green-400 font-medium">
                  Identity verified successfully
                </p>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  New Password <span className="text-blue-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={step === "submitting_password"}
                    placeholder="Min. 8 characters"
                    className="block w-full pl-4 pr-[42px] py-3 text-[14px] border border-gray-200 dark:border-gray-700 rounded-[14px] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] transition-all bg-white dark:bg-gray-800 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Confirm New Password <span className="text-blue-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={step === "submitting_password"}
                    placeholder="Re-enter your password"
                    className="block w-full pl-4 pr-[42px] py-3 text-[14px] border border-gray-200 dark:border-gray-700 rounded-[14px] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] transition-all bg-white dark:bg-gray-800 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-[13px] text-red-500 dark:text-red-400 -mt-1">{error}</p>
              )}

              <Button
                onClick={handleChangePassword}
                disabled={step === "submitting_password"}
                className="w-full bg-[#1849D6] hover:bg-[#133BB0] text-white py-3 rounded-[14px] text-[15px] font-medium transition-all flex items-center justify-center h-auto disabled:opacity-70 mt-1"
              >
                {step === "submitting_password" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing Password…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Change Password
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
