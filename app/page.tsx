import Image from "next/image";
import { User, Lock, Eye, Globe, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full bg-white font-sans relative">

      {/* Right Panel (Graphic + Text) - Order 1 on Mobile (Top), Order 2 on Desktop (Right) */}
      <div className="w-full lg:w-1/2 h-[45vh] lg:h-auto p-0 lg:p-4 lg:pl-0 relative order-1 lg:order-2 flex-shrink-0">
        <div className="w-full h-full bg-gradient-to-b from-[#EFF3FF] to-[#DFE6FF] lg:rounded-[32px] overflow-hidden relative flex flex-col shadow-sm">

          {/* Top Image Section */}
          <div className="flex-1 relative flex items-center justify-center w-full h-full">
            <div className="absolute inset-0 w-full h-full lg:p-12 lg:pb-0">
              <Image
                src="/images/Login image [UMIS [1.0].png"
                alt="Dashboard Mockups"
                fill
                className="object-cover object-top opacity-90 mix-blend-multiply"
                priority
              />
            </div>
          </div>

          {/* Bottom Dark Section (Text Div) */}
          <div className="bg-transparent absolute bottom-8 lg:bottom-0 z-10 w-full pt-[40px] pb-[30px] lg:pb-[60px] px-6 lg:px-12 flex flex-col items-center text-center ">
            <div className="absolute top-0 left-0 w-full h-[1px]"></div>

            <h2 className="text-[20px] lg:text-[24px] font-semibold text-white mb-2 lg:mb-4 tracking-tight">
              Stay in Control of Your Time Off
            </h2>
            <p className="text-[13px] lg:text-[15px] text-white/90 max-w-[480px] leading-[1.6]">
              Track your time off balance and manage requests with the Time Off widget, ensuring a stress-free experience.
            </p>
          </div>

        </div>
      </div>

      {/* Left Panel (Login Form) - Order 2 on Mobile (Bottom), Order 1 on Desktop (Left) */}
      <div className="w-full lg:w-1/2 flex flex-col p-6 sm:p-8 lg:p-12 relative z-20 bg-white rounded-t-[32px] lg:rounded-none -mt-8 lg:mt-0 flex-1 order-2 lg:order-1">

        {/* Main Content Centered */}
        <div className="w-full max-w-[400px] mx-auto my-auto flex flex-col pb-8 lg:pb-0">
          {/* Logo */}
          <div className="w-[64px] h-[64px] lg:w-[72px] lg:h-[72px] rounded-full bg-[#F8F9FB] border border-gray-100 shadow-sm flex items-center justify-center mx-auto mb-6 lg:mb-8">
            <Image
              src="/images/bu_logo.png"
              alt="UMIS Logo"
              width={32}
              height={32}
              className="object-contain lg:w-[40px] lg:h-[40px]"
            />
          </div>

          <h1 className="text-[22px] lg:text-[26px] font-bold text-center text-gray-900 mb-2 tracking-tight">
            Student Login
          </h1>
          <p className="text-[14px] lg:text-[15px] text-gray-500 text-center mb-8 lg:mb-10">
            Enter your details to login.
          </p>

          <form className="flex flex-col gap-4 lg:gap-5">
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
                  type="password"
                  placeholder="••••••••••"
                  className="block w-full pl-[42px] pr-[42px] py-3 lg:py-3.5 text-[14px] lg:text-[15px] border border-gray-200 rounded-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] transition-all bg-white"
                />
                <button type="button" className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600">
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

              <Link href="#" className="text-[13px] lg:text-[14px] font-medium text-gray-600 hover:text-[#1D4ED8] underline underline-offset-2 transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Link href="/dashboard">
              <Button className="w-full bg-[#1849D6] hover:bg-[#133BB0] text-white py-3 lg:py-[14px] rounded-[14px] text-[15px] font-medium shadow-[0_4px_14px_rgba(24,73,214,0.25)] transition-all flex items-center justify-center h-auto">
                Login
              </Button>
            </Link>
          </form>
        </div>

        {/* Footer */}
        <div className="w-full flex items-center justify-between text-[12px] lg:text-[13px] text-gray-500 font-medium mt-auto pt-8">
          <span>© 2026 ESMIS</span>
          <button className="flex items-center gap-1.5 hover:text-gray-800 transition-colors">
            <Globe className="w-[14px] h-[14px]" />
            ENG
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
}
