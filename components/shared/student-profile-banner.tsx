"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Camera, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { usePersistentToggle } from "@/hooks/use-persistent-toggle";
import { UMISResponse } from "@/lib/session";
import { toTitleCase } from "@/lib/utils";
import { updateProfilePictureAction } from "@/app/actions/user";
import {
  proxyImageUrl,
  extractPicUrl,
  DEFAULT_AVATAR,
} from "@/hooks/use-student-avatar";

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
  /** Optional callback after profile picture update */
  onAvatarUpdated?: (newUrl: string) => void;
}

export function StudentProfileBanner({
  showEditAvatar,
  welcomeMessage,
  userData,
  showDetailedInfo,
  showDetailedRow,
  onAvatarUpdated,
}: StudentProfileBannerProps) {
  const initialPic = extractPicUrl(userData);
  const [avatarUrl, setAvatarUrl] = useState<string>(
    initialPic ? proxyImageUrl(initialPic) : DEFAULT_AVATAR
  );
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive the per-user localStorage key from the matric number
  const matric =
    userData?.user_data?.personal_information?.matric_number ??
    (userData?.user_data as unknown as Record<string, unknown>)?.matric_number as string ??
    null;
  const avatarKey = matric ? `profile_avatar:${matric}` : null;

  // Sync avatar URL from props / localStorage / events
  useEffect(() => {
    // Clear legacy un-namespaced keys
    try {
      localStorage.removeItem("profile_avatar");
      localStorage.removeItem("student_avatar");
    } catch {
      // Ignore
    }

    const apiPic = extractPicUrl(userData);
    if (apiPic) {
      const proxied = proxyImageUrl(apiPic);
      setAvatarUrl(proxied);
      if (avatarKey) {
        try {
          localStorage.setItem(avatarKey, apiPic);
        } catch {
          // Ignore
        }
      }
      return;
    }

    // Fall back to per-user cache
    if (avatarKey) {
      try {
        const saved = localStorage.getItem(avatarKey);
        if (saved) {
          setAvatarUrl(proxyImageUrl(saved));
          return;
        }
      } catch {
        // Ignore
      }
    }

    // Default avatar
    setAvatarUrl(DEFAULT_AVATAR);
  }, [userData, avatarKey]);

  useEffect(() => {
    const handleAvatarUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<{ url?: string; matric?: string }>;
      if (
        customEvt.detail?.url &&
        (!customEvt.detail.matric || customEvt.detail.matric === matric)
      ) {
        setAvatarUrl(proxyImageUrl(customEvt.detail.url));
        return;
      }
      if (avatarKey) {
        try {
          const updated = localStorage.getItem(avatarKey);
          if (updated) setAvatarUrl(proxyImageUrl(updated));
        } catch {
          // Ignore
        }
      }
    };

    window.addEventListener("profile_avatar_updated", handleAvatarUpdate);
    window.addEventListener("storage", handleAvatarUpdate);
    return () => {
      window.removeEventListener("profile_avatar_updated", handleAvatarUpdate);
      window.removeEventListener("storage", handleAvatarUpdate);
    };
  }, [matric, avatarKey]);
  console.log("avatar", avatarUrl);
  const handleAvatarClick = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be picked again if needed
    e.target.value = "";

    // 1. File type validation: jpeg, jpg, png
    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png"];
    const allowedExtensions = [".jpg", ".jpeg", ".png"];
    const fileName = file.name.toLowerCase();
    const isValidMime = allowedMimeTypes.includes(file.type.toLowerCase());
    const isValidExt = allowedExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValidMime && !isValidExt) {
      toast.error("Invalid file type. Only JPEG, JPG, and PNG files are supported.");
      return;
    }

    // 2. File size validation: Maximum 1MB (1,048,576 bytes)
    const MAX_SIZE = 1 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error("File size exceeds 1MB limit. Please choose a smaller file.");
      return;
    }

    setIsUploading(true);

    // Immediate preview locally via FileReader
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);

    // Build FormData and trigger server action
    const formData = new FormData();
    formData.append("profile_picture", file);

    const result = await updateProfilePictureAction(formData);

    setIsUploading(false);

    if (result.success) {
      const rawUrl = result.profile_picture_url || (reader.result as string) || avatarUrl;
      const proxiedUrl = proxyImageUrl(rawUrl);
      setAvatarUrl(proxiedUrl);
      if (rawUrl && avatarKey && !rawUrl.startsWith("data:")) {
        try {
          localStorage.setItem(avatarKey, rawUrl);
        } catch {
          // Ignore
        }
      }
      window.dispatchEvent(
        new CustomEvent("profile_avatar_updated", {
          detail: { url: proxiedUrl, matric },
        })
      );

      toast.success(result.message || "Profile picture updated successfully!");
      if (onAvatarUpdated) {
        onAvatarUpdated(proxiedUrl);
      }
    } else {
      toast.error(result.error || "Failed to update profile picture.");
    }
  };


  const [showCgpa, toggleCgpa, mountedCgpa] = usePersistentToggle("showCgpa", true);
  const mounted = mountedCgpa;

  // Derived display values from session data (with fallbacks)
  const rawName = userData?.entity_name ?? "—";
  const displayName = toTitleCase(rawName);
  const displayMatric = userData?.user_data?.personal_information?.matric_number ?? "—";
  const displayEmail = userData?.user_data?.contact_information?.email ?? "—";

  let displayProgramme = userData?.user_data?.degree_name ?? "";
  const department = userData?.user_data?.department ?? "";
  const lowerProg = displayProgramme.toLowerCase();

  if (lowerProg.includes("bachelor of science")) {
    displayProgramme = "B.Sc.";
  } else if (lowerProg.includes("bachelor of arts")) {
    displayProgramme = "B.A.";
  } else if (lowerProg.includes("bachelor of engineering")) {
    displayProgramme = "B.Eng.";
  } else if (lowerProg.includes("bachelor of medicine")) {
    displayProgramme = "M.B.";
  }

  if (department && !displayProgramme.toLowerCase().includes(department.toLowerCase())) {
    displayProgramme = displayProgramme ? `${displayProgramme} ${department}` : department;
  }

  if (!displayProgramme) {
    displayProgramme = "—";
  }

  const displayLevel = userData?.user_data?.academic_information?.study_level ?? "—";
  const displaySchool = userData?.user_data?.school_name ?? "—";
  const displayDepartment = userData?.user_data?.department ?? "—";
  const displayStatus = "Active";
  const displayCgpa = userData?.user_data?.academic_information?.cummulative_gpa?.toFixed(2) ?? "—";

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/jpg"
        className="hidden"
        onChange={handleFileChange}
      />
      {welcomeMessage && (
        <h2 className="text-[18px] md:text-[20px] font-bold text-gray-900 dark:text-gray-100 mb-4 tracking-tight">
          {welcomeMessage}
        </h2>
      )}

      <div className="flex flex-col xl:flex-row gap-5 xl:gap-6 items-stretch">

        {/* Profile Picture Card */}
        {showDetailedInfo && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[20px] p-4 md:p-6 flex flex-col items-center justify-between gap-6 md:gap-8 xl:w-[332px] shrink-0 transition-colors duration-200">

            <div className="flex flex-col items-center gap-4 w-full pt-2">
              <div className="relative">
                <div className="w-[100px] h-[100px] md:w-[120px] md:h-[120px] rounded-full bg-gray-200 dark:bg-gray-800 border-[5px] border-white dark:border-gray-900 shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden relative transition-colors duration-200">
                  <Image
                    src={avatarUrl}
                    alt={`${displayName}`}
                    fill
                    unoptimized
                    className="object-cover"
                    onError={() => {
                      if (avatarUrl !== DEFAULT_AVATAR) {
                        setAvatarUrl(DEFAULT_AVATAR);
                      }
                    }}
                  />
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full z-10">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
                {showEditAvatar && (
                  <button
                    onClick={handleAvatarClick}
                    disabled={isUploading}
                    className="absolute bottom-0 right-0 md:bottom-1 md:right-1 w-[28px] h-[28px] md:w-[32px] md:h-[32px] bg-[#003cbb] border-[2.5px] border-white rounded-full flex items-center justify-center text-[#ffffff] hover:bg-[#003095] disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {isUploading ? <Loader2 className="w-[14px] h-[14px] animate-spin" /> : <Camera className="w-[14px] h-[14px]" />}
                  </button>
                )}
              </div>


              <div className="text-center select-text">
                <h2 className="text-[18px] md:text-[22px] font-semibold text-gray-900 dark:text-gray-100 leading-tight select-all">{displayName}</h2>
                <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400 mt-1">{displayProgramme}</p>
                <p className="text-[12px] font-normal text-gray-400 dark:text-gray-500 mt-1 break-all select-all">{displayEmail}</p>
              </div>
            </div>

            <div className="w-full flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-5">
              <div>
                <p className="text-[11px] md:text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1">Matric no</p>
                <p className="text-[14px] md:text-[16px] font-bold text-gray-900 dark:text-gray-100">{displayMatric}</p>
              </div>
              <div className="flex flex-col items-end">
                <p className="text-[11px] md:text-[12px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Status</p>
                <span className="bg-[#ECFDF3] dark:bg-[#027A48]/20 text-[#027A48] dark:text-[#12B76A] px-2.5 md:px-3 py-1 rounded-full text-[10px] md:text-[12px] font-bold flex items-center gap-1.5 tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]"></span>
                  {displayStatus.toUpperCase()}
                </span>
              </div>
            </div>

          </div>
        )}

        {/* Profile Picture Card on dashboard*/}
        {showDetailedRow && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[20px] p-4 md:p-6 flex flex-col md:flex-row items-stretch justify-between gap-4 md:gap-8 md:w-[49.5%] w-[100%] shrink-0 transition-colors duration-200">

            {/* Avatar + Name */}
            <div className="flex flex-row items-center gap-4 w-full">
              <div className="relative shrink-0">
                <div className="w-[80px] h-[80px] md:w-[120px] md:h-[120px] rounded-full bg-gray-200 dark:bg-gray-800 border-[5px] border-white dark:border-gray-900 shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden relative transition-colors duration-200">
                  <Image
                    src={avatarUrl}
                    alt={`${displayName}`}
                    fill
                    unoptimized
                    className="object-cover"
                    onError={() => {
                      if (avatarUrl !== DEFAULT_AVATAR) {
                        setAvatarUrl(DEFAULT_AVATAR);
                      }
                    }}
                  />
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full z-10">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
                {showEditAvatar && (
                  <button
                    onClick={handleAvatarClick}
                    disabled={isUploading}
                    className="absolute bottom-0 right-0 md:bottom-1 md:right-1 w-[28px] h-[28px] md:w-[32px] md:h-[32px] bg-[#003cbb] border-[2.5px] border-white rounded-full flex items-center justify-center text-[#ffffff] hover:bg-[#003095] disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {isUploading ? <Loader2 className="w-[14px] h-[14px] animate-spin" /> : <Camera className="w-[14px] h-[14px]" />}
                  </button>
                )}
              </div>

              <div className="text-left select-text">
                <h2 className="text-[18px] md:text-[22px] font-semibold text-gray-900 dark:text-gray-100 leading-tight select-all">{displayName}</h2>
                <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400 mt-1">{displayProgramme}</p>
                <p className="text-[12px] font-normal text-gray-400 dark:text-gray-500 mt-1 break-all select-all">{displayEmail}</p>
              </div>
            </div>

            {/* Matric + Status — below on mobile, right side on md+ */}
            <div className="flex flex-row items-center flex-wrap gap-3 justify-between border-t border-gray-100 dark:border-gray-800 pt-4 md:border-t-0 md:pt-0 md:border-l md:border-gray-100 md:dark:border-gray-800 md:pl-8 md:flex-col md:items-start md:justify-center md:gap-4 shrink-0">
              <div>
                <p className="text-[11px] md:text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1">Matric no</p>
                <p className="text-[14px] md:text-[16px] font-bold text-gray-900 dark:text-gray-100">{displayMatric}</p>
              </div>
              <div className="flex flex-col">
                <p className="text-[11px] md:text-[12px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Status</p>
                <span className="bg-[#ECFDF3] dark:bg-[#027A48]/20 text-[#027A48] dark:text-[#12B76A] px-2.5 md:px-3 py-1 rounded-full text-[10px] md:text-[12px] font-bold flex items-center gap-1.5 tracking-wide">
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
              <div className="bg-gradient-to-b from-[#e5e0ff] to-[#f5f3ff] dark:from-[#2e2b4d] dark:to-[#1e1c36] border border-gray-200/50 dark:border-gray-800 rounded-[20px] p-5 md:p-6 flex items-center justify-around gap-6 shrink-0 md:w-[50%] order-2 md:order-1 transition-colors duration-200">
                <div className="flex flex-col gap-1 md:gap-3">
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <span className="text-[12px] md:text-[14px] font-medium">Current CGPA</span>
                    <button
                      type="button"
                      onClick={toggleCgpa}
                      className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-gray-400 dark:text-gray-500 active:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full touch-manipulation shrink-0"
                      aria-label={showCgpa ? "Hide CGPA" : "Show CGPA"}
                    >
                      {showCgpa ? <Eye className="w-4 h-4 md:w-5 md:h-5" /> : <EyeOff className="w-4 h-4 md:w-5 md:h-5" />}
                    </button>
                  </div>
                  <div className="flex items-baseline gap-1 text-[#00a63e] dark:text-[#12B76A]">
                    {mounted && !showCgpa ? (
                      <span className="text-[20px] md:text-[28px] font-bold">****</span>
                    ) : (
                      <>
                        <span className="text-[20px] md:text-[28px] font-bold">{displayCgpa}</span>
                        <span className="text-[14px] md:text-[18px] font-semibold">/ 5.0</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="w-[1px] h-[40px] md:h-[50px] bg-gray-300/50 dark:bg-gray-700"></div>

                <div className="flex flex-col gap-1 md:gap-3">
                  <span className="text-[12px] md:text-[14px] font-medium text-gray-500 dark:text-gray-400">Current Level</span>
                  <span className="text-[20px] md:text-[28px] font-bold text-gray-900 dark:text-gray-100">{displayLevel}</span>
                </div>
              </div>

              {/* School & Department */}
              <div className="bg-gradient-to-b from-[#d6f4ff] to-[#ebfaff] dark:from-[#1b3a4d] dark:to-[#112436] border border-gray-200/50 dark:border-gray-800 rounded-[20px] p-5 md:p-6 flex flex-col justify-center gap-1 md:gap-2 flex-1 order-1 md:order-2 transition-colors duration-200">
                <p className="text-[12px] md:text-[16px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">School & Department</p>
                <h3 className="text-[14px] md:text-[24px] font-semibold text-gray-900 dark:text-gray-100 leading-snug">{displaySchool} - {displayDepartment}</h3>
              </div>
            </div>
          )}

          {/* Academic Standing */}
          <div className="bg-[#e5ecfc] dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-800 rounded-[20px] h-[100%] p-5 md:p-6 flex flex-col justify-center gap-4 w-full transition-colors duration-200">
            <div className="flex items-center justify-between">
              <p className="text-[12px] md:text-[14px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">Academic Standing</p>
              <span className="bg-[#c2d6ff] dark:bg-[#162664]/30 text-[#162664] dark:text-[#c2d6ff] px-2.5 py-1 rounded-full text-[10px] md:text-[12px] font-bold flex items-center gap-1.5 uppercase tracking-wide whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-[#162664] dark:bg-[#4d82ff]"></span>
                Good standing
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[13px] md:text-[15px] font-semibold text-gray-700 dark:text-gray-300">Academic Progress (Semester 6 of 8)</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white dark:bg-gray-900 h-2 md:h-3 rounded-full overflow-hidden">
                  <div className="bg-[#003cbb] dark:bg-[#4d82ff] h-full rounded-full" style={{ width: '48%' }}></div>
                </div>
                <span className="text-[12px] md:text-[14px] font-bold text-gray-900 dark:text-gray-100">48%</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
