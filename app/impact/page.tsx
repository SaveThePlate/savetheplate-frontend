"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Leaf, Droplet, Cloud, TreePine, Calculator, Info, TrendingUp } from "lucide-react";
import Image from "next/image";

const ImpactPage = () => {
  const router = useRouter();
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
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Environmental Impact</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-4">
            <Leaf className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Understanding Your Impact
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Every meal you save from waste makes a real difference. Learn how we calculate your environmental impact and the positive change you&apos;re creating.
          </p>
        </div>

        {/* The Problem Section */}
        <div className="bg-white rounded-3xl p-8 mb-8 shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Info className="w-6 h-6 text-red-500" />
            The Food Waste Problem
          </h2>
          <div className="space-y-4 text-gray-700">
            <p>
              Food waste is one of the biggest environmental challenges of our time. When food goes to waste:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>It decomposes in landfills, producing <strong>methane gas</strong> - a greenhouse gas 25 times more potent than CO₂</li>
              <li>All the <strong>water, energy, and resources</strong> used to produce that food are wasted</li>
              <li>It contributes to <strong>climate change</strong> and environmental degradation</li>
              <li>It represents a <strong>massive economic loss</strong> for businesses and consumers</li>
            </ul>
            <p className="pt-2">
              By rescuing food that would otherwise be wasted, you&apos;re directly reducing these negative impacts!
            </p>
          </div>
        </div>

        {/* Metrics Explanation */}
        <div className="space-y-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-emerald-600" />
            How We Calculate Your Impact
          </h2>

          {/* Meals Saved */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🍽️</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Meals Saved</h3>
                <p className="text-gray-700 mb-3">
                  This represents the total number of meals or food packages you&apos;ve rescued from going to waste.
                </p>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                  <p className="text-sm font-semibold text-orange-900 mb-1">How it&apos;s calculated:</p>
                  <p className="text-sm text-orange-800">
                    Each confirmed order counts as meals saved. If you order 3 rescue packs, that&apos;s 3 meals saved!
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
                <h3 className="text-xl font-bold text-gray-900 mb-2">CO₂ Emissions Saved</h3>
                <p className="text-gray-700 mb-3">
                  Carbon dioxide equivalent (CO₂e) represents the greenhouse gas emissions prevented by saving food from waste.
                </p>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900 mb-1">How it&apos;s calculated:</p>
                  <p className="text-sm text-blue-800 mb-2">
                    We use a conservative estimate: <strong>1.5 kg CO₂e per meal saved</strong>
                  </p>
                  <p className="text-xs text-blue-700">
                    This accounts for methane emissions from food waste decomposition (methane is 25x more potent than CO₂) 
                    and the emissions from food production that would have been wasted.
                  </p>
                </div>
                <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-900 mb-2">💡 Real-world equivalent:</p>
                  <p className="text-sm text-gray-700">
                    <strong>1 tree</strong> absorbs approximately <strong>21 kg of CO₂ per year</strong>. 
                    So saving 14 meals ≈ planting 1 tree!
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
                <h3 className="text-xl font-bold text-gray-900 mb-2">Water Saved</h3>
                <p className="text-gray-700 mb-3">
                  Water footprint represents all the water used in the production, processing, and transportation of food.
                </p>
                <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-200">
                  <p className="text-sm font-semibold text-cyan-900 mb-1">How it&apos;s calculated:</p>
                  <p className="text-sm text-cyan-800 mb-2">
                    We estimate: <strong>1,500 liters of water per meal saved</strong>
                  </p>
                  <p className="text-xs text-cyan-700">
                    This includes water for irrigation, processing, cleaning, and all stages of the food supply chain. 
                    The average person drinks about 2-3 liters per day, so saving one meal saves enough water for 
                    about 500-750 days of drinking water!
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
              <h3 className="text-xl font-bold text-emerald-900">For Customers</h3>
            </div>
            <p className="text-emerald-800 mb-4">
              Every order you place directly saves food from waste. Your impact grows with each rescue pack or offer you purchase!
            </p>
            <ul className="space-y-2 text-sm text-emerald-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">✓</span>
                <span>Each confirmed order counts toward your environmental impact</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">✓</span>
                <span>Track your savings and impact on your profile page</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">✓</span>
                <span>Share your achievements and inspire others!</span>
              </li>
            </ul>
          </div>

          {/* For Providers */}
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 border-2 border-teal-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                <TreePine className="w-5 h-5 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-teal-900">For Providers</h3>
            </div>
            <p className="text-teal-800 mb-4">
              By listing your surplus food, you&apos;re preventing waste at the source. Every offer you create has the potential to save multiple meals!
            </p>
            <ul className="space-y-2 text-sm text-teal-700">
              <li className="flex items-start gap-2">
                <span className="text-teal-600 mt-1">✓</span>
                <span>Each confirmed order from your offers contributes to environmental savings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-600 mt-1">✓</span>
                <span>Reduce waste disposal costs while helping the planet</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-600 mt-1">✓</span>
                <span>Build a sustainable business model that customers love</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Impact Multiplier */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 border-2 border-purple-200 mb-8">
          <h2 className="text-2xl font-bold text-purple-900 mb-4 text-center">
            The Ripple Effect
          </h2>
          <p className="text-center text-purple-800 mb-6 max-w-2xl mx-auto">
            Your individual actions create a collective impact. When thousands of people participate, 
            the environmental benefits multiply exponentially!
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
            Ready to Make a Difference?
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Every meal counts. Start rescuing food today and watch your environmental impact grow!
          </p>
          <div className="flex justify-center">
            {!loading && (
              <>
                {userRole === "CLIENT" && (
                  <button
                    onClick={() => router.push("/client/home")}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    Browse Offers
                  </button>
                )}
                {userRole === "PROVIDER" && (
                  <button
                    onClick={() => router.push("/provider/publish")}
                    className="px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
                  >
                    List Your Surplus
                  </button>
                )}
                {!userRole && (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => router.push("/client/home")}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                    >
                      Browse Offers
                    </button>
                    <button
                      onClick={() => router.push("/provider/publish")}
                      className="px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
                    >
                      List Your Surplus
                    </button>
                  </div>
                )}
              </>
            )}
            {loading && (
              <div className="px-6 py-3 text-gray-500">Loading...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImpactPage;

