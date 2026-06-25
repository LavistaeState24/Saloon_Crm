import StatCard from "../../../components/common/StatCard";

export default function DealSummaryCards({ summary }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Invoices"
        value={summary?.totalDeals ?? "--"}
        accent="gold"
        meta="All Invoices"
      />

      <StatCard
        label="Paid Invoices"
        value={summary?.closedDeals ?? "--"}
        accent="green"
        meta="Successfully Paid"
      />

      <StatCard
        label="Billing Revenue"
        value={
          summary?.totalRevenue !== undefined &&
            summary?.totalRevenue !== null
            ? summary.totalRevenue.toLocaleString("en-IN")
            : "--"
        }
        accent="wine"
        meta="Revenue Generated"
      />

      <StatCard
        label="Billing Conversion"
        value={summary?.closingRate ?? "--"}
        accent="amber"
        meta="Paid Invoice Ratio"
      />
    </section>
  );
}