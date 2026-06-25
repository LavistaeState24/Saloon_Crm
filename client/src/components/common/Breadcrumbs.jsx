import { Link, useLocation, useNavigation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { industryLabels, getIndustryLabel } from "../../config/industryLabels";

const formatLabel = (value) => {
  if (!value) return "";
  const mappedLabel = industryLabels.breadcrumbs[value] || getIndustryLabel(value);
  if (mappedLabel && mappedLabel !== value) return mappedLabel;

  // hide MongoDB ids / long dynamic ids
  if (value.length > 16) return "Details";

  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function Breadcrumbs() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const navigation = useNavigation();
  const pathnames = location.pathname.split("/").filter(Boolean);
  const isLoading = navigation.state !== "idle";

  if (pathnames.length === 0) return null;

  if (isLoading) {
    return (
      <nav
        aria-label="breadcrumb"
        className="mb-4 flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm shadow-xl backdrop-blur-lg"
      >
        <div className="h-4 w-16 animate-pulse rounded-full bg-white/10" />
        <ChevronRight className="mx-2 h-4 w-4 text-white/20" />
        <div className="h-4 w-24 animate-pulse rounded-full bg-white/10" />
        <ChevronRight className="mx-2 h-4 w-4 text-white/20" />
        <div className="h-4 w-20 animate-pulse rounded-full bg-white/10" />
      </nav>
    );
  }

  const getBreadcrumbTarget = (routeTo) => {
    const legacyRouteMap = {
      "/projects": "/services",
      "/clients": "/customers",
      "/site-visits": "/appointments",
      "/deals": "/billing",
      "/deals/all": "/billing/all",
      "/deals/draft": "/billing/draft",
      "/deals/issued": "/billing/issued",
      "/deals/paid": "/billing/paid",
      "/deals/revenue-summary": "/billing/reports",
    };

    if (routeTo === "/services") {
      return searchParams.get("returnTo") || "/services";
    }

    return legacyRouteMap[routeTo] || routeTo;
  };

  return (
    <nav aria-label="breadcrumb" className="mb-4 flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted shadow-xl backdrop-blur-lg">
      <Link
        to="/dashboard"
        className="flex items-center gap-3 text-white/60 transition hover:text-gold-2"
      >
        <Home className="h-4 w-4 text-gold-2" />
        {industryLabels.breadcrumbs.dashboard}
      </Link>

      {pathnames.map((name, index) => {
        if (name === "dashboard") return null;

        const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
        const isLast = index === pathnames.length - 1;

        return (
          <div key={routeTo} className="flex items-center">
            <ChevronRight className="mx-2 h-4 w-4 text-white/20" />

            {isLast ? (
              <span className="font-medium text-ivory">
                {formatLabel(name)}
              </span>
            ) : (
              <Link to={getBreadcrumbTarget(routeTo)} className="text-white/60 transition hover:text-gold-2">
                {formatLabel(name)}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
