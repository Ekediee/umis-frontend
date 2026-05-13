"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, X, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

function formatPrice(price: number): string {
  return `₦${price.toLocaleString()}.00`;
}

function PaymentResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const status = searchParams.get("status") || "success";
  const ref = searchParams.get("ref") || "PAY-728910-ARTH";
  const amount = parseFloat(searchParams.get("amount") || "647000");
  const gateway = searchParams.get("gateway") || "Payzeep";
  const isSuccess = status === "success";
  
  const getGatewayLogo = () => {
    const g = gateway.toLowerCase();
    if (g.includes("payzeep")) return "/payzeep_icon.png.svg";
    if (g.includes("flutterwave")) return "/flutterwave_symbol.svg.svg";
    return null;
  };
  
  const [showConfetti, setShowConfetti] = useState(isSuccess);

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 4000); // Plays for ~4 seconds (approx 2 loops)
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  const handleContinueToDashboard = () => {
    router.push("/dashboard");
  };

  const handleDownloadReceipt = () => {
    router.push(`/dashboard/finance/receipt?status=success&ref=${ref}&amount=${amount}&gateway=${gateway}`);
  };

  const handleViewRegistrationStatus = () => {
    router.push("/dashboard/finance");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8 relative overflow-hidden">
      {/* Confetti GIF — positioned on top of the card */}
      {showConfetti && (
        <>
          {/* Single large confetti burst */}
          <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center overflow-hidden">
            <div className="relative w-full h-full max-w-[800px] max-h-[800px] opacity-100 scale-125 md:scale-150">
              <Image
                src="/Confetti.gif"
                alt=""
                fill
                className="object-contain"
                unoptimized
                priority
              />
            </div>
          </div>
        </>
      )}

      {/* Result Card */}
      <div className="relative z-10 w-full max-w-[560px] bg-white rounded-[20px] border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6 md:p-10 flex flex-col items-center">
        {/* Status Icon */}
        {isSuccess ? (
          <div className="w-16 h-16 rounded-full bg-[#10b981] flex items-center justify-center mb-4 shadow-[0_4px_16px_rgba(16,185,129,0.3)]">
            <Check className="w-8 h-8 text-white" strokeWidth={3} />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#ef4444] flex items-center justify-center mb-4 shadow-[0_4px_16px_rgba(239,68,68,0.3)]">
            <X className="w-8 h-8 text-white" strokeWidth={3} />
          </div>
        )}

        {/* Title */}
        <h1 className="text-[22px] md:text-[26px] font-bold text-[#0a0d14] text-center">
          {isSuccess ? "Payment Successful!" : "Payment Failed"}
        </h1>

        {/* Subtitle */}
        <p className="text-[14px] text-[#525866] text-center mt-2 max-w-[400px] leading-relaxed">
          {isSuccess
            ? "Your registration payment has been confirmed. A receipt has been sent to your registered email address."
            : "Something went wrong while processing your payment. Please try again or contact support."}
        </p>

        {/* Transaction Summary */}
        {isSuccess && (
          <div className="w-full mt-6 border border-gray-100 rounded-[16px] p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold text-[#868c98] uppercase tracking-wider">
                Transaction Summary
              </span>
              <span className="text-[12px] font-medium text-[#525866] bg-[#f6f8fa] px-2.5 py-1 rounded-[8px]">
                Ref: {ref}
              </span>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              {/* Student Name */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[12px] text-[#868c98]">Student Name</span>
                <span className="text-[14px] font-semibold text-[#0a0d14]">
                  Yakubu Onome Joy
                </span>
              </div>

              {/* Amount Paid */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[12px] text-[#868c98]">Amount Paid</span>
                <span className="text-[16px] font-bold text-[#10b981]">
                  {formatPrice(amount)}
                </span>
              </div>

              {/* Payment Method */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[12px] text-[#868c98]">Payment Method</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-gray-50 border border-gray-100 p-0.5">
                    {getGatewayLogo() ? (
                      <Image 
                        src={getGatewayLogo()!} 
                        alt={gateway} 
                        width={16} 
                        height={16} 
                        className="object-contain" 
                      />
                    ) : (
                      <div className="w-full h-full bg-[#6366f1] flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">
                          {gateway.substring(0, 2)}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-[14px] font-semibold text-[#0a0d14]">
                    {gateway}
                  </span>
                </div>
              </div>

              {/* Date & Time */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[12px] text-[#868c98]">Date & Time</span>
                <span className="text-[14px] font-semibold text-[#0a0d14]">
                  {new Date().toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  •{" "}
                  {new Date().toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row items-center gap-3 mt-6">
          <Button
            onClick={handleContinueToDashboard}
            className="w-full sm:flex-1 h-12 rounded-[12px] text-[14px] font-medium bg-[#003cbb] hover:bg-[#002e8f] text-white transition-all gap-2"
          >
            Continue to Dashboard
            <ChevronRight className="w-4 h-4" />
          </Button>

          {isSuccess && (
            <Button
              onClick={handleDownloadReceipt}
              variant="outline"
              className="w-full sm:flex-1 h-12 rounded-[12px] text-[14px] font-medium border-gray-200 text-[#0a0d14] hover:bg-gray-50 transition-all gap-2"
            >
              Download receipt
              <Download className="w-4 h-4" />
            </Button>
          )}

          {!isSuccess && (
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="w-full sm:flex-1 h-12 rounded-[12px] text-[14px] font-medium border-gray-200 text-[#0a0d14] hover:bg-gray-50 transition-all gap-2"
            >
              Try Again
            </Button>
          )}
        </div>

        {/* Footer Links */}
        {isSuccess && (
          <div className="flex flex-col items-center gap-2 mt-6">
            <button
              onClick={handleViewRegistrationStatus}
              className="text-[14px] font-medium text-[#003cbb] hover:underline flex items-center gap-1"
            >
              View Registration Status
            </button>
            <span className="text-[13px] text-[#525866]">
              Need help?{" "}
              <button className="text-[#003cbb] font-medium hover:underline">
                Contact Support
              </button>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003cbb]"></div>
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}
