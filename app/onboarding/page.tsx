"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const OnboardingPage = () => {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleSelect = (selectedRole: string) => setRole(selectedRole);

  const handleSubmitRole = async () => {
    if (!role) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/set-role`,
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (role === "PROVIDER") router.push("/onboarding/fillDetails");
      else router.push("/client/home");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FBEAEA] via-[#EAF3FB] to-[#FFF8EE] px-4">
      <div className="bg-white rounded-3xl shadow-md max-w-md w-full p-8 flex flex-col items-center text-center space-y-6">
        <h1 className="text-3xl font-extrabold text-gray-800">
          Perfect! Now, tell us
        </h1>
        <p className="text-gray-600 text-lg">Are you a:</p>

        {/* Role Selection */}
        <div className="flex gap-6 w-full justify-center">
          <div
            onClick={() => handleRoleSelect("PROVIDER")}
            className={`flex flex-col items-center justify-center gap-2 p-6 rounded-2xl cursor-pointer border-2 transition-all duration-200 ${
              role === "PROVIDER"
                ? "border-emerald-400 bg-emerald-50 shadow-md"
                : "border-gray-200 hover:border-emerald-200 hover:bg-emerald-50"
            }`}
          >
            <span className="text-4xl">🍔</span>
            <p className="text-gray-800 font-semibold">Restaurant</p>
          </div>

          <div
            onClick={() => handleRoleSelect("CLIENT")}
            className={`flex flex-col items-center justify-center gap-2 p-6 rounded-2xl cursor-pointer border-2 transition-all duration-200 ${
              role === "CLIENT"
                ? "border-yellow-400 bg-yellow-50 shadow-md"
                : "border-gray-200 hover:border-yellow-300 hover:bg-yellow-50"
            }`}
          >
            <span className="text-4xl">😁</span>
            <p className="text-gray-800 font-semibold">Client</p>
          </div>
        </div>

        {/* Submit Button */}
        {role && (
          <button
            onClick={handleSubmitRole}
            disabled={isSubmitting}
            className="mt-4 w-full py-3 rounded-full bg-emerald-400 text-white font-semibold text-lg transition-all hover:bg-emerald-500 disabled:bg-gray-200 disabled:text-gray-500"
          >
            {isSubmitting ? "Submitting..." : "Next step >"}
          </button>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
