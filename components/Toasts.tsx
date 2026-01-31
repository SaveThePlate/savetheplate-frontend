"use client";

import { useLanguage } from "@/context/LanguageContext";

export const AuthToast = () => {
  const { t } = useLanguage();
  
  return (
    <div className="flex flex-col gap-2 mx-4 my-2 p-4 bg-green-50 border border-green-200 rounded-lg shadow-lg max-w-md">
      <div className="flex gap-3 items-center">
        <div className="bg-green-200 flex justify-center items-center w-9 h-9 rounded-lg">
          <span className="text-green-700 font-bold">✔</span>
        </div>
        <h2 className="font-semibold text-lg text-green-900">
          {t("toasts.check_email") || "Check your email"}
        </h2>
      </div>
      <p className="font-normal text-green-800 text-sm">
        {t("toasts.login_link_sent") || "We sent you a login link. Be sure to check your spam too."}
      </p>
    </div>
  );
};

export const ErrorToast = ({ message }: { message?: string }) => {
  const { t } = useLanguage();
  
  // Ensure message is always a string
  const safeMessage = typeof message === 'string' ? message : (message ? String(message) : undefined);
  
  return (
    <div className="flex flex-col gap-2 mx-4 my-2 p-4 bg-red-50 border border-red-200 rounded-lg shadow-lg max-w-md">
      <div className="flex gap-3 items-center">
        <div className="bg-red-200 flex justify-center items-center w-9 h-9 rounded-lg">
          <span className="text-red-700 font-bold">⚠</span>
        </div>
        <h2 className="font-semibold text-lg text-red-900">
          {t("toasts.error") || "Error"}
        </h2>
      </div>
      <p className="font-normal text-red-800 text-sm">
        {safeMessage || t("toasts.error_generic") || "There was an error, please try again."}
      </p>
    </div>
  );
};
