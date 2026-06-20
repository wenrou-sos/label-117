import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "悦齿口腔连锁管理系统",
  description: "悦齿口腔连锁诊所管理平台",
};

import AppLayout from "./AppLayout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full bg-background">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
