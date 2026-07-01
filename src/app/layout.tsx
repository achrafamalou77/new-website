import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Algeria Travel SaaS",
  description: "Travel CRM, Client Directory and Invoices System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
