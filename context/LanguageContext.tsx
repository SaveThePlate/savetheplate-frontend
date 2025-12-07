"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "fr";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language preference first
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("language") as Language;
      if (saved && (saved === "en" || saved === "fr")) {
        setLanguageState(saved);
      }
    }
  }, []);

  // Load translations when language changes
  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true);
      try {
        const translations = await import(`@/locales/${language}.json`);
        setTranslations(translations.default);
      } catch (error) {
        console.error(`Failed to load ${language} translations:`, error);
        // Fallback to English
        const fallback = await import(`@/locales/en.json`);
        setTranslations(fallback.default);
      } finally {
        setIsLoading(false);
      }
    };
    loadTranslations();
  }, [language]);

  const setLanguage = (lang: Language) => {
    if (lang !== language) {
      setLanguageState(lang);
      if (typeof window !== "undefined") {
        localStorage.setItem("language", lang);
      }
    }
  };

  const t = (key: string, params?: Record<string, any>): string => {
    const keys = key.split(".");
    let value: any = translations;
    for (const k of keys) {
      value = value?.[k];
    }
    let result = value || key;
    
    // Replace parameters like {orderId} with actual values
    if (params) {
      Object.keys(params).forEach((param) => {
        result = result.replace(new RegExp(`\\{${param}\\}`, "g"), params[param]);
      });
    }
    
    return result;
  };

  // Update HTML lang attribute when language changes
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

