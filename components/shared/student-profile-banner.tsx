"use client";

import Image from "next/image";
import { Camera, Eye, EyeOff } from "lucide-react";
import { usePersistentToggle } from "@/hooks/use-persistent-toggle";
import { UMISResponse } from "@/lib/session";
import { toTitleCase } from "@/lib/utils";

interface StudentProfileBannerProps {
  /** Show the camera edit button on the avatar (only on profile page) */
  showEditAvatar?: boolean;
  /** Optional welcome message shown above the banner (used on dashboard) */
  welcomeMessage?: string;
  /** Real user data from the session */
  userData?: UMISResponse | null;
  /** Whether to show CGPA, Level, and School details (hidden on dashboard) */
  showDetailedInfo?: boolean;
  /** Whether to show detailed row (used on dashboard) */
  showDetailedRow?: boolean;
}

export function StudentProfileBanner({ 
  showEditAvatar, 
  welcomeMessage,
  userData,
  showDetailedInfo,
  showDetailedRow 
}: StudentProfileBannerProps) {

  const [showCgpa, toggleCgpa, mountedCgpa] = usePersistentToggle("showCgpa", true);
  const mounted = mountedCgpa;

  console.log("This is the data", userData);

  // Derived display values from session data (with fallbacks)
  const rawName = userData?.entity_name ?? "—";
  const displayName = toTitleCase(rawName);
  const displayMatric = userData?.user_data?.matric_number ?? "—";
  const displayProgramme = userData?.user_data?.degree_name ?? "—";
  const displayLevel = userData?.user_data?.current_level ?? "—";
  const displaySchool = userData?.user_data?.school_name ?? "—";
  const displayDepartment = userData?.user_data?.department ?? "—";
  const displayStatus = userData?.user_data?.status ?? "Active";
  const displayCgpa = userData?.user_data?.cummulative_gpa?.toFixed(2) ?? "—";
  
  return (
    <div className="w-full">
      {welcomeMessage && (
        <h2 className="text-[18px] md:text-[20px] font-bold text-gray-900 mb-4 tracking-tight">
          {welcomeMessage}
        </h2>
      )}

      <div className="flex flex-col xl:flex-row gap-5 xl:gap-6 items-stretch">

        {/* Profile Picture Card */}
        {showDetailedInfo && (
        <div className="bg-white border border-gray-200 rounded-[24px] p-4 md:p-6 flex flex-col items-center justify-between gap-6 md:gap-8 xl:w-[332px] shrink-0">

          <div className="flex flex-col items-center gap-4 w-full pt-2">
            <div className="relative">
              <div className="w-[100px] h-[100px] md:w-[120px] md:h-[120px] rounded-full bg-gray-200 border-[5px] border-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden relative">
                <Image
                  src="/Student Image.png"
                  alt={`${displayName}`}
                  fill
                  className="object-cover"
                />
              </div>
              {showEditAvatar && (
                <button className="absolute bottom-0 right-0 md:bottom-1 md:right-1 w-[28px] h-[28px] md:w-[32px] md:h-[32px] bg-[#003cbb] border-[2.5px] border-white rounded-full flex items-center justify-center text-white hover:bg-[#003095] transition-colors shadow-sm">
                  <Camera className="w-[14px] h-[14px]" />
                </button>
              )}
            </div>

            <div className="text-center">
              <h2 className="text-[20px] md:text-[24px] font-semibold text-gray-900 leading-tight">{displayName}</h2>
              <p className="text-[14px] font-medium text-gray-500 mt-1">{displayProgramme}</p>
            </div>
          </div>

          <div className="w-full flex items-center justify-between border-t border-gray-100 pt-5">
            <div>
              <p className="text-[11px] md:text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1">Matric no</p>
              <p className="text-[14px] md:text-[16px] font-bold text-gray-900">{displayMatric}</p>
            </div>
            <div className="flex flex-col items-end">
              <p className="text-[11px] md:text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1">Status</p>
              <span className="bg-[#ECFDF3] text-[#027A48] px-2.5 md:px-3 py-1 rounded-full text-[10px] md:text-[12px] font-bold flex items-center gap-1.5 tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]"></span>
                {displayStatus.toUpperCase()}
              </span>
            </div>
          </div>

        </div>
        )}

        {/* Profile Picture Card on dashboard*/}
        {showDetailedRow && (

          <div className="bg-white border border-gray-200 rounded-[24px] p-4 md:p-6 flex flex-row items-center justify-between gap-6 md:gap-8 md:w-[49.5%] w-[100%] shrink-0">

          <div className="flex flex-row items-center gap-4 w-full pt-2">
            <div className="relative">
              <div className="w-[100px] h-[100px] md:w-[120px] md:h-[120px] rounded-full bg-gray-200 border-[5px] border-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden relative">
                <Image
                  src="/Student Image.png"
                  alt={`${displayName}`}
                  fill
                  className="object-cover"
                />
              </div>
              {showEditAvatar && (
                <button className="absolute bottom-0 right-0 md:bottom-1 md:right-1 w-[28px] h-[28px] md:w-[32px] md:h-[32px] bg-[#003cbb] border-[2.5px] border-white rounded-full flex items-center justify-center text-white hover:bg-[#003095] transition-colors shadow-sm">
                  <Camera className="w-[14px] h-[14px]" />
                </button>
              )}
            </div>

            <div className="text-left">
              <h2 className="text-[20px] md:text-[24px] font-semibold text-gray-900 leading-tight">{displayName}</h2>
              <p className="text-[14px] font-medium text-gray-500 mt-1">{displayProgramme}</p>
            </div>
          </div>

          <div className="w-full flex items-center justify-between border-t border-gray-100 pt-5">
            <div>
              <p className="text-[11px] md:text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1">Matric no</p>
              <p className="text-[14px] md:text-[16px] font-bold text-gray-900">{displayMatric}</p>
            </div>
            <div className="flex flex-col ">
              <p className="text-[11px] md:text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1">Status</p>
              <span className="bg-[#ECFDF3] text-[#027A48] px-2.5 md:px-3 py-1 rounded-full text-[10px] md:text-[12px] font-bold flex items-center gap-1.5 tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]"></span>
                {displayStatus.toUpperCase()}
              </span>
            </div>
          </div>

        </div>
        )}

        {/* Academic Information */}
        <div className="flex-1 flex flex-col gap-5 xl:gap-6">
          {showDetailedInfo && (
            <div className="flex flex-col md:flex-row w-full gap-5 h-[50%]">
              {/* CGPA & Level */}
              <div className="bg-gradient-to-b from-[#e5e0ff] to-[#f5f3ff] border border-gray-200/50 rounded-[24px] p-5 md:p-6 flex items-center justify-around gap-6 shrink-0 md:w-[50%] order-2 md:order-1">
                <div className="flex flex-col gap-1 md:gap-3">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <span className="text-[12px] md:text-[14px] font-medium">Current CGPA</span>
                    <button
                      type="button"
                      onClick={toggleCgpa}
                      className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-gray-400 active:text-gray-600 md:hover:text-gray-600 transition-colors rounded-full touch-manipulation shrink-0"
                      aria-label={showCgpa ? "Hide CGPA" : "Show CGPA"}
                    >
                      {showCgpa ? <Eye className="w-4 h-4 md:w-5 md:h-5" /> : <EyeOff className="w-4 h-4 md:w-5 md:h-5" />}
                    </button>
                  </div>
                  <div className="flex items-baseline gap-1 text-[#00a63e]">
                    {mounted && !showCgpa ? (
                      <span className="text-[20px] md:text-[28px] font-bold">****</span>
                    ):(
                      <>
                        <span className="text-[20px] md:text-[28px] font-bold">{displayCgpa}</span>
                        <span className="text-[14px] md:text-[18px] font-semibold">/ 5.0</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="w-[1px] h-[40px] md:h-[50px] bg-gray-300/50"></div>

                <div className="flex flex-col gap-1 md:gap-3">
                  <span className="text-[12px] md:text-[14px] font-medium text-gray-500">Current Level</span>
                  <span className="text-[20px] md:text-[28px] font-bold text-gray-900">{displayLevel}</span>
                </div>
              </div>

              {/* School & Department */}
              <div className="bg-gradient-to-b from-[#d6f4ff] to-[#ebfaff] border border-gray-200/50 rounded-[24px] p-5 md:p-6 flex flex-col justify-center gap-1 md:gap-2 flex-1 order-1 md:order-2">
                <p className="text-[12px] md:text-[16px] text-gray-500 uppercase tracking-wider">School & Department</p>
                <h3 className="text-[14px] md:text-[24px] font-semibold text-gray-900 leading-snug">{displaySchool} - {displayDepartment}</h3>
              </div>
            </div>
          )}  

          {/* Academic Standing */}
          <div className="bg-[#e5ecfc] border border-gray-200/50 rounded-[24px] h-[100%] p-5 md:p-6 flex flex-col justify-center gap-4 w-full">
            <div className="flex items-center justify-between">
              <p className="text-[12px] md:text-[14px] text-gray-500 uppercase tracking-wider">Academic Standing</p>
              <span className="bg-[#c2d6ff] text-[#162664] px-2.5 py-1 rounded-full text-[10px] md:text-[12px] font-bold flex items-center gap-1.5 uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-[#162664]"></span>
                Good standing
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[13px] md:text-[15px] font-semibold text-gray-700">Academic Progress (Semester 6 of 8)</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white h-2 md:h-3 rounded-full overflow-hidden">
                  <div className="bg-[#003cbb] h-full rounded-full" style={{ width: '48%' }}></div>
                </div>
                <span className="text-[12px] md:text-[14px] font-bold text-gray-900">48%</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
