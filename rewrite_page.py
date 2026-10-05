import re

filepath = "/home/ague/projects/office/umis-frontend/app/(student-page)/dashboard/finance/fees/payment/page.tsx"

with open(filepath, "r") as f:
    lines = f.readlines()

out_lines = []
skip_next = 0

for i, line in enumerate(lines):
    if skip_next > 0:
        skip_next -= 1
        continue
    
    # Remove worshipAuto from getNextStep
    if "const worshipAuto =" in line and "getNextStep" in "".join(lines[max(0, i-5):i]):
        continue
    if "if (step === 1) return worshipAuto ? 3 : 2;" in line:
        out_lines.append(line.replace("worshipAuto ? 3 : 2", "2").replace("      // skip worship when auto-assigned", ""))
        continue

    # Remove worshipAuto from getPrevStep
    if "const worshipAuto =" in line and "getPrevStep" in "".join(lines[max(0, i-5):i]):
        continue
    if "if (step === 3) return worshipAuto ? 1 : 2;" in line:
        out_lines.append(line.replace("worshipAuto ? 1 : 2", "2").replace("       // skip back over worship when auto-assigned", ""))
        continue

    # Fix the useEffect that skips step 2
    if "if (isWorshipAutoAssigned && currentStep === 2) {" in line:
        # skip this and next 2 lines
        skip_next = 2
        continue
    if "// Also correct if worship is auto-assigned but we're stuck on step 2" in line:
        continue

    # Fix the useEffect that auto-assigns the WC
    if "// ── Auto-assign hall's worship center" in line:
        # skip this and next 7 lines
        skip_next = 7
        continue

    out_lines.append(line)

content = "".join(out_lines)

# Ensure excludedId is added to SelectWorshipCenter
if "excludedId=" not in content:
    content = re.sub(
        r'(lockedCenter=\{lockedWCDetails\})',
        r'\1\n            excludedId={(!isOffCampus && hallAssignedWC) ? String(hallAssignedWC.sabbath_class_id) : null}',
        content
    )

with open(filepath, "w") as f:
    f.write(content)

print("Cleaned up successfully.")
