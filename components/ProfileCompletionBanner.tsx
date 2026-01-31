"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { AlertCircle, MapPin, Map, Camera, CheckCircle } from "lucide-react";

interface ProfileData {
  location?: string;
  mapsLink?: string;
  profileImage?: string | { url?: string };
}

interface ProfileCompletionBannerProps {
  profile: ProfileData | null;
  onEditProfile: () => void;
}

export const ProfileCompletionBanner: React.FC<ProfileCompletionBannerProps> = ({ 
  profile, 
  onEditProfile 
}) => {
  const { t } = useLanguage();
  const router = useRouter();

  // Check what's missing from the profile
  const missingItems = React.useMemo(() => {
    const items = [];
    
    if (!profile?.location || profile.location.trim() === '') {
      items.push({
        key: 'location',
        icon: MapPin,
        title: t("profile_completion.missing_location"),
        priority: 'high'
      });
    }
    
    if (!profile?.mapsLink || profile.mapsLink.trim() === '') {
      items.push({
        key: 'maps',
        icon: Map,
        title: t("profile_completion.missing_maps"),
        priority: 'high'
      });
    }
    
    if (!profile?.profileImage) {
      items.push({
        key: 'image',
        icon: Camera,
        title: t("profile_completion.missing_image"),
        priority: 'medium'
      });
    }
    
    return items;
  }, [profile, t]);

  // If profile is complete, show success message
  if (missingItems.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-emerald-700" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-emerald-900">
              {t("profile_completion.profile_complete")}
            </h3>
            <p className="text-sm text-emerald-700 mt-1">
              Your profile has all the information customers need to find and trust you.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Sort by priority (high first)
  const sortedItems = missingItems.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1 };
    return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <AlertCircle className="w-5 h-5 text-amber-700" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900 mb-2">
            {t("profile_completion.title")}
          </h3>
          
          <div className="space-y-2 mb-4">
            {sortedItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.key} className="flex items-center gap-2 text-sm text-amber-800">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.title}</span>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={onEditProfile}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {t("profile_completion.complete_now")}
            </Button>
            {missingItems.some(item => item.key === 'location' || item.key === 'maps') && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push("https://maps.google.com")}
                className="border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                <Map className="w-4 h-4 mr-1" />
                Get Maps Link
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
