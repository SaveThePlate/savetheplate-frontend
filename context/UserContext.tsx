"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useState,
} from "react";
import { sanitizeErrorMessage } from "@/utils/errorUtils";
import { axiosInstance } from "@/lib/axiosInstance";

export type AuthUser = {
  id: number;
  email: string;
  username: string;
  role: string;
  phoneNumber?: number | null;
  mapsLink?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  profileImage?: string | null;
  emailVerified?: boolean | null;
};

interface UserContextType {
  /** Full authenticated user object (from `/users/me`) */
  user: AuthUser | null;
  /** Convenience: same as `user?.role` */
  userRole: string | null;
  loading: boolean;
  error: string | null;
  /**
   * Legacy name kept to minimize churn: refreshes user session information.
   * Internally this calls `/users/me`.
   */
  fetchUserRole: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRole = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setUser(null);
      setUserRole(null);
      setLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.get("/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const me = response?.data as AuthUser;
      setUser(me || null);
      setUserRole(me?.role || null);
      setError(null);
    } catch (err: any) {
      // If auth is invalid, clear local token and reset session.
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        try {
          localStorage.removeItem("accessToken");
        } catch {}
        setUser(null);
        setUserRole(null);
      }

      const errorMsg = sanitizeErrorMessage(err, {
        action: "load user information",
        defaultMessage:
          "Unable to load user information. Please try again later.",
      });
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  const contextValue = useMemo(
    () => ({ user, userRole, loading, error, fetchUserRole }),
    [user, userRole, loading, error, fetchUserRole],
  );

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
