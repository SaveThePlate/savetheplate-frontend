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
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [scanningOrder, setScanningOrder] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [useCamera, setUseCamera] = useState(true);
  const { t } = useLanguage();

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

      // First, preview the order
      const previewResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/qr/${qrCodeToken}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const order = previewResponse.data;

      // Confirm the order
      const confirmResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/scan`,
        { qrCodeToken },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (confirmResponse.data.alreadyConfirmed) {
        setSuccess(
          t("qr_scanner.order_already_confirmed", { 
            orderId: order.id, 
            username: order.user?.username || "N/A" 
          })
        );
      } else {
        setSuccess(
          t("qr_scanner.order_confirmed_success", { 
            orderId: order.id, 
            username: order.user?.username || "N/A" 
          })
        );
      }

      // Stop scanning and call success callback
      setTimeout(() => {
        if (scannerRef.current) {
          scannerRef.current.stop();
        }
        onScanSuccess(qrCodeToken);
      }, 2000);
    } catch (err: any) {
      console.error("Error scanning QR code:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          t("qr_scanner.invalid_qr")
      );
      setScanningOrder(false);
    }
  }, [onScanSuccess, scanningOrder, t]);

  useEffect(() => {
    if (!useCamera || showManualEntry) return;

    const startScanning = async () => {
      try {
        const html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" }, // Use back camera
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            handleScanResult(decodedText);
          },
          (errorMessage) => {
            // Ignore scanning errors (they're frequent during scanning)
          }
        );

        setScanning(true);
        setError(null);
      } catch (err: any) {
        console.error("Error starting scanner:", err);
        setError(
          err.message || t("qr_scanner.camera_failed")
        );
        // If camera fails, suggest manual entry
        setShowManualEntry(true);
        setUseCamera(false);
      }
    };

    startScanning();

    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current = null;
          })
          .catch((err) => {
            console.error("Error stopping scanner:", err);
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

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current
        .stop()
        .then(() => {
          scannerRef.current = null;
          onClose();
        })
        .catch((err) => {
          console.error("Error stopping scanner:", err);
          onClose();
        });
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{t("qr_scanner.title")}</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close scanner"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Scanner or Manual Entry */}
        <div className="p-4">
          {!showManualEntry && useCamera ? (
            <div
              id="qr-reader"
              className="w-full rounded-xl overflow-hidden bg-gray-100"
              style={{ minHeight: "300px" }}
            />
          ) : (
            <div className="w-full">
              <div className="p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 text-center mb-4">
                <Keyboard size={48} className="mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 mb-4">
                  {t("qr_scanner.enter_manually")}
                </p>
                <form onSubmit={handleManualSubmit} className="space-y-3">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => {
                      setManualCode(e.target.value);
                      setError(null);
                    }}
                    placeholder={t("qr_scanner.paste_placeholder")}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:outline-none text-center font-mono text-sm"
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
                      className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                    >
                      {t("qr_scanner.use_camera")}
                    </button>
                    <button
                      type="submit"
                      disabled={!manualCode.trim() || scanningOrder}
                      className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
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
              onClick={() => {
                if (scannerRef.current) {
                  scannerRef.current.stop();
                }
                setShowManualEntry(true);
                setUseCamera(false);
              }}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              <Keyboard size={18} />
              {t("qr_scanner.enter_manually_button")}
            </button>
          )}

          {/* Status Messages */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {!error && !success && scanning && useCamera && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
              <Camera size={20} className="text-blue-600" />
              <p className="text-sm text-blue-800">
                {t("qr_scanner.point_camera")}
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
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

