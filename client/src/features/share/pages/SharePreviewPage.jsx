import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Badge from "../../../components/common/Badge";
import LoaderScreen from "../../../components/common/LoaderScreen";
import { shareService } from "../../../services/shareService";

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

export default function SharePreviewPage() {
  const { token } = useParams();
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const loadPreview = async () => {
      const data = await shareService.getPreview(token);
      setPreview(data);
    };

    loadPreview();
  }, [token]);

  if (!preview) {
    return <LoaderScreen />;
  }

  const project = preview.project;

  return (
    <div className="min-h-screen bg-ink bg-glow px-6 py-12 text-ivory">
      <div className="mx-auto max-w-4xl rounded-[36px] border border-white/10 bg-white/5 p-8 shadow-glass">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold">Curated Presentation</p>
            <h1 className="mt-2 font-display text-4xl">{project.publicAlias}</h1>
          </div>
          <Badge tone="gold">Customer-safe</Badge>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Location</p>
            <p className="mt-2 text-xl text-ivory">{project.location}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Service Type</p>
            <p className="mt-2 text-xl text-ivory">{project.configuration || formatPropertyTypes(project.propertyType)}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Price</p>
            <p className="mt-2 text-xl text-ivory">{formatPrice(project.priceRange)}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Launch Date</p>
            <p className="mt-2 text-xl text-ivory">
              {project.possessionDate ? new Date(project.possessionDate).toLocaleDateString("en-IN") : "On request"}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-[28px] border border-white/10 bg-black/20 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Highlights</p>
          <p className="mt-3 text-lg text-ivory">{project.amenities?.join(", ") || "Available on request"}</p>
        </div>

        <div className="mt-6 rounded-[28px] border border-gold/20 bg-gold/10 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-gold-2">WhatsApp-ready message</p>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-ivory">{project.whatsAppMessage}</pre>
        </div>
      </div>
    </div>
  );
}
