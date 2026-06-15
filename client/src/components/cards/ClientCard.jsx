import { BadgeIndianRupee, MapPin, Phone, Shapes } from "lucide-react";

import Badge from "../common/Badge";

export default function ClientCard({ client }) {
  
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-glass ">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl text-white">{client.ownerName}</h3>
        </div>
        <Badge tone="gold">{client.propertyCondition}</Badge>
      </div>
      <div className="mt-4 space-y-2 text-sm text-muted">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <p>Location: <span className="text-ivory">{client.premiseArea || "Not specified"}</span></p>
        </div>
        <div className="flex items-center gap-2">
          <Shapes className="h-4 w-4" />
          <p>Service Type: <span className="text-ivory">{client.propertyType || "Not specified"}</span></p>
        </div>
        <div className="flex items-center gap-2">
          <BadgeIndianRupee className="h-4 w-4" />
          <p>Price: <span className="text-ivory">{client.ownerPrice || "-"}</span></p>
        </div>
      </div>
    </div>
  );
}
