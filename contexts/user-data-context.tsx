"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getUserData, getStudentProfileAction } from "@/app/actions/user";
import type { UMISResponse } from "@/lib/session";

/**
 * Holds the current user's session data.
 * `undefined` means the context is not yet initialised (provider missing).
 * `null` means the data has been fetched but no session exists.
 */
const UserDataContext = createContext<UMISResponse | null | undefined>(
  undefined
);

type UserDataUpdater = (update: (prev: UMISResponse | null) => UMISResponse | null) => void;

/**
 * Lets a page patch the shared user data after a successful edit (e.g. a new
 * email on the profile page), so the header, sidebar and change-password modal
 * see the change straight away instead of after a full reload.
 */
const UpdateUserDataContext = createContext<UserDataUpdater>(() => {});

/**
 * Fetches user session data once on mount and provides it to all
 * descendant components via UserDataContext.
 *
 * Place this in the (student-page) layout so every student page
 * shares a single fetch.
 */
export function UserDataProvider({
  children,
  initialData = null,
}: {
  children: React.ReactNode;
  initialData?: UMISResponse | null;
}) {
  const [userData, setUserData] = useState<UMISResponse | null>(initialData);

  useEffect(() => {
    if (initialData) {
      setUserData(initialData);
    } else {
      // The user_data cookie can be absent while the session token is still
      // valid (e.g. cookie eviction, partial clear). If getUserData() returns
      // null, fall back to the live API so the context is never silently empty.
      getUserData().then((data) => {
        if (data) {
          setUserData(data);
        } else {
          getStudentProfileAction().then(setUserData);
        }
      });
    }
  }, [initialData]);

  const update = useCallback<UserDataUpdater>((fn) => setUserData((prev) => fn(prev)), []);

  return (
    <UpdateUserDataContext.Provider value={update}>
      <UserDataContext.Provider value={userData}>
        {children}
      </UserDataContext.Provider>
    </UpdateUserDataContext.Provider>
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
    return null;
  }
  return ctx;
}

/** Patches the shared user data. A no-op outside `<UserDataProvider>`. */
export function useUpdateUserData(): UserDataUpdater {
  return useContext(UpdateUserDataContext);
}
