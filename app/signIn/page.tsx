"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ReloadIcon } from "@radix-ui/react-icons";
import useOpenApiFetch from "@/lib/OpenApiFetch";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


export default function SignIn() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

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
          toast.success('Magic link sent to your email');

        } else {
          console.error("Failed to send magic link to your email");

          // Display error toast
          toast.error("Failed to send magic link. Please try again.");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to send magic link to your email");
        toast.error('Failed to send magic link to your email');
        console.error(err);

        setLoading(false);
      });
  }

  return (
    <div className="w-screen h-screen flex justify-center items-center">
      <ToastContainer />
      <div className="flex flex-col items-center w-3/4 sm:w-2/5 md:w-1/4">
        <div className="flex flex-col items-center space-y-2">
          <h1 className="font-semibold text-4xl">Happy to see you again!</h1>
          <p className="font-normal text-l">
            Enter your email to sign in to your account
          </p>
          <br/>
        </div>

        <form
          className="flex flex-col items-center w-full gap-3"
          onSubmit={handleSubmit}
        >
          <Input
            placeholder="name@example.com"
            className="w-full font-base"
            type="email"
            required
            onChange={(e) => setEmail(e.target.value)}
          />
          {loading ? (
            <Button disabled className="w-full bg-green-900 font-medium">
              <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
              Please wait
            </Button>
          ) : (
            <Button
              className="w-full bg-green-900 hover:bg-green-900/90 font-medium"
              type="submit"
              id="sign-in-button"
            >
              Sign In with Email
            </Button>
          )}
        </form>
        <Separator orientation="horizontal" className="mt-6 bg-green-700" />

        <p className="mt-8 font-normal text-mauve-1100 text-sm">
          Check your email to find the magic link.
        </p>
      </div>
    </div>
  );
}
