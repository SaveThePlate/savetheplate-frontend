"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Shield, Lock, Eye, FileText, Users, Database, Globe } from "lucide-react";
import Link from "next/link";

const PrivacyPolicyPage = () => {
  const { t } = useLanguage();

  return (
    <main className="flex flex-col items-center w-full min-h-screen bg-gray-50">
      <div className="w-full mx-auto px-4 sm:px-6 max-w-4xl pt-8 sm:pt-12 pb-12 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <Shield className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#344e41]">
            {t("privacy.title")}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {t("privacy.last_updated")}: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-gray-100 space-y-8">
          {/* Introduction */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-600" />
              {t("privacy.introduction.title")}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {t("privacy.introduction.content")}
            </p>
          </section>

          {/* Information We Collect */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Database className="w-6 h-6 text-emerald-600" />
              {t("privacy.collect.title")}
            </h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  {t("privacy.collect.personal.title")}
                </h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>{t("privacy.collect.personal.email")}</li>
                  <li>{t("privacy.collect.personal.name")}</li>
                  <li>{t("privacy.collect.personal.phone")}</li>
                  <li>{t("privacy.collect.personal.location")}</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  {t("privacy.collect.usage.title")}
                </h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>{t("privacy.collect.usage.orders")}</li>
                  <li>{t("privacy.collect.usage.offers")}</li>
                  <li>{t("privacy.collect.usage.preferences")}</li>
                  <li>{t("privacy.collect.usage.device")}</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Information */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Eye className="w-6 h-6 text-emerald-600" />
              {t("privacy.use.title")}
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>{t("privacy.use.service")}</li>
              <li>{t("privacy.use.communication")}</li>
              <li>{t("privacy.use.improvement")}</li>
              <li>{t("privacy.use.security")}</li>
              <li>{t("privacy.use.legal")}</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-600" />
              {t("privacy.sharing.title")}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {t("privacy.sharing.content")}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>{t("privacy.sharing.providers")}</li>
              <li>{t("privacy.sharing.service")}</li>
              <li>{t("privacy.sharing.legal")}</li>
            </ul>
          </section>

          {/* Data Security */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Lock className="w-6 h-6 text-emerald-600" />
              {t("privacy.security.title")}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {t("privacy.security.content")}
            </p>
          </section>

          {/* Your Rights */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Globe className="w-6 h-6 text-emerald-600" />
              {t("privacy.rights.title")}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              {t("privacy.rights.content")}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>{t("privacy.rights.access")}</li>
              <li>{t("privacy.rights.correction")}</li>
              <li>{t("privacy.rights.deletion")}</li>
              <li>{t("privacy.rights.objection")}</li>
              <li>{t("privacy.rights.portability")}</li>
            </ul>
            <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-sm text-emerald-800">
                <strong>{t("privacy.rights.deletion_note")}</strong>{" "}
                <Link href="/data-deletion" className="text-emerald-600 hover:text-emerald-700 underline">
                  {t("privacy.rights.deletion_link")}
                </Link>
              </p>
            </div>
          </section>

          {/* Cookies */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {t("privacy.cookies.title")}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {t("privacy.cookies.content")}
            </p>
          </section>

          {/* Third-Party Services */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {t("privacy.third_party.title")}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {t("privacy.third_party.content")}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>{t("privacy.third_party.google")}</li>
              <li>{t("privacy.third_party.facebook")}</li>
              <li>{t("privacy.third_party.analytics")}</li>
            </ul>
          </section>

          {/* Changes to Policy */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {t("privacy.changes.title")}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {t("privacy.changes.content")}
            </p>
          </section>

          {/* Contact */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {t("privacy.contact.title")}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {t("privacy.contact.content")}
            </p>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>{t("privacy.contact.email")}:</strong>{" "}
                <a href="mailto:savetheplatetunisia@gmail.com" className="text-emerald-600 hover:text-emerald-700">
                  savetheplatetunisia@gmail.com
                </a>
              </p>
              <p className="text-sm text-gray-700 mt-2">
                <strong>{t("privacy.contact.address")}:</strong> {t("contact.location_address")}
              </p>
            </div>
          </section>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
          >
            ← {t("common.back")}
          </Link>
        </div>
      </div>
    </main>
  );
};

export default PrivacyPolicyPage;

