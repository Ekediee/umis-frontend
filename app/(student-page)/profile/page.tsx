"use client";

import React from "react";
import Image from "next/image";
import { 
  Camera, Eye, Info, User, Book, Heart, Globe, MapPin, 
  Phone, Mail, Home, Users
} from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 w-full flex flex-col gap-5 md:gap-6">
      
      {/* Top Row: Profile Pic & Academic Info */}
      <div className="flex flex-col xl:flex-row gap-5 xl:gap-6 items-stretch">
        
        {/* Profile Picture Card */}
        <div className="bg-white border border-gray-200 rounded-[24px] p-6 flex flex-col items-center justify-between gap-8 xl:w-[332px] shrink-0">
          
          <div className="flex flex-col items-center gap-4 w-full pt-2">
            <div className="relative">
              <div className="w-[120px] h-[120px] rounded-full bg-gray-200 border-[5px] border-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden relative">
                {/* Image placeholder */}
                <Image 
                  src="/Student Image.png" 
                  alt="Yakubu Onome Joy" 
                  fill 
                  className="object-cover"
                />
              </div>
              <button className="absolute bottom-1 right-1 w-[32px] h-[32px] bg-[#003cbb] border-[2.5px] border-white rounded-full flex items-center justify-center text-white hover:bg-[#003095] transition-colors shadow-sm">
                <Camera className="w-[14px] h-[14px]" />
              </button>
            </div>
            
            <div className="text-center">
              <h2 className="text-[22px] md:text-[24px] font-semibold text-gray-900 leading-tight">Yakubu Onome Joy</h2>
              <p className="text-[14px] font-medium text-gray-500 mt-1">BSc. Computer Science</p>
            </div>
          </div>
          
          <div className="w-full flex items-center justify-between border-t border-gray-100 pt-5">
            <div>
              <p className="text-[11px] md:text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1">Matric no</p>
              <p className="text-[15px] md:text-[16px] font-bold text-gray-900">CS/2021/4092</p>
            </div>
            <div className="flex flex-col items-end">
              <p className="text-[11px] md:text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1">Status</p>
              <span className="bg-[#ECFDF3] text-[#027A48] px-3 py-1 rounded-full text-[11px] md:text-[12px] font-bold flex items-center gap-1.5 tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]"></span>
                ACTIVE
              </span>
            </div>
          </div>
          
        </div>

        {/* Academic Information */}
        <div className="flex-1 flex flex-col md:flex-row flex-wrap gap-5 xl:gap-6">
          <div className="flex w-full justify-between gap-5">
          <div className="bg-gradient-to-b from-[#d6f4ff] to-[#ebfaff] border border-gray-200/50 rounded-[24px] p-6 flex flex-col justify-center gap-2 flex-1 min-w-[260px] md:w-full">
            <p className="text-[13px] md:text-[14px] text-gray-500 uppercase tracking-wider">School & Department</p>
            <h3 className="text-[18px] md:text-[20px] font-semibold text-gray-900 leading-snug max-w-[500px]">School of Computing & Information Technology</h3>
          </div>
          
          <div className="bg-gradient-to-b from-[#e5e0ff] to-[#f5f3ff] border border-gray-200/50 rounded-[24px] p-6 flex  items-center justify-around gap-6 shrink-0 md:w-[50%]">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-1.5 text-gray-500">
                <span className="text-[14px] font-medium">Current CGPA</span>
                <Eye className="w-4 h-4" />
              </div>
              <div className="flex items-baseline gap-1 text-[#00a63e]">
                <span className="text-[26px] md:text-[28px] font-bold">4.82</span>
                <span className="text-[16px] md:text-[18px] font-semibold">/ 5.0</span>
              </div>
            </div>
            
            <div className="w-[1px] h-[50px] bg-gray-300/50"></div>
            
            <div className="flex flex-col gap-3">
              <span className="text-[14px] font-medium text-gray-500">Current Level</span>
              <span className="text-[26px] md:text-[28px] font-bold text-gray-900">300</span>
            </div>
          </div>
          </div>

          <div className="bg-[#e5ecfc] border border-gray-200/50 rounded-[24px] p-6 flex flex-col justify-center gap-4 w-full">
            <div className="flex items-center justify-between">
              <p className="text-[13px] md:text-[14px] text-gray-500 uppercase tracking-wider">Academic Standing</p>
              <span className="bg-[#c2d6ff] text-[#162664] px-3 py-1 rounded-full text-[11px] md:text-[12px] font-bold flex items-center gap-1.5 uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-[#162664]"></span>
                GOOD STANDING
              </span>
            </div>
            
            <div>
              <p className="text-[14px] md:text-[15px] font-semibold text-gray-600 mb-3">Academic Progress (Semester 6 of 8)</p>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-white h-3 rounded-full overflow-hidden">
                  <div className="bg-[#003cbb] h-full rounded-full" style={{ width: '48%' }}></div>
                </div>
                <span className="text-[13px] md:text-[14px] font-bold text-gray-600">48%</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Approvals */}
      <div className="flex flex-col md:flex-row gap-5">
        <div className="bg-white border border-gray-200 rounded-[24px] p-5 flex items-center justify-between flex-1">
          <span className="text-[15px] md:text-[16px] font-semibold text-gray-900">Financial Approval</span>
          <span className="bg-[#ECFDF3] text-[#027A48] px-3 py-1.5 rounded-full text-[12px] font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]"></span>
            Approved
          </span>
        </div>
        <div className="bg-white border border-gray-200 rounded-[24px] p-5 flex items-center justify-between flex-1">
          <span className="text-[15px] md:text-[16px] font-semibold text-gray-900">Off-Campus Residence Application</span>
          <span className="bg-[#ECFDF3] text-[#027A48] px-3 py-1.5 rounded-full text-[12px] font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]"></span>
            Approved
          </span>
        </div>
      </div>

      {/* Alert */}
      <div className="bg-[#ECFDF3] rounded-[16px] p-4 flex items-start gap-3">
        <div className="mt-0.5">
          <Info className="w-5 h-5 text-[#027A48]" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-[14px] font-medium text-[#027A48]">Payment Status: Current</p>
          <p className="text-[13px] text-[#027A48]/80">
            All fees paid up to date. <span className="font-bold text-gray-900">Next payment due: September 2026</span>
          </p>
        </div>
      </div>

      {/* Bottom Cards: 3 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Personal Info */}
        <div className="bg-white border border-gray-200 rounded-[24px] p-6 flex flex-col gap-6">
          <h3 className="text-[16px] md:text-[18px] font-semibold text-gray-900">Personal Information</h3>
          <div className="flex flex-col gap-5">
            <InfoRow icon={<User size={16} />} label="Gender" value="Female" />
            <InfoRow icon={<Book size={16} />} label="Religion" value="Christian" />
            <InfoRow icon={<Church size={16} />} label="Denomination" value="Seventh-Day Adventist" />
            <InfoRow icon={<Heart size={16} />} label="Marital Status" value="Single" />
            <InfoRow icon={<Globe size={16} />} label="Nationality" value="Nigerian" />
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white border border-gray-200 rounded-[24px] p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] md:text-[18px] font-semibold text-gray-900">Contact Information</h3>
            <button className="bg-[#003cbb] hover:bg-[#003095] text-white rounded-[10px] px-8 py-2 h-auto text-[13px] font-medium gap-1.5 transition-colors">
              Update
            </button>
          </div>
          <div className="flex flex-col gap-5">
            <InfoRow icon={<Mail size={16} />} label="Email" value="joy.onome@example.com" />
            <InfoRow icon={<Phone size={16} />} label="Phone" value="08125001111" />
            <InfoRow icon={<MapPin size={16} />} label="Residential Address" value="23, Example Street, Lagos" />
            <InfoRow icon={<Home size={16} />} label="Town/City" value="Ikeja" />
            <InfoRow icon={<Globe size={16} />} label="Country" value="Nigeria" />
            <InfoRow icon={<User size={16} />} label="Residency Status" value="Off-Campus" />
          </div>
        </div>

        {/* Next of Kin */}
        <div className="bg-white border border-gray-200 rounded-[24px] p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] md:text-[18px] font-semibold text-gray-900">Next of Kin</h3>
            <button className="bg-[#003cbb] hover:bg-[#003095] text-white rounded-[10px] px-8 py-2 h-auto text-[13px] font-medium gap-1.5 transition-colors">
              Update
            </button>
          </div>
          <div className="flex flex-col gap-5">
            <InfoRow icon={<User size={16} />} label="Name" value="Yakubu Emmanuel" />
            <InfoRow icon={<Users size={16} />} label="Relationship" value="Father" />
            <InfoRow icon={<Phone size={16} />} label="Phone" value="08125001111" />
            <InfoRow icon={<MapPin size={16} />} label="Residential Address" value="23, Example Street, Lagos" />
            <InfoRow icon={<Home size={16} />} label="Town/City" value="Ikeja" />
            <InfoRow icon={<Globe size={16} />} label="Country" value="Nigeria" />
          </div>
        </div>

      </div>

    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-[#f8fafc] flex items-center justify-center text-gray-500 shrink-0">
        {icon}
      </div>
      <div className="flex flex-col">
        <p className="text-[12px] text-gray-500 capitalize">{label}</p>
        <p className="text-[14px] font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

// Lucide React doesn't export 'Church' in some older versions, so we use a robust fallback SVG
function Church(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m18 7 4 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9l4-2" />
      <path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4" />
      <path d="M18 22V5l-6-3-6 3v17" />
      <path d="M12 7v5" />
      <path d="M10 9h4" />
    </svg>
  );
}
