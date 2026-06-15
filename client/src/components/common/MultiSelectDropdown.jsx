import { X } from "lucide-react";
import { forwardRef, useEffect, useRef, useState } from "react";

const normalizeValue = (value) => (Array.isArray(value) ? value : []);

const MultiSelectDropdown = forwardRef(function MultiSelectDropdown(
  {
    label,
    options = [],
    className = "",
    icon: Icon,
    error,
    placeholder = "Select options",
    value = [],
    onChange,
    onBlur,
    name,
  },
  ref
) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const selectedValues = normalizeValue(value);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const toggleValue = (nextValue) => {
    const nextSelection = selectedValues.includes(nextValue)
      ? selectedValues.filter((item) => item !== nextValue)
      : [...selectedValues, nextValue];

    onChange?.(nextSelection);
  };

  const removeValue = (nextValue) => {
    onChange?.(selectedValues.filter((item) => item !== nextValue));
  };

  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="font-semibold text-sm text-muted">{label}</span>
      <div ref={containerRef} className="relative">
        <button
          ref={ref}
          type="button"
          name={name}
          aria-invalid={Boolean(error)}
          aria-expanded={isOpen}
          onBlur={onBlur}
          onClick={() => setIsOpen((current) => !current)}
          className={`flex min-h-[48px] w-full flex-wrap items-center gap-2 rounded-2xl border py-2 text-left text-sm text-ivory outline-none transition focus:bg-white/10 ${
            error ? "border-rose-400/70 focus:border-rose-400" : "border-white/10 bg-white/5 focus:border-gold/50"
          } ${Icon ? "pl-12 pr-4" : "px-4"}`}
        >
          {Icon ? (
            <Icon className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-muted" />
          ) : null}
          {selectedValues.length ? (
            selectedValues.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium text-gold-2"
              >
                {item}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    removeValue(item);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      event.stopPropagation();
                      removeValue(item);
                    }
                  }}
                  className="text-gold-2 transition hover:text-ivory"
                  aria-label={`Remove ${item}`}
                >
                  <X className="h-3 w-3" />
                </span>
              </span>
            ))
          ) : (
            <span className="text-muted/60">{placeholder}</span>
          )}
        </button>

        {isOpen ? (
          <div className="absolute z-20 mt-2 w-full rounded-2xl border border-white/10 bg-ink-2 p-2 shadow-2xl">
            <div className="max-h-60 overflow-y-auto">
              {options.map((option) => {
                const optionValue = typeof option === "string" ? option : option.value;
                const optionLabel = typeof option === "string" ? option : option.label;
                const isSelected = selectedValues.includes(optionValue);

                return (
                  <button
                    key={optionValue}
                    type="button"
                    onClick={() => toggleValue(optionValue)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                      isSelected
                        ? "bg-gold/10 text-gold-2"
                        : "text-ivory hover:bg-white/5"
                    }`}
                  >
                    <span>{optionLabel}</span>
                    {isSelected ? <X className="h-3.5 w-3.5" /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
      {error ? <span className="text-sm text-rose-300">{error}</span> : null}
    </label>
  );
});

export default MultiSelectDropdown;
