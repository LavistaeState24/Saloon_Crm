export default function Badge({ children, tone = "gold" }) {
  const tones = {
    gold: "border-gold/30 bg-gold/10 text-gold-2",
    green: "border-green/40 bg-green/20 text-emerald-200",
    wine: "border-wine/40 bg-wine/20 text-rose-200",
    slate: "border-white/10 bg-white/5 text-muted",
    amber: "border-amber-400/40 bg-amber-500/15 text-amber-200",
    rose: "border-rose-400/40 bg-rose-500/15 text-rose-200",
    blue: "border-sky-400/40 bg-sky-500/15 text-sky-200",
  };

  return (
    <span className={`rounded-full border px-2.5 py-1.5 text-[11px] font-medium sm:px-3 sm:py-2 sm:text-xs ${tones[tone]}`}>
      {children}
    </span>
  );
}
