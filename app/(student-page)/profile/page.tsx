"use client";

import React from "react";
import Image from "next/image";
import { 
  Camera, Eye, Info, User, Book, Heart, Globe, MapPin, 
  Phone, Mail, Home, Users, Calendar, X, CheckCircle2
} from "lucide-react";

export default function ProfilePage() {
  const [isContactModalOpen, setIsContactModalOpen] = React.useState(false);
  const [isNokModalOpen, setIsNokModalOpen] = React.useState(false);
  const [isSuccessBannerOpen, setIsSuccessBannerOpen] = React.useState(false);
  const [contactInfo, setContactInfo] = React.useState({
    email: "joy.onome@example.com",
    phone: "08125001111",
    address: "23, Example Street, Lagos",
    city: "Ikeja",
    country: "Nigeria",
    residencyStatus: "Off-Campus"
  });

  const [nextOfKinInfo, setNextOfKinInfo] = React.useState({
    name: "Badmus Rukky",
    relationship: "Father",
    phone: "08125001111",
    address: "23, Example Street, Lagos",
    city: "Ikeja",
    country: "Nigeria"
  });

  const handleUpdateContact = (updatedInfo: typeof contactInfo) => {
    setContactInfo(updatedInfo);
    setIsContactModalOpen(false);
    setIsSuccessBannerOpen(true);
    
    // Auto-hide banner after 5 seconds
    setTimeout(() => {
      setIsSuccessBannerOpen(false);
    }, 5000);
  };

  const handleUpdateNok = (updatedInfo: typeof nextOfKinInfo) => {
    setNextOfKinInfo(updatedInfo);
    setIsNokModalOpen(false);
    setIsSuccessBannerOpen(true);
    
    // Auto-hide banner after 5 seconds
    setTimeout(() => {
      setIsSuccessBannerOpen(false);
    }, 5000);
  };
  return (
    <div className="pl-4 pr-4 md:p-6 lg:p-8 w-full flex flex-col gap-5 md:gap-6 pb-24 md:pb-8">
      
      {/* Top Section: Profile Pic & Basic Stats */}
      <div className="flex flex-col xl:flex-row gap-5 xl:gap-6 items-stretch">
        
        {/* Profile Picture Card - Mobile Optimized */}
        <div className="bg-white border border-gray-200 rounded-[24px] p-4 md:p-6 flex flex-col items-center justify-between gap-6 md:gap-8 xl:w-[332px] shrink-0">
          
          <div className="flex flex-col items-center gap-4 w-full pt-2">
            <div className="relative">
              <div className="w-[100px] h-[100px] md:w-[120px] md:h-[120px] rounded-full bg-gray-200 border-[5px] border-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden relative">
                {/* Image placeholder */}
                <Image 
                  src="/Student Image.png" 
                  alt="Yakubu Onome Joy" 
                  fill 
                  className="object-cover"
                />
              </div>
              <button className="absolute bottom-0 right-0 md:bottom-1 md:right-1 w-[28px] h-[28px] md:w-[32px] md:h-[32px] bg-[#003cbb] border-[2.5px] border-white rounded-full flex items-center justify-center text-white hover:bg-[#003095] transition-colors shadow-sm">
                <Camera className="w-[14px] h-[14px]" />
              </button>
            </div>
            
            <div className="text-center">
              <h2 className="text-[20px] md:text-[24px] font-semibold text-gray-900 leading-tight">Yakubu Onome Joy</h2>
              <p className="text-[14px] font-medium text-gray-500 mt-1">BSc. Computer Science</p>
            </div>
          </div>
          
          <div className="w-full flex items-center justify-between border-t border-gray-100 pt-5">
            <div>
              <p className="text-[11px] md:text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1">Matric no</p>
              <p className="text-[14px] md:text-[16px] font-bold text-gray-900">CS/2021/4092</p>
            </div>
            <div className="flex flex-col items-end">
              <p className="text-[11px] md:text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1">Status</p>
              <span className="bg-[#ECFDF3] text-[#027A48] px-2.5 md:px-3 py-1 rounded-full text-[10px] md:text-[12px] font-bold flex items-center gap-1.5 tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]"></span>
                ACTIVE
              </span>
            </div>
          </div>
          
        </div>

        {/* Academic Information - Mobile Optimized Gradients & Layout */}
        <div className="flex-1 flex flex-col gap-5 xl:gap-6">
          <div className="flex flex-col md:flex-row w-full gap-5">
            {/* CGPA & Level - Horizontal on mobile as per Figma */}
            <div className="bg-gradient-to-b from-[#e5e0ff] to-[#f5f3ff] border border-gray-200/50 rounded-[24px] p-5 md:p-6 flex items-center justify-around gap-6 shrink-0 md:w-[50%] order-2 md:order-1">
              <div className="flex flex-col gap-1 md:gap-3">
                <div className="flex items-center gap-1.5 text-gray-500">
                  <span className="text-[12px] md:text-[14px] font-medium">Current CGPA</span>
                  <Eye className="w-3.5 h-3.5 md:w-4 h-4" />
                </div>
                <div className="flex items-baseline gap-1 text-[#00a63e]">
                  <span className="text-[20px] md:text-[28px] font-bold">4.82</span>
                  <span className="text-[14px] md:text-[18px] font-semibold">/ 5.0</span>
                </div>
              </div>
              
              <div className="w-[1px] h-[40px] md:h-[50px] bg-gray-300/50"></div>
              
              <div className="flex flex-col gap-1 md:gap-3">
                <span className="text-[12px] md:text-[14px] font-medium text-gray-500">Current Level</span>
                <span className="text-[20px] md:text-[28px] font-bold text-gray-900">300</span>
              </div>
            </div>

            {/* School & Department */}
            <div className="bg-gradient-to-b from-[#d6f4ff] to-[#ebfaff] border border-gray-200/50 rounded-[24px] p-5 md:p-6 flex flex-col justify-center gap-1 md:gap-2 flex-1 order-1 md:order-2">
              <p className="text-[12px] md:text-[14px] text-gray-500 uppercase tracking-wider">School & Department</p>
              <h3 className="text-[14px] md:text-[18px] font-semibold text-gray-900 leading-snug">School of Computing & Information Technology</h3>
            </div>
          </div>

          {/* Academic Standing */}
          <div className="bg-[#e5ecfc] border border-gray-200/50 rounded-[24px] p-5 md:p-6 flex flex-col justify-center gap-4 w-full">
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

      {/* Approvals Section - Stacked on Mobile */}
      <div className="flex flex-col md:flex-row gap-5 items-stretch md:items-start">
        <div className="bg-white border border-gray-200 rounded-[24px] p-5 flex items-center justify-between flex-1">
          <span className="text-[14px] md:text-[16px] font-semibold text-gray-900">Financial Approval</span>
          <span className="bg-[#ECFDF3] text-[#027A48] px-3 py-1.5 rounded-full text-[11px] md:text-[12px] font-semibold flex items-center gap-1.5 uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]"></span>
            Approved
          </span>
        </div>
        <OffCampusApplicationCard status="unapplied" />
      </div>

      {/* Alert Banner */}
      <div className="bg-[#ECFDF3] rounded-[16px] p-4 flex items-start gap-3 border border-[#12B76A]/10">
        <div className="mt-0.5">
          <Info className="w-5 h-5 text-[#027A48]" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-[13px] md:text-[14px] font-bold text-[#027A48]">Payment Status: Current</p>
          <p className="text-[12px] md:text-[13px] text-[#027A48]/90 leading-snug">
            All fees paid up to date. <span className="font-bold text-gray-900">Next payment due: September 2026</span>
          </p>
        </div>
      </div>

      {/* Details Sections: Personal, Contact & Next of Kin */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Personal Information - Grid on Mobile */}
        <div className="bg-white border border-gray-200 rounded-[24px] p-5 md:p-6 flex flex-col gap-5 md:gap-6">
          <h3 className="text-[16px] md:text-[18px] font-semibold text-gray-900">Personal Information</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <InfoRow icon={<User size={14} />} label="Gender" value="Female" />
            <InfoRow icon={<Book size={14} />} label="Religion" value="Christian" />
            <InfoRow icon={<Church size={14} />} label="Denomination" value="SDA" />
            <InfoRow icon={<Heart size={14} />} label="Marital Status" value="Single" />
            <InfoRow icon={<Globe size={14} />} label="Nationality" value="Nigerian" />
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white border border-gray-200 rounded-[24px] p-5 md:p-6 flex flex-col gap-5 md:gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] md:text-[18px] font-semibold text-gray-900">Contact Information</h3>
            <button 
              onClick={() => setIsContactModalOpen(true)}
              className="bg-white border-[1.5px] border-[#003cbb] text-[#003cbb] hover:bg-[#f5f8fe] rounded-[10px] px-4 md:px-8 py-2 h-auto text-[12px] md:text-[13px] font-medium transition-colors active:scale-95"
            >
              Update
            </button>
          </div>
          <div className="flex flex-col gap-5">
            <InfoRow icon={<Mail size={14} />} label="Email" value={contactInfo.email} />
            <InfoRow icon={<Phone size={14} />} label="Phone" value={contactInfo.phone} />
            <InfoRow icon={<MapPin size={14} />} label="Residential Address" value={contactInfo.address} />
            <InfoRow icon={<Home size={14} />} label="Town/City" value={contactInfo.city} />
            <InfoRow icon={<Globe size={14} />} label="Country" value={contactInfo.country} />
            <InfoRow icon={<User size={14} />} label="Residency Status" value={contactInfo.residencyStatus} />
          </div>
        </div>

        {/* Next of Kin Information */}
        <div className="bg-white border border-gray-200 rounded-[24px] p-5 md:p-6 flex flex-col gap-5 md:gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] md:text-[18px] font-semibold text-gray-900">Next of Kin</h3>
            <button 
              onClick={() => setIsNokModalOpen(true)}
              className="bg-white border-[1.5px] border-[#003cbb] text-[#003cbb] hover:bg-[#f5f8fe] rounded-[10px] px-4 md:px-8 py-2 h-auto text-[12px] md:text-[13px] font-medium transition-colors active:scale-95"
            >
              Update
            </button>
          </div>
          <div className="flex flex-col gap-5">
            <InfoRow icon={<User size={14} />} label="Name" value={nextOfKinInfo.name} />
            <InfoRow icon={<Users size={14} />} label="Relationship" value={nextOfKinInfo.relationship} />
            <InfoRow icon={<Phone size={14} />} label="Phone" value={nextOfKinInfo.phone} />
            <InfoRow icon={<MapPin size={14} />} label="Residential Address" value={nextOfKinInfo.address} />
            <InfoRow icon={<Home size={14} />} label="Town/City" value={nextOfKinInfo.city} />
            <InfoRow icon={<Globe size={14} />} label="Country" value={nextOfKinInfo.country} />
          </div>
        </div>

      </div>

      {isContactModalOpen && (
        <UpdateContactModal 
          isOpen={isContactModalOpen} 
          onClose={() => setIsContactModalOpen(false)} 
          initialData={contactInfo}
          onSave={handleUpdateContact}
        />
      )}

      {isNokModalOpen && (
        <UpdateNextOfKinModal 
          isOpen={isNokModalOpen} 
          onClose={() => setIsNokModalOpen(false)} 
          initialData={nextOfKinInfo}
          onSave={handleUpdateNok}
        />
      )}

      {isSuccessBannerOpen && (
        <SuccessToast 
          onClose={() => setIsSuccessBannerOpen(false)} 
        />
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-2 md:gap-3">
      <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-[#f8fafc] flex items-center justify-center text-gray-500 shrink-0">
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <p className="text-[10px] md:text-[12px] text-gray-500 capitalize truncate">{label}</p>
        <p className="text-[12px] md:text-[14px] font-medium text-gray-900 truncate">{value}</p>
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

type ApplicationState = 'unapplied' | 'reviewed' | 'rejected' | 'approved';

function OffCampusApplicationCard({ status = 'unapplied' }: { status?: ApplicationState }) {
  if (status === 'unapplied') {
    return (
      <div className="bg-white border border-gray-200 rounded-[24px] p-5 flex items-center justify-between flex-1 w-full gap-4">
        <span className="text-[14px] md:text-[16px] font-semibold text-gray-900">Off-Campus Residence Application</span>
        <button className="bg-white border-[1.5px] border-[#003cbb] text-[#003cbb] hover:bg-[#f5f8fe] rounded-[10px] px-4 md:px-6 py-2 text-[12px] md:text-[13px] font-medium transition-colors whitespace-nowrap active:scale-95">
          Apply Now
        </button>
      </div>
    );
  }

  if (status === 'approved') {
    return (
      <div className="bg-white border border-gray-200 rounded-[24px] p-5 flex items-center justify-between flex-1 w-full gap-4">
        <span className="text-[14px] md:text-[16px] font-semibold text-gray-900">Off-Campus Residence Application</span>
        <span className="bg-[#ECFDF3] text-[#027A48] px-3 py-1.5 rounded-full text-[11px] md:text-[12px] font-semibold flex items-center gap-1.5 uppercase tracking-wide whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]"></span>
          APPROVED
        </span>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="bg-white border border-gray-200 rounded-[24px] p-5 md:p-6 flex flex-col gap-4 flex-1 w-full">
        <div className="flex flex-col items-start gap-3">
          <span className="text-[15px] md:text-[18px] font-semibold text-gray-900">Off-Campus Residence Application</span>
          <span className="bg-[#fce7ec] text-[#9e1c32] px-3 py-1 rounded-full text-[11px] md:text-[12px] font-semibold flex items-center gap-1.5 uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9e1c32]"></span>
            REJECTED
          </span>
        </div>
      </div>
    );
  }

  if (status === 'reviewed') {
    return (
      <div className="bg-white border border-gray-200 rounded-[24px] p-5 md:p-6 flex flex-col gap-5 flex-1 w-full">
        <div className="flex flex-col items-start gap-4">
          <span className="text-[15px] md:text-[18px] font-semibold text-gray-900">Off-Campus Residence Application</span>
          <span className="bg-[#fce5d8] text-[#9b3e10] px-3 py-1 rounded-full text-[11px] md:text-[12px] font-semibold flex items-center gap-1.5 uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9b3e10]"></span>
            REVIEWED
          </span>
        </div>
        <p className="text-[14px] md:text-[15px] text-gray-600">Your application is under review. You have been scheduled for an interview.</p>
        <div className="flex flex-col gap-4 mt-1">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-[14px] bg-[#f8fafc] flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-[14px] md:text-[15px] font-medium text-gray-900">March 28, 2026 at 10:00 AM</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-[14px] bg-[#f8fafc] flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-[14px] md:text-[15px] font-medium text-gray-900">Student Affairs Office, Room 204</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

interface UpdateContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: {
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    residencyStatus: string;
  };
  onSave: (data: UpdateContactModalProps["initialData"]) => void;
}

function UpdateContactModal({ isOpen, onClose, initialData, onSave }: UpdateContactModalProps) {
  const [formData, setFormData] = React.useState(initialData);

  const isFormFilled = formData.email && formData.phone && formData.address && formData.city && formData.country;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-t-[24px] md:rounded-[24px] w-full max-w-[488px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-gray-100">
          <h3 className="text-[16px] md:text-[18px] font-semibold text-gray-900">Update Contact Information</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 md:p-6 flex flex-col gap-4 md:gap-5 max-h-[60vh] md:max-h-[70vh] overflow-y-auto">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] md:text-[14px] font-medium text-gray-700 flex gap-1">
              Email address <span className="text-blue-600">*</span>
            </label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="E.g alexrivera@example.com"
              className="w-full px-4 py-2 md:py-2.5 bg-white border border-gray-200 rounded-[12px] text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] md:text-[14px] font-medium text-gray-700 flex gap-1">
              Phone number <span className="text-blue-600">*</span>
            </label>
            <input 
              type="tel" 
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="E.g 08120004444"
              className="w-full px-4 py-2 md:py-2.5 bg-white border border-gray-200 rounded-[12px] text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] md:text-[14px] font-medium text-gray-700 flex gap-1">
              Residential Address <span className="text-blue-600">*</span>
            </label>
            <input 
              type="text" 
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="E.g 5, alex rivera street"
              className="w-full px-4 py-2 md:py-2.5 bg-white border border-gray-200 rounded-[12px] text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] md:text-[14px] font-medium text-gray-700 flex gap-1">
              Town/City <span className="text-blue-600">*</span>
            </label>
            <input 
              type="text" 
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Enter city of residence"
              className="w-full px-4 py-2 md:py-2.5 bg-white border border-gray-200 rounded-[12px] text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] md:text-[14px] font-medium text-gray-700 flex gap-1">
              Country <span className="text-blue-600">*</span>
            </label>
            <select 
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full px-4 py-2 md:py-2.5 bg-white border border-gray-200 rounded-[12px] text-[14px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_16px_center] bg-no-repeat"
            >
              <option value="Nigeria">Nigeria</option>
              <option value="Ghana">Ghana</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="United States">United States</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] md:text-[14px] font-medium text-gray-700">Residency Status</label>
            <input 
              type="text" 
              name="residencyStatus"
              value={formData.residencyStatus}
              onChange={handleChange}
              placeholder="E.g Neal Wilson B205"
              className="w-full px-4 py-2 md:py-2.5 bg-gray-50 border border-gray-200 rounded-[12px] text-[14px] text-gray-500 focus:outline-none cursor-not-allowed"
              readOnly
            />
          </div>
        </div>

        <div className="p-5 md:p-6 pt-2">
          <button 
            disabled={!isFormFilled}
            onClick={() => onSave(formData)}
            className={`w-full py-3 rounded-[12px] text-[15px] font-semibold transition-all shadow-sm ${
              isFormFilled 
                ? "bg-[#003cbb] text-white hover:bg-[#003095] active:scale-[0.98]" 
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

interface UpdateNextOfKinModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: {
    name: string;
    relationship: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
  onSave: (data: UpdateNextOfKinModalProps["initialData"]) => void;
}

function UpdateNextOfKinModal({ isOpen, onClose, initialData, onSave }: UpdateNextOfKinModalProps) {
  const [formData, setFormData] = React.useState(initialData);

  const isFormFilled = formData.name && formData.relationship && formData.phone && formData.address && formData.city && formData.country;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-t-[24px] md:rounded-[24px] w-full max-w-[488px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-gray-100">
          <h3 className="text-[16px] md:text-[18px] font-semibold text-gray-900">Update Next of Kin Information</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 md:p-6 flex flex-col gap-4 md:gap-5 max-h-[60vh] md:max-h-[70vh] overflow-y-auto">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] md:text-[14px] font-medium text-gray-700 flex gap-1">
              Name <span className="text-blue-600">*</span>
            </label>
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="E.g Badmus Rukky"
              className="w-full px-4 py-2 md:py-2.5 bg-white border border-gray-200 rounded-[12px] text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] md:text-[14px] font-medium text-gray-700 flex gap-1">
              Relationship <span className="text-blue-600">*</span>
            </label>
            <input 
              type="text" 
              name="relationship"
              value={formData.relationship}
              onChange={handleChange}
              placeholder="E.g Father"
              className="w-full px-4 py-2 md:py-2.5 bg-white border border-gray-200 rounded-[12px] text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] md:text-[14px] font-medium text-gray-700 flex gap-1">
              Phone Number <span className="text-blue-600">*</span>
            </label>
            <input 
              type="tel" 
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="E.g 08120004444"
              className="w-full px-4 py-2 md:py-2.5 bg-white border border-gray-200 rounded-[12px] text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] md:text-[14px] font-medium text-gray-700 flex gap-1">
              Residential Address <span className="text-blue-600">*</span>
            </label>
            <input 
              type="text" 
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="E.g 5, alex rivera street"
              className="w-full px-4 py-2 md:py-2.5 bg-white border border-gray-200 rounded-[12px] text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] md:text-[14px] font-medium text-gray-700 flex gap-1">
              Town/City <span className="text-blue-600">*</span>
            </label>
            <input 
              type="text" 
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Enter city of residence"
              className="w-full px-4 py-2 md:py-2.5 bg-white border border-gray-200 rounded-[12px] text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] md:text-[14px] font-medium text-gray-700 flex gap-1">
              Country <span className="text-blue-600">*</span>
            </label>
            <select 
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full px-4 py-2 md:py-2.5 bg-white border border-gray-200 rounded-[12px] text-[14px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_16px_center] bg-no-repeat"
            >
              <option value="Nigeria">Nigeria</option>
              <option value="Ghana">Ghana</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="United States">United States</option>
            </select>
          </div>
        </div>

        <div className="p-5 md:p-6 pt-2">
          <button 
            disabled={!isFormFilled}
            onClick={() => onSave(formData)}
            className={`w-full py-3 rounded-[12px] text-[15px] font-semibold transition-all shadow-sm ${
              isFormFilled 
                ? "bg-[#003cbb] text-white hover:bg-[#003095] active:scale-[0.98]" 
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

function SuccessToast({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed top-6 md:top-6 md:right-6 left-6 right-6 md:left-auto z-[110] animate-in slide-in-from-top md:slide-in-from-right duration-300">
      <div className="bg-[#cbf5e5] flex gap-3 items-start p-4 rounded-[12px] shadow-[0px_4px_8px_0px_rgba(0,0,0,0.08)] w-full md:w-[390px] border border-[#176448]/10">
        <div className="text-[#176448] shrink-0 mt-0.5">
          <CheckCircle2 size={20} />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <p className="font-semibold text-[13px] md:text-[14px] text-[#176448] leading-tight">
            Information Successfully updated
          </p>
          <p className="text-[12px] md:text-[13px] text-[#176448]/80 leading-tight">
            You have successfully updated your details
          </p>
        </div>
        <button 
          onClick={onClose}
          className="text-[#176448] hover:bg-[#b8ecd8] p-1 rounded-md transition-colors shrink-0"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

