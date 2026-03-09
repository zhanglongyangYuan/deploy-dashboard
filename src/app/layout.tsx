import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "部署项目管理 | Dashboard",
  description: "管理所有部署项目的统一面板",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
