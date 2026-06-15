import { CalendarDays, Pencil, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import PageSkeleton from "../../../components/common/PageSkeleton";
import { useCan } from "../../../hooks/useCan";
import { dealService } from "../../../services/dealService";
import { formatCurrency, formatDate, formatDateTime, getDealStatusTone, getPaymentStatusTone } from "../dealConfig";

const infoItems = (deal) => [
  ["Customer", deal.lead?.ownerName || "-"],
  ["Customer Phone", deal.lead?.clientPhoneNumber || "-"],
  ["Service", deal.project?.projectName || "-"],
  ["Alias", deal.project?.publicAlias || "-"],
  ["Unit", deal.finalUnit || "-"],
  ["Final Price", formatCurrency(deal.finalPrice)],
  ["Token Amount", formatCurrency(deal.tokenAmount)],
  ["Booking Date", formatDate(deal.bookingDate)],
  ["Payment Status", deal.paymentStatus || "-"],
  ["Documents Pending", deal.documentsPending ? "Yes" : "No"],
  ["Closed By", deal.closedBy?.name || "-"],
  ["Deal Status", deal.dealStatus || "-"],
];

export default function DealDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const canUpdateDeals = useCan("deals", "update");
  const [deal, setDeal] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const loadDeal = async () => {
      try {
        const data = await dealService.getById(id);
        setDeal(data);
      } catch (requestError) {
        setLoadError(requestError.response?.data?.message || "Unable to load invoice details");
      }
    };

    loadDeal();
  }, [id]);

  if (loadError) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-rose-300">{loadError}</p>
        <Button variant="secondary" onClick={() => navigate("/deals/negotiation")}>
          Back to Billing
        </Button>
      </div>
    );
  }

  if (!deal) {
    return <PageSkeleton variant="detail" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Invoice Details</p>
          <h2 className="mt-2 font-display text-4xl">{deal.lead?.ownerName || "Invoice"}</h2>
          <p className="mt-2 text-sm text-muted">{deal.project?.projectName || "Service not attached"}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Badge tone={getDealStatusTone(deal.dealStatus)}>{deal.dealStatus}</Badge>
          <Badge tone={getPaymentStatusTone(deal.paymentStatus)}>{deal.paymentStatus || "Pending"}</Badge>
          {canUpdateDeals ? (
            <Link to={`/deals/${id}/edit`}>
              <Button icon={Pencil}>Edit Invoice</Button>
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-gold-2" />
            <h3 className="font-display text-2xl">Invoice Information</h3>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {infoItems(deal).map(([label, value]) => (
              <div key={label} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{label}</p>
                <p className="mt-2 break-words text-base font-medium text-ivory">{value || "Not added"}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
          <div className="flex items-center gap-3">
            <UserRound className="h-5 w-5 text-gold-2" />
            <h3 className="font-display text-2xl">Audit Trail</h3>
          </div>
          <div className="mt-5 space-y-4">
            {[
              ["Created By", deal.createdBy?.name || "-"],
              ["Created At", formatDateTime(deal.createdAt)],
              ["Updated By", deal.updatedBy?.name || "-"],
              ["Updated At", formatDateTime(deal.updatedAt)],
              ["Notes", deal.notes || "-"],
              ["Brokerage Details", deal.brokerageDetails || "-"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{label}</p>
                <p className="mt-2 break-words text-base font-medium text-ivory">{value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
