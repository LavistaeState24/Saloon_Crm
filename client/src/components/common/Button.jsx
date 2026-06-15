export default function Button({
  children,
  className = "",
  variant = "primary",
  icon: Icon,
  iconRight: IconRight,
  ...props
}) {
  const variants = {
    primary:
      "bg-gradient-to-r from-gold to-gold-2 text-ink shadow-glass hover:opacity-90",
    secondary:
      "border border-white/15 bg-white/5 text-ivory hover:border-gold/50 hover:bg-white/10",
    ghost: "text-muted hover:text-ivory",
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon ? <Icon className="mr-2 h-4 w-4 shrink-0" /> : null}
      {children}
      {IconRight ? <IconRight className="ml-2 h-4 w-4 shrink-0" /> : null}
    </button>
  );
}
