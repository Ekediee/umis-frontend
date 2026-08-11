"use client";

import { useState, useEffect } from "react";
import { getFinanceRegistrationAction } from "@/app/actions/registration";
import type { FinanceRegistrationData } from "@/app/actions/registration";

interface UseFinanceRegistrationResult {
  data: FinanceRegistrationData | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches all finance-registration data (residences, worship centers,
 * meal types, general charges) once on mount.
 *
 * Consumers pass the data down as props to step components so the
 * network call happens only once for the entire payment flow.
 */
export function useFinanceRegistration(): UseFinanceRegistrationResult {
  const [data, setData] = useState<FinanceRegistrationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    getFinanceRegistrationAction().then((result) => {
      if (cancelled) return;

      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setData(result.data);
      }
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoading, error };
}
