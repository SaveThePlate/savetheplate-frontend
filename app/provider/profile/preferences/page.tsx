"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Globe, Check } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

type Language = {
  code: "en" | "fr";
  name: string;
  nativeName: string;
  flag: string;
};

const languages: Language[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
];

export default function Preferences() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (languageCode: "en" | "fr") => {
    setLanguage(languageCode);
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push("/provider/profile")}
          className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center hover:bg-emerald-50 transition-colors"
        >
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="font-display font-bold text-3xl">{t("preferences.title") || "Preferences"}</h1>
      </div>

      {/* Language Section */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-4 sm:p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <Globe className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="font-bold text-base sm:text-lg">{t("preferences.language") || "Language"}</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">{t("preferences.chooseLanguage") || "Choose your preferred language"}</p>
          </div>
        </div>

        <div className="space-y-2">
          {languages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-lg border transition-all active:scale-[0.98] ${
                  isSelected
                    ? "border-emerald-600 bg-emerald-50"
                    : "border-border hover:border-emerald-600/50 bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl sm:text-2xl">{lang.flag}</span>
                  <div className="text-left">
                    <div className="font-medium text-sm sm:text-base">{lang.name}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">{lang.nativeName}</div>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-600 flex items-center justify-center animate-in zoom-in duration-200">
                    <Check size={12} className="text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}

