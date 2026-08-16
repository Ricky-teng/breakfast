function EggMark() {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10">
      <circle cx="20" cy="20" r="19" fill="#FFF7ED" stroke="#FDBA74" strokeWidth="1.5" />
      <ellipse cx="20" cy="20" rx="9" ry="8" fill="#F59E0B" />
      <ellipse cx="17" cy="17" rx="2.5" ry="2" fill="#FDE68A" opacity="0.8" />
    </svg>
  );
}

const destinations = [
  {
    href: "/board",
    title: "訂單看板",
    description: "即時處理 LINE 訊息與網路訂單",
  },
  {
    href: "/admin/menu",
    title: "菜單管理",
    description: "改價、上下架、客製化選項",
  },
  {
    href: "/admin/orders",
    title: "訂單紀錄",
    description: "查看歷史訂單與每日營收",
  },
];

export default function AdminHubPage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-amber-50 via-orange-50/40 to-white px-4 py-12">
      <EggMark />
      <h1 className="mt-3 text-xl font-semibold text-amber-950">後台管理</h1>
      <p className="mb-8 text-sm text-amber-700/60">美上美早餐店</p>

      <div className="flex w-full max-w-sm flex-col gap-3">
        {destinations.map((d) => (
          <a
            key={d.href}
            href={d.href}
            className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="font-medium text-amber-950">{d.title}</p>
            <p className="text-sm text-zinc-400">{d.description}</p>
          </a>
        ))}
      </div>

      <a
        href="/menu"
        className="mt-8 text-sm text-amber-700 hover:underline"
      >
        回點餐頁
      </a>
    </div>
  );
}
