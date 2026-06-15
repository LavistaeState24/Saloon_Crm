import { createContext, createElement, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

const listeners = new Set();
const dismissTimers = new Map();
const recentKeys = new Map();
let toastCount = 0;

const DEFAULT_DURATION = 3500;
const DEDUPE_WINDOW = 1200;

const ToastContext = createContext(null);

const emit = (items) => {
  listeners.forEach((listener) => listener(items));
};

const normalizeMessage = (value) => String(value || "").trim();

const shouldSkipDuplicate = (key) => {
  const now = Date.now();
  const lastShown = recentKeys.get(key);

  if (lastShown && now - lastShown < DEDUPE_WINDOW) {
    return true;
  }

  recentKeys.set(key, now);
  return false;
};

const pushToast = (type, message, options = {}) => {
  const normalizedMessage = normalizeMessage(message);

  if (!normalizedMessage) {
    return null;
  }

  const id = options.id || `${type}-${Date.now()}-${toastCount++}`;
  const dedupeKey = options.id ? String(options.id) : `${type}:${normalizedMessage}`;

  if (shouldSkipDuplicate(dedupeKey)) {
    return null;
  }

  const toast = {
    id,
    type,
    message: normalizedMessage,
    duration: options.duration ?? DEFAULT_DURATION,
  };

  const currentToasts = toastStore.get();
  toastStore.set([toast, ...currentToasts].slice(0, 4));

  if (dismissTimers.has(id)) {
    clearTimeout(dismissTimers.get(id));
  }

  dismissTimers.set(
    id,
    setTimeout(() => {
      dismiss(id);
    }, toast.duration),
  );

  return id;
};

const toastStore = (() => {
  let value = [];

  return {
    get: () => value,
    set: (nextValue) => {
      value = nextValue;
      emit(value);
    },
  };
})();

export const toast = {
  success: (message, options) => pushToast("success", message, options),
  error: (message, options) => pushToast("error", message, options),
  info: (message, options) => pushToast("info", message, options),
  dismiss,
};

export function dismiss(id) {
  if (!id) {
    toastStore.set([]);
    return;
  }

  if (dismissTimers.has(id)) {
    clearTimeout(dismissTimers.get(id));
    dismissTimers.delete(id);
  }

  toastStore.set(toastStore.get().filter((entry) => entry.id !== id));
}

export function getApiErrorMessage(error, fallback = "Something went wrong") {
  return normalizeMessage(error?.response?.data?.message || error?.message || fallback);
}

export function useToastActions() {
  return useMemo(
    () => ({
      success: toast.success,
      error: toast.error,
      info: toast.info,
      dismiss: toast.dismiss,
    }),
    [],
  );
}

export function ToastHost() {
  const [items, setItems] = useState(toastStore.get());

  useEffect(() => {
    listeners.add(setItems);
    return () => {
      listeners.delete(setItems);
    };
  }, []);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    createElement(
      "div",
      {
        className:
          "pointer-events-none fixed right-4 top-4 z-[9999] flex w-full max-w-sm flex-col gap-3 px-2 sm:right-6 sm:top-6 sm:px-0",
      },
      items.map((item) => {
        const toastConfig =
          item.type === "success"
            ? {
              icon: CheckCircle2,
              title: "Success",
              toneClasses:
                "border-emerald-400/40 bg-emerald-950/90 text-emerald-50 shadow-emerald-950/30",
              iconClasses: "bg-emerald-400 text-emerald-950",
            }
            : item.type === "error"
              ? {
                icon: XCircle,
                title: "Error",
                toneClasses:
                  "border-rose-400/40 bg-rose-950/90 text-rose-50 shadow-rose-950/30",
                iconClasses: "bg-rose-400 text-rose-950",
              }
              : {
                icon: Info,
                title: "Info",
                toneClasses:
                  "border-sky-400/40 bg-sky-950/90 text-sky-50 shadow-sky-950/30",
                iconClasses: "bg-sky-400 text-sky-950",
              };

        return createElement(
          "div",
          {
            key: item.id,
            className: `pointer-events-auto rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl ${toastConfig.toneClasses}`,
            role: "status",
            "aria-live": "polite",
          },
          createElement(
            "div",
            { className: "flex items-start gap-3" },

            createElement(
              "span",
              {
                className: `mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${toastConfig.iconClasses}`,
              },
              createElement(toastConfig.icon, {
                className: "h-4 w-4",
              }),
            ),

            createElement(
              "div",
              { className: "min-w-0 flex-1" },
              createElement(
                "p",
                { className: "text-sm font-semibold leading-5" },
                toastConfig.title,
              ),
              createElement(
                "p",
                { className: "mt-0.5 text-sm leading-5 text-current/80" },
                item.message,
              ),
            ),

            createElement(
              "button",
              {
                type: "button",
                className:
                  "rounded-full px-2 py-1 text-xs uppercase tracking-[0.2em] text-current/60 transition hover:bg-white/10 hover:text-current",
                onClick: () => dismiss(item.id),
                "aria-label": "Dismiss toast",
              },
              createElement(X, { className: "h-4 w-4" }),
            ),
          ),
        );
      }),
    ),
    document.body,
  );
}

export const ToastProvider = ToastContext.Provider;

export function useToast() {
  return useContext(ToastContext);
}
