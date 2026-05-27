import Image from "next/image";
import CopyRight from "@/components/CopyRight";
import { LoginForm } from "@/components/LoginForm";

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
                unoptimized
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
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
              alt="Pulse Logo"
              width={32}
              height={32}
              unoptimized
              className="object-contain lg:w-[40px] lg:h-[40px]"
            />
          </div>

          <h1 className="text-[22px] lg:text-[26px] font-bold text-center text-gray-900 mb-2 tracking-tight">
            Student Login
          </h1>
          <p className="text-[14px] lg:text-[15px] text-gray-500 text-center mb-8 lg:mb-10">
            Enter your details to login.
          </p>

          <LoginForm />
        </div>

        {/* Footer */}
        <div className="w-full flex items-center justify-center text-[12px] lg:text-[13px] text-gray-500 font-medium mt-auto pt-8">
          <span><CopyRight /></span>
          {/* <button className="flex items-center gap-1.5 hover:text-gray-800 transition-colors">
            <Globe className="w-[14px] h-[14px]" />
            ENG
            <ChevronDown className="w-3.5 h-3.5" />
          </button> */}
        </div>
      </div>

    </div>
  );
}
