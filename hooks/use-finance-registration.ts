"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getFinanceRegistrationAction,
  getFinancialRegSummaryAction,
} from "@/app/actions/registration";
import type {
  FinanceRegistrationData,
  FinancialRegSummaryData,
} from "@/app/actions/registration";
import { getStudentFeesAction } from "@/app/actions/payment";
import type { StudentFeesData } from "@/app/actions/payment.types";

interface UseFinanceRegistrationResult {
  data: FinanceRegistrationData | null;
  summary: FinancialRegSummaryData | null;
  studentFees: StudentFeesData | null;
  isLoading: boolean;
  error: string | null;
  markAsLocked: () => void;
  refreshSummaryAndFees: () => Promise<void>;
}

/**
 * Fetches all finance-registration data (residences, worship centers,
 * meal types, general charges), the student's existing financial registration
 * summary (/api/v1/academics/financial-reg-summary), and student fee ledger
 * (/api/v1/payment/student-fees) once on mount.
 *
 * Consumers pass the data down as props to step components so the
 * network call happens only once for the entire payment flow.
 */
export function useFinanceRegistration(): UseFinanceRegistrationResult {
  const [data, setData] = useState<FinanceRegistrationData | null>(null);
  const [summary, setSummary] = useState<FinancialRegSummaryData | null>(null);
  const [studentFees, setStudentFees] = useState<StudentFeesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    Promise.all([
      getFinanceRegistrationAction(),
      getFinancialRegSummaryAction().catch(() => ({ data: undefined })),
      getStudentFeesAction().catch(() => ({ success: false, data: undefined })),
    ]).then(([regResult, summaryResult, feesResult]) => {
      if (cancelled) return;

      if (regResult.error) {
        setError(regResult.error);
      } else if (regResult.data) {
        setData(regResult.data);
      }

      if (summaryResult?.data) {
        setSummary(summaryResult.data);
      }

      if (feesResult?.success && feesResult.data) {
        setStudentFees(feesResult.data);
      }

      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const markAsLocked = useCallback(() => {
    setSummary((prev) =>
      prev
        ? { ...prev, lock_financial_reg: true }
        : {
            meal_type: null,
            worship_center: null,
            semester_residence: null,
            lock_financial_reg: true,
          }
    );
  }, []);

  const refreshSummaryAndFees = useCallback(async () => {
    const [summaryResult, feesResult] = await Promise.all([
      getFinancialRegSummaryAction().catch(() => ({ data: undefined })),
      getStudentFeesAction().catch(() => ({ success: false, data: undefined })),
    ]);

    if (summaryResult?.data) {
      setSummary({
        ...summaryResult.data,
        lock_financial_reg: true,
      });
    } else {
      markAsLocked();
    }

    if (feesResult?.success && feesResult.data) {
      setStudentFees(feesResult.data);
    }
  }, [markAsLocked]);

  return {
    data,
    summary,
    studentFees,
    isLoading,
    error,
    markAsLocked,
    refreshSummaryAndFees,
  };
}

