"use client";
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { sanitizeErrorMessage } from '@/utils/errorUtils';
interface UserContextType {
  userRole: string | null;
  loading: boolean;
  error: string | null;
  fetchUserRole: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const fetchUserRole = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      // No token - user is not authenticated, but don't redirect
      // Let individual pages handle their own authentication checks
      setUserRole(null);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(process.env.NEXT_PUBLIC_BACKEND_URL + '/users/get-role', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        setUserRole(response.data.role);
      } else {
        console.error('Failed to fetch user role:', response.data.message);
        const errorMsg = sanitizeErrorMessage({ response: { data: { message: response.data.message } } }, {
          action: "load user information",
          defaultMessage: "Unable to load user information. Please try again later."
        });
        setError(errorMsg);
        setUserRole(null);
      }
    } catch (error: any) {
      console.error('Error fetching user role:', error);
      const errorMsg = sanitizeErrorMessage(error, {
        action: "load user information",
        defaultMessage: "Unable to load user information. Please try again later."
      });
      setError(errorMsg);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({ userRole, loading, error, fetchUserRole }),
    [userRole, loading, error, fetchUserRole]
  );

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
