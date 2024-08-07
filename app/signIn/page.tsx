"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { toast } from "sonner";
import { AuthToast, ErrorToast } from "@/components/authToast";
import { auth } from "@/lib/api";
import { ReloadIcon } from "@radix-ui/react-icons";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  //   e.preventDefault();
  //   setLoading(true);
  //   const response = await auth(email);
  //   setLoading(false);
  //   toast(AuthToast);
  // }


  return (
    <div className="w-screen h-screen flex justify-center items-center">
      <div className="flex flex-col items-center w-3/4 sm:w-2/5 md:w-1/4">
       
        <div className="flex flex-col items-center space-y-2">
          <img src="fullname1.png" alt="Logo" />
          <h1 className="font-semibold text-4xl">Happy to see you again!</h1>
          <br/>
          <p className="font-normal text-l">Enter your email to sign in to your account</p>
          <br/>
        </div>

        <form
          className="flex flex-col items-center w-full gap-3"
          // onSubmit={handleSubmit}
        >
          <Input
            placeholder="name@example.com"
            className="w-full font-base"
            type="email"
            required
            onChange={(e) => setEmail(e.target.value)}
          />
          {loading ? (
            <Button disabled className="w-full bg-green-900  font-medium">
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
