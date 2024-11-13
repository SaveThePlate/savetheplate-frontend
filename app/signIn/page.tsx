"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ReloadIcon } from "@radix-ui/react-icons";
import useOpenApiFetch from "@/lib/OpenApiFetch";
import { AuthToast, ErrorToast } from "@/components/Toasts";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  const [showAuthToast, setShowAuthToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);

  const clientApi = useOpenApiFetch();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    clientApi
      .POST("/auth/send-magic-mail", {
        body: { email: email },
      })
      .then((resp) => {
        if (resp.response.status === 201) {
          console.info("Magic link sent to your email");
          setShowAuthToast(true);
          setShowErrorToast(false);
        } else {
          console.error("Failed to send magic link to your email");
          setShowErrorToast(true);
          setShowAuthToast(false);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to send magic link to your email");
        setShowErrorToast(true);
        setShowAuthToast(false);
        console.error(err);
        setLoading(false);
      });
  }

  return (
<div
      className="min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8"
      style={{
        backgroundColor: '#98cca8', 
      }}
    >
      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-md px-4 sm:px-8 py-12 bg-white rounded-3xl shadow-lg">

        {/* Header */}
        <h1
          className="text-3xl sm:text-4xl lg:text-5xl font-extrabold animate-fadeInDown mb-4 sm:mb-6"
          style={{
            color: '#ffbe98', 
            WebkitTextStroke: '0.5px #000000', 
            textShadow: '4px 4px 6px rgba(0, 0, 0, 0.15)', 
          }}
        >
          {!isNewUser
            ? "Welcome to SaveThePlate! 🥳"
            : "Welcome back! We've missed you! 🥰"}
        </h1>
        
        {/* Description Text */}
        <p
          className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 font-semibold animate-fadeInUp"
          style={{
            color: '#333333', 
          }}
        >
          {!isNewUser
            ? "Join us in reducing food waste and saving the planet, one meal at a time."
            : "Thank you for continuing your journey with us!"}
        </p>

        {/* Form */}
        <form
          className="flex flex-col items-center w-full space-y-4"
          onSubmit={handleSubmit}
        >
          <Input
            placeholder="name@example.com"
            className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600"
            type="email"
            required
            onChange={(e) => setEmail(e.target.value)}
          />

          {loading ? (
            <Button
              disabled
              className="w-full bg-teal-700 text-white font-bold py-2 rounded-lg flex justify-center items-center border border-black"
            >
              <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </Button>
          ) : (
            <Button
              className="w-full bg-[#fffc5ed3] text-black font-bold py-2 rounded-full border border-black hover:bg-[#cfcd4fd3] "
              type="submit"
              id="sign-in-button"
            >
              Sign In with Email
            </Button>
          )}
        </form>

        {/* Separator */}
        <Separator orientation="horizontal" className="mt-6 bg-[#f0ece7]" />

        {showAuthToast && AuthToast}
        {showErrorToast && ErrorToast}

        {/* Footer Text */}
        <p className="mt-8 text-center font-light text-xs sm:text-sm text-gray-500">
          {!isNewUser
            ? "Check your inbox to complete your registration and start rescuing meals!"
            : "Check your email for the magic link and keep saving meals!"}
        </p>
      </div>
    </div>
  
  );
}
