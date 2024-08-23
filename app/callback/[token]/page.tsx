"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import { LocalStorage, SessionStorage } from "@/lib/utils";
import useOpenApiFetch from "@/lib/OpenApiFetch";

function AuthCallback() {
  const { token }: { token: string } = useParams();

  const router = useRouter();

  const clientApi = useOpenApiFetch();

  useEffect(() => {
    clientApi
      .POST("/auth/verify-magic-mail", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: {
          token: token,
        },
      })
      .then((resp: any) => {
        console.log(resp);
        LocalStorage.setItem("refresh-token", resp.data.refreshToken);
        LocalStorage.setItem("access-token", resp.data.accessToken);
        LocalStorage.removeItem("remember");
        router.push("/");
      })
      .catch((error: any) => {
        console.log(error);
      });
  }, [token,clientApi, router]);

  return <div>Loading...</div>;
}

export default AuthCallback;
