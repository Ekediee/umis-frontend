import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection, ImpactSection } from "@/components/landing/features-section";
import { PortalsSection } from "@/components/landing/portals-section";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#101828] flex flex-col relative overflow-hidden font-sans selection:bg-[#003CBB]/10 selection:text-[#003CBB]">
      {/* Background Watermarks from Figma Node 2701:33688 */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-[0.035]">
        <div className="relative w-full h-[5000px]">
          <Image
            src="/images/landing/background_watermarks.png"
            alt=""
            fill
            className="object-cover object-top"
            priority={false}
          />
        </div>
      </div>

      {/* Navigation */}
      <Navbar />

      {/* Main Content Sections strictly in Figma order */}
      <main className="flex-1 flex flex-col w-full z-10 relative">
        <HeroSection />
        <FeaturesSection />
        <PortalsSection />
        <ImpactSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
