"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, HelpCircle, Mail, MessageCircle, FileText, ExternalLink } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";

export default function HelpSupport() {
  const router = useRouter();
  const { t } = useLanguage();

  const helpItems = [
    {
      icon: MessageCircle,
      title: t("help.contactUs") || "Contact Us",
      description: t("help.contactUsDesc") || "Get in touch with our support team",
      href: "/client/contact",
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: FileText,
      title: t("help.privacyPolicy") || "Privacy Policy",
      description: t("help.privacyPolicyDesc") || "Learn how we protect your data",
      href: "/privacy",
      color: "bg-green-100 text-green-600",
    },
    {
      icon: Mail,
      title: t("help.emailSupport") || "Email Support",
      description: t("help.emailSupportDesc") || "Send us an email for assistance",
      href: "mailto:savetheplatetunisia@gmail.com",
      color: "bg-purple-100 text-purple-600",
      external: true,
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
        <h1 className="font-display font-bold text-3xl">{t("profile.helpSupport") || "Help & Support"}</h1>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-lg">{t("help.title") || "Need Help?"}</h2>
            <p className="text-sm text-muted-foreground">{t("help.subtitle") || "We're here to assist you with any questions or issues"}</p>
          </div>
        </div>
      </div>

      {/* Help Options */}
      <div className="space-y-3">
        {helpItems.map((item, index) => {
          const Icon = item.icon;
          const content = (
            <div
              className={`bg-white rounded-2xl border border-border shadow-sm overflow-hidden hover:border-primary/50 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${item.color}`}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">{item.title}</h3>
                      {item.external && <ExternalLink size={16} className="text-muted-foreground" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </div>
            </div>
          );

          if (item.external) {
            return (
              <a key={item.title} href={item.href} target="_blank" rel="noopener noreferrer" className="block">
                {content}
              </a>
            );
          }

          return (
            <Link key={item.title} href={item.href} className="block">
              {content}
            </Link>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="mt-8 bg-white rounded-2xl border border-border shadow-sm p-6">
        <h2 className="font-bold text-lg mb-4">{t("help.faq") || "Frequently Asked Questions"}</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-1">{t("help.faq1Question") || "How do I place an order?"}</h3>
            <p className="text-sm text-muted-foreground">{t("help.faq1Answer") || "Browse available offers, select the items you want, and place your order. You'll receive a QR code for pickup."}</p>
          </div>
          <div>
            <h3 className="font-medium mb-1">{t("help.faq2Question") || "When can I pick up my order?"}</h3>
            <p className="text-sm text-muted-foreground">{t("help.faq2Answer") || "Check the pickup deadline on your order. Make sure to collect your order before the expiration date."}</p>
          </div>
          <div>
            <h3 className="font-medium mb-1">{t("help.faq3Question") || "What payment methods are accepted?"}</h3>
            <p className="text-sm text-muted-foreground">{t("help.faq3Answer") || "Currently, we accept cash payments at pickup. More payment options are coming soon."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

