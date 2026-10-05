import re

filepath = "/home/ague/projects/office/umis-frontend/app/(student-page)/dashboard/finance/fees/payment/page.tsx"

with open(filepath, "r") as f:
    content = f.read()

# Add excludedId
content = re.sub(
    r'(lockedCenter=\{lockedWCDetails\})',
    r'\1\n            excludedId={(!isOffCampus && hallAssignedWC) ? String(hallAssignedWC.sabbath_class_id) : null}',
    content
)

with open(filepath, "w") as f:
    f.write(content)
print("Done")
