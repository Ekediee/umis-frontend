import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import FeesPage from "./page";
import { getOfflineDraft } from "@/lib/offline-storage";
import { useRegistrationStore } from "@/hooks/use-registration-store";

const replace = vi.fn();
let params = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, back: vi.fn(), push: vi.fn() }),
  useSearchParams: () => params,
}));

vi.mock("@/app/actions/registration", () => ({
  getSemesterRegistrationStatusAction: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/offline-storage", () => ({
  getOfflineDraft: vi.fn(),
  OFFLINE_FINANCE_REG_KEY: "offline-finance-registration",
}));

const draft = vi.mocked(getOfflineDraft);
const question = "How would you like to register?";

describe("Financial registration choice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    params = new URLSearchParams();
    draft.mockResolvedValue(undefined);
    useRegistrationStore.setState({ payState: "not_started", isFinancialSubmitted: false });
  });

  it("asks a student who hasn't chosen yet", async () => {
    render(<FeesPage />);

    expect(await screen.findByText(question)).toBeDefined();
    expect(replace).not.toHaveBeenCalled();
  });

  it("sends a student who already chose back to where they stopped", async () => {
    draft.mockResolvedValue({ paymentType: "semester", currentStep: 3 } as never);

    render(<FeesPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard/finance/fees/payment?type=semester"));
    expect(screen.queryByText(question)).toBeNull();
  });

  it("keeps the choice when the student has reached payment", async () => {
    draft.mockResolvedValue({ paymentType: "full", currentStep: 4 } as never);
    useRegistrationStore.setState({ payState: "in_progress", isFinancialSubmitted: true });

    render(<FeesPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard/finance/fees/payment?type=full&step=5"));
  });

  it("asks again after a completed payment", async () => {
    draft.mockResolvedValue({ paymentType: "semester", currentStep: 4 } as never);
    useRegistrationStore.setState({ payState: "completed" });

    render(<FeesPage />);

    expect(await screen.findByText(question)).toBeDefined();
    expect(replace).not.toHaveBeenCalled();
  });

  it("stays on the screen when the student chose to change their option", async () => {
    params = new URLSearchParams("change=semester");
    draft.mockResolvedValue({ paymentType: "semester", currentStep: 1 } as never);

    render(<FeesPage />);

    expect(await screen.findByText(question)).toBeDefined();
    expect(replace).not.toHaveBeenCalled();
  });
});
