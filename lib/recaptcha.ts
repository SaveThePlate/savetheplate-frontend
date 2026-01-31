/**
 * Google reCAPTCHA v3 integration
 * For production use, ensure you have set NEXT_PUBLIC_RECAPTCHA_SITE_KEY in your environment
 */

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

/**
 * Load reCAPTCHA script dynamically
 */
export const loadRecaptcha = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.grecaptcha) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      window.grecaptcha?.ready(() => {
        resolve();
      });
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load reCAPTCHA script'));
    };
    
    document.head.appendChild(script);
  });
};

/**
 * Get reCAPTCHA token for a specific action
 */
export const getReCaptchaToken = async (action: string = 'signup'): Promise<string | null> => {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  
  // If reCAPTCHA is not configured, return null (graceful degradation)
  if (!siteKey) {
    console.warn('reCAPTCHA site key is not configured');
    return null;
  }

  try {
    // Load reCAPTCHA if not already loaded
    await loadRecaptcha();
    
    // Execute reCAPTCHA v3
    if (!window.grecaptcha) {
      throw new Error('reCAPTCHA is not available');
    }
    
    const token = await window.grecaptcha.execute(siteKey, { action });
    return token;
  } catch (error) {
    console.error('Error getting reCAPTCHA token:', error);
    // Return null to allow signup to continue without reCAPTCHA
    // In production, you may want to handle this differently
    return null;
  }
};

/**
 * Verify reCAPTCHA token with backend
 */
export const verifyRecaptchaToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/verify-recaptcha', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();
    return data.success === true && data.score > 0.5;
  } catch (error) {
    console.error('Error verifying reCAPTCHA token:', error);
    // Return true to allow signup to continue if verification fails
    return true;
  }
};
