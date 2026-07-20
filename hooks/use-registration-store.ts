import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RegistrationStatusState = "not_started" | "in_progress" | "completed";

interface RegistrationState {
  regState: RegistrationStatusState;
  payState: RegistrationStatusState;
  setRegState: (state: RegistrationStatusState) => void;
  setPayState: (state: RegistrationStatusState) => void;
  resetStore: () => void;
}

export const useRegistrationStore = create<RegistrationState>()(
  persist(
    (set) => ({
      regState: "not_started",
      payState: "not_started",
      setRegState: (state) => set({ regState: state }),
      setPayState: (state) => set({ payState: state }),
      resetStore: () => set({ regState: "not_started", payState: "not_started" }),
    }),
    {
      name: "registration-status-storage",
    }
  )
);
