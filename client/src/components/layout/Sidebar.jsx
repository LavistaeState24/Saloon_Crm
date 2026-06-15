import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { navigationItems } from "./navigation";
import { usePermissions } from "../../hooks/usePermissions";
import { industryLabels } from "../../config/industryLabels";

export const SIDEBAR_WIDTH = "18rem";

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const permissions = usePermissions();
  const visibleItems = navigationItems.filter((link) => {
    if (!link.moduleKey || !link.actionKey) {
      return true;
    }

    return Boolean(permissions?.[link.moduleKey]?.[link.actionKey]);
  });

  useEffect(() => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  }, [location.pathname]);

  return (
    <aside
      className={`fixed left-0 top-16 z-40 flex h-[calc(100vh-4rem)] w-64 flex-col border-r border-white/10 bg-[#0d0c0a]/95 px-4 py-5 shadow-glass backdrop-blur-xl transition-transform duration-300 ease-out overflow-y-auto
  ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      {/* Brand */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
        <p className="font-serif text-lg leading-none text-[#f3d79b]">
          {industryLabels.brandName}
        </p>
        <p className="mt-1 text-xs tracking-wide text-white/55">
          {industryLabels.brandTagline}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {visibleItems.map((link, index) => {
          const Icon = link.icon;
          const previousGroup = visibleItems[index - 1]?.group;
          const shouldRenderGroup = link.group && link.group !== previousGroup;

          return (
            <div key={link.to} className="space-y-2">
              {shouldRenderGroup ? (
                <p className="px-4 pt-4 text-xs uppercase tracking-[0.25em] text-gold-2/80">
                  {link.group}
                </p>
              ) : null}
              <NavLink
                to={link.to}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200
            ${isActive
                  ? "border border-[#c9a35d]/25 bg-gradient-to-r from-[#c9a35d]/20 to-transparent text-[#f3d79b] shadow-[0_0_22px_rgba(201,163,93,0.12)]"
                  : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                }`
                }
              >
                <Icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                <span className="truncate">{link.label}</span>
              </NavLink>
            </div>
          );
        })}
      </nav>

      {/* Bottom Card */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-4">
        <p className="text-sm font-medium text-white">{industryLabels.footerTitle}</p>
        <p className="mt-1 text-xs leading-5 text-white/50">
          {industryLabels.footerDescription}
        </p>
      </div>
    </aside>
  );
}
