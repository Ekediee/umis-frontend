"use client";

import { StudentProfileBanner } from "@/components/shared/student-profile-banner";
import { getUserData } from "@/app/actions/user";
import { UMISResponse } from "@/lib/session";
import React from "react";

interface WelcomeBannerProps {
  userData?: UMISResponse | null;
}

export function WelcomeBanner({userData}: WelcomeBannerProps) {

  const firstName = userData?.user_data?.personal_information?.student_name?.split(" ")[0] ?? "Student";
  const welcomeMessage = `Welcome back ${firstName} Here is your academic overview`;

  return (
    <div className="mb-5 md:mb-6" style={{fontWeight: '700'}}>
      <StudentProfileBanner
        welcomeMessage={welcomeMessage}
        userData={userData}
        showDetailedRow={true}
      />
    </div>
  );
}
