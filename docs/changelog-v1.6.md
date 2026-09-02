# University Student Portal: Design Documentation & Master Flow
**Version:** 1.6.0
**Role:** Principal Product Designer & Senior Product Manager
**Status:** Final Design Phase (University Integration)

---

## 1. Executive Summary
This document outlines the strategic design and functional architecture for the University Student Portal. The portal is engineered to facilitate a seamless, end-to-end enrollment experience, prioritizing academic clarity, financial transparency, and data integrity.

---

## 2. Comprehensive Visual Identity & Design Tokens
The following palettes are the foundational building blocks of the portal's UI, ensuring a professional and authoritative aesthetic.

### A. Skye Palette (Primary Interaction & Brand)
Used for primary call-to-actions, active navigation highlights, and high-energy interactive components.
- **Scale:** `#ccdaf9`, `#aac2f5`, `#80a4f0`, `#5585ea`, `#2a67e5`, `#0048e0`, `#003cbb`, `#003095`, `#002470`, `#00184b`, `#000e2d`
- **Surfaces:** `#f5f8fe`, `#eef3fd`, `#e6edfc`, `#dde6fb`, `#d5e0fa`
- **Primary color:** `#003cbb`

### B. Indigo Palette (Structural Layout & Secondary Elements)
Used for structural headers, secondary utility buttons, sidebar backgrounds, and deep informational hierarchy.
- **Scale:** `#ccd6e7`, `#aabad7`, `#8098c3`, `#5575af`, `#2a539b`, `#003087`, `#002871`, `#00205a`, `#001844`, `#00102d`, `#000a1b`
- **Surfaces:** `#f5f7fa`, `#eef1f7`, `#e6ebf3`, `#dde4ef`, `#d5ddeb`

### C. Gold Palette (Academic Honors & Success States)
Reserved for academic audit highlights, honors achievements, and positive confirmation states.
- **Scale:** `#eee8ce`, `#e3d8ae`, `#d6c585`, `#c8b15c`, `#ba9e34`, `#ac8a0b`, `#8f7309`, `#735c07`, `#564506`, `#392e04`, `#221c02`
- **Surfaces:** `#fcfaf5`, `#f9f7ef`, `#f7f4e7`, `#f4f0de`, `#f1ecd6`

### D. Marigold Palette (Academic Alerts & Compliance)
Used for identifying carry-over courses, registration warnings, and critical compliance deadlines.
- **Scale:** `#f6e5b5`, `#f1d891`, `#eccb6c`, `#e8be47`, `#e3b122`, `#bd941c`, `#977617`, `#725911`, `#4c3b0b`, `#2d2307`
- **Surfaces:** `#f9efd3`, `#fefcf6`, `#fdfaf0`, `#fcf7e9`, `#fbf4e2`, `#faf2da`

### E. Emerald Palette (Success States)
Used for positive confirmation states, successful payments, and system success notifications.
- **Scale:** `#D1FADF`, `#12B76A`, `#027A48`
- **Surfaces:** `#ECFDF3`

### F. Orange Palette (Alerts & Warnings)
Used for academic alerts, missing prerequisites, and critical compliance warnings.
- **Scale:** `#FDBA8C`, `#F97316`, `#C2410C`
- **Surfaces:** `#FFF7ED`

---

## 3. The Integrated Master Flow: End-to-End Enrollment

### Phase 1: Discovery & Academic Preparation
*Goal: Strategic situational awareness and prerequisite mapping.*

1. **System Entry:** Direct access to the **Notification Center** via the Dashboard to locate session announcements.
2. **Academic Audit:** Navigate to **Academic Details** for a comprehensive review of previous **Semester Results**.
3. **Requirement Identification:** Systematically identify **Carry Over Courses** or **Repeated Courses** requiring immediate attention in the upcoming session.

### Phase 2: Course Registration & Validation
*Goal: Academic compliance and slot reservation.*

1. **Initiation:** Enter the **Registration Module** and select **Register Courses**.
2. **Group Allocation:** Select the designated **Class Group** for the current academic session.
3. **Academic Planning:** Select both **Current Semester Courses** and identified **Carry Over Courses** from the unified interface.
4. **Verification:** Review the **Summary of Selected Units** to ensure total credit load compliance.
5. **Finalization:** Submit registration and **Print the Course Form** for physical record-keeping.

### Phase 3: Financial Clearance & Ancillary Services
*Goal: Frictionless transaction management and student welfare onboarding.*

1. **Financial Transition:** Move to the **Finance Module** to initiate **School Fees** payment.
2. **Residence & Welfare:**
   - Select **Residence** (including **Off-Campus** registration).
   - Choose a **Meal Plan**.
   - Select a preferred **Worship Center**.
3. **Checkout & Review:** Final review of selections and costs. Option for **Partial** or **Full Payment** before redirecting to the **Payment Gateway**.
4. **Closure:** Success state validation followed by the **Show Receipt** command.

### Phase 4: Administrative Maintenance
*Goal: Lifecycle data hygiene and emergency readiness.*

1. **Profile Audit:** Final review of personal data within **My Profile**.
2. **Kin Update:** Specific mandatory update to **Next of Kin** details and **Contact Information** to ensure institutional record accuracy.

---

## 4. Design & Lifecycle Guardrails
- **Academic Persistence:** Ensure all registration data is cached across Phase 2 and 3 to prevent data loss.
- **Accessibility:** UI must maintain WCAG AA compliance using the Skye and Indigo palettes for primary legibility.
- **Validation Logic:** System should prevent Phase 3 checkout if Phase 2 verification fails credit load limits.
