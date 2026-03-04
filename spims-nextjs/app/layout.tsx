import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SPIMS - Smart Public Infrastructure Monitoring System",
  description: "Unified Next.js application for monitoring public infrastructure",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
