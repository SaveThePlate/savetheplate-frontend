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
import { useUser } from "@/context/UserContext";
import { getPostAuthRedirect } from "@/lib/authRedirect";
import { readAuthIntentRole } from "@/lib/authIntent";
import { getReCaptchaToken } from "@/lib/recaptcha";

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
  // COMMENTED OUT: Magic link disabled
  // const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  // const [authMode, setAuthMode] = useState<"magic-link" | "password">("password");
  const [magicLinkLoading] = useState(false); // Keep for compatibility but unused
  const [authMode] = useState<"magic-link" | "password">("password"); // Keep for compatibility but unused
  const [isSignUp, setIsSignUp] = useState(false);
  const [showVerificationCode, setShowVerificationCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [signUpEmail, setSignUpEmail] = useState("");

  const clientApi = useOpenApiFetch();
  const router = useRouter();
  const { user, userRole, loading: userLoading, fetchUserRole } = useUser();

  // Helper function to safely set error messages (always convert to string)
  const safeSetErrorMessage = (message: any) => {
    if (message === null || message === undefined) {
      setErrorMessage("");
    } else if (typeof message === 'string') {
      setErrorMessage(message);
    } else if (typeof message === 'object' && message.message) {
      setErrorMessage(String(message.message));
    } else {
      setErrorMessage(String(message));
    }
  };

  // Check if user is already signed in
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");
      
      if (!token) {
        setCheckingAuth(false);
        return;
      }

      try {
        // Ensure UserContext has current user (single source of truth).
        if (!userLoading && !userRole) {
          await fetchUserRole();
        }

        // If user has no role (unverified email), allow them to stay on sign in page
        // This is important for users on verification screen who want to navigate
        if (!userRole || userRole === "NONE") {
          setCheckingAuth(false);
          return;
        }

        // Redirect users with valid roles to their appropriate home pages
        if (userRole === "CLIENT") {
          router.push("/client/home");
          return;
        }
        if (userRole === "PROVIDER" || userRole === "PENDING_PROVIDER") {
          router.push("/provider/home");
          return;
        }

        setCheckingAuth(false);
      } catch (error) {
        // Token is invalid or expired, allow sign in
        console.debug("Token check failed, showing sign in form");
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router, user, userRole, userLoading, fetchUserRole]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (loading) {
      return;
    }
    
    // Validate email format
    if (!email || !email.includes('@')) {
      setShowErrorToast(true);
      setErrorMessage(t("signin.error_email_required"));
      setShowAuthToast(false);
      return;
    }

    setLoading(true);
    setShowErrorToast(false);
    setShowAuthToast(false);

    try {
      // Form submission only handles password authentication
      // COMMENTED OUT: Magic link is disabled
      if (isSignUp) {
          // Sign up with password
          if (!password || password.length < 8) {
            setShowErrorToast(true);
            setErrorMessage(t("signin.error_password_short"));
            setLoading(false);
            return;
          }
          if (!username || username.trim().length === 0) {
            setShowErrorToast(true);
            setErrorMessage(t("signin.error_username_required"));
            setLoading(false);
            return;
          }

          // Get reCAPTCHA token (will be null if not configured)
          const recaptchaToken = await getReCaptchaToken('signup');

          const response = await axiosInstance.post(
            `/auth/signup`,
            {
              email,
              password,
              username,
              recaptchaToken,
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
                  `/auth/send-verification-email`,
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
                const errorMsg = emailError?.response?.data?.error || 
                  t("signin.error_verification_email_failed");
                safeSetErrorMessage(errorMsg);
              }
              
              setLoading(false);
              return;
            }

            // Email is verified, proceed with normal flow
            // For client signup, automatically set role to CLIENT and redirect to client home
            try {
              const token = response.data.accessToken;
              
              // Set role to CLIENT
              await axiosInstance.post(
                `/users/set-role`,
                { role: "CLIENT" },
                { 
                  headers: { 
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                  } 
                }
              );
              
              // Refresh global user context
              await fetchUserRole().catch(() => {});
              
              // Redirect directly to client home
              router.push("/client/home");
            } catch (e) {
              console.error("Error setting client role:", e);
              // If setting role fails, fallback to onboarding
              fetchUserRole().catch(() => {});
              router.push("/onboarding");
            }
          } else {
            throw new Error("Invalid response from server");
          }
        } else {
          // Sign in with password
          if (!password) {
            setShowErrorToast(true);
            setErrorMessage(t("signin.error_password_required"));
            setLoading(false);
            return;
          }

          const response = await axiosInstance.post(
            `/auth/signin`,
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

            // Single source of truth: fetch `/users/me` and redirect from it.
            try {
              const meResp = await axiosInstance.get(`/users/me`, {
                headers: { Authorization: `Bearer ${response.data.accessToken}` },
              });
              fetchUserRole().catch(() => {});
              router.push(getPostAuthRedirect(meResp.data));
            } catch (e) {
              fetchUserRole().catch(() => {});
              router.push("/onboarding");
            }
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
        `/auth/verify-email-code`,
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
            `/users/me`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const role = userDetails.data?.role;
          
          // If user has no role (NONE), automatically set to CLIENT and redirect
          if (role === 'NONE' || !role) {
            try {
              await axiosInstance.post(
                `/users/set-role`,
                { role: "CLIENT" },
                { 
                  headers: { 
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                  } 
                }
              );
              
              // Refresh user context and redirect to client home
              await fetchUserRole().catch(() => {});
              router.push('/client/home');
            } catch (roleError) {
              console.error("Error setting client role after verification:", roleError);
              // If setting role fails, fallback to onboarding
              router.push('/onboarding');
            }
          } else if (role === 'PROVIDER' || role === 'PENDING_PROVIDER') {
            router.push('/provider/home');
          } else if (role === 'CLIENT') {
            router.push('/client/home');
          } else {
            // Unknown role, go to onboarding
            router.push('/onboarding');
          }
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
            // Other error, try to set role and redirect to client home (most common case)
            try {
              await axiosInstance.post(
                `/users/set-role`,
                { role: "CLIENT" },
                { 
                  headers: { 
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                  } 
                }
              );
              await fetchUserRole().catch(() => {});
              router.push('/client/home');
            } catch {
              // Last resort: go to onboarding
              router.push('/onboarding');
            }
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
        `/auth/send-verification-email`,
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
        `/auth/google`,
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

        // Single source of truth: fetch `/users/me` and redirect from it.
        try {
          const meResp = await axiosInstance.get(`/users/me`, {
            headers: { Authorization: `Bearer ${response.data.accessToken}` },
          });
          const userData = meResp.data;
          const intentRole = readAuthIntentRole();
          
          // Handle unverified users or users with no role from Google OAuth
          // Google OAuth users are typically auto-verified, but default to CLIENT if no role
          if (!userData.role || userData.role === "NONE") {
            try {
              await axiosInstance.post(
                `/users/set-role`,
                { role: "CLIENT" },
                { headers: { Authorization: `Bearer ${response.data.accessToken}` } }
              );
              await fetchUserRole().catch(() => {});
              router.push("/client/home");
            } catch (roleError) {
              console.error("Error setting role:", roleError);
              await fetchUserRole().catch(() => {});
              router.push(getPostAuthRedirect(userData, intentRole));
            }
          } else {
            await fetchUserRole().catch(() => {});
            router.push(getPostAuthRedirect(userData, intentRole));
          }
        } catch (e) {
          console.error("Error fetching user data:", e);
          await fetchUserRole().catch(() => {});
          const intentRole = readAuthIntentRole();
          router.push(getPostAuthRedirect(null, intentRole));
        }
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
        
        // Web OAuth URL - use www.facebook.com, not m.facebook.com
        // Facebook decides whether to open Facebook App or Browser based on User-Agent, not domain
        const webOAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
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
          // Android: Use mobile web OAuth directly instead of intent:// deep links
          // Many Android browsers will show an error if the fb{appId} intent scheme
          // has no handler (Facebook app not installed) and won't reliably fall back.
          // Using the mobile web OAuth URL is more robust and still lets Facebook
          // redirect back to our /auth/callback endpoint.
          console.log("Android device detected, using mobile web OAuth for Facebook login");
          window.location.href = webOAuthUrl;
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
          `/auth/facebook`,
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
                `/users/me`,
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
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation Header - Match Landing Page */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo */}
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Image
                src="/logo.png"
                alt="Save The Plate"
                width={36}
                height={36}
                className="object-contain"
              />
              <span className="text-lg font-bold text-[#1B4332] hidden sm:block">SaveThePlate</span>
            </button>
            
            {/* Center - Navigation Links (Desktop) */}
            <div className="hidden md:flex items-center gap-8">
              <a href="/#features" className="text-gray-600 hover:text-primary transition-colors font-medium relative group">
                {t("landing.fun_header_badge")}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="/#how-it-works" className="text-gray-600 hover:text-primary transition-colors font-medium relative group">
                {t("landing.how_it_works")}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="/#business" className="text-gray-600 hover:text-primary transition-colors font-medium relative group">
                {t("landing.for_business")}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
            </div>
            
            {/* Right side - Language Switcher */}
            <div className="flex items-center gap-3">
              <LanguageSwitcher variant="button" />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen pt-20 pb-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-emerald-50/30 to-white">
        <div className="w-full max-w-md">
          {/* Sign In Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-emerald-100/50 overflow-hidden backdrop-blur-sm">
            {/* Header Section with Logo */}
            <div className="bg-gradient-to-br from-white to-emerald-50 px-6 sm:px-8 py-8 sm:py-10 text-center border-b border-emerald-100/50">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1B4332] mb-2 sm:mb-3 leading-tight">
                {!isNewUser ? t("signin.welcome_new") : t("signin.welcome_back")}
              </h1>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                {!isNewUser
                  ? t("signin.description_new")
                  : t("signin.description_back")}
              </p>
            </div>

            {/* Form Section */}
            <div className="px-6 sm:px-8 py-8 sm:py-10">
            {/* Verification Code Input */}
            {showVerificationCode ? (
              <div className="space-y-4 sm:space-y-5 animate-fade-in">
                <div className="text-center mb-4 sm:mb-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-100 mb-3 sm:mb-4">
                    <span className="text-2xl sm:text-3xl">📧</span>
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-2 px-2">
                    {t("signin.verify_email_title")}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground px-3 sm:px-2">
                    {t("signin.verify_email_desc")} <br />
                    <strong className="text-emerald-600">{signUpEmail}</strong>
                  </p>
                </div>

                <form onSubmit={handleVerifyCode} className="space-y-4 sm:space-y-5">
                  <div>
                    <label htmlFor="verificationCode" className="block text-xs sm:text-sm font-semibold text-foreground mb-2 sm:mb-3">
                      {t("signin.verification_code_label")}
                    </label>
                    <Input
                      id="verificationCode"
                      placeholder={t("signin.verification_code_placeholder")}
                      className="w-full px-3 py-3 sm:px-4 sm:py-4 text-base sm:text-lg border-2 border-border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white transition-all text-center text-2xl sm:text-3xl tracking-[0.4em] sm:tracking-[0.5em] font-mono"
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
                      {t("signin.verification_code_hint")}
                    </p>
                  </div>

                  {verifyingCode ? (
                    <Button
                      disabled
                      className="w-full bg-emerald-600 text-white font-semibold py-3 sm:py-3.5 rounded-lg sm:rounded-xl flex justify-center items-center text-sm sm:text-base shadow-lg"
                    >
                      <ReloadIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      {t("signin.verifying")}
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 sm:py-3.5 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
                      type="submit"
                    >
                      {t("signin.verify_button")}
                    </Button>
                  )}

                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={loading}
                    className="w-full text-xs sm:text-sm text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50 transition-colors"
                  >
                    {loading ? t("signin.sending") : t("signin.resend_code")}
                  </button>

                  {/* Explore without verification option */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-center text-gray-600 mb-2">
                      {t("signin.verify_later") || "Want to verify your email later?"}
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push("/")}
                      className="w-full text-xs sm:text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors underline"
                    >
                      {t("signin.explore_platform") || "Explore the platform"}
                    </button>
                  </div>
                </form>

                {showAuthToast && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800 transition-all duration-300">
                    {t("signin.verification_sent")}
                  </div>
                )}
                {showErrorToast && <ErrorToast message={errorMessage} />}
              </div>
            ) : (
              <>
            {/* Sign Up / Sign In Toggle */}
            <div className="flex gap-1.5 sm:gap-2 mb-5 sm:mb-6 p-1 sm:p-1.5 bg-emerald-50/50 rounded-lg sm:rounded-xl border border-emerald-100">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setPassword("");
                  setUsername("");
                }}
                className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-semibold rounded-md sm:rounded-lg transition-all duration-200 ${
                  !isSignUp
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-gray-700 hover:text-emerald-600 hover:bg-white"
                }`}
              >
                {t("signin.sign_in")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setPassword("");
                }}
                className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-semibold rounded-md sm:rounded-lg transition-all duration-200 ${
                  isSignUp
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-gray-700 hover:text-emerald-600 hover:bg-white"
                }`}
              >
                {t("signin.sign_up")}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2.5">
                <label htmlFor="email" className="block text-sm font-semibold text-[#1B4332]">
                  {t("signin.email_label")}
                </label>
                <Input
                  id="email"
                  placeholder={t("signin.email_placeholder")}
                  className="w-full px-4 py-3 text-base border-2 border-emerald-100 rounded-lg focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white transition-all hover:border-emerald-200"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-4 sm:space-y-5">
                {isSignUp && (
                  <div className="space-y-2.5">
                    <label htmlFor="username" className="block text-sm font-semibold text-[#1B4332]">
                      {t("signin.username_label")}
                    </label>
                    <Input
                      id="username"
                      placeholder={t("signin.username_placeholder")}
                      className="w-full px-4 py-3 text-base border-2 border-emerald-100 rounded-lg focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white transition-all hover:border-emerald-200"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                    />
                  </div>
                )}
                <div className="space-y-2.5">
                  <label htmlFor="password" className="block text-sm font-semibold text-[#1B4332]">
                    {t("signin.password_label")}
                  </label>
                  <Input
                    id="password"
                    placeholder={isSignUp ? t("signin.password_placeholder_signup") : t("signin.password_placeholder_signin")}
                    className="w-full px-4 py-3 text-base border-2 border-emerald-100 rounded-lg focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white transition-all hover:border-emerald-200"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={isSignUp ? 8 : undefined}
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                  />
                  {isSignUp && (
                    <p className="mt-1.5 text-xs text-gray-600 flex items-center gap-1.5">
                      <span>🔒</span>
                      {t("signin.password_hint")}
                    </p>
                  )}
                </div>
              </div>

              {loading ? (
                <Button
                  disabled
                  className="w-full bg-emerald-600 text-white font-semibold py-3.5 rounded-lg flex justify-center items-center text-base shadow-lg mt-8"
                >
                  <ReloadIcon className="mr-2 h-5 w-5 animate-spin" />
                  {isSignUp ? t("signin.signing_up") : t("signin.signing_in")}
                </Button>
              ) : (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-base mt-8 transform hover:scale-[1.01] active:scale-[0.99]"
                  type="submit"
                  id="sign-in-button"
                >
                  {isSignUp ? t("signin.sign_up") : t("signin.sign_in")}
                </Button>
              )}
            </form>

              {/* Toast Messages */}
              <div className="mt-6 space-y-3">
                {showAuthToast && <AuthToast />}
                {showErrorToast && <ErrorToast message={errorMessage} />}
              </div>

              {/* reCAPTCHA Badge Notice */}
              {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
                <div className="mt-4 text-center text-xs text-gray-500">
                  <p>
                    This site is protected by reCAPTCHA and the Google{' '}
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">
                      Privacy Policy
                    </a>
                    {' '}and{' '}
                    <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">
                      Terms of Service
                    </a>
                    {' '}apply.
                  </p>
                </div>
              )}
            </>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
