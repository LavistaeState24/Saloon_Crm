import { useEffect, useState } from "react";
import { useCan } from "../../../hooks/useCan";

import DataTable from "../../../components/common/DataTable";
import FormInput from "../../../components/common/FormInput";
import StatCard from "../../../components/common/StatCard";
import { dealService } from "../../../services/dealService";
import { formatCurrency } from "../dealConfig";

const initialFilters = {
  dateFrom: "",
  dateTo: "",
};

export default function DealRevenueSummaryPage() {
  const canViewDealReports = useCan("dealReports", "view");
  const [summary, setSummary] = useState(null);
  const [staffReports, setStaffReports] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadReports = async (nextFilters = filters) => {
    setIsLoading(true);
    setLoadError("");

    try {
      const [summaryData, staffData] = await Promise.all([
        dealService.summary(nextFilters),
        dealService.staffReports(nextFilters),
      ]);
      setSummary(summaryData);
      setStaffReports(staffData || []);
    } catch (requestError) {
      setLoadError(requestError.response?.data?.message || "Unable to load invoice reports");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (canViewDealReports) {
      loadReports();
    }
  }, [canViewDealReports]);

  if (!canViewDealReports) {
    return null;
  }

  const columns = [
    { key: "closerName", label: "Staff" },
    { key: "closerRole", label: "Role" },
    { key: "closedDeals", label: "Paid Invoices" },
    { key: "totalRevenue", label: "Invoice Value", render: (row) => formatCurrency(row.totalRevenue) },
    { key: "totalTokens", label: "Advance Collected", render: (row) => formatCurrency(row.totalTokens) },
    { key: "pendingDocuments", label: "Pending Items", render: (row) => row.pendingDocuments || 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Invoice Reports</p>
        <h2 className="mt-2 font-display text-3xl">Salon Billing Reports</h2>
        <p className="mt-2 text-sm text-muted">Track paid value, advance flow, and performance by staff.</p>
      </div>

      <div className="grid gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-glass md:grid-cols-2 xl:grid-cols-4">
        <FormInput 
          label="Billing From"
          type="date"
          value={filters.dateFrom}
          onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))}
        />
        <FormInput
          label="Billing To"
          type="date"
          value={filters.dateTo}
          onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))}
        />
        <div className="flex items-end gap-3 xl:col-span-2">
          <button
            type="button"
            className="inline-flex w-full items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-ivory transition hover:border-gold/50 hover:bg-white/10"
            onClick={() => {
              setFilters(initialFilters);
              loadReports(initialFilters);
            }}
          >
            Reset
          </button>
          <button
            type="button"
            className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-gold to-gold-2 px-4 py-3 text-sm font-semibold text-ink transition hover:opacity-90"
            onClick={() => loadReports(filters)}
          >
            Apply
          </button>
        </div>
      </div>

      {loadError ? <p className="text-sm text-rose-300">{loadError}</p> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Invoices" value={summary?.totalDeals ?? "--"} accent="gold" meta="Tracked" />
        <StatCard label="Paid Invoices" value={summary?.closedDeals ?? "--"} accent="green" meta="Collected" />
        <StatCard label="Total Billing" value={formatCurrency(summary?.totalRevenue)} accent="wine" meta="Paid value" />
        <StatCard label="Billing Conversion Rate" value={summary?.closingRate ?? "--"} accent="amber" meta="Performance" />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Current Month Billing" value={formatCurrency(summary?.currentMonthRevenue)} accent="gold" meta="This month" />
        <StatCard label="Advance Collected" value={formatCurrency(summary?.totalTokens)} accent="blue" meta="Advance flow" />
        <StatCard label="Pending Items" value={summary?.documentsPending ?? "--"} accent="rose" meta="Pending notes/items" />
        <StatCard label="Month Paid Invoices" value={summary?.currentMonthBookings ?? "--"} accent="green" meta="Services in range" />
      </section>

      <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-gold">Staff Reports</p>
            <h3 className="mt-2 font-display text-2xl">Staff Billing Performance</h3>
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={staffReports}
          totalRecords={staffReports.length}
          loading={isLoading}
          emptyMessage="No staff billing reports found."
          searchPlaceholder="Search staff billing reports..."
          defaultRowsPerPage={10}
        />
      </div>
    </div>
  );
}
