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
          onClick={() => router.push("/client/profile")}
          className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center hover:bg-emerald-50 transition-colors"
        >
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="font-display font-bold text-3xl">{t("preferences.title") || "Preferences"}</h1>
      </div>

      {/* Language Section */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-lg">{t("preferences.language") || "Language"}</h2>
            <p className="text-sm text-muted-foreground">{t("preferences.chooseLanguage") || "Choose your preferred language"}</p>
          </div>
        </div>

        <div className="space-y-2">
          {languages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all active:scale-[0.98] ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="text-left">
                    <div className="font-medium">{lang.name}</div>
                    <div className="text-sm text-muted-foreground">{lang.nativeName}</div>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center animate-in zoom-in duration-200">
                    <Check size={14} className="text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Info Note */}
      <div className="bg-white border border-border rounded-xl p-4">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">{t("preferences.note") || "Note:"}</strong> {t("preferences.noteText") || "Changing the language will update the app interface immediately."}
        </p>
      </div>
    </div>
  );
}

