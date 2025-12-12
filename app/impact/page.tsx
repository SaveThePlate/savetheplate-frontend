"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Leaf, Droplet, Cloud, TreePine, Calculator, Info, TrendingUp } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import SharedLayout from "@/components/SharedLayout";
import RouteGuard from "@/components/RouteGuard";

const ImpactPage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/get-role`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserRole(response.data.role);
      } catch (err) {
        console.error("Error fetching user role:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  return (
    <RouteGuard allowedRoles={["CLIENT", "PROVIDER"]} redirectTo="/signIn">
      <SharedLayout>
        <div className="w-full mx-auto px-4 sm:px-6 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-4">
            <Leaf className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t("impact.understanding")}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t("impact.description")}
          </p>
        </div>

        {/* The Problem Section */}
        <div className="bg-white rounded-3xl p-8 mb-8 shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Info className="w-6 h-6 text-red-500" />
            {t("impact.problem_title")}
          </h2>
          <div className="space-y-4 text-gray-700">
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-emerald-600" />
            {t("impact.calculation_title")}
          </h2>

          {/* Meals Saved */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🍽️</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t("impact.meals_saved_title")}</h3>
                <p className="text-gray-700 mb-3">
                  {t("impact.meals_saved_description")}
                </p>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                  <p className="text-sm font-semibold text-orange-900 mb-1">How it&apos;s calculated:</p>
                  <p className="text-sm text-orange-800">
                    {t("impact.meals_calculation")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CO2 Saved */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Cloud className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t("impact.co2_title")}</h3>
                <p className="text-gray-700 mb-3">
                  {t("impact.co2_description")}
                </p>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900 mb-1">How it&apos;s calculated:</p>
                  <p className="text-sm text-blue-800 mb-2">
                    {t("impact.co2_calculation")}
                  </p>
                  <p className="text-xs text-blue-700">
                    {t("impact.co2_explanation")}
                  </p>
                </div>
                <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-900 mb-2">💡 Real-world equivalent:</p>
                  <p className="text-sm text-gray-700">
                    {t("impact.co2_equivalent")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Water Saved */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center flex-shrink-0">
                <Droplet className="w-6 h-6 text-cyan-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t("impact.water_title")}</h3>
                <p className="text-gray-700 mb-3">
                  {t("impact.water_description")}
                </p>
                <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-200">
                  <p className="text-sm font-semibold text-cyan-900 mb-1">How it&apos;s calculated:</p>
                  <p className="text-sm text-cyan-800 mb-2">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* For Clients */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border-2 border-emerald-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-emerald-900">{t("impact.for_customers")}</h3>
            </div>
            <p className="text-emerald-800 mb-4">
              {t("impact.for_customers_description")}
            </p>
            <ul className="space-y-2 text-sm text-emerald-700">
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
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 border-2 border-teal-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                <TreePine className="w-5 h-5 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-teal-900">{t("impact.for_providers")}</h3>
            </div>
            <p className="text-teal-800 mb-4">
              {t("impact.for_providers_description")}
            </p>
            <ul className="space-y-2 text-sm text-teal-700">
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
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 border-2 border-purple-200 mb-8">
          <h2 className="text-2xl font-bold text-purple-900 mb-4 text-center">
            {t("impact.ripple_effect")}
          </h2>
          <p className="text-center text-purple-800 mb-6 max-w-2xl mx-auto">
            {t("impact.ripple_description")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="bg-white rounded-xl p-4 border border-purple-200">
              <p className="text-3xl font-bold text-purple-600 mb-1">100</p>
              <p className="text-sm text-purple-700">Meals saved = 150 kg CO₂ prevented</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-purple-200">
              <p className="text-3xl font-bold text-purple-600 mb-1">1,000</p>
              <p className="text-sm text-purple-700">Meals saved = 1,500 kg CO₂ prevented</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-purple-200">
              <p className="text-3xl font-bold text-purple-600 mb-1">10,000</p>
              <p className="text-sm text-purple-700">Meals saved = 15,000 kg CO₂ prevented</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t("impact.ready_title")}
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
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
              <div className="px-6 py-3 text-gray-500">{t("common.loading")}</div>
            )}
          </div>
        </div>
      </div>
      </SharedLayout>
    </RouteGuard>
  );
};

export default ImpactPage;

