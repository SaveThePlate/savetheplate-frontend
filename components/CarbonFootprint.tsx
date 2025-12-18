"use client";

import React from "react";
import { Leaf, Cloud, Zap } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const CarbonFootprint = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg border-2 border-emerald-200/50 hover:shadow-xl transition-all duration-300">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <Leaf className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg sm:text-xl font-bold text-emerald-900 mb-1">
            {t("home.carbon_footprint_title")}
          </h3>
          <p className="text-xs sm:text-sm text-emerald-700">
            {t("home.carbon_footprint_subtitle")}
          </p>
        </div>
      </div>

      <div className="space-y-4 mt-6">
        {/* CO2 per visit */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Cloud className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {t("home.carbon_per_visit", { co2: "0.03" })}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {t("home.carbon_cleaner_than", { percentage: "34" })}
              </p>
            </div>
          </div>
        </div>

        {/* Sustainable energy */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {t("home.sustainable_energy")}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {t("home.carbon_badge")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Link to websitecarbon */}
      <div className="mt-6 pt-4 border-t border-emerald-200">
        <a
          href="https://www.websitecarbon.com/website/leftover-ccdev-space/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs sm:text-sm text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-2 transition-colors"
        >
          <span>{t("home.learn_more")}</span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    </div>
  );
};

export default CarbonFootprint;

