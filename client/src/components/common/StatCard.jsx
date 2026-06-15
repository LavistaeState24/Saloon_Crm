import Badge from "./Badge";

export default function StatCard({ label, value, accent, meta, icon: Icon }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-glass backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-2 text-gold-2">
              <Icon className="h-4 w-4" />
            </div>
          ) : null}
          <p className="text-sm text-muted">{label}</p>
        </div>
        <Badge tone={accent}>{meta}</Badge>
      </div>
      <p className="mt-4 font-display text-3xl text-ivory">{value}</p>
    </div>
  );
}
