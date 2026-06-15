import StatCard from "../../../components/common/StatCard";

export default function DealSummaryCards({ summary }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Total Deals" value={summary?.totalDeals ?? "--"} accent="gold" meta="Pipeline" />
      <StatCard label="Closed Deals" value={summary?.closedDeals ?? "--"} accent="green" meta="Revenue ready" />
      <StatCard
        label="Revenue"
        value={summary?.totalRevenue !== undefined && summary?.totalRevenue !== null ? summary.totalRevenue.toLocaleString("en-IN") : "--"}
        accent="wine"
        meta="Closed value"
      />
      <StatCard label="Closing Rate" value={summary?.closingRate ?? "--"} accent="amber" meta="Close ratio" />
    </section>
  );
}
