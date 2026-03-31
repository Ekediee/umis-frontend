import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BadgeCheck } from "lucide-react";

export function WelcomeBanner() {
  return (
    <div className="mb-6">
      <h2 className="text-[22px] font-semibold text-gray-900 mb-4 tracking-tight">
        Welcome back Alex, Here is your academic overview
      </h2>
      
      <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col xl:flex-row gap-8 items-start xl:items-center justify-between">
        
        {/* Left Section: User Info */}
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <Avatar className="w-[84px] h-[84px] border-[5px] border-white shadow-sm">
              {/* Note: The user image in the original design looks like a 3D avatar */}
              <AvatarImage src="https://i.pravatar.cc/300?u=alex2" alt="Alex Rivera" className="object-cover" />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xl font-bold">AR</AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 bg-white rounded-full p-[2px] shadow-sm">
              <BadgeCheck className="w-6 h-6 text-blue-600 fill-white" />
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <h3 className="text-[22px] font-bold text-gray-900 leading-tight tracking-tight">Alex Rivera</h3>
            <p className="text-[15px] text-gray-500 font-medium">BSc. Computer Science</p>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="bg-[#EEF2FC] text-[#3B5B98] px-3.5 py-1.5 rounded-lg text-xs font-bold flex flex-col items-start leading-[1.3]">
                <span className="text-[9px] uppercase tracking-wider text-[#7990C2] mb-[2px]">MATRIC NO</span>
                CS/2021/4092
              </div>
              <div className="bg-[#EAF6ED] text-[#299054] px-3.5 py-1.5 rounded-lg text-xs font-bold flex flex-col items-start leading-[1.3] border border-[#D4ECD9]">
                <span className="text-[9px] uppercase tracking-wider text-[#5EB17E] mb-[2px]">STATUS</span>
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#34A853]"></span>ACTIVE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Progress */}
        <div className="flex-1 w-full xl:max-w-[420px] bg-[#F8F9FB] rounded-[20px] p-5">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-[11px] font-bold text-gray-400 tracking-wider">ACADEMIC STANDING</h4>
            <div className="bg-[#E6EAF6] text-[#4A64A5] text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4A64A5]"></span>
              Good Standing
            </div>
          </div>
          <div className="flex items-end justify-between mb-2.5">
            <div className="text-[14px] font-bold text-gray-800">
               Academic Progress <span className="text-gray-500 font-medium">(Semester 6 of 8)</span>
            </div>
            <div className="text-[18px] font-bold text-gray-900">48%</div>
          </div>
          <div className="h-2.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
             {/* Note: In the image it's a solid blue line going to 48%, quite rounded */}
             <div className="h-full bg-[#314A95] rounded-full" style={{ width: '48%' }}></div>
          </div>
        </div>

      </div>
    </div>
  );
}
