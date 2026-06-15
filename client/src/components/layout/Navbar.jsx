import { useState } from "react";
import { LogOut, Menu, SquareUserRound, Mail, Clock, ShieldCheck } from "lucide-react";
import Button from "../common/Button";
import Logo from "../../assets/Logo.png";
import { useAuth } from "../../hooks/useAuth";
import { industryLabels } from "../../config/industryLabels";

export default function Navbar({ onToggleSidebar, isSidebarOpen }) {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const isOnline =
    user?.lastSeenAt &&
    Date.now() - new Date(user.lastSeenAt).getTime() < 5 * 60 * 1000;

  const formatDateTime = (value) =>
    value ? new Date(value).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }) : "Never";

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-white/10 bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-auto items-center justify-between gap-3 px-4 py-3 shadow-xl sm:px-6 lg:px-4 ">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-ivory transition hover:border-gold/50 hover:bg-white/10"
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <Menu className="h-5 w-5" />
          </button>

          <img
            src={Logo}
            className="h-9 w-auto shrink-0 object-contain sm:h-11"
            alt={industryLabels.appName}
          />
        </div>

        <div className="relative ml-auto">
          <button
            type="button"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-2 py-2 text-ivory transition hover:border-gold/50 hover:bg-white/10"
          >
            <div className="relative flex h-5 w-5 items-center justify-center rounded-md bg-black/30 text-gold-2">
              <SquareUserRound className="h-5 w-5" />
              <span
                className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-ink ${
                  isOnline ? "bg-emerald-400" : "bg-slate-500"
                }`}
              />
            </div>
          </button>

          {isProfileOpen ? (
            <div className="absolute right-0 top-full z-50 mt-4 w-[calc(100vw-1rem)] max-w-[250px] overflow-hidden rounded-2xl border border-white/10 bg-[#111111]/95 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">

              {/* Header */}
              <div className="border-b border-white/10 p-4">
                <div className="flex items-center gap-3">

                  <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-black/30 text-gold-2">
                    <SquareUserRound className="h-5 w-5" />

                    <span
                      className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-ink ${isOnline ? "bg-emerald-400" : "bg-slate-500"
                        }`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {user?.name || "-"}
                    </p>

                    <p className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-gray-400">
                      {user?.role || "-"}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${isOnline
                      ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                      : "border border-slate-500/20 bg-slate-500/10 text-slate-400"
                      }`}
                  >
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </div>

              {/* User Info */}
              <div className="space-y-4 px-4 py-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
                    Last Login
                  </p>
                  <p className="mt-1 text-sm text-white">
                    {formatDateTime(user?.lastLoginAt)}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
                    Last Seen
                  </p>
                  <p className="mt-1 text-sm text-white">
                    {formatDateTime(user?.lastSeenAt)}
                  </p>
                </div>
              </div>

              {/* Logout */}
              <div className="border-t border-white/10 p-2">
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-red-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-300"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
