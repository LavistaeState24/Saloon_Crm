import { Eye } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import DataTable from "../../../components/common/DataTable";
import FormInput from "../../../components/common/FormInput";
import SelectDropdown from "../../../components/common/SelectDropdown";
import { interestLevelOptions, leadStatusOptions } from "../../../constants/theme";
import { clientService } from "../../../services/clientService";
import { userService } from "../../../services/userService";
import { formatBudgetRange, getInterestLevelTone } from "../clientPipeline";
import { normalizeSalonCustomerStatus } from "../../../config/industryLabels";

const initialFilters = {
  search: "",
  leadStatus: "",
  interestLevel: "",
  assignedStaff: "",
};

const formatDateTime = (value) => (value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-");

const getFollowupTone = (status) => {
  if (status === "Overdue") return "rose";
  if (status === "Completed") return "green";
  if (status === "Cancelled") return "slate";
  return "gold";
};

const getLeadStatusTone = (status) => {
  if (status === "Positive" || status === "Booking" || status === "Closed") return "green";
  if (status === "Negotiation" || status === "Site Visit Planned") return "amber";
  if (status === "Lost") return "rose";
  return "slate";
};

export default function PositiveClientsPage() {
  const [positiveClients, setPositiveClients] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState("");

  const loadPositiveClients = async (nextFilters = initialFilters) => {
    setIsLoading(true);
    setListError("");

    try {
      const [clientData, assignableUsers] = await Promise.all([
        clientService.listAllPositive(nextFilters),
        userService.listAssignable(),
      ]);

      setPositiveClients(clientData.items || []);
      setStaffOptions(
        assignableUsers.map((user) => ({
          value: user.id,
          label: `${user.name} (${user.role})`,
        })),
      );
    } catch (requestError) {
      setListError(requestError.response?.data?.message || "Unable to load priority customers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPositiveClients(initialFilters);
  }, []);

  const positiveLeadStatusOptions = useMemo(
    () =>
      leadStatusOptions
        .filter((status) => !["New Lead", "Call Pending", "Connected", "Lost"].includes(status))
        .map((status) => ({ value: status, label: normalizeSalonCustomerStatus(status) })),
    [],
  );

  const interestOptions = useMemo(
    () => interestLevelOptions.filter((level) => ["Hot", "Warm"].includes(level)).map((level) => ({ value: level, label: level })),
    [],
  );

  const columns = [
    {
      key: "client",
      label: "Customer Info",
      searchValue: (row) =>
        [
          row.ownerName,
          row.clientPhoneNumber,
          row.areaPreference,
          row.premiseArea,
          row.requirementType,
          row.assignedStaff?.name,
          row.interestedProjects?.join(" "),
        ]
          .filter(Boolean)
          .join(" "),
      render: (row) => (
        <div className="space-y-1">
          <p className="font-medium text-ivory">{row.ownerName}</p>
          <p className="text-xs text-muted">{row.clientPhoneNumber}</p>
          <p className="text-xs text-muted">{row.areaPreference || row.premiseArea || "Area not added"}</p>
          {/* <p className="text-xs text-muted">
            {row.requirementType || "Requirement not added"} | {formatBudgetRange(row.budgetMin, row.budgetMax)}
          </p> */}
        </div>
      ),
    },
    {
      key: "interestedProjects",
      label: "Interested Services",
      searchValue: (row) => row.interestedProjects?.join(" ") || "",
      render: (row) =>
        row.interestedProjects?.length ? (
          <div className="flex flex-wrap gap-2">
            {row.interestedProjects.slice(0, 3).map((projectAlias) => (
              <Badge key={`${row._id}-${projectAlias}`} tone="slate">
                {projectAlias}
              </Badge>
            ))}
            {row.interestedProjects.length > 3 ? <Badge tone="slate">+{row.interestedProjects.length - 3} more</Badge> : null}
          </div>
        ) : (
          <span className="text-muted">No shared services</span>
        ),
    },
    {
      key: "objections",
      label: "Objections",
      render: (row) => <p className="max-w-xs whitespace-pre-wrap text-sm text-muted">{row.objections || "No objections captured"}</p>,
    },
    {
      key: "lastDiscussion",
      label: "Last Discussion",
      searchValue: (row) => row.lastDiscussion || "",
      render: (row) => (
        <div className="space-y-1">
          <p className="max-w-xs whitespace-pre-wrap text-sm text-ivory">{row.lastDiscussion || "No discussion saved"}</p>
          <p className="text-xs text-muted">{formatDateTime(row.lastDiscussionAt)}</p>
        </div>
      ),
    },
    {
      key: "nextActiveFollowup",
      label: "Next Reminder",
      searchValue: (row) => `${row.nextActiveFollowup?.note || ""} ${row.nextActiveFollowup?.reminderType || ""}`,
      render: (row) =>
        row.nextActiveFollowup ? (
          <div className="space-y-2">
            <p className="text-sm text-ivory">{formatDateTime(row.nextActiveFollowup.reminderDateTime)}</p>
            <p className="max-w-xs text-xs text-muted">{row.nextActiveFollowup.note || "No note added"}</p>
            <div className="flex flex-wrap gap-2">
              <Badge tone={getFollowupTone(row.nextActiveFollowup.status)}>{row.nextActiveFollowup.status}</Badge>
              <Badge tone="slate">{row.nextActiveFollowup.reminderType}</Badge>
            </div>
          </div>
        ) : (
          <span className="text-muted">No active follow-up</span>
        ),
    },
    {
      key: "assignedStaff",
      label: "Assigned Staff",
      searchValue: (row) => `${row.assignedStaff?.name || ""} ${row.nextActiveFollowup?.assignedStaff?.name || ""}`,
      render: (row) => (
        <div className="space-y-1">
          <p className="text-sm text-ivory">{row.assignedStaff?.name || "Unassigned"}</p>
          <p className="text-xs text-muted">{row.nextActiveFollowup?.assignedStaff?.name ? `Follow-up: ${row.nextActiveFollowup.assignedStaff.name}` : ""}</p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      searchValue: (row) => `${row.leadStatus || ""} ${row.interestLevel || ""}`,
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Badge tone={getLeadStatusTone(row.leadStatus)}>{normalizeSalonCustomerStatus(row.leadStatus) || "New Customer"}</Badge>
          <Badge tone={getInterestLevelTone(row.interestLevel)}>{row.interestLevel || "Warm"}</Badge>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      searchable: false,
      render: (row) => (
        <Link to={`/clients/${row._id}`}>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted transition hover:border-gold/50 hover:bg-gold/10 hover:text-gold-2"
            title="View customer"
            aria-label="View customer"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Priority Customer Module</p>
        <h2 className="mt-2 font-display text-3xl">Priority customers with active reminder momentum</h2>
      </div>

      <div className="grid gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-glass md:grid-cols-2 xl:grid-cols-5">
        <FormInput
          label="Search"
          placeholder="Name, phone, area, service..."
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
        />
        <SelectDropdown
          label="Customer Status"
          options={positiveLeadStatusOptions}
          value={filters.leadStatus}
          onChange={(event) => setFilters((current) => ({ ...current, leadStatus: event.target.value }))}
        />
        <SelectDropdown
          label="Interest Level"
          options={interestOptions}
          value={filters.interestLevel}
          onChange={(event) => setFilters((current) => ({ ...current, interestLevel: event.target.value }))}
        />
        <SelectDropdown
          label="Assigned Staff"
          options={staffOptions}
          value={filters.assignedStaff}
          onChange={(event) => setFilters((current) => ({ ...current, assignedStaff: event.target.value }))}
        />
        <div className="flex items-end gap-3">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => {
              setFilters(initialFilters);
              loadPositiveClients(initialFilters);
            }}
          >
            Reset 
          </Button>
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              loadPositiveClients(filters);
            }}
          >
            Apply
          </Button>
        </div>
      </div>

      {listError ? <p className="text-sm text-rose-300">{listError}</p> : null}

      <DataTable
        columns={columns}
        rows={positiveClients}
        totalRecords={positiveClients.length}
        loading={isLoading}
        emptyMessage="No positive clients found."
        searchPlaceholder="Search visible positive clients..."
        defaultRowsPerPage={10}
      />
    </div>
  );
}
