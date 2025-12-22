"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { ReloadIcon } from "@radix-ui/react-icons";
import axios from "axios";
import { useLanguage } from "@/context/LanguageContext";
import Image from "next/image";

function VerifyEmailPage() {
  const { token }: { token: string } = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/verify-email`,
          {
            token: token,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.data?.verified) {
          setVerified(true);
          // Redirect to sign in after 3 seconds
          setTimeout(() => {
            router.push("/signIn");
          }, 3000);
        } else {
          setError("Email verification failed. Please try again.");
        }
      } catch (err: any) {
        console.error("Error verifying email:", err);
        const errorMessage = err?.response?.data?.error || 
                            err?.response?.data?.message || 
                            "Email verification failed. The link may have expired. Please request a new verification email.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Verifying your email...</p>
        </div>
      </div>
    );
  }

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
        <div className="bg-white rounded-xl shadow-xl border border-border p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <Image
              src="/logo.png"
              alt="Save The Plate"
              width={80}
              height={80}
              className="mx-auto"
            />
          </div>
          <div className="mb-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Email Verified! ✅
            </h1>
            <p className="text-muted-foreground">
              Your email address has been successfully verified. You can now use all features of SaveThePlate.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Redirecting to sign in...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
      <div className="bg-white rounded-xl shadow-xl border border-border p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <Image
            src="/logo.png"
            alt="Save The Plate"
            width={80}
            height={80}
            className="mx-auto"
          />
        </div>
        <div className="mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Verification Failed
          </h1>
          <p className="text-muted-foreground mb-4">
            {error || "Unable to verify your email address."}
          </p>
        </div>
        <div className="space-y-3">
          <button
            onClick={() => router.push("/signIn")}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Go to Sign In
          </button>
          <p className="text-sm text-muted-foreground">
            You can request a new verification email from your profile settings.
          </p>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmailPage;

