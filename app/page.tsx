"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import axios from "axios";
import { 
  ArrowRight, 
  Leaf, 
  DollarSign, 
  MapPin, 
  Clock, 
  Heart,
  ShoppingBag,
  Store,
  TrendingUp,
  CheckCircle2
} from "lucide-react";

const WelcomePage = () => {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if user is already authenticated on page load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setCheckingAuth(false);
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/get-role`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const userRole = response?.data?.role;
        if (userRole === 'PROVIDER') {
          router.push("/provider/home");
        } else if (userRole === 'CLIENT') {
          router.push("/client/home");
        } else {
          // No role, redirect to onboarding
          router.push("/onboarding");
        }
      } catch (error) {
        // Token is invalid or expired, stay on landing page
        console.debug("Token check failed, staying on landing page");
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleGetStarted = async () => {
    setLoading(true);
    const token = localStorage.getItem("accessToken");

    if (!token) {
      router.push("/signIn");
      return;
    }

    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/get-role`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const userRole = response?.data?.role;
      if (userRole) {
        setRole(userRole);
        router.push(
          userRole === "PROVIDER"
            ? "/provider/home"
            : userRole === "CLIENT"
            ? "/client/home"
            : "/onboarding"
        );
      } else {
        router.push("/onboarding");
      }
    } catch (error) {
      console.error("Error fetching role:", error);
      router.push("/onboarding");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    router.push("/signIn");
  };

  // Show loading state while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9FAF5] via-[#F0F7F4] to-[#E8F4EE]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9FAF5] via-[#F0F7F4] to-[#E8F4EE] overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        {/* Decorative Background Elements */}
        <div className="absolute top-20 left-[-4rem] w-64 h-64 bg-emerald-200 rounded-full blur-3xl opacity-30 -z-10" />
        <div className="absolute bottom-20 right-[-4rem] w-64 h-64 bg-teal-200 rounded-full blur-3xl opacity-30 -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-100 rounded-full blur-3xl opacity-20 -z-10" />

        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="text-center lg:text-left space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-sm border-2 border-emerald-200 px-4 py-2 shadow-sm">
                <Leaf className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-700">
                  Save food. Save money. Save the planet.
                </span>
              </div>

              {/* Main Headline */}
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1B4332] leading-tight">
                  Rescue delicious food{" "}
                  <span className="text-emerald-600">before it goes to waste</span>
                </h1>
                <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  Discover amazing Rescue Packs from local bakeries, cafés, and restaurants. 
                  Enjoy great food at friendly prices while making a positive impact on the environment.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={handleGetStarted}
                  disabled={loading}
                  className="group px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      Get Started
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
                {!role && (
                  <button
                    onClick={handleSignIn}
                    className="px-8 py-4 bg-white hover:bg-gray-50 text-emerald-700 font-bold rounded-xl border-2 border-emerald-600 shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    Sign In
                  </button>
                )}
              </div>

              {/* Stats */}
              {/* <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-emerald-700">100+</div>
                  <div className="text-xs sm:text-sm text-gray-600">Meals Saved</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-emerald-700">50+</div>
                  <div className="text-xs sm:text-sm text-gray-600">Local Partners</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-emerald-700">500+</div>
                  <div className="text-xs sm:text-sm text-gray-600">Happy Users</div>
                </div>
              </div> */}
            </div>

            {/* Right: Illustration */}
            <div className="relative">
              <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-emerald-100 p-8 sm:p-12 overflow-hidden">
                {/* Decorative blobs */}
                <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-100 rounded-full blur-3xl opacity-50" />
                <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-teal-100 rounded-full blur-3xl opacity-50" />
                
                <div className="relative z-10 flex flex-col items-center">
                  <Image
                    src="/loveyou.png"
                    width={280}
                    height={280}
                    alt="Save The Plate illustration"
                    className="mx-auto animate-float mb-6"
                    style={{ width: "auto", height: "auto" }}
                    priority
                  />
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border-2 border-emerald-200 w-full">
                    <p className="text-center text-gray-800 font-semibold text-base sm:text-lg">
                      &quot;Every Rescue Pack is a win for your wallet and the planet.&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1B4332] mb-4">
              Why Choose Save The Plate?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join thousands of people making a difference, one meal at a time
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border-2 border-emerald-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                <DollarSign className="w-7 h-7 text-emerald-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Save Money</h3>
              <p className="text-gray-600">
                Get delicious food at up to 50% off regular prices. Great deals on quality meals from local businesses.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 border-2 border-teal-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-xl bg-teal-100 flex items-center justify-center mb-4">
                <Leaf className="w-7 h-7 text-teal-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Save The Planet</h3>
              <p className="text-gray-600">
                Reduce food waste and help the environment. Every meal you rescue prevents CO₂ emissions and saves water.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border-2 border-amber-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
                <MapPin className="w-7 h-7 text-amber-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Support Local</h3>
              <p className="text-gray-600">
                Help local businesses reduce waste while discovering amazing food from your neighborhood.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                <Clock className="w-7 h-7 text-blue-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Quick & Easy</h3>
              <p className="text-gray-600">
                Browse, order, and pick up in minutes. Simple process with QR code verification for seamless experience.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 border-2 border-pink-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-xl bg-pink-100 flex items-center justify-center mb-4">
                <Heart className="w-7 h-7 text-pink-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Make A Difference</h3>
              <p className="text-gray-600">
                Track your environmental impact. See how many meals you&apos;ve saved and your contribution to the planet.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border-2 border-purple-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                <ShoppingBag className="w-7 h-7 text-purple-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Surprise Packs</h3>
              <p className="text-gray-600">
                Discover exciting Rescue Packs with a variety of items. Each pack is a delightful surprise at a great price.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1B4332] mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simple steps to start rescuing food and saving money
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-emerald-200 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Browse Offers</h3>
              <p className="text-gray-600">
                Explore available Rescue Packs and custom offers from local businesses near you.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-emerald-200 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Place Order</h3>
              <p className="text-gray-600">
                Select your favorite pack, place an order, and receive a unique QR code for pickup.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-emerald-200 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Pick Up & Enjoy</h3>
              <p className="text-gray-600">
                Visit the store, show your QR code, and enjoy delicious food while saving the planet!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Providers Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-3xl p-8 sm:p-12 text-white shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 mb-6">
                  <Store className="w-5 h-5" />
                  <span className="text-sm font-semibold">For Business Owners</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  List Your Surplus Food
                </h2>
                <p className="text-lg mb-6 opacity-90">
                  Turn your surplus food into revenue while reducing waste. Join local businesses making a positive impact.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span>Reduce food waste and disposal costs</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span>Generate additional revenue from surplus</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span>Track your environmental impact</span>
                  </li>
                </ul>
                <button
                  onClick={handleGetStarted}
                  disabled={loading}
                  className="px-6 py-3 bg-white text-emerald-700 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Loading..." : "Start Listing"}
                </button>
              </div>
              <div className="hidden lg:block">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border-2 border-white/20">
                  <TrendingUp className="w-24 h-24 mx-auto opacity-80" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#F9FAF5] via-[#F0F7F4] to-[#E8F4EE]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1B4332] mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join our community of food rescuers and start saving money while helping the planet today.
          </p>
          <button
            onClick={handleGetStarted}
            disabled={loading}
            className="px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Loading...
              </>
            ) : (
              <>
                Get Started Now
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </section>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default WelcomePage;
