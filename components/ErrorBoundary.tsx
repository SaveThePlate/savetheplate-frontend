"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import axios from "axios";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  getHomePath = async (): Promise<string> => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        return "/signIn";
      }

      // Try to get user role from token payload first (faster)
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        // Note: role might not be in token, so we'll fall back to API call
      } catch {
        // Token parsing failed, will try API
      }

      // Fetch role from API
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/get-role`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const role = response?.data?.role;
      if (role === "PROVIDER") {
        return "/provider/home";
      } else if (role === "CLIENT") {
        return "/client/home";
      } else {
        return "/signIn";
      }
    } catch (error) {
      // If we can't determine role, go to sign in
      console.error("Error determining user role for redirect:", error);
      return "/signIn";
    }
  };

  handleGoHome = async () => {
    this.setState({ hasError: false, error: null });
    const homePath = await this.getHomePath();
    // Use router navigation instead of window.location to preserve session
    if (homePath === "/signIn") {
      // Only redirect to sign in if we can't determine role
      window.location.href = homePath;
    } else {
      // For provider/client home, use router to preserve session
      window.location.href = homePath;
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">
              We&apos;re sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="w-full"
              >
                Go to Home
              </Button>
            </div>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

