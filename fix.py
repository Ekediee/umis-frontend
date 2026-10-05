import os

filepath = "/home/ague/projects/office/umis-frontend/app/(student-page)/dashboard/finance/fees/payment/page.tsx"

with open(filepath, "r") as f:
    content = f.read()

target = "mealTypes={financeData?.meal_types || []}"
replacement = "mealTypes={financeData?.meal_types?.filter((m: any) => !m.selection.toLowerCase().includes(\"off campus\")) || []}"

if target in content:
    content = content.replace(target, replacement)
    with open(filepath, "w") as f:
        f.write(content)
    print("Fixed!")
else:
    print("Target not found. It might already be fixed, or the file reverted to something else.")
