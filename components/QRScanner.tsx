"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, CheckCircle, AlertCircle, Keyboard, QrCode } from "lucide-react";
import axios from "axios";
import { useLanguage } from "@/context/LanguageContext";

interface QRScannerProps {
  onScanSuccess: (result: string) => void;
  onClose: () => void;
  providerId: number;
}

const QRScanner: React.FC<QRScannerProps> = ({
  onScanSuccess,
  onClose,
  providerId,
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScannerStartedRef = useRef<boolean>(false); // Track if scanner was successfully started
  const isMountedRef = useRef<boolean>(true); // Track if component is mounted
  const [scanning, setScanning] = useState(false);
  const [isScannerRunning, setIsScannerRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [scanningOrder, setScanningOrder] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [useCamera, setUseCamera] = useState(true);
  const { t } = useLanguage();

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Safe stop function that checks if scanner is running
  const safeStopScanner = useCallback(async () => {
    // Only try to stop if scanner exists AND was successfully started
    if (!scannerRef.current || !isScannerStartedRef.current) {
      setIsScannerRunning(false);
      isScannerStartedRef.current = false;
      return;
    }

    try {
      // Stop the scanner and release camera immediately
      await scannerRef.current.stop();
      
      // Also manually stop any remaining media tracks to ensure camera is fully released
      try {
        const videoElement = document.querySelector('#qr-reader video') as HTMLVideoElement;
        if (videoElement && videoElement.srcObject) {
          const stream = videoElement.srcObject as MediaStream;
          stream.getTracks().forEach(track => {
            track.stop();
          });
          videoElement.srcObject = null;
        }
      } catch (trackErr) {
        // Ignore errors when stopping tracks - camera might already be stopped
      }
      
      // Update state immediately to reflect that camera is stopped
      setIsScannerRunning(false);
      isScannerStartedRef.current = false;
      setScanning(false);
    } catch (err: any) {
      // Ignore errors if scanner is already stopped or not running
      const errorMessage = err?.message || String(err || '');
      if (
        errorMessage.includes("not running") || 
        errorMessage.includes("not paused") ||
        errorMessage.includes("Cannot stop")
      ) {
        // Scanner is already stopped, just update state
        setIsScannerRunning(false);
        isScannerStartedRef.current = false;
        setScanning(false);
      } else {
        // Log other errors but don't throw
        console.warn("Error stopping scanner:", err);
        setIsScannerRunning(false);
        isScannerStartedRef.current = false;
        setScanning(false);
      }
    }
  }, []);

  const handleScanResult = useCallback(async (decodedText: string) => {
    if (scanningOrder) return; // Prevent multiple scans
    setScanningOrder(true);
    setError(null);
    setSuccess(null);

    try {
      // Extract token from URL if QR code contains a URL
      // Handle cases like: https://leftover.ccdev.space/callback/TOKEN or /callback/TOKEN
      let qrCodeToken = decodedText.trim();
      
      // If it's a URL, extract the token from the path
      if (/^https?:\/\//i.test(qrCodeToken) || qrCodeToken.startsWith('/')) {
        try {
          // Try to extract token from URL path (e.g., /callback/TOKEN or /orders/qr/TOKEN)
          const urlMatch = qrCodeToken.match(/\/(?:callback|orders\/qr)\/([^\/\?]+)/);
          if (urlMatch && urlMatch[1]) {
            qrCodeToken = urlMatch[1];
          } else {
            // If no match, try to get the last segment of the path
            const pathParts = qrCodeToken.split('/').filter(Boolean);
            if (pathParts.length > 0) {
              const lastPart = pathParts[pathParts.length - 1];
              // Remove query parameters if any
              qrCodeToken = lastPart.split('?')[0];
            }
          }
        } catch {
          // If URL parsing fails, use the original text
        }
      }

      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError(t("qr_scanner.login_required"));
        setScanningOrder(false);
        return;
      }

      // Confirm the order directly (this endpoint confirms and returns the order)
      const confirmResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/scan`,
        { qrCodeToken },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          } 
        }
      );

      console.log('✅ QR scan successful:', confirmResponse.data);

      // Stop scanning immediately - this releases the camera
      await safeStopScanner();
      setScanningOrder(false); // Reset scanning state
      
      // Close the modal immediately after successful scan (before calling onScanSuccess)
      onClose();
      
      // Call success callback after a brief delay to ensure modal is closed and camera is released
      setTimeout(() => {
        onScanSuccess(qrCodeToken);
      }, 100);
    } catch (err: any) {
      console.error("Error scanning QR code:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          t("qr_scanner.invalid_qr")
      );
      setScanningOrder(false);
    }
  }, [onScanSuccess, onClose, scanningOrder, t, safeStopScanner]);

  useEffect(() => {
    if (!useCamera || showManualEntry) return;

    const startScanning = async () => {
      try {
        // Check if the DOM element exists before creating scanner
        const element = document.getElementById("qr-reader");
        if (!element) {
          console.warn("QR reader element not found, will retry...");
          // Retry after a short delay
          setTimeout(() => {
            if (useCamera && !showManualEntry) {
              startScanning();
            }
          }, 100);
          return;
        }

        const html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;

        // Calculate responsive QR box size based on viewport
        const isMobile = window.innerWidth < 640; // sm breakpoint
        const qrBoxSize = isMobile ? 200 : 250;

        await html5QrCode.start(
          { facingMode: "environment" }, // Use back camera
          {
            fps: 10,
            qrbox: { width: qrBoxSize, height: qrBoxSize },
          },
          (decodedText) => {
            handleScanResult(decodedText);
          },
          (errorMessage) => {
            // Ignore scanning errors (they're frequent during scanning)
          }
        );

        // Only mark as started if start() succeeded and component is still mounted
        if (isMountedRef.current) {
          isScannerStartedRef.current = true;
          setScanning(true);
          setIsScannerRunning(true);
          setError(null);
        } else {
          // Component unmounted during initialization, stop the scanner safely
          try {
            await html5QrCode.stop();
          } catch (stopErr: any) {
            // Ignore stop errors - scanner might not be fully started
            const errorMessage = stopErr?.message || String(stopErr || '');
            if (
              !errorMessage.includes("not running") && 
              !errorMessage.includes("not paused") &&
              !errorMessage.includes("Cannot stop")
            ) {
              console.warn("Error stopping scanner after unmount:", stopErr);
            }
          }
          scannerRef.current = null;
          isScannerStartedRef.current = false;
        }
      } catch (err: any) {
        console.error("Error starting scanner:", err);
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setError(
            err.message || t("qr_scanner.camera_failed")
          );
          // If camera fails, suggest manual entry
          setShowManualEntry(true);
          setUseCamera(false);
          setIsScannerRunning(false);
        }
        isScannerStartedRef.current = false;
        scannerRef.current = null;
      }
    };

    startScanning();

    return () => {
      // Cleanup: only try to stop if scanner was successfully started
      const scanner = scannerRef.current;
      const wasStarted = isScannerStartedRef.current;
      
      // Clear refs immediately to prevent any other operations
      scannerRef.current = null;
      isScannerStartedRef.current = false;
      setIsScannerRunning(false);
      
      // Only try to stop if scanner exists and was actually started
      if (scanner && wasStarted) {
        scanner.stop().catch((err: any) => {
          // Ignore errors if scanner is already stopped
          const errorMessage = err?.message || String(err || '');
          if (
            !errorMessage.includes("not running") && 
            !errorMessage.includes("not paused") &&
            !errorMessage.includes("Cannot stop")
          ) {
            console.warn("Error stopping scanner during cleanup:", err);
          }
        }).finally(() => {
          // Also manually stop any remaining media tracks
          try {
            const videoElement = document.querySelector('#qr-reader video') as HTMLVideoElement;
            if (videoElement && videoElement.srcObject) {
              const stream = videoElement.srcObject as MediaStream;
              stream.getTracks().forEach(track => {
                track.stop();
              });
              videoElement.srcObject = null;
            }
          } catch (trackErr) {
            // Ignore errors when stopping tracks
          }
        });
      }
    };
  }, [useCamera, showManualEntry, handleScanResult, t]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      setError(t("qr_scanner.paste_placeholder"));
      return;
    }
    await handleScanResult(manualCode.trim());
  };

  const handleClose = async () => {
    // Stop scanner and release camera before closing
    await safeStopScanner();
    scannerRef.current = null;
    isScannerStartedRef.current = false;
    setIsScannerRunning(false);
    setScanning(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate pr-2">{t("qr_scanner.title")}</h2>
          <button
            onClick={handleClose}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close scanner"
          >
            <X size={20} className="sm:w-6 sm:h-6 text-gray-600" />
          </button>
        </div>

        {/* Scanner or Manual Entry */}
        <div className="p-3 sm:p-4 flex-1 min-h-0 overflow-y-auto">
          {!showManualEntry && useCamera ? (
            <div
              id="qr-reader"
              className="w-full rounded-lg sm:rounded-xl overflow-hidden bg-gray-100"
              style={{ minHeight: "250px", maxHeight: "400px" }}
            />
          ) : (
            <div className="w-full">
              <div className="p-4 sm:p-6 bg-gray-50 rounded-lg sm:rounded-xl border-2 border-dashed border-gray-300 text-center mb-3 sm:mb-4">
                <Keyboard size={40} className="sm:w-12 sm:h-12 mx-auto text-gray-400 mb-2 sm:mb-3" />
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                  {t("qr_scanner.enter_manually")}
                </p>
                <form onSubmit={handleManualSubmit} className="space-y-2 sm:space-y-3">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => {
                      setManualCode(e.target.value);
                      setError(null);
                    }}
                    placeholder={t("qr_scanner.paste_placeholder")}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg sm:rounded-xl focus:border-emerald-500 focus:outline-none text-center font-mono text-xs sm:text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowManualEntry(false);
                        setUseCamera(true);
                        setManualCode("");
                        setError(null);
                      }}
                      className="flex-1 px-3 sm:px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium text-xs sm:text-sm transition-colors"
                    >
                      {t("qr_scanner.use_camera")}
                    </button>
                    <button
                      type="submit"
                      disabled={!manualCode.trim() || scanningOrder}
                      className="flex-1 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium text-xs sm:text-sm transition-colors"
                    >
                      {scanningOrder ? t("qr_scanner.validating") : t("qr_scanner.validate_code")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Toggle Button */}
          {!showManualEntry && useCamera && (
            <button
              onClick={async () => {
                await safeStopScanner();
                setShowManualEntry(true);
                setUseCamera(false);
              }}
              className="w-full mt-2 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-xs sm:text-sm transition-colors"
            >
              <Keyboard size={16} className="sm:w-[18px] sm:h-[18px]" />
              {t("qr_scanner.enter_manually_button")}
            </button>
          )}

          {/* Status Messages */}
          {error && (
            <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle size={18} className="sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-red-800 break-words">{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle size={18} className="sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-green-800 break-words">{success}</p>
            </div>
          )}

          {!error && !success && scanning && useCamera && (
            <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
              <Camera size={18} className="sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-blue-800">
                {t("qr_scanner.point_camera")}
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <p className="text-[10px] sm:text-xs text-gray-600 text-center">
            {useCamera && !showManualEntry
              ? t("qr_scanner.instructions_camera")
              : t("qr_scanner.instructions_manual")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;

