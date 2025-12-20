"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ReloadIcon } from "@radix-ui/react-icons";
import useOpenApiFetch from "@/lib/OpenApiFetch";
import { AuthToast, ErrorToast } from "@/components/Toasts";
import { useRouter } from "next/navigation";
import axios from "axios";
import { axiosInstance } from "@/lib/axiosInstance";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";
import { sanitizeErrorMessage } from "@/utils/errorUtils";
import { GoogleLogin } from "@react-oauth/google";
import { LocalStorage } from "@/lib/utils";
import { Home } from "lucide-react";

export default function SignIn() {
  const { t, language } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showAuthToast, setShowAuthToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);

  const clientApi = useOpenApiFetch();
  const router = useRouter();

  // Check if user is already signed in
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
          // Check if provider has submitted location details
          // If not, redirect to fillDetails page to complete their information
          try {
            const userDetails = await axios.get(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const { phoneNumber, mapsLink } = userDetails.data || {};
            // If location details are missing, redirect to fillDetails page to complete them
            if (!phoneNumber || !mapsLink) {
              router.push("/onboarding/fillDetails");
            } else {
              router.push("/provider/home");
            }
          } catch (error) {
            // If we can't fetch user details, redirect to fillDetails to be safe
            console.error("Error fetching user details:", error);
            router.push("/onboarding/fillDetails");
          }
        } else if (userRole === 'CLIENT') {
          // Redirect to client home
          router.push("/client/home");
        } else {
          setCheckingAuth(false);
        }
      } catch (error) {
        // Token is invalid or expired, allow sign in
        console.debug("Token check failed, showing sign in form");
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    // Validate email format
    if (!email || !email.includes('@')) {
      setShowErrorToast(true);
      setShowAuthToast(false);
      return;
    }

    setLoading(true);
    setShowErrorToast(false);
    setShowAuthToast(false);

    try {
      const resp = await clientApi.POST("/auth/send-magic-mail", {
        body: { email },
      });

      // Accept both 200 (OK) and 201 (Created) status codes
      const status = resp.response?.status;
      if (status === 200 || status === 201) {
        setShowAuthToast(true);
        setShowErrorToast(false);
      } else {
        console.error("Unexpected status code:", status, resp);
        setShowErrorToast(true);
        setShowAuthToast(false);
      }
      setLoading(false);
    } catch (err: any) {
      console.error("Failed to send magic link:", err);
      
      let userMessage = "There was an error sending the magic link. Please try again.";
      
      // Check if it's a network error (502, CORS, etc.)
      if (err?.isNetworkError || 
          err?.status === 502 || 
          err?.status === 503 ||
          err?.message?.includes("Server is temporarily unavailable") ||
          err?.message?.includes("Network error")) {
        console.error("Network/Server error detected");
        userMessage = "Server is temporarily unavailable. Please try again in a few moments.";
      }
      // Check for CORS errors (usually happens when backend is down and Cloudflare returns 502 without CORS headers)
      else if (err?.message?.includes("CORS") || 
               err?.message?.includes("Access-Control") ||
               err?.message?.includes("Failed to fetch")) {
        console.error("CORS/Network error - likely backend is down");
        userMessage = "Unable to connect to the server. Please check your connection and try again.";
      }
      // Check if it's an API error with response data
      else if (err?.response?.data || err?.data) {
        userMessage = sanitizeErrorMessage(err, {
          action: "send magic link",
          defaultMessage: "There was an error sending the magic link. Please try again."
        });
      }
      
      setErrorMessage(userMessage);
      setShowErrorToast(true);
      setShowAuthToast(false);
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(credentialResponse: any) {
    setGoogleLoading(true);
    setShowErrorToast(false);
    setShowAuthToast(false);

    try {
      // Validate credential exists
      if (!credentialResponse?.credential) {
        throw new Error("No credential received from Google");
      }

      // Send Google credential to backend
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/google`,
        {
          credential: credentialResponse.credential,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Check if response has tokens
      if (response.data?.accessToken && response.data?.refreshToken) {
        // Store tokens
        LocalStorage.setItem("refresh-token", response.data.refreshToken);
        LocalStorage.setItem("accessToken", response.data.accessToken);
        LocalStorage.removeItem("remember");

        // Determine redirect based on user's role
        const role = response.data.role || response.data.user?.role;
        let redirectTo = '/onboarding'; // Default for new users

        // If user has a valid role, determine redirect
        if (role === 'PROVIDER') {
          // Check if provider has submitted location details
          try {
            const userDetails = await axios.get(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
              { headers: { Authorization: `Bearer ${response.data.accessToken}` } }
            );
            const { phoneNumber, mapsLink } = userDetails.data || {};
            if (!phoneNumber || !mapsLink) {
              redirectTo = '/onboarding/fillDetails';
            } else {
              redirectTo = '/provider/home';
            }
          } catch (error) {
            console.error("Error fetching user details:", error);
            redirectTo = '/onboarding/fillDetails';
          }
        } else if (role === 'PENDING_PROVIDER') {
          redirectTo = '/onboarding/thank-you';
        } else if (role === 'CLIENT') {
          redirectTo = '/client/home';
        }

        // Redirect user
        router.push(redirectTo);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      console.error("Failed to authenticate with Google:", err);
      console.error("Error details:", {
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        data: err?.response?.data,
        message: err?.message,
        credentialLength: credentialResponse?.credential?.length,
      });
      
      let userMessage = "There was an error signing in with Google. Please try again.";
      
      // Handle 500 Internal Server Error specifically
      if (err?.response?.status === 500) {
        userMessage = "Server error during Google authentication. Please try again or contact support if the issue persists.";
        console.error("Backend returned 500 error. This is a server-side issue. Response data:", err?.response?.data);
      } else if (err?.isNetworkError || 
          err?.status === 502 || 
          err?.status === 503 ||
          err?.message?.includes("Server is temporarily unavailable") ||
          err?.message?.includes("Network error")) {
        userMessage = "Server is temporarily unavailable. Please try again in a few moments.";
      } else if (err?.message?.includes("CORS") || 
                 err?.message?.includes("Access-Control") ||
                 err?.message?.includes("Failed to fetch")) {
        userMessage = "Unable to connect to the server. Please check your connection and try again.";
      } else if (err?.response?.data || err?.data) {
        userMessage = sanitizeErrorMessage(err, {
          action: "sign in with Google",
          defaultMessage: "There was an error signing in with Google. Please try again."
        });
      }
      
      setErrorMessage(userMessage);
      setShowErrorToast(true);
      setGoogleLoading(false);
    }
  }

  function handleGoogleError() {
    console.error("Google sign-in failed");
    setErrorMessage(t("signin.google_error") || "Google sign-in was cancelled or failed. Please try again.");
    setShowErrorToast(true);
    setGoogleLoading(false);
  }

  function handleFacebookLogin() {
    setFacebookLoading(true);
    setShowErrorToast(false);
    setShowAuthToast(false);

    try {
      // Check if Facebook SDK is loaded
      if (typeof window === 'undefined' || !(window as any).FB) {
        throw new Error("Facebook SDK not loaded. Please refresh the page and try again.");
      }

      // Verify SDK is initialized
      if (!(window as any).FB.getLoginStatus) {
        throw new Error("Facebook SDK is not fully initialized. Please wait a moment and try again.");
      }

      // Check for SDK initialization errors
      const sdkError = (window as any).facebookSDKError;
      if (sdkError) {
        console.error("Facebook SDK initialization error detected:", sdkError);
        throw new Error(sdkError);
      }

      // Log App ID for debugging (only in console, not exposed to user)
      const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
      if (appId) {
        console.log("Attempting Facebook login with App ID:", appId);
      } else {
        console.warn("NEXT_PUBLIC_FACEBOOK_APP_ID is not set");
      }

      // Check if we're on HTTPS (required for FB.login in production)
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isHttps = window.location.protocol === 'https:';
      
      if (!isHttps && !isLocalhost) {
        const currentUrl = window.location.href;
        const httpsUrl = currentUrl.replace(/^http:/, 'https:');
        setErrorMessage(
          t("signin.facebook_https_required") || 
          `Facebook login requires HTTPS. Please use: ${httpsUrl}\n\n` +
          "If you're the administrator, ensure:\n" +
          "1. Your site is served over HTTPS\n" +
          "2. 'Enforce HTTPS' is enabled in Facebook Developers settings\n" +
          "3. All OAuth redirect URIs use HTTPS"
        );
        setShowErrorToast(true);
        setFacebookLoading(false);
        return;
      }

      // Login with Facebook - use regular function, not async
      // Wrap in try-catch to handle errors from FB.login
      try {
        (window as any).FB.login(
          (response: any) => {
            // Check for errors in the response
            if (response.error) {
              console.error("Facebook login response error:", response.error);
              handleFacebookError(response.error);
              return;
            }
            // Handle the response in a separate async function
            handleFacebookResponse(response);
          },
          { scope: 'email,public_profile' }
        );
      } catch (loginError: any) {
        console.error("FB.login threw an error:", loginError);
        handleFacebookError(loginError);
      }
    } catch (err: any) {
      console.error("Facebook login error:", err);
      handleFacebookError(err);
    }
  }

  function handleFacebookError(error: any) {
    setFacebookLoading(false);
    
    const errorMessage = error?.message || error?.error?.message || error?.errorMessage || '';
    const errorCode = error?.code || error?.error?.code;
    
    console.error("Facebook error details:", {
      message: errorMessage,
      code: errorCode,
      error: error
    });

    // Check for JSSDK not enabled error (in French or English)
    if (
      errorMessage.includes('JSSDK') || 
      errorMessage.includes('JavaScript SDK') ||
      errorMessage.includes('Se connecter avec le SDK JavaScript') ||
      errorMessage.includes('Login with JavaScript SDK') ||
      errorCode === 190
    ) {
      const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
      setErrorMessage(
        "Facebook JavaScript SDK is not enabled for this app.\n\n" +
        "To fix this:\n" +
        "1. Go to https://developers.facebook.com/apps/\n" +
        "2. Select your app" + (appId ? ` (App ID: ${appId})` : '') + "\n" +
        "3. Go to Settings > Basic Settings\n" +
        "4. Scroll to 'Facebook Login' section\n" +
        "5. Enable 'Login with JavaScript SDK' (set to 'Yes')\n" +
        "6. Save changes and wait a few minutes\n" +
        "7. Try again\n\n" +
        "For detailed instructions, see GUIDE_ACTIVER_FACEBOOK_JSSDK.md"
      );
    }
    // Check for specific Facebook HTTPS errors
    else if (errorMessage.includes('secure') || errorMessage.includes('HTTPS') || errorMessage.includes('connexion sécurisée')) {
      setErrorMessage(
        t("signin.facebook_https_error") || 
        "Facebook requires a secure connection (HTTPS). Please ensure:\n" +
        "1. Your site uses HTTPS\n" +
        "2. 'Enforce HTTPS' is enabled in Facebook Developers\n" +
        "3. All OAuth redirect URIs use HTTPS"
      );
    }
    // Check for app not setup errors
    else if (errorMessage.includes('App Not Setup') || errorMessage.includes('app is still in development')) {
      setErrorMessage(
        "Facebook app is not properly configured or is in development mode.\n\n" +
        "To fix this:\n" +
        "1. Go to https://developers.facebook.com/apps/\n" +
        "2. Select your app\n" +
        "3. Go to Settings > Basic Settings\n" +
        "4. Ensure 'Login with JavaScript SDK' is enabled\n" +
        "5. Add your domain to 'App Domains'\n" +
        "6. If in development mode, add yourself as a Tester in Roles\n" +
        "7. Try again"
      );
    }
    // Generic error
    else {
      setErrorMessage(
        t("signin.facebook_error") || 
        "Facebook sign-in failed. " + (errorMessage ? `Error: ${errorMessage}` : "Please try again.")
      );
    }
    
    setShowErrorToast(true);
  }

  async function handleFacebookResponse(response: any) {
    if (response.authResponse) {
      // Get user access token
      const accessToken = response.authResponse.accessToken;

      // Send Facebook access token to backend
      // Use axios directly (not axiosInstance) since we're authenticating - no token needed
      try {
        const backendResponse = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/facebook`,
          {
            accessToken: accessToken,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            // Don't use axiosInstance here - we're authenticating, so no auth token needed
            // This prevents token conflicts
          }
        );

        // Check if response has tokens
        if (backendResponse.data?.accessToken && backendResponse.data?.refreshToken) {
          // Store tokens
          LocalStorage.setItem("refresh-token", backendResponse.data.refreshToken);
          LocalStorage.setItem("accessToken", backendResponse.data.accessToken);
          LocalStorage.removeItem("remember");

          // Determine redirect based on user's role
          const role = backendResponse.data.role || backendResponse.data.user?.role;
          let redirectTo = '/onboarding'; // Default for new users

          // If user has a valid role, determine redirect
          if (role === 'PROVIDER') {
            try {
              const userDetails = await axios.get(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
                { headers: { Authorization: `Bearer ${backendResponse.data.accessToken}` } }
              );
              const { phoneNumber, mapsLink } = userDetails.data || {};
              if (!phoneNumber || !mapsLink) {
                redirectTo = '/onboarding/fillDetails';
              } else {
                redirectTo = '/provider/home';
              }
            } catch (error) {
              console.error("Error fetching user details:", error);
              redirectTo = '/onboarding/fillDetails';
            }
          } else if (role === 'PENDING_PROVIDER') {
            redirectTo = '/onboarding/thank-you';
          } else if (role === 'CLIENT') {
            redirectTo = '/client/home';
          }

          // Redirect user
          router.push(redirectTo);
        } else {
          throw new Error("Invalid response from server");
        }
      } catch (err: any) {
        console.error("Failed to authenticate with Facebook:", err);
        console.error("Error details:", {
          status: err?.response?.status,
          statusText: err?.response?.statusText,
          data: err?.response?.data,
          message: err?.message,
        });
        
        let userMessage = "There was an error signing in with Facebook. Please try again.";
        
        if (err?.response?.status === 500) {
          // Log backend error details for debugging
          const errorDetails = err?.response?.data;
          console.error("Backend Facebook auth error (500):", errorDetails);
          
          // Try to extract more detailed error message from backend response
          let detailedError = '';
          if (errorDetails?.message) {
            if (typeof errorDetails.message === 'object') {
              detailedError = JSON.stringify(errorDetails.message);
            } else {
              detailedError = errorDetails.message;
            }
          } else if (errorDetails?.error) {
            detailedError = typeof errorDetails.error === 'string' 
              ? errorDetails.error 
              : JSON.stringify(errorDetails.error);
          }
          
          userMessage = `Server error during Facebook authentication. ${detailedError ? `Error: ${detailedError}` : 'Please check the backend logs. The backend may be experiencing issues with Facebook OAuth configuration.'}`;
        } else if (err?.isNetworkError || 
            err?.status === 502 || 
            err?.status === 503 ||
            err?.message?.includes("Server is temporarily unavailable") ||
            err?.message?.includes("Network error")) {
          userMessage = "Server is temporarily unavailable. Please try again in a few moments.";
        } else if (err?.message?.includes("CORS") || 
                   err?.message?.includes("Access-Control") ||
                   err?.message?.includes("Failed to fetch")) {
          userMessage = "Unable to connect to the server. Please check your connection and try again.";
        } else if (err?.response?.data || err?.data) {
          userMessage = sanitizeErrorMessage(err, {
            action: "sign in with Facebook",
            defaultMessage: "There was an error signing in with Facebook. Please try again."
          });
        }
        
        setErrorMessage(userMessage);
        setShowErrorToast(true);
        setFacebookLoading(false);
      }
    } else {
      // User cancelled or login failed
      if (response.error) {
        handleFacebookError(response.error);
      } else {
        setErrorMessage(t("signin.facebook_error") || "Facebook sign-in was cancelled or failed. Please try again.");
        setShowErrorToast(true);
        setFacebookLoading(false);
      }
    }
  }

  // Show loading state while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 overflow-x-hidden">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">{t("common.loading") || "Checking authentication..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 overflow-x-hidden flex items-center justify-center py-8 sm:py-12 px-4">
      {/* Language Switcher - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher variant="button" />
      </div>

      {/* Back to Home Button - Fixed Position */}
      <button
        onClick={() => router.push("/")}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-border shadow-sm hover:bg-emerald-50 hover:text-emerald-600 transition-colors text-sm font-medium"
        aria-label="Back to home"
      >
        <Home size={18} />
        <span className="hidden sm:inline">{t("nav.home") || "Home"}</span>
      </button>

      <div className="w-full max-w-md mx-auto">
        {/* Sign In Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-border overflow-hidden">
          {/* Header Section with Logo */}
          <div className="bg-white px-6 sm:px-8 py-8 sm:py-10 text-center border-b border-border">
            <button
              onClick={() => router.push("/")}
              className="inline-block mb-6 hover:opacity-90 transition-opacity"
              aria-label="Go to home page"
            >
              <Image
                src="/logo.png"
                alt="Save The Plate"
                width={100}
                height={100}
                className="object-contain cursor-pointer mx-auto"
                priority
              />
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {!isNewUser ? t("signin.welcome_new") : t("signin.welcome_back")}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {!isNewUser
                ? t("signin.description_new")
                : t("signin.description_back")}
            </p>
          </div>

          {/* Form Section */}
          <div className="px-6 sm:px-8 py-6 sm:py-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
                  Email
                </label>
                <Input
                  id="email"
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 text-base border-2 border-border rounded-xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white transition-all"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {loading ? (
                <Button
                  disabled
                  className="w-full bg-emerald-600 text-white font-semibold py-3.5 rounded-xl flex justify-center items-center text-base shadow-lg"
                >
                  <ReloadIcon className="mr-2 h-5 w-5 animate-spin" />
                  {t("signin.sending")}
                </Button>
              ) : (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-base"
                  type="submit"
                  id="sign-in-button"
                >
                  {t("signin.sign_in_email")}
                </Button>
              )}
            </form>

            {/* Social Sign In - Google and Facebook */}
            {(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_FACEBOOK_APP_ID) && (
              <>
                {/* Separator */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-muted-foreground">
                      {t("common.or") || "or"}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                {/* Google Sign In - Temporarily commented out until logic is fixed */}
                {/* {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
                  <div className="w-full flex justify-center">
                    {googleLoading ? (
                      <Button
                        disabled
                        className="w-full bg-white border-2 border-border text-foreground font-semibold py-3 rounded-xl flex justify-center items-center hover:bg-emerald-50"
                      >
                        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                        {t("signin.google_signing_in") || "Signing in..."}
                      </Button>
                    ) : (
                      <div className="w-full flex justify-center">
                        <GoogleLogin
                          onSuccess={handleGoogleSuccess}
                          onError={handleGoogleError}
                          useOneTap={false}
                          theme="outline"
                          size="large"
                          text="signin_with"
                          shape="rectangular"
                          locale={language}
                        />
                      </div>
                    )}
                  </div>
                )} */}

                  {/* Facebook Sign In */}
                  {process.env.NEXT_PUBLIC_FACEBOOK_APP_ID && (
                    <Button
                      onClick={handleFacebookLogin}
                      disabled={facebookLoading}
                      className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold py-3.5 rounded-xl flex justify-center items-center gap-3 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base"
                    >
                      {facebookLoading ? (
                        <>
                          <ReloadIcon className="h-5 w-5 animate-spin" />
                          {t("signin.facebook_signing_in") || "Signing in with Facebook..."}
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                          {t("signin.facebook_sign_in") || "Sign in with Facebook"}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </>
            )}

            {showAuthToast && <AuthToast />}
            {showErrorToast && <ErrorToast message={errorMessage} />}

            {/* Spam folder reminder */}
            <p className="mt-6 text-center font-medium text-xs sm:text-sm text-foreground">
              {t("signin.check_spam")}
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInDown {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInDown {
          animation: fadeInDown 0.8s ease-in-out;
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-in-out;
        }
      `}</style>
    </div>
  );
}
