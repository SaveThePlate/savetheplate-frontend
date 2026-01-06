"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Phone, CheckCircle2, XCircle, Send, Check } from "lucide-react";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";
import { axiosInstance } from "@/lib/axiosInstance";
import Image from "next/image";
import { sanitizeImageUrl, shouldUnoptimizeImage } from "@/utils/imageUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DEFAULT_PROFILE_IMAGE = "/logo.png";

export default function AccountDetails() {
  const router = useRouter();
  const { t } = useLanguage();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState<number | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [profileImage, setProfileImage] = useState(DEFAULT_PROFILE_IMAGE);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<{ username: string; phoneNumber: number | null }>({ username: "", phoneNumber: null });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifyingCode, setVerifyingCode] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          router.push("/signIn");
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };
        const profileRes = await axiosInstance.get(`/users/me`, { headers });

        const { username, email, phoneNumber, profileImage, emailVerified } = profileRes.data || {};
        setUsername(username || "");
        setEmail(email || "");
        setPhoneNumber(phoneNumber ?? null);
        setEmailVerified(emailVerified || false);
        setFormData({ username: username || "", phoneNumber: phoneNumber ?? null });
        setProfileImage(profileImage || DEFAULT_PROFILE_IMAGE);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router, t]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "phoneNumber") {
      const numberValue = value === "" ? null : parseInt(value, 10);
      setFormData((prev) => ({ ...prev, phoneNumber: numberValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/signIn");
        return;
      }

      setIsSaving(true);

      await axiosInstance.post(`/users/me`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsername(formData.username);
      setPhoneNumber(formData.phoneNumber);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      console.error(err?.response?.data || err?.message || err);
      toast.error(err?.response?.data?.error || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/signIn");
        return;
      }

      setSendingVerification(true);

      await axiosInstance.post(
        `/auth/send-verification-email`,
        { email },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Verification email sent! Check your inbox for the verification link or code.");
      setShowVerifyDialog(true);
    } catch (err: any) {
      console.error("Failed to send verification email:", err);
      const errorMsg = err?.response?.data?.error || "Failed to send verification email";
      toast.error(errorMsg);
    } finally {
      setSendingVerification(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code.");
      return;
    }

    setVerifyingCode(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/signIn");
        return;
      }

      const response = await axiosInstance.post(
        `/auth/verify-email-code`,
        {
          email: email.trim(),
          code: verificationCode.trim(),
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.verified) {
        setEmailVerified(true);
        setShowVerifyDialog(false);
        setVerificationCode("");
        toast.success("Email verified successfully!");
        
        // Refresh profile data
        const profileRes = await axiosInstance.get(`/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { emailVerified: newEmailVerified } = profileRes.data || {};
        setEmailVerified(newEmailVerified || false);
      } else {
        toast.error("Invalid verification code. Please try again.");
      }
    } catch (err: any) {
      console.error("Error verifying code:", err);
      const errorMsg = err?.response?.data?.error || 
                      err?.response?.data?.message || 
                      "Invalid verification code. Please try again.";
      toast.error(errorMsg);
    } finally {
      setVerifyingCode(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const displayName = username || email || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen pb-24 px-4 pt-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push("/client/profile")}
          className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center hover:bg-emerald-50 transition-colors"
        >
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="font-display font-bold text-3xl">{t("profile.accountDetails") || "Account Details"}</h1>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl p-6 border border-border shadow-sm mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold overflow-hidden">
            {profileImage && profileImage !== DEFAULT_PROFILE_IMAGE ? (
              <Image
                src={sanitizeImageUrl(profileImage)}
                alt={displayName}
                width={64}
                height={64}
                className="w-full h-full object-cover"
                unoptimized={shouldUnoptimizeImage(sanitizeImageUrl(profileImage))}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = DEFAULT_PROFILE_IMAGE;
                }}
              />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-xl">{displayName}</h2>
            <p className="text-muted-foreground text-sm">{email}</p>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t("client.profile.username") || "Username"}
              </label>
              <input
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder={t("client.profile.username") || "Username"}
                className="w-full p-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:outline-none text-foreground bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t("client.profile.phone_number") || "Phone Number"}
              </label>
              <input
                name="phoneNumber"
                type="number"
                value={formData.phoneNumber ?? ""}
                onChange={handleInputChange}
                placeholder={t("client.profile.phone_number") || "Phone Number"}
                className="w-full p-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:outline-none text-foreground bg-white"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    {t("common.saved") || "Saved"}
                  </>
                ) : isSaving ? (
                  t("common.saving") || "Saving..."
                ) : (
                  t("common.save") || "Save"
                )}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData({ username, phoneNumber });
                }}
                className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors"
              >
                {t("common.cancel") || "Cancel"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-border">
              <User className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("client.profile.username") || "Username"}</p>
                <p className="font-medium">{username || "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-border">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{email || "-"}</p>
                  </div>
                  {emailVerified ? (
                    <div className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-medium">Verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-amber-600">
                      <XCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">Not Verified</span>
                    </div>
                  )}
                </div>
                {!emailVerified && (
                  <div className="mt-2 flex flex-col gap-2">
                    <button
                      onClick={handleResendVerification}
                      disabled={sendingVerification}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      {sendingVerification ? "Sending..." : "Send Verification Email"}
                    </button>
                    <button
                      onClick={() => setShowVerifyDialog(true)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Or enter verification code
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-border">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("client.profile.phone_number") || "Phone Number"}</p>
                <p className="font-medium">{phoneNumber || "-"}</p>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              {t("common.edit") || "Edit"}
            </button>
          </div>
        )}
      </div>

      {/* Verification Code Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Verify Your Email</DialogTitle>
            <DialogDescription>
              Enter the 6-digit verification code sent to <strong>{email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setVerificationCode(value);
                }}
                placeholder="000000"
                className="w-full p-4 text-center text-2xl font-bold tracking-widest border-2 border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:outline-none text-foreground bg-white"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowVerifyDialog(false);
                  setVerificationCode("");
                }}
                className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyCode}
                disabled={verifyingCode || verificationCode.length !== 6}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {verifyingCode ? "Verifying..." : "Verify"}
              </button>
            </div>
            <button
              onClick={handleResendVerification}
              disabled={sendingVerification}
              className="w-full text-xs text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50"
            >
              {sendingVerification ? "Sending..." : "Resend code"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

