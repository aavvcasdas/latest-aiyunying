import type { Metadata } from "next";
import CastStudio from "@/components/CastStudio";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "立绘动作库 · 鲸鱼娘 MV",
};

export default function CastPage() {
  return (
    <>
      <SiteHeader active="cast" />
      <CastStudio />
    </>
  );
}
