import StatCard from "../../../components/common/StatCard";

export default function DealSummaryCards({ summary }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Invoices"
        value={summary?.totalDeals ?? "--"}
        accent="gold"
        meta="Billing Pipeline"
      />

      <StatCard
        label="Paid Invoices"
        value={summary?.closedDeals ?? "--"}
        accent="green"
        meta="Payment Received"
      />

      <StatCard
        label="Total Billing"
        value={
          summary?.totalRevenue !== undefined &&
            summary?.totalRevenue !== null
            ? summary.totalRevenue.toLocaleString("en-IN")
            : "--"
        }
        accent="wine"
        meta="Invoice Value"
      />

      <StatCard
        label="Collection Rate"
        value={summary?.closingRate ?? "--"}
        accent="amber"
        meta="Paid vs Total"
      />
    </section>
  );
}