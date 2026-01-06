"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Leaf, Droplet, Cloud, TreePine, Calculator, Info, TrendingUp } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import { useUser } from "@/context/UserContext";

const ImpactPage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const { userRole, loading } = useUser();

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
        <div className="flex-1">
          <h1 className="font-display font-bold text-lg sm:text-xl md:text-2xl mb-1">{t("impact.title")}</h1>
        </div>
      </div>

      {/* The Problem Section */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-border shadow-sm mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3 flex items-center gap-2">
            <Info className="w-5 h-5 text-red-500" />
            {t("impact.problem_title")}
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              {t("impact.problem_intro")}
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{t("impact.problem_1")}</li>
              <li>{t("impact.problem_2")}</li>
              <li>{t("impact.problem_3")}</li>
              <li>{t("impact.problem_4")}</li>
            </ul>
            <p className="pt-2">
              {t("impact.problem_conclusion")}
            </p>
          </div>
        </div>

      {/* Metrics Explanation */}
      <div className="space-y-4 mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-emerald-600" />
          {t("impact.calculation_title")}
        </h2>

        {/* Meals Saved */}
        <div className="bg-white rounded-xl p-4 border border-border shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🍽️</span>
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold text-foreground mb-1">{t("impact.meals_saved_title")}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                  {t("impact.meals_saved_description")}
                </p>
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <p className="text-xs font-semibold text-orange-900 mb-1">{t("impact.how_calculated")}</p>
                  <p className="text-xs text-orange-800">
                    {t("impact.meals_calculation")}
                  </p>
                </div>
              </div>
            </div>
          </div>

        {/* CO2 Saved */}
        <div className="bg-white rounded-xl p-4 border border-border shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Cloud className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold text-foreground mb-1">{t("impact.co2_title")}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                  {t("impact.co2_description")}
                </p>
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-xs font-semibold text-blue-900 mb-1">{t("impact.how_calculated")}</p>
                  <p className="text-xs text-blue-800 mb-1">
                    {t("impact.co2_calculation")}
                  </p>
                  <p className="text-xs text-blue-700">
                    {t("impact.co2_explanation")}
                  </p>
                </div>
                <div className="mt-3 bg-white rounded-lg p-3 border border-border">
                  <p className="text-xs font-semibold text-foreground mb-1">{t("impact.real_world_equivalent")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("impact.co2_equivalent")}
                  </p>
                </div>
              </div>
            </div>
          </div>

        {/* Water Saved */}
        <div className="bg-white rounded-xl p-4 border border-border shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
                <Droplet className="w-5 h-5 text-cyan-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold text-foreground mb-1">{t("impact.water_title")}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                  {t("impact.water_description")}
                </p>
                <div className="bg-cyan-50 rounded-lg p-3 border border-cyan-200">
                  <p className="text-xs font-semibold text-cyan-900 mb-1">{t("impact.how_calculated")}</p>
                  <p className="text-xs text-cyan-800 mb-1">
                    {t("impact.water_calculation")}
                  </p>
                  <p className="text-xs text-cyan-700">
                    {t("impact.water_explanation")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Your Role Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* For Clients */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border-2 border-emerald-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-emerald-900">{t("impact.for_customers")}</h3>
            </div>
            <p className="text-xs sm:text-sm text-emerald-800 mb-3">
              {t("impact.for_customers_description")}
            </p>
            <ul className="space-y-1.5 text-xs sm:text-sm text-emerald-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">✓</span>
                <span>{t("impact.customer_1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">✓</span>
                <span>{t("impact.customer_2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">✓</span>
                <span>{t("impact.customer_3")}</span>
              </li>
            </ul>
          </div>

          {/* For Providers */}
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-4 border-2 border-teal-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                <TreePine className="w-4 h-4 text-teal-600" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-teal-900">{t("impact.for_providers")}</h3>
            </div>
            <p className="text-xs sm:text-sm text-teal-800 mb-3">
              {t("impact.for_providers_description")}
            </p>
            <ul className="space-y-1.5 text-xs sm:text-sm text-teal-700">
              <li className="flex items-start gap-2">
                <span className="text-teal-600 mt-0.5">✓</span>
                <span>{t("impact.provider_1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-600 mt-0.5">✓</span>
                <span>{t("impact.provider_2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-600 mt-0.5">✓</span>
                <span>{t("impact.provider_3")}</span>
              </li>
            </ul>
          </div>
        </div>

      {/* Impact Multiplier */}
      <div className="bg-white rounded-xl p-4 border border-border shadow-sm mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-purple-900 mb-3 text-center">
          {t("impact.ripple_effect")}
        </h2>
        <p className="text-center text-xs sm:text-sm text-purple-800 mb-4 max-w-2xl mx-auto">
          {t("impact.ripple_description")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <div className="bg-white rounded-lg p-3 border border-border">
            <p className="text-2xl font-bold text-purple-600 mb-1">100</p>
            <p className="text-xs text-purple-700">{t("impact.ripple_100")}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-border">
            <p className="text-2xl font-bold text-purple-600 mb-1">1,000</p>
            <p className="text-xs text-purple-700">{t("impact.ripple_1000")}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-border">
            <p className="text-2xl font-bold text-purple-600 mb-1">10,000</p>
            <p className="text-xs text-purple-700">{t("impact.ripple_10000")}</p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-white rounded-xl p-4 border border-border shadow-sm text-center">
          <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3">
            {t("impact.ready_title")}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-4 max-w-2xl mx-auto">
            {t("impact.ready_description")}
          </p>
          <div className="flex justify-center">
            {!loading && (
              <>
                {userRole === "CLIENT" && (
                  <button
                    onClick={() => router.push("/client/home")}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    {t("impact.browse_offers")}
                  </button>
                )}
                {userRole === "PROVIDER" && (
                  <button
                    onClick={() => router.push("/provider/publish")}
                    className="px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
                  >
                    {t("impact.list_surplus")}
                  </button>
                )}
                {!userRole && (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => router.push("/client/home")}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                    >
                      {t("impact.browse_offers")}
                    </button>
                    <button
                      onClick={() => router.push("/provider/publish")}
                      className="px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
                    >
                      {t("impact.list_surplus")}
                    </button>
                  </div>
                )}
              </>
            )}
            {loading && (
              <div className="px-6 py-3 text-muted-foreground">{t("common.loading")}</div>
            )}
          </div>
        </div>
    </div>
  );
};

export default ImpactPage;

