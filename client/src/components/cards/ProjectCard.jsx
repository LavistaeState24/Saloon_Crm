import { Building2, MapPin, Wallet } from "lucide-react";

import Badge from "../common/Badge";

const formatPropertyTypes = (value) => (Array.isArray(value) ? value.join(", ") : value || "-");
const formatPrice = (value) => {
  if (!value?.min) {
    return "-";
  }

  if (!value.max || value.min === value.max) {
    return value.min.toLocaleString("en-IN");
  }

  return `${value.min.toLocaleString("en-IN")} - ${value.max.toLocaleString("en-IN")}`;
};

export default function ProjectCard({ project }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-glass">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold">{project.location}</p>
          <h3 className="mt-2 font-display text-xl text-ivory">{project.projectName}</h3>
        </div>
        <Badge tone={project.status === "active" ? "green" : "slate"}>{project.status}</Badge>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-muted">
        <div>
          <p className="text-xs uppercase tracking-[0.2em]">Service Type</p>
          <div className="mt-1 flex items-center gap-2 text-ivory">
            <Building2 className="h-4 w-4 text-gold-2" />
            <p>{project.configuration || formatPropertyTypes(project.propertyType)}</p>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em]">Price</p>
          <div className="mt-1 flex items-center gap-2 text-ivory">
            <Wallet className="h-4 w-4 text-gold-2" />
            <p>{formatPrice(project.priceRange)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
