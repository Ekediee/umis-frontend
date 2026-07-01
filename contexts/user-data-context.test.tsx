import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { UserDataProvider, useUserData } from "@/contexts/user-data-context";
import type { UMISResponse } from "@/lib/session";

// ─── Mock the server action ───────────────────────────────────────────────────
vi.mock("@/app/actions/user", () => ({
  getUserData: vi.fn(),
}));

import { getUserData } from "@/app/actions/user";
const mockGetUserData = getUserData as ReturnType<typeof vi.fn>;

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const mockUserData: UMISResponse = {
  entity_id: "42",
  entity_name: "Test Student",
  user_data: {
    account_number: null,
    contact_information: {
      country: null,
      email: "test@example.com",
      phone: null,
      residency_status: null,
      residential_address: null,
      town: null,
    },
    cummulative_gpa: 3.75,
    current_level: 300,
    degree_id: null,
    degree_name: null,
    department: "Computer Science",
    financial_approval: true,
    guardian_information: {
      guardian_address: null,
      guardian_country: null,
      guardian_name: null,
      guardian_phone: null,
      guardian_town: null,
    },
    is_off_campus: false,
    matric_number: "CSC/2021/001",
    off_campus_apprpval: false,
    personal_information: {
      student_name: "Test Student",
      matric_number: "CSC/2021/001",
      denomination: null,
      gender: "Male",
      marital_status: null,
      nationality: null,
      religion: null,
    },
    school_name: "Test University",
    status: "active",
    student_name: "Test Student",
    academic_information: {
      status: "active",
      study_level: 300,
      cummulative_gpa: 3.75,
      financial_approval: null,
      is_off_campus: false,
      off_campus_apprpval: null,
      residency_status: null,
    },
  },
};

// ─── Helper consumer component ────────────────────────────────────────────────
function UserDataConsumer() {
  const userData = useUserData();
  if (!userData) return <div data-testid="no-data">no data</div>;
  return <div data-testid="entity-name">{userData.entity_name}</div>;
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("UserDataProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls getUserData on mount and provides the result to consumers", async () => {
    mockGetUserData.mockResolvedValue(mockUserData);

    render(
      <UserDataProvider>
        <UserDataConsumer />
      </UserDataProvider>
    );

    // Initially the state is null — consumer shows "no data"
    expect(screen.getByTestId("no-data")).toBeInTheDocument();

    // After the promise resolves the context value updates
    await waitFor(() => {
      expect(screen.getByTestId("entity-name")).toHaveTextContent(
        "Test Student"
      );
    });

    expect(mockGetUserData).toHaveBeenCalledTimes(1);
  });

  it("renders with null when getUserData returns null", async () => {
    mockGetUserData.mockResolvedValue(null);

    render(
      <UserDataProvider>
        <UserDataConsumer />
      </UserDataProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("no-data")).toBeInTheDocument();
    });
  });

  it("calls getUserData exactly once (no repeated fetches on re-renders)", async () => {
    mockGetUserData.mockResolvedValue(mockUserData);

    const { rerender } = render(
      <UserDataProvider>
        <UserDataConsumer />
      </UserDataProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("entity-name")).toBeInTheDocument();
    });

    // Trigger a re-render of the provider
    rerender(
      <UserDataProvider>
        <UserDataConsumer />
      </UserDataProvider>
    );

    expect(mockGetUserData).toHaveBeenCalledTimes(1);
  });
});

describe("useUserData", () => {
  it("throws when used outside of UserDataProvider", () => {
    // Suppress the expected React error boundary output in test logs
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => render(<UserDataConsumer />)).toThrow(
      "useUserData must be used within a <UserDataProvider>"
    );

    consoleSpy.mockRestore();
  });
});
