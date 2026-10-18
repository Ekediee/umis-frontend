import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FinanceOverview } from "./finance-overview";
import * as paymentActions from "@/app/actions/payment";

vi.mock("@/app/actions/payment", () => ({
  getStudentFeesAction: vi.fn(),
}));

describe("FinanceOverview Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});

