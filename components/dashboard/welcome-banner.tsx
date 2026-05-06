import { StudentProfileBanner } from "@/components/shared/student-profile-banner";

export function WelcomeBanner() {
  return (
    <div className="mb-5 md:mb-6" style={{fontWeight: '700'}}>
      <StudentProfileBanner
        welcomeMessage="Welcome back Yakubu, Here is your academic overview"
        showDetailedRow = {true}
      />
    </div>
  );
}
