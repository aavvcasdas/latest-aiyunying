import Link from "next/link";

const TABS = [
  { id: "mv", href: "/", label: "MV 播放台" },
  { id: "cast", href: "/cast", label: "立绘动作库" },
] as const;

export default function SiteHeader({ active }: { active: "mv" | "cast" }) {
  return (
    <header className="border-b border-line/70 bg-ink/70 backdrop-blur">
      <div className="mx-auto flex max-w-[1560px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-baseline gap-3">
          <span className="font-display bg-gradient-to-r from-amber-200 to-pink-300 bg-clip-text text-2xl text-transparent">勾指起誓</span>
          <span className="text-xs text-slate-400">鲸鱼娘 MV · 立绘版</span>
        </Link>
        <nav className="flex gap-1 rounded-full border border-line bg-panel p-1 text-sm" aria-label="主导航">
          {TABS.map((t) => (
            <Link
              key={t.id}
              href={t.href}
              aria-current={active === t.id ? "page" : undefined}
              className={`rounded-full px-4 py-1.5 transition-colors ${
                active === t.id ? "bg-gradient-to-r from-amber-300 to-pink-300 font-medium text-slate-900" : "text-slate-300 hover:bg-panel-2 hover:text-white"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
