"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";

type Language = "en" | "fr";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("fr");
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
        // Try dynamic import first (works in development and some production builds)
        try {
          const translations = await import(`@/locales/${language}.json`);
          setTranslations(translations.default);
          setIsLoading(false);
          return;
        } catch (importError) {
          console.debug(`Dynamic import failed for ${language}, trying fetch...`);
        }

        // Fallback to fetch from public folder (works reliably in all environments including mobile)
        const response = await fetch(`/locales/${language}.json`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const translations = await response.json();
        setTranslations(translations);
      } catch (error) {
        console.error(`Failed to load ${language} translations:`, error);
        // Fallback to English
        try {
          const response = await fetch(`/locales/en.json`);
          if (response.ok) {
            const fallback = await response.json();
            setTranslations(fallback);
          } else {
            console.error('Failed to load fallback English translations');
            setTranslations({});
          }
        } catch (fallbackError) {
          console.error('Failed to load fallback translations:', fallbackError);
          setTranslations({});
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadTranslations();
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    if (lang !== language) {
      setLanguageState(lang);
      if (typeof window !== "undefined") {
        localStorage.setItem("language", lang);
      }
    }
  }, [language]);

  const t = useCallback((key: string, params?: Record<string, any>): string => {
    // Return empty string if translations haven't loaded yet
    if (!translations || Object.keys(translations).length === 0) {
      return "";
    }
    
    const keys = key.split(".");
    let value: any = translations;
    for (const k of keys) {
      value = value?.[k];
    }
    
    // If value is undefined, null, or empty string, return empty string
    // This allows the || fallback pattern to work in components
    let result = (value !== undefined && value !== null && value !== "") ? value : "";
    
    // Replace parameters like {orderId} with actual values
    if (params && result) {
      Object.keys(params).forEach((param) => {
        result = result.replace(new RegExp(`\\{${param}\\}`, "g"), params[param]);
      });
    }
    
    return result;
  }, [translations]);

  // Update HTML lang attribute when language changes
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
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

