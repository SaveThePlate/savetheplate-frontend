"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

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

  const fetchUserRole = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return; // Handle case when no token is available
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
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setError('Could not fetch user role. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // refresh the user role, allowing components to trigger a refresh when needed
  const refreshUserRole = async () => {
    setLoading(true);
    await fetchUserRole();
  };

  useEffect(() => {
    fetchUserRole();
    refreshUserRole();
  }, []);

  return (
    <UserContext.Provider value={{ userRole, loading, error, fetchUserRole }}>
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
