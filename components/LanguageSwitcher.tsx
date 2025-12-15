"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Globe, Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface LanguageSwitcherProps {
  variant?: "default" | "button" | "icon";
  className?: string;
}

export function LanguageSwitcher({ 
  variant = "default",
  className = "" 
}: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();
  const currentLang = language || "en";

  // Simple toggle button variant
  if (variant === "button") {
    return (
      <Button
        onClick={() => setLanguage(currentLang === "en" ? "fr" : "en")}
        variant="outline"
        size="sm"
        className={`flex items-center gap-2 bg-white border-2 border-gray-300 hover:border-emerald-500 hover:bg-emerald-50 shadow-sm ${className}`}
        style={{ minWidth: '60px', zIndex: 9999 }}
        title={currentLang === "en" ? "Switch to French" : "Passer à l'anglais"}
      >
        <Languages size={18} className="text-emerald-600" />
        <span className="hidden sm:inline font-semibold text-gray-700">
          {currentLang === "en" ? "EN" : "FR"}
        </span>
        <span className="sm:hidden font-semibold text-gray-700">{currentLang.toUpperCase()}</span>
      </Button>
    );
  }

  // Icon only variant
  if (variant === "icon") {
    return (
      <Button
        onClick={() => setLanguage(language === "en" ? "fr" : "en")}
        variant="ghost"
        size="sm"
        className={`p-2 ${className}`}
        title={language === "en" ? "Switch to French" : "Passer à l'anglais"}
      >
        <Globe size={20} />
      </Button>
    );
  }

  // Default dropdown variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`flex items-center gap-2 text-gray-700 hover:text-gray-900 ${className}`}
        >
          <Globe size={18} />
          <span className="hidden sm:inline">
            {language === "en" ? "English" : "Français"}
          </span>
          <span className="sm:hidden">{language.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        <DropdownMenuItem
          onClick={() => setLanguage("en")}
          className={`cursor-pointer ${language === "en" ? "bg-gray-100 font-semibold" : ""}`}
        >
          <span className="mr-2">🇬🇧</span>
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage("fr")}
          className={`cursor-pointer ${language === "fr" ? "bg-gray-100 font-semibold" : ""}`}
        >
          <span className="mr-2">🇫🇷</span>
          Français
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

