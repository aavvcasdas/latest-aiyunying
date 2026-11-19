import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "勾指起誓 · 鲸鱼娘 MV 立绘版",
  description: "用代码做 MV：八位角色换成立绘，动作由骨架形变实时渲染。",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen text-slate-100 antialiased">{children}</body>
    </html>
  );
}
