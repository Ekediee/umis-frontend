"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getUserData } from "@/app/actions/user";
import type { UMISResponse } from "@/lib/session";

/**
 * Holds the current user's session data.
 * `undefined` means the context is not yet initialised (provider missing).
 * `null` means the data has been fetched but no session exists.
 */
const UserDataContext = createContext<UMISResponse | null | undefined>(
  undefined
);

/**
 * Fetches user session data once on mount and provides it to all
 * descendant components via UserDataContext.
 *
 * Place this in the (student-page) layout so every student page
 * shares a single fetch.
 */
export function UserDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userData, setUserData] = useState<UMISResponse | null>(null);

  useEffect(() => {
    getUserData().then(setUserData);
  }, []);

  return (
    <UserDataContext.Provider value={userData}>
      {children}
    </UserDataContext.Provider>
  );
}

/**
 * Returns the current user's session data from context.
 *
 * @throws {Error} if called outside of a `<UserDataProvider>`.
 */
export function useUserData(): UMISResponse | null {
  const ctx = useContext(UserDataContext);
  if (ctx === undefined) {
    throw new Error("useUserData must be used within a <UserDataProvider>");
  }
  return ctx;
}
