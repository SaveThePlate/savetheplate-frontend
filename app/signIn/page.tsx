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
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showAuthToast, setShowAuthToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [authMode, setAuthMode] = useState<"magic-link" | "password">("password");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showVerificationCode, setShowVerificationCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [signUpEmail, setSignUpEmail] = useState("");

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
        const response = await axiosInstance.get(
          `/users/get-role`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const userRole = response?.data?.role;
        if (userRole === 'PROVIDER') {
          // Check if provider has submitted location details
          // If not, redirect to fillDetails page to complete their information
          try {
            const userDetails = await axiosInstance.get(
              `/users/me`,
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
      setErrorMessage("Please enter a valid email address.");
      setShowAuthToast(false);
      return;
    }

    setLoading(true);
    setShowErrorToast(false);
    setShowAuthToast(false);

    try {
      // Form submission only handles password authentication
      // Magic link is handled by the alternative button
      if (isSignUp) {
          // Sign up with password
          if (!password || password.length < 8) {
            setShowErrorToast(true);
            setErrorMessage("Password must be at least 8 characters long.");
            setLoading(false);
            return;
          }
          if (!username || username.trim().length === 0) {
            setShowErrorToast(true);
            setErrorMessage("Username is required.");
            setLoading(false);
            return;
          }

          const response = await axiosInstance.post(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/signup`,
            {
              email,
              password,
              username,
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.data?.accessToken && response.data?.refreshToken) {
            // Store tokens first (needed for verification flow)
            LocalStorage.setItem("refresh-token", response.data.refreshToken);
            LocalStorage.setItem("accessToken", response.data.accessToken);
            LocalStorage.removeItem("remember");
            
            // Check if email is verified
            const userEmailVerified = response.data.user?.emailVerified;
            
            if (!userEmailVerified) {
              // Show verification code input instead of redirecting
              setSignUpEmail(email);
              setShowVerificationCode(true);
              
              // Automatically send verification email after sign up
              try {
                await axiosInstance.post(
                  `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/send-verification-email`,
                  { email },
                  {
                    headers: {
                      'Content-Type': 'application/json',
                    },
                  }
                );
                setShowAuthToast(true);
                setShowErrorToast(false);
              } catch (emailError: any) {
                // If sending email fails, still show the verification form
                // but show an error message
                console.error("Failed to send verification email:", emailError);
                setShowAuthToast(false);
                setShowErrorToast(true);
                setErrorMessage(
                  emailError?.response?.data?.error || 
                  "Account created but failed to send verification email. Please click 'Resend Code' to try again."
                );
              }
              
              setLoading(false);
              return;
            }

            // Email is verified, proceed with normal flow

            const role = response.data.role || response.data.user?.role;
            let redirectTo = '/onboarding';

            if (role === 'PROVIDER') {
              try {
                const userDetails = await axiosInstance.get(
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

            router.push(redirectTo);
          } else {
            throw new Error("Invalid response from server");
          }
        } else {
          // Sign in with password
          if (!password) {
            setShowErrorToast(true);
            setErrorMessage("Password is required.");
            setLoading(false);
            return;
          }

          const response = await axiosInstance.post(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/signin`,
            {
              email,
              password,
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.data?.accessToken && response.data?.refreshToken) {
            LocalStorage.setItem("refresh-token", response.data.refreshToken);
            LocalStorage.setItem("accessToken", response.data.accessToken);
            LocalStorage.removeItem("remember");

            const role = response.data.role || response.data.user?.role;
            let redirectTo = '/onboarding';

            if (role === 'PROVIDER') {
              try {
                const userDetails = await axiosInstance.get(
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

            router.push(redirectTo);
          } else {
            throw new Error("Invalid response from server");
          }
        }
      setLoading(false);
    } catch (err: any) {
      console.error("Authentication error:", err);
      
      // Determine if this is a sign-in or sign-up error
      const isSignInError = !isSignUp;
      
      // Use sanitizeErrorMessage for user-friendly messages
      let userMessage = sanitizeErrorMessage(err, {
        action: isSignUp ? "sign up" : "sign in",
        defaultMessage: isSignInError 
          ? t("signin.error_invalid_credentials") || "Invalid email or password. Please check your credentials and try again."
          : t("signin.error_signup_failed") || "Unable to create account. Please check your information and try again.",
        t: t
      });
      
      // Handle specific error cases with clearer messages
      if (err?.response?.status === 404) {
        // 404 on auth endpoint usually means wrong credentials or endpoint doesn't exist
        userMessage = t("signin.error_invalid_credentials") || "Invalid email or password. Please check your credentials and try again.";
      } else if (err?.response?.status === 401) {
        // 401 means unauthorized - wrong credentials
        userMessage = t("signin.error_invalid_credentials") || "Invalid email or password. Please check your credentials and try again.";
      } else if (err?.response?.status === 400) {
        // 400 could be validation error or wrong credentials
        const backendMsg = err?.response?.data?.message || err?.response?.data?.error || '';
        if (backendMsg.toLowerCase().includes('password') || 
            backendMsg.toLowerCase().includes('credential') ||
            backendMsg.toLowerCase().includes('invalid')) {
          userMessage = t("signin.error_invalid_credentials") || "Invalid email or password. Please check your credentials and try again.";
        } else if (isSignUp && backendMsg) {
          // For sign-up, show the backend message if it's user-friendly
          userMessage = backendMsg;
        }
      } else if (err?.response?.status === 409) {
        // 409 Conflict - user already exists
        userMessage = t("signin.error_account_exists") || "An account with this email already exists. Please sign in instead.";
        // Immediately switch to sign-in mode if user was trying to sign up
        if (isSignUp) {
          setIsSignUp(false);
          setPassword("");
          setUsername("");
          console.log("Switched to sign-in mode - user already exists");
        }
      }
      
      setErrorMessage(userMessage);
      setShowErrorToast(true);
      setShowAuthToast(false);
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 6) {
      setShowErrorToast(true);
      setErrorMessage("Please enter a valid 6-digit code.");
      return;
    }

    setVerifyingCode(true);
    setShowErrorToast(false);

    try {
      // Ensure code is sent as a string and trimmed
      const codeToSend = String(verificationCode).trim();
      
      console.log('Sending verification request:', {
        email: signUpEmail,
        codeLength: codeToSend.length,
        code: codeToSend,
      });
      
      const response = await axiosInstance.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/verify-email-code`,
        {
          email: signUpEmail.trim(),
          code: codeToSend,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data?.verified) {
        // Get the stored tokens from signup (should be there from signup)
        const token = localStorage.getItem("accessToken");
        
        if (!token) {
          // If no token, user might have refreshed or tokens expired
          // Redirect to sign in - they'll need to sign in again
          console.warn("No access token found after verification, redirecting to sign in");
          setShowErrorToast(true);
          setErrorMessage("Please sign in again to continue.");
          setTimeout(() => {
            router.push("/signIn");
          }, 2000);
          return;
        }

        // Fetch user details to get role
        try {
          const userDetails = await axiosInstance.get(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const role = userDetails.data?.role;
          let redirectTo = '/onboarding';

          if (role === 'PROVIDER') {
            const { phoneNumber, mapsLink } = userDetails.data || {};
            if (!phoneNumber || !mapsLink) {
              redirectTo = '/onboarding/fillDetails';
            } else {
              redirectTo = '/provider/home';
            }
          } else if (role === 'PENDING_PROVIDER') {
            redirectTo = '/onboarding/thank-you';
          } else if (role === 'CLIENT') {
            redirectTo = '/client/home';
          }

          router.push(redirectTo);
        } catch (userDetailsError: any) {
          console.error("Error fetching user details after verification:", userDetailsError);
          // If token is invalid, redirect to sign in
          if (userDetailsError?.response?.status === 401 || userDetailsError?.response?.status === 403) {
            setShowErrorToast(true);
            setErrorMessage("Session expired. Please sign in again.");
            setTimeout(() => {
              router.push("/signIn");
            }, 2000);
          } else {
            // Other error, still try to redirect to onboarding
            router.push('/onboarding');
          }
        }
      } else {
        throw new Error("Verification failed");
      }
    } catch (err: any) {
      console.error("Error verifying code:", err);
      console.error("Error response:", err?.response?.data);
      
      // Use sanitizeErrorMessage for user-friendly messages
      const userMessage = sanitizeErrorMessage(err, {
        action: "verify email code",
        defaultMessage: t("signin.error_verify_code") || "Invalid verification code. Please check and try again.",
        t: t
      });
      
      setErrorMessage(userMessage);
      setShowErrorToast(true);
    } finally {
      setVerifyingCode(false);
    }
  }

  async function handleResendCode() {
    try {
      setLoading(true);
      await axiosInstance.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/send-verification-email`,
        { email: signUpEmail },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      setShowAuthToast(true);
      setShowErrorToast(false);
      setErrorMessage("");
    } catch (err: any) {
      // Use sanitizeErrorMessage for user-friendly messages
      const userMessage = sanitizeErrorMessage(err, {
        action: "resend verification code",
        defaultMessage: t("signin.error_resend_code") || "Failed to resend verification code. Please try again.",
        t: t
      });
      setErrorMessage(userMessage);
      setShowErrorToast(true);
    } finally {
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
      const response = await axiosInstance.post(
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
            const userDetails = await axiosInstance.get(
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
      
      // Use sanitizeErrorMessage for user-friendly messages
      const userMessage = sanitizeErrorMessage(err, {
        action: "sign in with Google",
        defaultMessage: "Unable to sign in with Google. Please try again.",
        t: t
      });
      
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
      const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
      if (!appId) {
        throw new Error("Facebook App ID is not configured. Please contact support.");
      }

      // Check if we're on HTTPS (required for Facebook login in production)
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

      // Detect if user is on mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                       (window.innerWidth <= 768 && window.innerHeight <= 1024);
      
      // On mobile devices, use OAuth flow that opens Facebook native app
      // This allows users already logged into Facebook app to authenticate without re-entering credentials
      if (isMobile) {
        console.log("Mobile device detected, using OAuth flow to open Facebook native app");
        
        // Build OAuth redirect URL
        const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);
        const scope = encodeURIComponent('email,public_profile');
        const state = encodeURIComponent(Date.now().toString()); // Simple state for CSRF protection
        
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        const isAndroid = /Android/i.test(navigator.userAgent);
        
        // Web OAuth fallback URL (used if native app is not installed)
        const webOAuthUrl = `https://m.facebook.com/v24.0/dialog/oauth?` +
          `client_id=${appId}&` +
          `redirect_uri=${redirectUri}&` +
          `scope=${scope}&` +
          `state=${state}&` +
          `response_type=code&` +
          `display=touch`;
        
        if (isIOS) {
          // iOS: Try to open Facebook app using fb:// URL scheme
          // Format: fb{appId}://authorize
          // If the app is installed, iOS will open it automatically
          const facebookAppUrl = `fb${appId}://authorize?` +
            `client_id=${appId}&` +
            `redirect_uri=${redirectUri}&` +
            `scope=${scope}&` +
            `state=${state}&` +
            `response_type=code`;
          
          // Track if app opened (page becomes hidden)
          let appOpened = false;
          const startTime = Date.now();
          
          // Listen for page visibility change (indicates app opened)
          const visibilityHandler = () => {
            if (document.hidden) {
              appOpened = true;
            }
          };
          document.addEventListener('visibilitychange', visibilityHandler);
          
          // Try to open the Facebook app
          window.location.href = facebookAppUrl;
          
          // Fallback: If app doesn't open within 2 seconds, use web OAuth
          setTimeout(() => {
            document.removeEventListener('visibilitychange', visibilityHandler);
            // Only fallback if page is still visible (app didn't open)
            if (!appOpened && document.visibilityState === 'visible') {
              console.log("Facebook app not available, falling back to web OAuth");
              window.location.href = webOAuthUrl;
            }
          }, 2000);
          
        } else if (isAndroid) {
          // Android: Use intent:// URL to open Facebook app
          // This will open the app if installed, otherwise fall back to web OAuth
          const intentUrl = `intent://authorize?` +
            `client_id=${appId}&` +
            `redirect_uri=${redirectUri}&` +
            `scope=${scope}&` +
            `state=${state}&` +
            `response_type=code` +
            `#Intent;scheme=fb${appId};package=com.facebook.katana;S.browser_fallback_url=${encodeURIComponent(webOAuthUrl)};end`;
          
          window.location.href = intentUrl;
        } else {
          // Other mobile devices, use mobile web OAuth
          window.location.href = webOAuthUrl;
        }
        
        return; // Don't set loading to false, as we're redirecting
      }

      // On desktop, use JavaScript SDK (FB.login)
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
      console.log("Attempting Facebook login with App ID:", appId);

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
    // Generic error - use sanitizeErrorMessage for user-friendly messages
    else {
      const userFriendlyMessage = sanitizeErrorMessage(error, {
        action: "sign in with Facebook",
        defaultMessage: t("signin.facebook_error") || "Unable to sign in with Facebook. Please try again.",
        t: t
      });
      setErrorMessage(userFriendlyMessage);
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
        const backendResponse = await axiosInstance.post(
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
              const userDetails = await axiosInstance.get(
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
        
        // Use sanitizeErrorMessage for user-friendly messages
        const userMessage = sanitizeErrorMessage(err, {
          action: "sign in with Facebook",
          defaultMessage: "Unable to sign in with Facebook. Please try again.",
          t: t
        });
        
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
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-emerald-200 rounded-full" />
            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-muted-foreground text-sm font-medium">{t("common.loading") || "Checking authentication..."}</p>
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
        className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-border shadow-sm hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-200 text-sm font-medium"
        aria-label="Back to home"
      >
        <Home size={18} />
        <span className="hidden sm:inline">{t("nav.home") || "Home"}</span>
      </button>

      <div className="w-full max-w-md mx-auto">
        {/* Sign In Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-border/50 overflow-hidden backdrop-blur-sm">
          {/* Header Section with Logo */}
          <div className="bg-gradient-to-br from-emerald-50 to-white px-4 sm:px-6 lg:px-8 py-8 sm:py-10 text-center border-b border-border/50">
            <button
              onClick={() => router.push("/")}
              className="inline-block mb-5 sm:mb-6 hover:opacity-90 transition-all duration-200 hover:scale-105"
              aria-label="Go to home page"
            >
              <Image
                src="/logo.png"
                alt="Save The Plate"
                width={90}
                height={90}
                className="sm:w-[110px] sm:h-[110px] object-contain cursor-pointer mx-auto drop-shadow-sm"
                priority
              />
            </button>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2 sm:mb-3 bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
              {!isNewUser ? t("signin.welcome_new") : t("signin.welcome_back")}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base px-2 leading-relaxed">
              {!isNewUser
                ? t("signin.description_new")
                : t("signin.description_back")}
            </p>
          </div>

          {/* Form Section */}
          <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* Verification Code Input */}
            {showVerificationCode ? (
              <div className="space-y-5 animate-fade-in">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                    <span className="text-3xl">📧</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                    Verify Your Email
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    We&apos;ve sent a 6-digit verification code to <br />
                    <strong className="text-emerald-600">{signUpEmail}</strong>
                  </p>
                </div>

                <form onSubmit={handleVerifyCode} className="space-y-5">
                  <div>
                    <label htmlFor="verificationCode" className="block text-sm font-semibold text-foreground mb-3">
                      Verification Code
                    </label>
                    <Input
                      id="verificationCode"
                      placeholder="000000"
                      className="w-full px-4 py-4 text-lg border-2 border-border rounded-xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white transition-all text-center text-3xl tracking-[0.5em] font-mono"
                      type="text"
                      required
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setVerificationCode(value);
                      }}
                      autoFocus
                    />
                    <p className="mt-2 text-xs text-muted-foreground text-center">
                      Enter the 6-digit code from your email
                    </p>
                  </div>

                  {verifyingCode ? (
                    <Button
                      disabled
                      className="w-full bg-emerald-600 text-white font-semibold py-3.5 rounded-xl flex justify-center items-center text-base shadow-lg"
                    >
                      <ReloadIcon className="mr-2 h-5 w-5 animate-spin" />
                      Verifying...
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-base"
                      type="submit"
                    >
                      Verify Email
                    </Button>
                  )}

                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={loading}
                    className="w-full text-sm text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50 transition-colors"
                  >
                    {loading ? "Sending..." : "Resend Code"}
                  </button>
                </form>

                {showAuthToast && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800 transition-all duration-300">
                    Verification code sent! Please check your email.
                  </div>
                )}
                {showErrorToast && <ErrorToast message={errorMessage} />}
              </div>
            ) : (
              <>
            {/* Sign Up / Sign In Toggle */}
            <div className="flex gap-2 mb-6 p-1.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setPassword("");
                  setUsername("");
                }}
                className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  !isSignUp
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-gray-700 hover:text-emerald-600 hover:bg-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setPassword("");
                }}
                className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  isSignUp
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-gray-700 hover:text-emerald-600 hover:bg-white"
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  placeholder="name@example.com"
                  className="w-full px-4 py-3.5 text-base border-2 border-border rounded-xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white transition-all hover:border-emerald-300"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-5">
                {isSignUp && (
                  <div className="space-y-1.5">
                    <label htmlFor="username" className="block text-sm font-semibold text-foreground mb-2">
                      Username
                    </label>
                    <Input
                      id="username"
                      placeholder="john_doe"
                      className="w-full px-4 py-3.5 text-base border-2 border-border rounded-xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white transition-all hover:border-emerald-300"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-2">
                    Password
                  </label>
                  <Input
                    id="password"
                    placeholder={isSignUp ? "At least 8 characters" : "Enter your password"}
                    className="w-full px-4 py-3.5 text-base border-2 border-border rounded-xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white transition-all hover:border-emerald-300"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={isSignUp ? 8 : undefined}
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                  />
                  {isSignUp && (
                    <p className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1">
                      <span>🔒</span>
                      Password must be at least 8 characters long
                    </p>
                  )}
                </div>
              </div>

              {loading ? (
                <Button
                  disabled
                  className="w-full bg-emerald-600 text-white font-semibold py-3.5 rounded-xl flex justify-center items-center text-base shadow-lg mt-6"
                >
                  <ReloadIcon className="mr-2 h-5 w-5 animate-spin" />
                  {isSignUp ? "Signing up..." : "Signing in..."}
                </Button>
              ) : (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-base mt-6 transform hover:scale-[1.02] active:scale-[0.98]"
                  type="submit"
                  id="sign-in-button"
                >
                  {isSignUp ? "Create Account" : "Sign In"}
                </Button>
              )}
            </form>

            {/* Alternative Authentication Options */}
            <div>
              {/* Separator */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-muted-foreground font-medium">
                    {t("common.or") || "or"}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {/* Magic Link - Passwordless Option */}
                <Button
                  onClick={async (e) => {
                    e.preventDefault();
                    if (!email || !email.includes('@')) {
                      setShowErrorToast(true);
                      setErrorMessage("Please enter a valid email address.");
                      setShowAuthToast(false);
                      return;
                    }
                    setAuthMode("magic-link");
                    setMagicLinkLoading(true);
                    setShowErrorToast(false);
                    setShowAuthToast(false);
                    try {
                      const resp = await clientApi.POST("/auth/send-magic-mail", {
                        body: { email },
                      });
                      
                      // Check if response is successful
                      // OpenApiFetch returns { data, response, error }
                      // If there's no error, the request was successful
                      if (resp.response && (resp.response.status === 200 || resp.response.status === 201)) {
                        setShowAuthToast(true);
                        setShowErrorToast(false);
                        setMagicLinkLoading(false);
                        return;
                      }
                      
                      // If response exists but status is not 200/201, treat as error
                      throw new Error("Unexpected response status");
                    } catch (err: any) {
                      console.error("Magic link error:", err);
                      
                      // Check if it's actually a successful response that was thrown
                      // Sometimes OpenApiFetch might throw even on success
                      if (err?.response?.status === 200 || err?.response?.status === 201) {
                        setShowAuthToast(true);
                        setShowErrorToast(false);
                        setMagicLinkLoading(false);
                        return;
                      }
                      
                      // Use sanitizeErrorMessage for user-friendly messages
                      const userMessage = sanitizeErrorMessage(err, {
                        action: "send magic link",
                        defaultMessage: "Unable to send magic link. Please check your email and try again.",
                        t: t
                      });
                      
                      setErrorMessage(userMessage);
                      setShowErrorToast(true);
                      setShowAuthToast(false);
                    } finally {
                      setMagicLinkLoading(false);
                    }
                  }}
                  disabled={magicLinkLoading || loading || !email || !email.includes('@')}
                  className="w-full bg-white border-2 border-emerald-200 hover:border-emerald-300 text-emerald-600 hover:text-emerald-700 font-semibold py-3.5 rounded-xl flex justify-center items-center gap-3 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {magicLinkLoading ? (
                    <>
                      <ReloadIcon className="h-5 w-5 animate-spin" />
                      <span>{t("signin.sending") || "Sending..."}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl">✨</span>
                      <span>{t("signin.sign_in_email") || "Continue with Magic Link"}</span>
                    </>
                  )}
                </Button>

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
                    className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold py-3.5 rounded-xl flex justify-center items-center gap-3 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {facebookLoading ? (
                      <>
                        <ReloadIcon className="h-5 w-5 animate-spin" />
                        <span>{t("signin.facebook_signing_in") || "Signing in with Facebook..."}</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        <span>{t("signin.facebook_sign_in") || "Continue with Facebook"}</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Toast Messages */}
            <div className="mt-6 space-y-3">
              {showAuthToast && <AuthToast />}
              {showErrorToast && <ErrorToast message={errorMessage} />}
            </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
