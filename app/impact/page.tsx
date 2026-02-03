"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Leaf, Droplet, Cloud, TreePine, Calculator, Info, TrendingUp } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import SharedLayout from "@/components/SharedLayout";
import RouteGuard from "@/components/RouteGuard";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";

const ImpactPage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const { userRole, loading } = useUser();

  return (
    <RouteGuard allowedRoles={["CLIENT", "PROVIDER"]} redirectTo="/signIn">
      <SharedLayout>
        <main className="flex flex-col items-center w-full">
          {/* Sticky Header */}
          <header className="sticky top-0 z-40 w-full bg-transparent backdrop-blur-md border-b border-border/50 px-4 sm:px-6 py-4">
            <div className="w-full mx-auto max-w-2xl lg:max-w-6xl">
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-foreground">
                {t("impact.title")}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {t("impact.description")}
              </p>
            </div>
          </header>

          <div className="w-full mx-auto px-4 sm:px-6 max-w-2xl lg:max-w-6xl pt-4 sm:pt-6 space-y-6 sm:space-y-8 relative">
            {/* Decorative soft shapes */}
            <div className="absolute top-0 left-[-4rem] w-40 h-40 bg-[#FFD6C9] rounded-full blur-3xl opacity-40 -z-10" />
            <div className="absolute bottom-10 right-[-3rem] w-32 h-32 bg-[#C8E3F8] rounded-full blur-2xl opacity-40 -z-10" />

            {/* The Problem Section */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 sm:p-8 mb-8 shadow-sm border border-red-200/50">
          <h2 className="text-xl sm:text-2xl font-bold text-red-900 mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            {t("impact.problem_title")}
          </h2>
          <div className="space-y-4 text-red-800">
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
          <div className="space-y-6 mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
            </div>
            {t("impact.calculation_title")}
          </h2>

          {/* Meals Saved */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-5 sm:p-6 shadow-sm border border-orange-200/50">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-orange-600 text-white flex items-center justify-center flex-shrink-0">
                <span className="text-lg sm:text-xl">🍽️</span>
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold text-orange-900 mb-2">{t("impact.meals_saved_title")}</h3>
                <p className="text-xs sm:text-sm text-orange-800 mb-3">
                  {t("impact.meals_saved_description")}
                </p>
                <div className="bg-white rounded-lg p-3 border border-orange-200/50">
                  <p className="text-xs font-semibold text-orange-900 mb-1">{t("impact.how_calculated")}</p>
                  <p className="text-xs text-orange-800">
                    {t("impact.meals_calculation")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CO2 Saved */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 sm:p-6 shadow-sm border border-blue-200/50">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                <Cloud className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold text-blue-900 mb-2">{t("impact.co2_title")}</h3>
                <p className="text-xs sm:text-sm text-blue-800 mb-3">
                  {t("impact.co2_description")}
                </p>
                <div className="bg-white rounded-lg p-3 border border-blue-200/50">
                  <p className="text-xs font-semibold text-blue-900 mb-1">{t("impact.how_calculated")}</p>
                  <p className="text-xs text-blue-800 mb-2">
                    {t("impact.co2_calculation")}
                  </p>
                  <p className="text-xs text-blue-800">
                    {t("impact.co2_explanation")}
                  </p>
                </div>
                <div className="mt-3 bg-white rounded-lg p-3 border border-border/50">
                  <p className="text-xs font-semibold text-blue-900 mb-1">{t("impact.real_world_equivalent")}</p>
                  <p className="text-xs text-blue-800">
                    {t("impact.co2_equivalent")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Water Saved */}
          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-2xl p-5 sm:p-6 shadow-sm border border-cyan-200/50">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-cyan-600 text-white flex items-center justify-center flex-shrink-0">
                <Droplet className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold text-cyan-900 mb-2">{t("impact.water_title")}</h3>
                <p className="text-xs sm:text-sm text-cyan-800 mb-3">
                  {t("impact.water_description")}
                </p>
                <div className="bg-white rounded-lg p-3 border border-cyan-200/50">
                  <p className="text-xs font-semibold text-cyan-900 mb-1">{t("impact.how_calculated")}</p>
                  <p className="text-xs text-cyan-800 mb-2">
                    {t("impact.water_calculation")}
                  </p>
                  <p className="text-xs text-cyan-800">
                    {t("impact.water_explanation")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

          {/* Your Role Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
          {/* For Clients */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-5 sm:p-6 border border-emerald-200/50 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-emerald-900">{t("impact.for_customers")}</h3>
            </div>
            <p className="text-xs sm:text-sm text-emerald-800 mb-4">
              {t("impact.for_customers_description")}
            </p>
            <ul className="space-y-1.5 text-xs sm:text-sm text-emerald-800">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">✓</span>
                <span>{t("impact.customer_1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">✓</span>
                <span>{t("impact.customer_2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">✓</span>
                <span>{t("impact.customer_3")}</span>
              </li>
            </ul>
            </div>

            {/* For Providers */}
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-5 sm:p-6 border border-teal-200/50 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                <TreePine className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-teal-900">{t("impact.for_providers")}</h3>
            </div>
            <p className="text-xs sm:text-sm text-teal-800 mb-4">
              {t("impact.for_providers_description")}
            </p>
            <ul className="space-y-1.5 text-xs sm:text-sm text-teal-800">
              <li className="flex items-start gap-2">
                <span className="text-teal-600 mt-1">✓</span>
                <span>{t("impact.provider_1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-600 mt-1">✓</span>
                <span>{t("impact.provider_2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-600 mt-1">✓</span>
                <span>{t("impact.provider_3")}</span>
              </li>
            </ul>
          </div>
        </div>

          {/* Impact Multiplier */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 sm:p-8 border border-purple-200/50 shadow-sm mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-purple-900 mb-4 text-center">
            {t("impact.ripple_effect")}
          </h2>
          <p className="text-center text-xs sm:text-sm text-purple-800 mb-6 max-w-2xl mx-auto">
            {t("impact.ripple_description")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
            <div className="bg-white rounded-lg p-4 border border-purple-200/50 shadow-sm">
              <p className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1">100</p>
              <p className="text-xs sm:text-sm text-purple-700">{t("impact.ripple_100")}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-purple-200/50 shadow-sm">
              <p className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1">1,000</p>
              <p className="text-xs sm:text-sm text-purple-700">{t("impact.ripple_1000")}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-purple-200/50 shadow-sm">
              <p className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1">10,000</p>
              <p className="text-xs sm:text-sm text-purple-700">{t("impact.ripple_10000")}</p>
            </div>
          </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 sm:p-8 shadow-sm border border-emerald-200/50 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-emerald-900 mb-4">
            {t("impact.ready_title")}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-800 mb-6 max-w-2xl mx-auto">
            {t("impact.ready_description")}
          </p>
          <div className="flex justify-center">
            {!loading && (
              <>
                {userRole === "CLIENT" && (
                  <Button
                    onClick={() => router.push("/client/home")}
                    variant="emerald"
                    size="lg"
                  >
                    {t("impact.browse_offers")}
                  </Button>
                )}
                {userRole === "PROVIDER" && (
                  <Button
                    onClick={() => router.push("/provider/home")}
                    variant="teal"
                    size="lg"
                  >
                    {t("impact.list_surplus")}
                  </Button>
                )}
                {!userRole && (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={() => router.push("/client/home")}
                      variant="emerald"
                      size="lg"
                    >
                      {t("impact.browse_offers")}
                    </Button>
                    <Button
                      onClick={() => router.push("/provider/home")}
                      variant="teal"
                      size="lg"
                    >
                      {t("impact.list_surplus")}
                    </Button>
                  </div>
                )}
              </>
            )}
            {loading && (
              <div className="px-6 py-3 text-gray-500">{t("common.loading")}</div>
            )}
          </div>
          </div>
          </div>
        </main>
      </SharedLayout>
    </RouteGuard>
  );
};

export default ImpactPage;

