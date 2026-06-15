import { Eye, Pencil, Plus, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import DataTable from "../../../components/common/DataTable";
import FormInput from "../../../components/common/FormInput";
import SelectDropdown from "../../../components/common/SelectDropdown";
import { useCan } from "../../../hooks/useCan";
import { dealService } from "../../../services/dealService";
import { formatCurrency, formatDate, getDealStatusTone, getPaymentStatusTone, paymentStatusOptions } from "../dealConfig";

const initialFilters = {
  search: "",
  paymentStatus: "",
  documentsPending: "",
  dateFrom: "",
  dateTo: "",
};

export default function DealPipelinePage({ title, subtitle, status, statusLabel }) {
  const navigate = useNavigate();
  const canCreateDeals = useCan("deals", "create");
  const canUpdateDeals = useCan("deals", "update");
  const [rows, setRows] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filters, setFilters] = useState(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState("");

  const loadDeals = async (nextFilters = filters) => {
    setIsLoading(true);
    setListError("");

    try {
      const data = await dealService.listAll({
        ...nextFilters,
        dealStatus: status || undefined,
      });
      setRows(data.items || []);
      setTotalRecords(data.meta?.total ?? data.items?.length ?? 0);
    } catch (requestError) {
      setListError(requestError.response?.data?.message || "Unable to load billing records");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, [status]);

  const columns = [
    {
      key: "lead",
      label: "Customer",
      searchValue: (row) => `${row.lead?.ownerName || ""} ${row.lead?.clientPhoneNumber || ""}`,
      render: (row) => (
        <div>
          <p className="font-medium text-ivory">{row.lead?.ownerName || "-"}</p>
          <p className="text-xs text-muted">{row.lead?.clientPhoneNumber || ""}</p>
        </div>
      ),
    },
    {
      key: "project",
      label: "Service",
      searchValue: (row) => `${row.project?.projectName || ""} ${row.project?.publicAlias || ""}`,
      render: (row) => (
        <div>
          <p className="font-medium text-ivory">{row.project?.projectName || "-"}</p>
          <p className="text-xs text-muted">{row.project?.publicAlias || ""}</p>
        </div>
      ),
    },
    { key: "finalUnit", label: "Unit", render: (row) => row.finalUnit || "-" },
    {
      key: "finalPrice",
      label: "Price",
      searchValue: (row) => `${row.finalPrice || ""}`,
      render: (row) => formatCurrency(row.finalPrice),
    },
    {
      key: "tokenAmount",
      label: "Token",
      render: (row) => formatCurrency(row.tokenAmount),
    },
    {
      key: "paymentStatus",
      label: "Payment",
      render: (row) => <Badge tone={getPaymentStatusTone(row.paymentStatus)}>{row.paymentStatus || "-"}</Badge>,
    },
    {
      key: "bookingDate",
      label: "Booking Date",
      render: (row) => formatDate(row.bookingDate),
    },
    {
      key: "dealClosedBy",
      label: "Closed By",
      searchValue: (row) => row.closedBy?.name || row.dealClosedBy?.name || "",
      render: (row) => row.closedBy?.name || row.dealClosedBy?.name || "-",
    },
    {
      key: "dealStatus",
      label: "Status",
      render: (row) => <Badge tone={getDealStatusTone(row.dealStatus)}>{row.dealStatus}</Badge>,
    },
    {
      key: "actions",
      label: "Actions",
      searchable: false,
      render: (row) => (
        <div className="flex w-full items-center justify-center gap-2 whitespace-nowrap">
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted transition hover:border-gold/50 hover:bg-gold/10 hover:text-gold-2"
            onClick={() => navigate(`/deals/${row._id}`)}
            title="View deal"
            aria-label="View deal"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          {canUpdateDeals ? (
            <Link to={`/deals/${row._id}/edit`}>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted transition hover:border-gold/50 hover:bg-gold/10 hover:text-gold-2"
                title="Edit deal"
                aria-label="Edit deal"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </Link>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Billing / Invoices</p>
          <h2 className="mt-2 font-display text-3xl">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="secondary" icon={RefreshCw} onClick={() => loadDeals(filters)} disabled={isLoading}>
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
          {canCreateDeals ? (
            <Link to="/deals/new">
            <Button icon={Plus}>New Invoice</Button>
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-glass md:grid-cols-2 xl:grid-cols-5">
        <FormInput
          label="Search"
          placeholder="Customer, service, unit, note..."
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
        />
        <SelectDropdown
          label="Payment Status"
          options={paymentStatusOptions}
          value={filters.paymentStatus}
          onChange={(event) => setFilters((current) => ({ ...current, paymentStatus: event.target.value }))}
        />
        <SelectDropdown
          label="Documents"
          options={[
            { value: "true", label: "Pending" },
            { value: "false", label: "Ready" },
          ]}
          value={filters.documentsPending}
          onChange={(event) => setFilters((current) => ({ ...current, documentsPending: event.target.value }))}
        />
        <FormInput
          label="From"
          type="date"
          value={filters.dateFrom}
          onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))}
        />
        <FormInput
          label="To"
          type="date"
          value={filters.dateTo}
          onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))}
        />
        <div className="flex items-end gap-3 xl:col-span-5">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => {
              setFilters(initialFilters);
              loadDeals(initialFilters);
            }}
          >
            Reset Filters
          </Button>
          <Button
            type="button"
            className="w-full"
            onClick={() => loadDeals(filters)}
          >
            Apply Filters
          </Button>
        </div>
      </div>

      {listError ? <p className="text-sm text-rose-300">{listError}</p> : null}

      <DataTable
        columns={columns}
        rows={rows}
        totalRecords={totalRecords}
        loading={isLoading}
        emptyMessage={`No ${statusLabel.toLowerCase()} invoices found.`}
        searchPlaceholder={`Search ${statusLabel.toLowerCase()} invoices...`}
        defaultRowsPerPage={10}
      />
    </div>
  );
}
