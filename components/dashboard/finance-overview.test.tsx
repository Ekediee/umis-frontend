import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FinanceOverview } from "./finance-overview";
import * as paymentActions from "@/app/actions/payment";
import { useWalletStore } from "@/hooks/use-wallet-store";
import { useRegistrationStore } from "@/hooks/use-registration-store";
import * as offlineStorage from "@/lib/offline-storage";

vi.mock("@/app/actions/payment", () => ({
  getStudentFeesAction: vi.fn(),
  getWalletBalanceAction: vi.fn(),
}));

vi.mock("@/lib/offline-storage", () => ({
  getOfflineDraft: vi.fn().mockResolvedValue(null),
  OFFLINE_FINANCE_REG_KEY: "offline-finance-registration",
}));

describe("FinanceOverview Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(paymentActions.getWalletBalanceAction).mockResolvedValue({
      success: true,
      balance: 0,
      rawBalance: "0",
    });
    useWalletStore.setState({ balance: 0, rawBalance: "0" });
    useRegistrationStore.setState({ isFinancialSubmitted: false, payState: "not_started" });
    vi.mocked(offlineStorage.getOfflineDraft).mockResolvedValue(null);
  });

  it("renders all four fee categories and fetches live data", async () => {
    vi.mocked(paymentActions.getStudentFeesAction).mockResolvedValueOnce({
      success: true,
      data: {
        estimated_full_session_fee: 4500000,
        estimated_semester_fee: 2250000,
        amount_paid_for_semester: 1500000,
        total_outstanding_fees: -1252059.4,
      },
    });

    render(<FinanceOverview />);

    expect(screen.getByText("Estimated Full Session Fee")).toBeDefined();
    expect(screen.getByText("Estimated Semester Fee")).toBeDefined();
    expect(screen.getByText("Amount Paid For Semester")).toBeDefined();
    expect(screen.getByText("Outstanding Payment")).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText("₦4,500,000")).toBeDefined();
      expect(screen.getByText("₦2,250,000")).toBeDefined();
      expect(screen.getByText("₦1,500,000")).toBeDefined();
      expect(screen.getByText("₦1,252,059.40")).toBeDefined();
      expect(screen.getByText("Credit")).toBeDefined();
    });
  });

  it("shows Debt badge when total_outstanding_fees is positive", async () => {
    vi.mocked(paymentActions.getStudentFeesAction).mockResolvedValueOnce({
      success: true,
      data: {
        estimated_full_session_fee: 4500000,
        estimated_semester_fee: 2250000,
        amount_paid_for_semester: 1500000,
        total_outstanding_fees: 750000,
      },
    });

    render(<FinanceOverview />);

    await waitFor(() => {
      expect(screen.getByText("₦750,000")).toBeDefined();
      expect(screen.getByText("Debt")).toBeDefined();
    });
  });

  it("toggles fee values masking with the eye toggle button", async () => {
    vi.mocked(paymentActions.getStudentFeesAction).mockResolvedValueOnce({
      success: true,
      data: {
        estimated_full_session_fee: 4500000,
        estimated_semester_fee: 2250000,
        amount_paid_for_semester: 1500000,
        total_outstanding_fees: -1252059.4,
      },
    });

    render(<FinanceOverview />);

    await waitFor(() => {
      expect(screen.getByText("₦4,500,000")).toBeDefined();
    });

    const toggleBtn = screen.getByLabelText(/hide fees/i);
    fireEvent.click(toggleBtn);

    expect(screen.getAllByText("****").length).toBe(4);
  });

  it("shows 'Fund your wallet' button pointing to finance fund action when wallet balance is insufficient", async () => {
    vi.mocked(paymentActions.getWalletBalanceAction).mockResolvedValueOnce({
      success: true,
      balance: 500000,
      rawBalance: "500000",
    });
    useWalletStore.setState({ balance: 500000 });
    vi.mocked(paymentActions.getStudentFeesAction).mockResolvedValueOnce({
      success: true,
      data: {
        estimated_full_session_fee: 4500000,
        estimated_semester_fee: 2250000,
        amount_paid_for_semester: 0,
        total_outstanding_fees: 2250000,
      },
    });

    render(<FinanceOverview />);

    await waitFor(() => {
      const btn = screen.getByRole("link", { name: /fund your wallet/i });
      expect(btn).toBeDefined();
      expect(btn.getAttribute("href")).toBe("/dashboard/finance?action=fund&amount=1750000");
    });
  });

  it("shows 'Pay School Fees' button pointing to financial registration flow when wallet balance is sufficient but registration not started", async () => {
    vi.mocked(paymentActions.getWalletBalanceAction).mockResolvedValueOnce({
      success: true,
      balance: 2500000,
      rawBalance: "2500000",
    });
    useWalletStore.setState({ balance: 2500000 });
    vi.mocked(paymentActions.getStudentFeesAction).mockResolvedValueOnce({
      success: true,
      data: {
        estimated_full_session_fee: 4500000,
        estimated_semester_fee: 2250000,
        amount_paid_for_semester: 0,
        total_outstanding_fees: 2250000,
      },
    });

    render(<FinanceOverview />);

    await waitFor(() => {
      const btn = screen.getByRole("link", { name: /pay school fees/i });
      expect(btn).toBeDefined();
      expect(btn.getAttribute("href")).toBe("/dashboard/finance/fees");
    });
  });

  it("shows 'Pay School Fees' button pointing directly to payment screen (step 5) when wallet balance is sufficient and financial registration is submitted", async () => {
    vi.mocked(paymentActions.getWalletBalanceAction).mockResolvedValueOnce({
      success: true,
      balance: 3000000,
      rawBalance: "3000000",
    });
    useWalletStore.setState({ balance: 3000000 });
    useRegistrationStore.setState({ isFinancialSubmitted: true });
    vi.mocked(paymentActions.getStudentFeesAction).mockResolvedValueOnce({
      success: true,
      data: {
        estimated_full_session_fee: 4500000,
        estimated_semester_fee: 2250000,
        amount_paid_for_semester: 0,
        total_outstanding_fees: 2250000,
      },
    });

    render(<FinanceOverview />);

    await waitFor(() => {
      const btn = screen.getByRole("link", { name: /pay school fees/i });
      expect(btn).toBeDefined();
      expect(btn.getAttribute("href")).toBe("/dashboard/finance/fees/payment?step=5");
    });
  });
});
