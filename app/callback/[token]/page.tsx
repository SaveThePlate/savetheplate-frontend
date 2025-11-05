"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { LocalStorage } from "@/lib/utils";
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
        // console.log(resp);


        LocalStorage.setItem("refresh-token", resp.data.refreshToken);
        LocalStorage.setItem("accessToken", resp.data.accessToken);
        LocalStorage.removeItem("remember");

        const accessToken = resp.data.accessToken;
        if (accessToken) {
          try {
            const decodedToken = JSON.parse(atob(accessToken.split('.')[1]));
            const role = decodedToken?.role;

            if (role === 'PROVIDER') {
              router.push("/provider/home");
            } else if (role === 'CLIENT') {
              router.push("/client/home");
            } else {
              router.push("/"); 
            }
          } catch (error) {
            console.error("Error decoding token", error);
            router.push("/"); 
          }
        }
      })
      .catch((error: any) => {
        console.log(error);
      });
  }, [token, clientApi, router]);

}

export default AuthCallback;
