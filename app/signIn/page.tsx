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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-400 p-6">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md sm:max-w-lg md:max-w-md lg:max-w-xs">
        <div className="flex flex-col items-center space-y-4 mb-6 text-center">
          <h1 className="font-bold text-2xl sm:text-3xl text-green-900">
            {isNewUser
              ? "Welcome to SaveThePlate! 🥳"
              : "Welcome back! We've missed you! 🥰"}
          </h1>
          <p className="font-light text-sm sm:text-base text-gray-600">
            {isNewUser
              ? "Join us in reducing food waste and saving the planet, one meal at a time."
              : "Thank you for continuing your journey with us!"}
          </p>
        </div>

        {/* Form */}
        <form
          className="flex flex-col items-center w-full space-y-4"
          onSubmit={handleSubmit}
        >
          <Input
            placeholder="name@example.com"
            className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600"
            type="email"
            required
            onChange={(e) => setEmail(e.target.value)}
          />
          {loading ? (
            <Button
              disabled
              className="w-full bg-green-800 text-white font-medium py-2 rounded-lg flex justify-center items-center"
            >
              <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </Button>
          ) : (
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg"
              type="submit"
              id="sign-in-button"
            >
              Sign In with Email
            </Button>
          )}
        </form>

        <Separator orientation="horizontal" className="mt-6 bg-gray-300" />

        {/* Conditionally render toasts */}
        {showAuthToast && AuthToast}
        {showErrorToast && ErrorToast}

        <p className="mt-8 text-center font-light text-xs sm:text-sm text-gray-500">
          {isNewUser
            ? "Check your inbox to complete your registration and start rescuing meals!"
            : "Check your email for the magic link and keep saving meals!"}
        </p>
      </div>
    </div>
  );
}
