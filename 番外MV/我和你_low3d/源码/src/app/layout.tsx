import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "《我和你》· 八位 AI 娘像素 MV",
  description: "童年动画主题曲《我和你》逐词分镜像素 MV",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="bg-slate-100 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
