import json

transcript_path = "/home/ague/.gemini/antigravity/brain/adedd695-fb45-47c3-9b34-f30a728327a3/.system_generated/logs/transcript_full.jsonl"

files_to_restore = [
    "/home/ague/projects/office/umis-frontend/app/(student-page)/dashboard/finance/fees/payment/page.tsx",
    "/home/ague/projects/office/umis-frontend/components/fees/payment-stepper.tsx",
    "/home/ague/projects/office/umis-frontend/components/fees/payment-progress-sheet.tsx",
    "/home/ague/projects/office/umis-frontend/hooks/use-registration-store.ts",
    "/home/ague/projects/office/umis-frontend/components/fees/steps/payment-summary.tsx",
    "/home/ague/projects/office/umis-frontend/components/registration/steps/select-worship-center.tsx"
]

contents = {}

with open(transcript_path, "r") as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get("type") == "PLANNER_RESPONSE":
                calls = data.get("tool_calls", [])
                for call in calls:
                    args = call.get("args", {})
                    target = args.get("TargetFile")
                    if target in files_to_restore:
                        contents[target] = args.get("CodeContent")
        except Exception as e:
            pass

for target, content in contents.items():
    print(f"Restoring {target}...")
    with open(target, "w") as f:
        f.write(content)

print(f"Restored {len(contents)} files.")
