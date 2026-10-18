import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GPAWhatIfSimulator } from "./gpa-what-if-simulator";
import * as academicActions from "@/app/actions/academic-details";

vi.mock("@/app/actions/academic-details", () => ({
  getRegisteredCoursesAction: vi.fn(),
}));
vi.mock("@/contexts/user-data-context", () => ({ useUserData: () => null }));

describe("GPAWhatIfSimulator courses", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the registered courses automatically once the student has registered", async () => {
    vi.mocked(academicActions.getRegisteredCoursesAction).mockResolvedValueOnce({
      data: [
        { courseId: "COSC 301", title: "Operating Systems", instructor: "", units: 3, isCarryOver: false },
        { courseId: "GEDS 220", title: "Christian Faith", instructor: "", units: 2, isCarryOver: true },
      ],
    });

    render(<GPAWhatIfSimulator isOpen onClose={() => {}} />);

    expect(await screen.findByText("Your Registered Courses (2)")).toBeDefined();
    expect(screen.getByText("COSC 301")).toBeDefined();
    expect(screen.getByText("Registered")).toBeDefined();
    expect(screen.getByText("Carry-over")).toBeDefined();
    // Registered courses can't be added to, removed or edited (only their grades)
    expect(screen.queryByText("Add Course")).toBeNull();
    expect(screen.queryByLabelText("Remove course")).toBeNull();
  });

  it("lets the student add courses before they register", async () => {
    vi.mocked(academicActions.getRegisteredCoursesAction).mockResolvedValueOnce({ data: [] });

    render(<GPAWhatIfSimulator isOpen onClose={() => {}} />);

    expect(await screen.findByText(/haven't registered for this semester yet/)).toBeDefined();
    fireEvent.click(screen.getByText("Add Course"));
    await waitFor(() => expect(screen.getByText("Simulated Courses (1)")).toBeDefined());
    expect(screen.getByLabelText("Remove course")).toBeDefined();
  });
});
