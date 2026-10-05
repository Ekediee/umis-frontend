import re

filepath = "/home/ague/projects/office/umis-frontend/app/(student-page)/dashboard/finance/fees/payment/page.tsx"

with open(filepath, "r") as f:
    content = f.read()

# 1. Update visibleSteps
target_visible = """  const visibleSteps = useMemo((): StepDefinition[] => {
    const offCampus = selectedResidence === "OFF_CAMPUS";
    const worshipAuto = !offCampus && !!hallAssignedWC;

    return [
      { id: 1, title: "Select Residence" },
      { id: 2, title: "Select Worship Center" },
      { id: 3, title: "Select Meal Plan" },
      { id: 4, title: "Summary" },
    ].filter((s) => {
      // If auto-assigned, we hide the step UNLESS it is locked.
      // Actually, if it's auto-assigned, they don't get to choose anyway.
      if (s.id === 2 && worshipAuto) return false;
      if (s.id === 3 && offCampus) return false;
      return true;
    });
  }, [selectedResidence, hallAssignedWC]);"""

replacement_visible = """  const visibleSteps = useMemo((): StepDefinition[] => {
    const offCampus = selectedResidence === "OFF_CAMPUS";

    return [
      { id: 1, title: "Select Residence" },
      { id: 2, title: "Select Worship Center" },
      { id: 3, title: "Select Meal Plan" },
      { id: 4, title: "Summary" },
    ].filter((s) => {
      if (s.id === 3 && offCampus) return false;
      return true;
    });
  }, [selectedResidence]);"""

content = content.replace(target_visible, replacement_visible)

# 2. Update getNextStep
target_next = """  const getNextStep = (step: number): number => {
    // Re-derive inside the function from state so there is no stale closure risk
    const offCampus = selectedResidence === "OFF_CAMPUS";
    const worshipAuto = !offCampus && !!hallAssignedWC;

    if (step === 1) return worshipAuto ? 3 : 2;      // skip worship when auto-assigned
    if (step === 2) return offCampus ? 4 : 3;         // skip meal when off-campus
    if (step === 3) return 4;
    return step;
  };"""

replacement_next = """  const getNextStep = (step: number): number => {
    const offCampus = selectedResidence === "OFF_CAMPUS";
    if (step === 1) return 2;
    if (step === 2) return offCampus ? 4 : 3;
    if (step === 3) return 4;
    return step;
  };"""

content = content.replace(target_next, replacement_next)

# 3. Update getPrevStep
target_prev = """  const getPrevStep = (step: number): number => {
    const offCampus = selectedResidence === "OFF_CAMPUS";
    const worshipAuto = !offCampus && !!hallAssignedWC;

    if (step === 4) return offCampus ? 2 : 3;
    if (step === 3) return worshipAuto ? 1 : 2;
    if (step === 2) return 1;
    return step;
  };"""

replacement_prev = """  const getPrevStep = (step: number): number => {
    const offCampus = selectedResidence === "OFF_CAMPUS";
    if (step === 4) return offCampus ? 2 : 3;
    if (step === 3) return 2;
    if (step === 2) return 1;
    return step;
  };"""

content = content.replace(target_prev, replacement_prev)

# 4. Add excludedId to SelectWorshipCenter
target_worship = """        {currentStep === 2 && (
          <SelectWorshipCenter
            selectedId={selectedWorshipCenterId}
            onSelect={setSelectedWorshipCenterId}
            worshipCenters={mappedWorshipCenters}
            isLoading={isLoading}
            error={error}
            isLocked={isWorshipLocked}
            lockedUntil={worshipCenterLockedUntil}
            lockedCenter={lockedCenterDetails}
          />
        )}"""

replacement_worship = """        {currentStep === 2 && (
          <SelectWorshipCenter
            selectedId={selectedWorshipCenterId}
            onSelect={setSelectedWorshipCenterId}
            worshipCenters={mappedWorshipCenters}
            isLoading={isLoading}
            error={error}
            isLocked={isWorshipLocked}
            lockedUntil={worshipCenterLockedUntil}
            lockedCenter={lockedCenterDetails}
            excludedId={(!isOffCampus && hallAssignedWC) ? String(hallAssignedWC.sabbath_class_id) : null}
          />
        )}"""

content = content.replace(target_worship, replacement_worship)

# 5. Fix isWorshipAutoAssigned usage
# Instead of passing isWorshipAutoAssigned={isWorshipAutoAssigned} we pass false
# Wait, let's just search for it and replace it.
content = re.sub(r'isWorshipAutoAssigned=\{isWorshipAutoAssigned\}', 'isWorshipAutoAssigned={false}', content)

with open(filepath, "w") as f:
    f.write(content)

print("Patched successfully.")
