import createClient from "openapi-fetch";
import type { paths } from "@/generated/api/schema";
import { LocalStorage, SessionStorage } from "@/lib/utils";
import { useRouter } from "next/navigation";

const getaccessToken = () => {
  if (SessionStorage.getItem("accessToken")) {
    return SessionStorage.getItem("accessToken");
  }
  return LocalStorage.getItem("accessToken");
};

// eslint-disable-next-line import/no-anonymous-default-export
const useOpenApiFetch = () => {
  const route = useRouter();
  const baseClient = createClient<paths>({
    baseUrl:
      process.env.NEXT_PUBLIC_BACKEND_URL || "https://leftover.ccdev.space",
    headers: {
      Authorization:
        "Bearer " + (typeof window != "undefined" ? getaccessToken() : ""),
    },
  });

  function wrapper<T extends Function>(originalFn: T): T {
    const wrapFn = async (...args: any) => {
      try {
        const res = await originalFn(...args);
        const rawResponse = res.response;
        if (rawResponse.status === 403 || rawResponse.status === 401) {
          if (typeof window != "undefined") {
            // window.location.href = "/signin";
            // route.push("/signin");
          }
        }
        if (res.error) throw res.error;

        return res;
      } finally {
      }
    };
    return wrapFn as unknown as T;
  }

  return {
    GET: wrapper(baseClient.GET),
    POST: wrapper(baseClient.POST),
    PUT: wrapper(baseClient.PUT),
    PATCH: wrapper(baseClient.PATCH),
    DEL: wrapper(baseClient.DELETE),
  };
};

export default useOpenApiFetch;