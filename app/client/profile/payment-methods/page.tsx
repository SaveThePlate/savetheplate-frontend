"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, DollarSign, Check, Clock } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function PaymentMethods() {
  const router = useRouter();
  const { t } = useLanguage();

  const paymentMethods = [
    {
      id: "cash",
      name: t("payment.cash") || "Cash",
      description: t("payment.cashDesc") || "Pay with cash when you pick up your order",
      icon: DollarSign,
      available: true,
      color: "bg-green-100 text-green-600",
    },
    {
      id: "creditCard",
      name: t("payment.creditCard") || "Credit Card",
      description: t("payment.creditCardDesc") || "Pay securely with your credit or debit card",
      icon: CreditCard,
      available: false,
      color: "bg-blue-100 text-blue-600",
    },
  ];

  return (
    <div className="min-h-screen pb-24 px-4 pt-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push("/client/profile")}
          className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center hover:bg-emerald-50 transition-colors"
        >
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="font-display font-bold text-3xl">{t("payment.title") || "Payment Methods"}</h1>
      </div>

      {/* Info */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6 mb-6">
        <p className="text-sm text-muted-foreground">
          {t("payment.info") || "Choose your preferred payment method. Currently, cash payment is available at pickup."}
        </p>
      </div>

      {/* Payment Methods */}
      <div className="space-y-3">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          return (
            <div
              key={method.id}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 ${
                method.available
                  ? "border-border hover:border-primary/50"
                  : "border-border/50 opacity-75"
              }`}
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${method.color}`}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">{method.name}</h3>
                      {method.available ? (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                          <Check size={12} />
                          <span>{t("payment.available") || "Available"}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                          <Clock size={12} />
                          <span>{t("payment.comingSoon") || "Coming Soon"}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{method.description}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

