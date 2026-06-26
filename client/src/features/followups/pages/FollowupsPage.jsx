import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import AdvancedDataTable from "../../../components/common/AdvancedDataTable";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import FormInput from "../../../components/common/FormInput";
import Modal from "../../../components/common/Modal";
import SelectDropdown from "../../../components/common/SelectDropdown";
import { useCan } from "../../../hooks/useCan";
import { followupService } from "../../../services/followupService";
import { userService } from "../../../services/userService";

const reminderTypes = ["Call", "WhatsApp", "Details Send", "Site Visit", "Payment", "Document"];
const reminderTypeOptions = reminderTypes.map((type) => ({
  value: type,
  label: type === "Site Visit" ? "Appointment" : type,
}));
const reminderStatuses = ["Pending", "Completed", "Overdue", "Cancelled"];
const initialFilters = {
  status: "",
  type: "",
  staff: "",
  dateFrom: "",
  dateTo: "",
  today: "",
  overdue: "",
};

const getStatusTone = (status) => {
  if (status === "Completed") return "green";
  if (status === "Overdue") return "rose";
  if (status === "Cancelled") return "slate";
  return "gold";
};

const formatDateTime = (value) => (value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-");

export default function FollowupsPage() {
  const canUpdateFollowups = useCan("followups", "update");
  const [followups, setFollowups] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState(initialFilters);
  const [completionTarget, setCompletionTarget] = useState(null);
  const [completionNote, setCompletionNote] = useState("");
  const [actionError, setActionError] = useState("");
  const [isSavingAction, setIsSavingAction] = useState(false);

  const loadFollowups = async () => {
    setIsLoading(true);

    try {
      const params = {
        limit: 100,
        status: filters.status || undefined,
        type: filters.type || undefined,
        staff: filters.staff || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        today: filters.today || undefined,
        overdue: filters.overdue || undefined,
      };
      const [data, assignableUsers] = await Promise.all([followupService.list(params), userService.listAssignable()]);

      setFollowups(data.items || []);
      setStaffOptions(assignableUsers.map((user) => ({ value: user.id, label: `${user.name} (${user.role})` })));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFollowups();
  }, [filters]);

  const handleCompleteReminder = async () => {
    if (!completionTarget) return;

    setActionError("");
    setIsSavingAction(true);

    try {
      await followupService.complete(completionTarget._id, { completionNote });
      setCompletionTarget(null);
      setCompletionNote("");
      await loadFollowups();
    } catch (requestError) {
      setActionError(requestError.response?.data?.errors?.completionNote || requestError.response?.data?.message || "Unable to complete reminder");
    } finally {
      setIsSavingAction(false);
    }
  };

  const handleCancelReminder = async (row) => {
    setActionError("");
    setIsSavingAction(true);

    try {
      await followupService.cancel(row._id);
      await loadFollowups();
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || "Unable to cancel reminder");
    } finally {
      setIsSavingAction(false);
    }
  };

  const columns = [
    {
      key: "client",
      label: "Customer",
      searchValue: (row) => `${row.client?.ownerName || ""} ${row.client?.clientPhoneNumber || ""}`,
      render: (row) => (
        <div>
          <p className="font-medium text-ivory">{row.client?.ownerName || "-"}</p>
          <p className="text-xs text-muted">{row.client?.clientPhoneNumber || ""}</p>
        </div>
      ),
    },
    { key: "note", label: "Note" },
    { key: "reminderType", label: "Type" },
    {
      key: "assignedStaff",
      label: "Assigned",
      searchValue: (row) => row.assignedStaff?.name || "",
      render: (row) => row.assignedStaff?.name || "-",
    },
    {
      key: "reminderDateTime",
      label: "Reminder",
      render: (row) => <span className={row.status === "Overdue" ? "font-semibold text-rose-300" : ""}>{formatDateTime(row.reminderDateTime)}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <Badge tone={getStatusTone(row.status)}>{row.status}</Badge>,
    },
    {
      key: "actions",
      label: "Actions",
      searchable: false,
      render: (row) =>
        canUpdateFollowups && !["Completed", "Cancelled"].includes(row.status) ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              icon={CheckCircle2}
              disabled={isSavingAction}
              onClick={() => {
                setActionError("");
                setCompletionNote("");
                setCompletionTarget(row);
              }}
            >
              Complete
            </Button>
            <Button type="button" variant="ghost" icon={XCircle} disabled={isSavingAction} onClick={() => handleCancelReminder(row)}>
              Cancel
            </Button>
          </div>
        ) : (
          "-"
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
      <p className="text-xs uppercase tracking-[0.3em] text-gold">Reminder Tracker</p>
      <h2 className="mt-2 font-display text-3xl">Follow-up and reminder command center</h2>
      </div>

      <div className="grid gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-glass md:grid-cols-2 lg:grid-cols-6 xl:grid-cols-6">
        <SelectDropdown
          label="Status"
          options={reminderStatuses}
          value={filters.status}
          onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value, overdue: "" }))}
        />
        <SelectDropdown
          label="Type"
          options={reminderTypeOptions}
          value={filters.type}
          onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}
        />
        <SelectDropdown
          label="Staff"
          options={staffOptions}
          value={filters.staff}
          onChange={(event) => setFilters((current) => ({ ...current, staff: event.target.value }))}
        />
        <FormInput
          label="From"
          type="date"
          value={filters.dateFrom}
          onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value, today: "", overdue: "" }))}
        />
        <FormInput
          label="To"
          type="date"
          value={filters.dateTo}
          onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value, today: "", overdue: "" }))}
        />
        <SelectDropdown
          label="Quick Filter"
          options={[
            { value: "today", label: "Today" },
            { value: "overdue", label: "Overdue" },
          ]}
          value={filters.today ? "today" : filters.overdue ? "overdue" : ""}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              today: event.target.value === "today" ? "true" : "",
              overdue: event.target.value === "overdue" ? "true" : "",
              status: event.target.value === "overdue" ? "" : current.status,
            }))
          }
        />
        <div className="flex items-end xl:col-span-3">
          <Button type="button" variant="secondary" className="w-full" onClick={() => setFilters(initialFilters)}>
            Reset Filters
          </Button>
        </div>
      </div>

      {actionError ? <p className="text-sm text-rose-300">{actionError}</p> : null}

      <AdvancedDataTable
        columns={columns}
        rows={followups}
        totalRecords={followups.length}
        loading={isLoading}
        emptyMessage="No reminders found."
        searchPlaceholder="Search reminders..."
        defaultRowsPerPage={10}
      />

      <Modal
        title="Complete Reminder"
        isOpen={Boolean(completionTarget)}
        onClose={() => {
          if (!isSavingAction) {
            setCompletionTarget(null);
            setCompletionNote("");
            setActionError("");
          }
        }}
      >
        <div className="space-y-4">
          <FormInput
            label="Completion Note"
            as="textarea"
            rows={4}
            value={completionNote}
            onChange={(event) => setCompletionNote(event.target.value)}
            error={actionError}
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" disabled={isSavingAction} onClick={() => setCompletionTarget(null)}>
              Cancel
            </Button>
            <Button type="button" icon={CheckCircle2} disabled={isSavingAction} onClick={handleCompleteReminder}>
              {isSavingAction ? "Saving..." : "Complete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
