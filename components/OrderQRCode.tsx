"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { Download, Copy, Check } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface OrderQRCodeProps {
  qrCodeToken: string;
  orderId: number;
  orderTitle?: string;
}

const OrderQRCode: React.FC<OrderQRCodeProps> = ({
  qrCodeToken,
  orderId,
  orderTitle,
}) => {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();
  const defaultTitle = orderTitle || t("order_qr.default_title");

  const handleCopy = () => {
    navigator.clipboard.writeText(qrCodeToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const svg = document.getElementById(`qr-code-${orderId}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `order-${orderId}-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (!qrCodeToken) {
    return (
      <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 text-center">
        <p className="text-gray-500">{t("order_qr.not_available")}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl border-2 border-gray-200 shadow-sm">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {t("order_qr.pickup_qr_code")}
        </h3>
        <p className="text-sm text-gray-600">
          {t("order_qr.instructions")}
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="p-4 bg-white rounded-xl border-2 border-gray-300 shadow-sm">
          <QRCodeSVG
            id={`qr-code-${orderId}`}
            value={qrCodeToken}
            size={200}
            level="M"
            includeMargin={true}
          />
        </div>

        <div className="w-full space-y-2">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">{t("order_qr.order_code")}</p>
            <p className="text-sm font-mono font-semibold text-gray-900 break-all">
              {qrCodeToken}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              {copied ? (
                <>
                  <Check size={18} />
                  {t("order_qr.copied")}
                </>
              ) : (
                <>
                  <Copy size={18} />
                  {t("order_qr.copy_code")}
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
            >
              <Download size={18} />
              {t("order_qr.download_qr")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderQRCode;

