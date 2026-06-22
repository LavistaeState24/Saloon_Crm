import { CalendarPlus, Copy, ExternalLink, Pencil, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import DataTable from "../../../components/common/DataTable";
import FormInput from "../../../components/common/FormInput";
import Modal from "../../../components/common/Modal";
import SelectDropdown from "../../../components/common/SelectDropdown";
import { useCan } from "../../../hooks/useCan";
import { clientService } from "../../../services/clientService";
import { projectService } from "../../../services/projectService";
import { siteVisitService } from "../../../services/siteVisitService";
import { userService } from "../../../services/userService";
import SiteVisitForm from "../components/SiteVisitForm";
import { formatSiteVisitDateTime, getSiteVisitStatusTone, siteVisitStatusOptions } from "../siteVisitConfig";
import { buildSiteVisitConfirmationMessage, getSiteVisitWhatsAppUrl } from "../siteVisitMessaging";

const initialFilters = {
  visitStatus: "",
  assignedStaff: "",
  pickupRequired: "",
  dateFrom: "",
  dateTo: "",
};

const emptyFormValues = {
  leadId: "",
  projectId: "",
  assignedStaff: "",
  visitDateTime: "",
  pickupRequired: false,
  visitStatus: "Booked",
  clientFeedback: "",
  nextAction: "",
  postVisitResult: "",
};

export default function SiteVisitsPage() {
  const canCreateSiteVisits = useCan("siteVisits", "create");
  const canUpdateSiteVisits = useCan("siteVisits", "update");
  const [siteVisits, setSiteVisits] = useState([]);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [formError, setFormError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSiteVisit, setEditingSiteVisit] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadSiteVisitDependencies = async () => {
    const shouldLoadFormDependencies = canCreateSiteVisits || canUpdateSiteVisits;

    if (!shouldLoadFormDependencies) {
      return;
    }

    const [leadsData, projectsData, assignableUsers] = await Promise.all([clientService.listAll(), projectService.listAll(), userService.listAssignable()]);

    setCustomerOptions(
      (leadsData.items || []).map((lead) => ({
        value: lead._id,
        label: `${lead.ownerName} (${lead.clientPhoneNumber})`,
      }))
    );

    setServiceOptions((projectsData.items || []).map((project) => ({ value: project._id, label: `${project.projectName} (${project.publicAlias})` })));
    setStaffOptions(assignableUsers.map((user) => ({ value: user.id, label: `${user.name} (${user.role})` })));
  };

  const loadSiteVisits = async (nextFilters = filters) => {
    setIsLoading(true);
    setListError("");

    try {
      const data = await siteVisitService.listAll(nextFilters);
      setSiteVisits(data.items || []);
    } catch (requestError) {
      setListError(requestError.response?.data?.message || "Unable to load appointments");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadPage = async () => {
      setIsLoading(true);
      setListError("");

      try {
        await Promise.all([loadSiteVisitDependencies(), loadSiteVisits(initialFilters)]);
      } catch (requestError) {
        setListError(requestError.response?.data?.message || "Unable to load appointments");
        setIsLoading(false);
      }
    };

    loadPage();
  }, [canCreateSiteVisits, canUpdateSiteVisits]);

  const plannedRows = useMemo(
    () => siteVisits.filter((siteVisit) => ["Booked", "Confirmed", "Rescheduled", "Cancelled", "No Show"].includes(siteVisit.visitStatus)),
    [siteVisits],
  );

  const doneRows = useMemo(() => siteVisits.filter((siteVisit) => siteVisit.visitStatus === "Completed"), [siteVisits]);

  const toFormValues = (siteVisit) => ({
    leadId: siteVisit.leadId || siteVisit.client?._id || siteVisit.client || "",
    projectId: siteVisit.projectId || siteVisit.project?._id || siteVisit.project || "",
    assignedStaff: siteVisit.assignedStaff?._id || siteVisit.assignedStaff || "",
    visitDateTime: siteVisit.visitDateTime ? new Date(siteVisit.visitDateTime).toISOString().slice(0, 16) : "",
    pickupRequired: Boolean(siteVisit.pickupRequired),
    visitStatus: siteVisit.visitStatus || "Booked",
    clientFeedback: siteVisit.clientFeedback || "",
    nextAction: siteVisit.nextAction || "",
    postVisitResult: siteVisit.postVisitResult || "",
  });

  const openWhatsAppConfirmation = (siteVisit) => {
    window.open(getSiteVisitWhatsAppUrl(siteVisit), "_blank", "noopener,noreferrer");
  };

  const copyWhatsAppConfirmation = async (siteVisit) => {
    await navigator.clipboard.writeText(buildSiteVisitConfirmationMessage(siteVisit));
  };

  const columns = [
    {
      key: "lead",
      label: "Customer",
      searchValue: (row) => `${row.client?.ownerName || ""} ${row.client?.clientPhoneNumber || ""}`,
      render: (row) => (
        <div>
          <p className="font-medium text-ivory">{row.client?.ownerName || "-"}</p>
          <p className="text-xs text-muted">{row.client?.clientPhoneNumber || ""}</p>
        </div>
      ),
    },
    {
      key: "project",
      label: "Service",
      searchValue: (row) => `${row.project?.projectName || ""} ${row.project?.publicAlias || ""}`,
      render: (row) => (
        <div>
          <p className="text-sm text-ivory">{row.project?.projectName || "-"}</p>
          <p className="text-xs text-muted">{row.project?.publicAlias || ""}</p>
        </div>
      ),
    },
    {
      key: "visitDateTime",
      label: "Appointment Time",
      render: (row) => formatSiteVisitDateTime(row.visitDateTime),
    },
    {
      key: "assignedStaff",
      label: "Assigned Staff",
      searchValue: (row) => row.assignedStaff?.name || "",
      render: (row) => row.assignedStaff?.name || "-",
    },
    {
      key: "pickupRequired",
      label: "Assistance",
      render: (row) => <Badge tone={row.pickupRequired ? "amber" : "slate"}>{row.pickupRequired ? "Required" : "Not Required"}</Badge>,
    },
    {
      key: "visitStatus",
      label: "Status",
      render: (row) => <Badge tone={getSiteVisitStatusTone(row.visitStatus)}>{row.visitStatus}</Badge>,
    },
    {
      key: "postVisitResult",
      label: "Appointment Result",
      render: (row) => row.postVisitResult || "-",
    },
    {
      key: "actions",
      label: "Actions",
      searchable: false,
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          {canUpdateSiteVisits ? (
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted transition hover:border-gold/50 hover:bg-gold/10 hover:text-gold-2"
              onClick={() => {
                setEditingSiteVisit(row);
                setFormError("");
                setIsFormOpen(true);
              }}
              title="Edit appointment"
              aria-label="Edit appointment"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted transition hover:border-gold/50 hover:bg-gold/10 hover:text-gold-2"
            onClick={() => copyWhatsAppConfirmation(row)}
            title="Copy WhatsApp confirmation"
            aria-label="Copy WhatsApp confirmation"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted transition hover:border-gold/50 hover:bg-gold/10 hover:text-gold-2"
            onClick={() => openWhatsAppConfirmation(row)}
            title="Open WhatsApp confirmation"
            aria-label="Open WhatsApp confirmation"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Salon Appointments</p>
          <h2 className="mt-2 font-display text-3xl">Appointment scheduling, service completion, and customer follow-up</h2>
        </div>
        {canCreateSiteVisits ? (
          <Button
            icon={CalendarPlus}
            onClick={() => {
              setEditingSiteVisit(null);
              setFormError("");
              setIsFormOpen(true);
            }}
          >
            Book Appointment
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-glass md:grid-cols-2 xl:grid-cols-5">
        <SelectDropdown
          label="Appointment Status"
          options={siteVisitStatusOptions}
          value={filters.visitStatus}
          onChange={(event) => setFilters((current) => ({ ...current, visitStatus: event.target.value }))}
        />
        <SelectDropdown
          label="Assigned Staff"
          options={staffOptions}
          value={filters.assignedStaff}
          onChange={(event) => setFilters((current) => ({ ...current, assignedStaff: event.target.value }))}
        />
        <SelectDropdown
          label="Staff Assigned / Assistance Required"
          options={[
            { value: "true", label: "Required" },
            { value: "false", label: "Not Required" },
          ]}
          value={filters.pickupRequired}
          onChange={(event) => setFilters((current) => ({ ...current, pickupRequired: event.target.value }))}
        />
        <FormInput
          label="Date From"
          type="date"
          value={filters.dateFrom}
          onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))}
        />
        <FormInput
          label="Date To"
          type="date"
          value={filters.dateTo}
          onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))}
        />
        <div className="flex items-end gap-3">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => {
              setFilters(initialFilters);
              loadSiteVisits(initialFilters);
            }}
          >
            Reset
          </Button>
          <Button type="button" className="w-full" onClick={() => loadSiteVisits(filters)}>
            Apply
          </Button>
        </div>
      </div>

      {listError ? <p className="text-sm text-rose-300">{listError}</p> : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-gold">Planned Queue</p>
            <h3 className="mt-2 font-display text-2xl">Booked, confirmed, rescheduled, and cancelled appointments</h3>
          </div>
          <Button type="button" variant="secondary" icon={RefreshCw} onClick={() => loadSiteVisits(filters)} disabled={isLoading}>
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
        <DataTable
          columns={columns}
          rows={plannedRows}
          totalRecords={plannedRows.length}
          loading={isLoading}
          emptyMessage="No planned appointments found."
          searchPlaceholder="Search planned appointments..."
          defaultRowsPerPage={10}
        />
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold">Completed Appointments</p>
          <h3 className="mt-2 font-display text-2xl">Completed appointments and appointment results</h3>
        </div>
        <DataTable
          columns={columns}
          rows={doneRows}
          totalRecords={doneRows.length}
          loading={isLoading}
          emptyMessage="No completed appointments found."
          searchPlaceholder="Search completed appointments..."
          defaultRowsPerPage={10}
        />
      </section>

      <Modal
        title={editingSiteVisit ? "Edit Appointment" : "Book Appointment"}
        isOpen={isFormOpen}
        onClose={() => {
          if (!isSaving) {
            setIsFormOpen(false);
            setEditingSiteVisit(null);
            setFormError("");
          }
        }}
      >
        <div className="space-y-4">
          {formError ? <p className="text-sm text-rose-300">{formError}</p> : null}
          <SiteVisitForm
            initialValues={editingSiteVisit ? toFormValues(editingSiteVisit) : emptyFormValues}
            leadOptions={customerOptions}
            projectOptions={serviceOptions}
            staffOptions={staffOptions}
            isSaving={isSaving}
            saveLabel={editingSiteVisit ? "Update Appointment" : "Book Appointment"}
            submitIcon={editingSiteVisit ? Pencil : CalendarPlus}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingSiteVisit(null);
              setFormError("");
            }}
            onSubmit={async (values) => {
              setFormError("");
              setIsSaving(true);

              try {
                if (editingSiteVisit) {
                  await siteVisitService.update(editingSiteVisit._id, values);
                } else {
                  await siteVisitService.create(values);
                }

                setIsFormOpen(false);
                setEditingSiteVisit(null);
                await loadSiteVisits(filters);
              } catch (requestError) {
                setFormError(requestError.response?.data?.message || "Unable to save appointment");
                throw requestError;
              } finally {
                setIsSaving(false);
              }
            }}
          />
        </div>
      </Modal>
    </div>
  );
}
