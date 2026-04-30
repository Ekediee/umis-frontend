import { Info, ChevronDown, ChevronRight, CreditCard, ThumbsUp, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

const paymentHistoryData = [
  {
    id: 1,
    title: "First Semester 200L",
    year: "2025/2026",
    semesterId: "2",
    amountToPay: "₦4,500,000",
    amountPaid: "₦4,000,000",
    statusValue: "500,000",
    statusType: "deficit",
  },
  {
    id: 2,
    title: "Second Semester 100L",
    year: "2025/2026",
    semesterId: "1",
    amountToPay: "₦4,500,000",
    amountPaid: "₦4,800,000",
    statusValue: "200,000",
    statusType: "surplus",
  },
  {
    id: 3,
    title: "First Semester 100L",
    year: "2025/2026",
    semesterId: "2",
    amountToPay: "₦4,500,000",
    amountPaid: "₦4,000,000",
    statusValue: "500,000",
    statusType: "deficit",
  },
];

export default function FinancePage() {
  return (
    <div className="max-w-6x px-4 md:px-8 flex flex-col gap-6 pb-12">

      {/* Top Card: Financial Standing */}
      <div className="bg-[#EAF0FF] rounded-[24px] p-6 relative overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[15px] font-medium text-gray-600">Financial Standing</span>
          <div className="bg-[#D3E0FF] text-[#1E40AF] px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1E40AF]"></span>
            GREAT
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[18px] font-bold text-gray-900">Payment Progress 100%</span>
            <span className="text-[15px] font-bold text-gray-900">100%</span>
          </div>
          <div className="h-3 w-full bg-white/60 rounded-full overflow-hidden">
            <div className="h-full bg-[#1D4ED8] rounded-full w-full"></div>
          </div>
        </div>

        <div className="flex gap-2 items-start text-[#1E40AF]">
          <Info className="w-5 h-5 shrink-0" />
          <p className="text-[14px] leading-relaxed">
            You must achieve a payment of at least <span className="font-bold">75% payment</span> in order for you to be allowed to write your mid-semester
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="bg-white rounded-[24px] flex flex-col justify-between p-6 gap-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1 md:border-r order-gray-100 pr-4">
            <p className="text-[13px] font-medium text-gray-500 mb-3">Financial Approval</p>
            <div className="bg-[#ECFDF3] text-[#027A48] px-3 py-1.5 rounded-full text-[13px] font-bold inline-flex items-center gap-2 border border-[#D1FADF]">
              <ThumbsUp className="w-4 h-4" fill="currentColor" /> Approved
            </div>
          </div>

          <div className="flex-1 md:border-r border-gray-100 px-0">
            <p className="text-[13px] font-medium text-gray-500 mb-2">Full Session Fee</p>
            <p className="text-[22px] font-bold text-gray-900">₦4,500,000</p>
          </div>

          <div className="flex-1 px-0">
            <p className="text-[13px] font-medium text-gray-500 mb-2">Amount Paid For Semester</p>
            <p className="text-[22px] font-bold text-gray-900">₦4,600,000</p>
          </div>

          <div className="bg-[#ECFDF3] border border-[#D1FADF] rounded-[16px] p-4 flex-shrink-0 w-full md:w-[240px] relative">
            <Info className="absolute top-3 right-3 w-4 h-4 text-[#027A48]" />
            <div className="flex items-center gap-2 text-[#027A48] font-medium text-[13px] mb-1">
              <CreditCard className="w-4 h-4" /> Surplus
            </div>
            <p className="text-[22px] font-bold text-[#027A48]">₦100,000</p>
          </div>
        </div>

        {/* Banner Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          {/* Card 1 */}
          <div className="bg-[#E4E9FC] rounded-[24px] p-6 flex justify-between relative overflow-hidden min-h-[220px]">
            <div className="relative z-10 w-4/5 flex flex-col justify-center">
              <h3 className="text-[20px] font-bold text-gray-900 mb-6">Pay for a previous semester</h3>
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative w-full max-w-[200px]">
                  <select className="w-full appearance-none bg-white border border-transparent rounded-xl px-4 py-3 text-[14px] text-gray-700 font-medium focus:outline-none shadow-sm h-[48px]">
                    <option>Select Semester</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <Button className="w-[150px] bg-[#0038FF] hover:bg-[#002BCC] text-white rounded-xl py-0 h-[48px] text-[14px] font-medium flex items-center justify-center gap-2 shadow-sm transition-all">
                  Make payment <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="absolute right-[-60px] md:absolute right-[0px]  bottom-[-60px] w-[250px] h-[250px] pointer-events-none ">
              <Image
                className=" w-full h-auto  "
                src="/images/handsuccesspay.png"
                alt="Next.js logo"
                width={150}
                height={150}
                priority
              />
              {/* <img src="/images/" alt="" className="w-full h-full object-contain object-bottom right-[-20px] bottom-[-20px] relative" /> */}
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#E9DFFB] rounded-[24px] p-6 flex justify-between relative overflow-hidden min-h-[220px]">
            <div className="relative z-10 w-4/5 flex flex-col justify-center">
              <h3 className="text-[20px] font-bold text-gray-900 mb-8">Pay for current semester</h3>
              <Button className="w-[180px] bg-white/60 hover:bg-white/80 text-[#0038FF] rounded-xl py-0 h-[48px] text-[14px] font-semibold flex items-center justify-center gap-2 shadow-sm transition-all backdrop-blur-sm">
                Pay School Fees <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="absolute right-[0px] md:right-8 bottom-[-60px] w-[250px] h-[250px] pointer-events-none ">
              <Image
                className=" w-full h-auto  "
                src="/images/handpay.png"
                alt="Next.js logo"
                width={250}
                height={250}
                priority
              />
              {/* <img src="/images/" alt="" className="w-full h-full object-contain object-bottom right-[-20px] bottom-[-20px] relative" /> */}
            </div>
          </div>
        </div>
      </div>



      {/* Payment History */}
      <div className="mt-4">
        <h3 className="text-[18px] font-bold text-gray-900 mb-6">Payment History</h3>

        {/* Desktop View: Table */}
        <div className="hidden md:block w-full overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Table Header */}
            <div className="grid grid-cols-6 gap-4 px-6 py-4 bg-white rounded-[20px] border border-gray-100 border-b-0">
              <div className="text-[13px] font-medium text-gray-500">Semester</div>
              <div className="text-[13px] font-medium text-gray-500">Amount to pay</div>
              <div className="text-[13px] font-medium text-gray-500">Amount paid</div>
              <div className="text-[13px] font-medium text-gray-500">Deficit/Surplus</div>
              <div className="text-[13px] font-medium text-gray-500 text-center">View Invoice</div>
              <div className="text-[13px] font-medium text-gray-500 text-center">Download Invoice</div>
            </div>

            {/* Table Rows */}
            <div className="flex flex-col gap-2 mt-2">
              {paymentHistoryData.map((row) => (
                <div key={row.id} className="grid grid-cols-6 gap-4 px-6 py-5 bg-white rounded-[20px] items-center border border-gray-100 shadow-sm">
                  <div className="font-bold text-[15px] text-gray-900">
                    {row.year}<span className="text-orange-500">.{row.semesterId}</span>
                  </div>
                  <div className="text-[14px] text-gray-600">{row.amountToPay}</div>
                  <div className="text-[14px] text-gray-600">{row.amountPaid}</div>
                  <div>
                    <span className={`px-3 py-1.5 rounded-full text-[13px] font-bold ${row.statusType === 'deficit' ? 'bg-[#FEE4E2] text-[#D92D20]' : 'bg-[#ECFDF3] text-[#027A48]'}`}>
                      {row.statusValue}
                    </span>
                  </div>
                  <div className="flex justify-center">
                    <Link href="/dashboard/finance/receipt" className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-blue-600 hover:bg-gray-50 transition-colors">
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="flex justify-center">
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-blue-600 hover:bg-gray-50 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile View: Cards */}
        <div className="md:hidden flex flex-col gap-4">
          {paymentHistoryData.map((row) => (
            <div key={row.id} className="bg-white rounded-[20px] border border-gray-100 p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-[18px] font-bold text-gray-900 mb-1">{row.title}</h4>
                  <div className="font-bold text-[15px] text-gray-900">
                    {row.year}<span className="text-orange-500">.{row.semesterId}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href="/dashboard/finance/receipt" className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-blue-600 hover:bg-gray-50 transition-colors">
                    <Eye className="w-5 h-5" />
                  </Link>
                  <button className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-blue-600 hover:bg-gray-50 transition-colors">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="bg-[#F8F9FB] rounded-[16px] p-4 mt-5 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-[14px] text-gray-500">Amount to pay</span>
                  <span className="bg-white rounded-full px-4 py-1.5 font-bold text-[#1E293B] text-[15px]">
                    {row.amountToPay}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[14px] text-gray-500">Amount paid</span>
                  <span className="bg-white rounded-full px-4 py-1.5 font-bold text-[#1E293B] text-[15px]">
                    {row.amountPaid}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[14px] text-gray-500">
                    {row.statusType === 'deficit' ? 'Deficit:' : 'Surplus:'}
                  </span>
                  <span className={`rounded-full px-4 py-1.5 font-bold text-[15px] ${row.statusType === 'deficit' ? 'bg-[#FEE4E2] text-[#D92D20]' : 'bg-[#ECFDF3] text-[#027A48]'}`}>
                    {row.statusValue}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
