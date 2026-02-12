import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Deletion Request - Save The Plate",
  description: "Request deletion of your Save The Plate account data. We respect your privacy and will process your request within 30 days.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function DataDeletionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
