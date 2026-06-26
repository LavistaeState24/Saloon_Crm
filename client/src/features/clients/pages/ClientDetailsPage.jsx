import {
  Building2,
  Bell,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ClipboardList,
  Copy,
  Clock,
  ExternalLink,
  History,
  IndianRupee,
  Mail,
  MapPin,
  Phone,
  Ruler,
  ScrollText,
  Shapes,
  Sparkles,
  UserCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import DataTable from "../../../components/common/DataTable";
import FormInput from "../../../components/common/FormInput";
import Modal from "../../../components/common/Modal";
import PageSkeleton from "../../../components/common/PageSkeleton";
import SelectDropdown from "../../../components/common/SelectDropdown";
import { useAuth } from "../../../hooks/useAuth";
import { useCan } from "../../../hooks/useCan";
import { clientService } from "../../../services/clientService";
import { followupService } from "../../../services/followupService";
import { projectService } from "../../../services/projectService";
import { siteVisitService } from "../../../services/siteVisitService";
import { userService } from "../../../services/userService";
import { formatBudgetRange, getInterestLevelTone } from "../clientPipeline";
import ClientMatchingSection from "../components/ClientMatchingSection";
import SiteVisitForm from "../../siteVisits/components/SiteVisitForm";
import { formatSiteVisitDateTime, getSiteVisitStatusTone } from "../../siteVisits/siteVisitConfig";
import { buildSiteVisitConfirmationMessage, getSiteVisitWhatsAppUrl } from "../../siteVisits/siteVisitMessaging";
import ClientActivityTimeline from "../components/ClientActivityTimeline";
import {
  salonCustomerStatusOptions,
  salonFormLabels,
  salonPriorityLevelOptions,
  normalizeSalonCustomerStatus,
} from "../../../config/industryLabels";

const reminderTypes = ["Call", "WhatsApp", "Details Send", "Site Visit", "Payment", "Document"];
const reminderTypeOptions = reminderTypes.map((type) => ({
  value: type,
  label: type === "Site Visit" ? "Appointment" : type,
}));

export default function ClientDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSalesUser = user?.role === "sales";
  const canUpdateClients = useCan("clients", "update");
  const canViewFollowups = useCan("followups", "view");
  const canCreateFollowups = useCan("followups", "create");
  const canUpdateFollowups = useCan("followups", "update");
  const canViewSiteVisits = useCan("siteVisits", "view");
  const canCreateSiteVisits = useCan("siteVisits", "create");
  const canShowQuickUpdate = canUpdateClients || isSalesUser;
  const initialCallForm = {
    callConnected: false,
    leadStatus: "New Customer",
    interestLevel: "Warm",
    discussionSummary: "",
    requirementNote: "",
    objection: "",
    nextAction: "",
    nextFollowupDateTime: "",
    reminderType: "Call",
    callDuration: "",
    lostReason: "",
  };
  const initialReminderForm = {
    assignedStaff: "",
    reminderType: "Call",
    reminderDateTime: "",
    note: "",
  };
  const [client, setClient] = useState(null);
  const [callLogs, setCallLogs] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [siteVisits, setSiteVisits] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [callForm, setCallForm] = useState(initialCallForm);
  const [callErrors, setCallErrors] = useState({});
  const [callError, setCallError] = useState("");
  const [isSavingCall, setIsSavingCall] = useState(false);
  const [reminderForm, setReminderForm] = useState(initialReminderForm);
  const [reminderErrors, setReminderErrors] = useState({});
  const [reminderError, setReminderError] = useState("");
  const [completionReminder, setCompletionReminder] = useState(null);
  const [completionNote, setCompletionNote] = useState("");
  const [isSavingReminder, setIsSavingReminder] = useState(false);
  const [siteVisitError, setSiteVisitError] = useState("");
  const [isSavingSiteVisit, setIsSavingSiteVisit] = useState(false);
  const [timelineRefreshKey, setTimelineRefreshKey] = useState(0);
  const [quickEdit, setQuickEdit] = useState({
    assignedStaff: "",
    leadStatus: "",
    interestLevel: "",
    notes: "",
    internalNotes: "",
    lastCallStatus: "",
    nextFollowUpDate: "",
  });
  const [loadError, setLoadError] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const syncClientState = (nextClient) => {
    setClient(nextClient);
    setQuickEdit((current) => ({
      ...current,
      assignedStaff: nextClient.assignedStaff?._id || nextClient.assignedStaff || "",
      leadStatus: normalizeSalonCustomerStatus(nextClient.leadStatus) || "New Customer",
      interestLevel: nextClient.interestLevel || "Warm",
      notes: nextClient.notes || "",
      internalNotes: nextClient.internalNotes || "",
      lastCallStatus: nextClient.lastCallStatus || "",
      nextFollowUpDate: nextClient.nextFollowUpDate ? new Date(nextClient.nextFollowUpDate).toISOString().slice(0, 10) : "",
    }));
  };

  const refreshTimeline = () => {
    setTimelineRefreshKey((current) => current + 1);
  };

  useEffect(() => {
    const loadClient = async () => {
      setLoadError("");

      try {
        const [data, assignableUsers, callHistory, reminderData] = await Promise.all([
          clientService.getById(id),
          userService.listAssignable(),
          clientService.listCallLogs(id),
          canViewFollowups ? followupService.list({ leadId: id, limit: 100 }) : Promise.resolve({ items: [] }),
        ]);
        const [visitData, projectsData] = await Promise.all([
          canViewSiteVisits ? siteVisitService.list({ leadId: id, limit: 100 }) : Promise.resolve({ items: [] }),
          canCreateSiteVisits ? projectService.listAll() : Promise.resolve({ items: [] }),
        ]);
        setClient(data);
        setCallLogs(callHistory);
        setReminders(reminderData.items || []);
        setSiteVisits(visitData.items || []);
        setProjectOptions(
          (projectsData.items || []).map((project) => ({
            value: project._id,
            label: `${project.projectName} (${project.publicAlias})`,
          })),
        );
        setStaffOptions(
          assignableUsers.map((user) => ({
            value: user.id,
            label: `${user.name} (${user.role})`,
          })),
        );
          setQuickEdit({
          assignedStaff: data.assignedStaff?._id || data.assignedStaff || "",
          leadStatus: normalizeSalonCustomerStatus(data.leadStatus) || "New Customer",
          interestLevel: data.interestLevel || "Warm",
          notes: data.notes || "",
          internalNotes: data.internalNotes || "",
          lastCallStatus: data.lastCallStatus || "",
          nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate).toISOString().slice(0, 10) : "",
        });
        setCallForm((current) => ({
          ...current,
          leadStatus: normalizeSalonCustomerStatus(data.leadStatus) || "New Customer",
          interestLevel: data.interestLevel || "Warm",
        }));
        setReminderForm((current) => ({
          ...current,
          assignedStaff: data.assignedStaff?._id || data.assignedStaff || "",
        }));
      } catch (requestError) {
        setLoadError(requestError.response?.data?.message || "Unable to load customer details");
      }
    };

    loadClient();
  }, [canCreateSiteVisits, canViewFollowups, canViewSiteVisits, id]);

  const handleQuickUpdate = async () => {
    setUpdateError("");
    setIsSaving(true);

    try {
      const payload = {
        leadStatus: quickEdit.leadStatus,
        interestLevel: quickEdit.interestLevel,
        notes: quickEdit.notes,
        internalNotes: quickEdit.internalNotes,
        lastCallStatus: quickEdit.lastCallStatus,
        nextFollowUpDate: quickEdit.nextFollowUpDate || null,
      };

      if (!isSalesUser) {
        payload.assignedStaff = quickEdit.assignedStaff || null;
      }

      const updatedClient = await clientService.update(id, payload);

      syncClientState(updatedClient);
      refreshTimeline();
    } catch (requestError) {
      setUpdateError(requestError.response?.data?.message || "Unable to update customer");
    } finally {
      setIsSaving(false);
    }
  };

  const updateCallForm = (field, value) => {
    setCallForm((current) => ({ ...current, [field]: value }));
    setCallErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleCallUpdate = async () => {
    setCallError("");
    setCallErrors({});
    setIsSavingCall(true);

    try {
      if (callForm.leadStatus === "Lost" && !String(callForm.lostReason || "").trim()) {
        setCallErrors({ lostReason: "Lost reason is required when lead status is Lost" });
        return;
      }

      const payload = {
        ...callForm,
        callDuration: callForm.callDuration ? Number(callForm.callDuration) : undefined,
        nextFollowupDateTime: isTerminalLeadStatus
          ? null
          : callForm.nextFollowupDateTime || null,
        reminderType: isTerminalLeadStatus
          ? "None"
          : callForm.reminderType,
      };
      const savedCallLog = await clientService.createCallLog(id, payload);
      const [updatedClient, reminderData] = await Promise.all([
        clientService.getById(id),
        canViewFollowups ? followupService.list({ leadId: id, limit: 100 }) : Promise.resolve({ items: [] }),
      ]);

      syncClientState(updatedClient);
      setCallLogs((current) => [savedCallLog, ...current]);
      setReminders(reminderData.items || []);
      setCallForm({
        ...initialCallForm,
        leadStatus: normalizeSalonCustomerStatus(updatedClient.leadStatus) || "New Customer",
        interestLevel: updatedClient.interestLevel || "Warm",
      });
      refreshTimeline();
    } catch (requestError) {
      setCallErrors(requestError.response?.data?.errors || {});
      setCallError(requestError.response?.data?.message || "Unable to save call update");
    } finally {
      setIsSavingCall(false);
    }
  };

  const updateReminderForm = (field, value) => {
    console.log(field, value);
    setReminderForm((current) => ({ ...current, [field]: value }));
    setReminderErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleCreateReminder = async () => {
    setReminderError("");
    setReminderErrors({});
    setIsSavingReminder(true);

    try {
      if (isReminderLocked) {
        setReminderError("Complete the overdue reminder before creating a new reminder for this customer");
        return;
      }

      await followupService.create({
        client: id,
        ...reminderForm,
      });
      const reminderData = canViewFollowups ? await followupService.list({ leadId: id, limit: 100 }) : { items: [] };
      setReminders(reminderData.items || []);
      setReminderForm({
        ...initialReminderForm,
        assignedStaff: client.assignedStaff?._id || client.assignedStaff || "",
      });
      refreshTimeline();
    } catch (requestError) {
      setReminderErrors(requestError.response?.data?.errors || {});
      setReminderError(requestError.response?.data?.message || "Unable to create reminder");
    } finally {
      setIsSavingReminder(false);
    }
  };

  const handleCompleteReminder = async () => {
    if (!completionReminder) return;

    setReminderError("");
    setIsSavingReminder(true);

    try {
      await followupService.complete(completionReminder._id, { completionNote });
      const reminderData = canViewFollowups ? await followupService.list({ leadId: id, limit: 100 }) : { items: [] };
      setReminders(reminderData.items || []);
      setCompletionReminder(null);
      setCompletionNote("");
      refreshTimeline();
    } catch (requestError) {
      setReminderError(requestError.response?.data?.errors?.completionNote || requestError.response?.data?.message || "Unable to complete reminder");
    } finally {
      setIsSavingReminder(false);
    }
  };

  const handleCreateSiteVisit = async (values) => {
    setSiteVisitError("");
    setIsSavingSiteVisit(true);

    try {
      await siteVisitService.create(values);
      const visitData = canViewSiteVisits ? await siteVisitService.list({ leadId: id, limit: 100 }) : { items: [] };
      const updatedClient = await clientService.getById(id);
      setSiteVisits(visitData.items || []);
      syncClientState(updatedClient);
      refreshTimeline();
    } catch (requestError) {
      setSiteVisitError(requestError.response?.data?.message || "Unable to create site visit");
      throw requestError;
    } finally {
      setIsSavingSiteVisit(false);
    }
  };

  const handleCopySiteVisitMessage = async (siteVisit) => {
    await navigator.clipboard.writeText(buildSiteVisitConfirmationMessage(siteVisit));
  };

  const formatDateTime = (value) => (value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-");
  const overdueReminder = reminders.find((reminder) => reminder.status === "Overdue") || null;
  const isReminderLocked = Boolean(client?.hasOverdueReminder || overdueReminder) && user?.role !== "super-admin";
  const getReminderStatusTone = (status) => {
    if (status === "Completed") return "green";
    if (status === "Overdue") return "rose";
    if (status === "Cancelled") return "slate";
    return "gold";
  };

  const isTerminalLeadStatus = ["Lost", "Service Completed", "Converted"].includes(
    normalizeSalonCustomerStatus(callForm.leadStatus),
  );

  if (loadError) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-rose-300">{loadError}</p>
        <Button variant="secondary" onClick={() => navigate("/clients")}>
          Back to Customers
        </Button>
      </div>
    );
  }

  if (!client) {
    return <PageSkeleton variant="detail" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">{client.areaPreference || client.premiseArea || "Preferred Branch"}</p>
          <h2 className="mt-2 font-display text-4xl">{client.ownerName}</h2>
          <p className="mt-2 text-sm text-muted">{client.clientPhoneNumber}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="slate">{normalizeSalonCustomerStatus(client.leadStatus) || "New Customer"}</Badge>
          <Badge tone={getInterestLevelTone(client.interestLevel)}>{client.interestLevel || "Warm"}</Badge>
          <Badge tone="green">{client.assignedStaff?.name || "Unassigned"}</Badge>
          {canUpdateClients && !isSalesUser ? (
            <Link to={`/clients/${client._id}/edit`}>
              <Button>Edit Customer</Button>
            </Link>
          ) : null}
        </div>
      </div>

      {isReminderLocked ? (
        <div className="rounded-[28px] border border-amber-400/30 bg-amber-500/10 px-5 py-4 text-amber-50 shadow-glass">
          <p className="text-xs uppercase tracking-[0.24em] text-amber-200">Reminder lock active</p>
          <p className="mt-2 text-sm leading-6">
            This customer has an overdue reminder. Complete the reminder with a discussion note before saving status, call, appointment, or invoice actions.
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-1 md:grid-cols-1 sm:grid-cols-1">
        <div className="space-y-6">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-gold-2" />
              <h3 className="font-display text-2xl">Customer Snapshot</h3>
            </div>

            <div className="mt-5 grid gap-4  lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
              {[
                ["Assigned Staff", client.assignedStaff?.name, UserCheck],
                ["Source", client.source, Shapes],
                [salonFormLabels.serviceInterested, client.requirementType || client.purpose, ClipboardList],
                [salonFormLabels.preferredBranch, client.areaPreference, MapPin],
                ["Expected Spend Range", formatBudgetRange(client.budgetMin, client.budgetMax), IndianRupee],
                ["Last Interaction Status", client.lastCallStatus, Phone],
                ["Next Follow-up", client.nextFollowUpDate ? new Date(client.nextFollowUpDate).toLocaleDateString("en-IN") : "-", CalendarDays],
                ["Branch Name", client.premiseName, Building2],
                ["Branch Location", client.premiseArea, MapPin],
              ].map(([label, value, Icon]) => (
                <div key={label} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gold-2" />
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{label}</p>
                  </div>
                  <p className="mt-2 break-words text-base font-medium text-ivory">{value || "Not added"}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
            <div className="flex items-center gap-3">
              <UserRound className="h-5 w-5 text-gold-2" />
              <h3 className="font-display text-2xl">Customer and Service Profile</h3>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
              {[
                ["Customer Name", client.ownerName, UserRound],
                ["Phone Number", client.clientPhoneNumber, Phone],
                ["Email", client.email, Mail],
                ["Address", client.address, MapPin],
                ["Source", client.sourceOfProperty, Shapes],
                [salonFormLabels.customerType, client.propertyType, Sparkles],
                [salonFormLabels.customerStatus, normalizeSalonCustomerStatus(client.propertyStatus) || client.propertyStatus, Shapes],
                ["Expected Spend", client.ownerPrice?.toLocaleString("en-IN"), IndianRupee],
                ["Service Preference", client.propertyCondition, Shapes],
                ["Visit Frequency", client.propertyAge, ScrollText],
                ["Package / Duration", client.propertySize, Ruler],
                ["Date Added", client.dateOfAddingProperty ? new Date(client.dateOfAddingProperty).toLocaleDateString("en-IN") : "Not added", CalendarDays],
                ["Created By", client.createdBy?.name, UserRound],
              ].map(([label, value, Icon]) => (
                <div key={label} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gold-2" />
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{label}</p>
                  </div>
                  <p className="mt-2 break-words text-base font-medium text-ivory">{value || "Not added"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <ClientActivityTimeline leadId={client._id} refreshKey={timelineRefreshKey} />

        {canShowQuickUpdate ? (
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-5 w-5 text-gold-2" />
              <h3 className="font-display text-2xl">Quick Customer Update</h3>
            </div>

            <div className="mt-5 space-y-4">
              {!isSalesUser ? (
                <SelectDropdown
                  label="Assigned Staff"
                  options={staffOptions}
                  placeholder="Auto assign to creator"
                  value={quickEdit.assignedStaff}
                  onChange={(event) => setQuickEdit((current) => ({ ...current, assignedStaff: event.target.value }))}
                />
              ) : null}
              <SelectDropdown
                label={salonFormLabels.customerStatus}
                options={salonCustomerStatusOptions}
                value={quickEdit.leadStatus}
                onChange={(event) => setQuickEdit((current) => ({ ...current, leadStatus: event.target.value }))}
              />
              <SelectDropdown
                label={salonFormLabels.priorityLevel}
                options={salonPriorityLevelOptions}
                value={quickEdit.interestLevel}
                onChange={(event) => setQuickEdit((current) => ({ ...current, interestLevel: event.target.value }))}
              />
              <FormInput
                label="Last Interaction Status"
                placeholder="Contacted, no response, appointment planned..."
                value={quickEdit.lastCallStatus}
                onChange={(event) => setQuickEdit((current) => ({ ...current, lastCallStatus: event.target.value }))}
              />
              <FormInput
                label="Next Follow-up Date"
                type="date"
                value={quickEdit.nextFollowUpDate}
                onChange={(event) => setQuickEdit((current) => ({ ...current, nextFollowUpDate: event.target.value }))}
              />
              <FormInput
                label={salonFormLabels.notes}
                as="textarea"
                rows={4}
                className="lg:col-span-2"
                value={quickEdit.notes}
                onChange={(event) => setQuickEdit((current) => ({ ...current, notes: event.target.value }))}
              />
              <FormInput
                label="Internal Notes"
                as="textarea"
                rows={4}
                className="lg:col-span-2"
                value={quickEdit.internalNotes}
                onChange={(event) => setQuickEdit((current) => ({ ...current, internalNotes: event.target.value }))}
              />

              {updateError ? <p className="text-sm text-rose-300">{updateError}</p> : null}

              <div className="flex justify-end">
                <Button type="button" onClick={handleQuickUpdate} disabled={isSaving || isReminderLocked}>
                  {isSaving ? "Saving..." : "Save Update"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {canShowQuickUpdate ? (
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-gold-2" />
              <h3 className="font-display text-2xl">Call Update</h3>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-semibold text-ivory">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-gold"
                  checked={callForm.callConnected}
                  onChange={(event) => updateCallForm("callConnected", event.target.checked)}
                />
                Call connected
              </label>

              <div className="grid gap-4 lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1">
                <SelectDropdown
                  label={salonFormLabels.customerStatus}
                  options={salonCustomerStatusOptions}
                  value={callForm.leadStatus}
                  onChange={(event) => updateCallForm("leadStatus", event.target.value)}
                  error={callErrors.leadStatus}
                />
                <SelectDropdown
                  label={salonFormLabels.priorityLevel}
                  options={salonPriorityLevelOptions}
                  value={callForm.interestLevel}
                  onChange={(event) => updateCallForm("interestLevel", event.target.value)}
                  error={callErrors.interestLevel}
                />
              </div>

              <FormInput
                label="Consultation Summary"
                as="textarea"
                rows={4}
                value={callForm.discussionSummary}
                onChange={(event) => updateCallForm("discussionSummary", event.target.value)}
                error={callErrors.discussionSummary}
              />
              <FormInput
                label={salonFormLabels.serviceInterested}
                as="textarea"
                rows={3}
                value={callForm.requirementNote}
                onChange={(event) => updateCallForm("requirementNote", event.target.value)}
                error={callErrors.requirementNote}
              />
              <FormInput
                label="Customer Concern"
                as="textarea"
                rows={3}
                value={callForm.objection}
                onChange={(event) => updateCallForm("objection", event.target.value)}
                error={callErrors.objection}
              />

              <div className="grid gap-4 lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1">
                <FormInput
                  label="Next Action"
                  value={callForm.nextAction}
                  onChange={(event) => updateCallForm("nextAction", event.target.value)}
                  error={callErrors.nextAction}
                />
                {!isTerminalLeadStatus ? (
                  <FormInput
                  label="Next Follow-up"
                    type="datetime-local"
                    value={callForm.nextFollowupDateTime}
                    onChange={(event) => updateCallForm("nextFollowupDateTime", event.target.value)}
                    error={callErrors.nextFollowupDateTime}
                  />
                ) : null}
                <SelectDropdown
                  label="Reminder Type"
                  options={[{ value: "None", label: "None" }, ...reminderTypeOptions]}
                  value={callForm.reminderType}
                  onChange={(event) => updateCallForm("reminderType", event.target.value)}
                  error={callErrors.reminderType}
                />
                <FormInput
                  label="Consultation Duration (minutes)"
                  type="number"
                  min="0"
                  value={callForm.callDuration}
                  onChange={(event) => updateCallForm("callDuration", event.target.value)}
                  error={callErrors.callDuration}
                />
              </div>

              {callForm.leadStatus === "Lost" ? (
                <FormInput
                  label="Lost Reason"
                  as="textarea"
                  rows={3}
                  value={callForm.lostReason}
                  onChange={(event) => updateCallForm("lostReason", event.target.value)}
                  error={callErrors.lostReason}
                />
              ) : null}

              {callError ? <p className="text-sm text-rose-300">{callError}</p> : null}

              <div className="flex justify-end">
                <Button type="button" icon={Clock} onClick={handleCallUpdate} disabled={isSavingCall || isReminderLocked}>
                  {isSavingCall ? "Saving..." : "Save Call Update"}
                </Button>
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-5">
              <div className="flex items-center gap-3">
                <History className="h-5 w-5 text-gold-2" />
                <h3 className="font-display text-2xl">Call History</h3>
              </div>

              <div className="mt-4 overflow-auto rounded-2xl border border-white/10">
                <table className="w-full min-w-[840px] text-left text-sm">
                  <thead className="bg-white/5 text-xs uppercase tracking-[0.16em] text-muted">
                    <tr>
                      {["Date", "Status", "Connected", "Summary", "Lost Reason", "Next Reminder", "By"].map((heading) => (
                        <th key={heading} className="px-3 py-2 font-semibold">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {callLogs.length ? (
                      callLogs.map((callLog) => (
                        <tr key={callLog._id} className="border-t border-white/10 align-top">
                          <td className="px-3 py-3 text-muted">{formatDateTime(callLog.createdAt)}</td>
                          <td className="px-3 py-3 text-ivory">{normalizeSalonCustomerStatus(callLog.leadStatus) || callLog.leadStatus}</td>
                          <td className="px-3 py-3 text-muted">{callLog.callConnected ? "Yes" : "No"}</td>
                          <td className="max-w-xs px-3 py-3 text-muted">{callLog.discussionSummary}</td>
                          <td className="max-w-xs px-3 py-3 text-muted">{callLog.lostReason || "-"}</td>
                          <td className="px-3 py-3 text-muted">{formatDateTime(callLog.nextFollowupDateTime)}</td>
                          <td className="px-3 py-3 text-muted">{callLog.createdBy?.name || "-"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-3 py-6 text-center text-muted" colSpan={7}>
                          No call updates saved yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        {canViewFollowups ? (
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-gold-2" />
              <h3 className="font-display text-2xl">Reminders</h3>
            </div>

            {canCreateFollowups ? (
              <div className="mt-5 grid gap-4">
                {isReminderLocked ? (
                  <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
                    Complete the overdue reminder first before creating another reminder for this customer.
                  </div>
                ) : null}
                <div className="grid gap-4 lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1">
                  <SelectDropdown
                    label="Assigned Staff"
                    options={staffOptions}
                    disabled={isReminderLocked}
                    value={reminderForm.assignedStaff}
                    onChange={(event) => updateReminderForm("assignedStaff", event.target.value)}
                    error={reminderErrors.assignedStaff}
                  />
                  <SelectDropdown
                    label="Reminder Type"
                    options={reminderTypeOptions}
                    disabled={isReminderLocked}
                    value={reminderForm.reminderType}
                    onChange={(event) => updateReminderForm("reminderType", event.target.value)}
                    error={reminderErrors.reminderType}
                  />
                  <FormInput
                    label="Reminder Date/Time"
                    type="datetime-local"
                    disabled={isReminderLocked}
                    value={reminderForm.reminderDateTime}
                    onChange={(event) => updateReminderForm("reminderDateTime", event.target.value)}
                    error={reminderErrors.reminderDateTime}
                  />
                  <FormInput
                    label="Reminder Note"
                    disabled={isReminderLocked}
                    value={reminderForm.note}
                    onChange={(event) => updateReminderForm("note", event.target.value)}
                    error={reminderErrors.note}
                  />
                </div>

                {reminderError ? <p className="text-sm text-rose-300">{reminderError}</p> : null}

                <div className="flex justify-end">
                  <Button type="button" icon={Bell} disabled={isSavingReminder || isReminderLocked} onClick={handleCreateReminder}>
                    {isSavingReminder ? "Saving..." : "Create Reminder"}
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="mt-6 overflow-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-white/5 text-xs uppercase tracking-[0.16em] text-muted">
                  <tr>
                    {["Reminder", "Type", "Assigned", "Note", "Status", "Action"].map((heading) => (
                      <th key={heading} className="px-3 py-2 font-semibold">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reminders.length ? (
                    reminders.map((reminder) => (
                      <tr key={reminder._id} className="border-t border-white/10 align-top">
                        <td className={`px-3 py-3 ${reminder.status === "Overdue" ? "font-semibold text-rose-300" : "text-muted"}`}>
                          {formatDateTime(reminder.reminderDateTime)}
                        </td>
                        <td className="px-3 py-3 text-ivory">{reminder.reminderType}</td>
                        <td className="px-3 py-3 text-muted">{reminder.assignedStaff?.name || "-"}</td>
                        <td className="max-w-xs px-3 py-3 text-muted">{reminder.note}</td>
                        <td className="px-3 py-3">
                          <Badge tone={getReminderStatusTone(reminder.status)}>{reminder.status}</Badge>
                        </td>
                        <td className="px-3 py-3">
                          {canUpdateFollowups && !["Completed", "Cancelled"].includes(reminder.status) ? (
                            <Button
                              type="button"
                              variant="secondary"
                              icon={CheckCircle2}
                              disabled={isSavingReminder}
                              onClick={() => {
                                setReminderError("");
                                setCompletionNote("");
                                setCompletionReminder(reminder);
                              }}
                            >
                              Complete
                            </Button>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-3 py-6 text-center text-muted" colSpan={6}>
                        No reminders saved yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {canViewSiteVisits ? (
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-gold-2" />
              <h3 className="font-display text-2xl">Appointments</h3>
            </div>

            {canCreateSiteVisits ? (
              <div className="mt-5">
                <SiteVisitForm
                  initialValues={{
                    leadId: client._id,
                    assignedStaff: client.assignedStaff?._id || client.assignedStaff || "",
                    visitStatus: "Planned",
                  }}
                  hideLead
                  lockLead
                  disabled={isReminderLocked}
                  projectOptions={projectOptions}
                  staffOptions={staffOptions}
                  isSaving={isSavingSiteVisit}
                  saveLabel="Create Appointment"
                  submitIcon={CalendarPlus}
                  onSubmit={handleCreateSiteVisit}
                />
                {siteVisitError ? <p className="mt-3 text-sm text-rose-300">{siteVisitError}</p> : null}
              </div>
            ) : null}

            <div className="mt-6">
              <DataTable
                columns={[
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
                  {
                    key: "visitDateTime",
                    label: "Visit Time",
                    render: (row) => formatSiteVisitDateTime(row.visitDateTime),
                  },
                  {
                    key: "assignedStaff",
                    label: "Assigned",
                    render: (row) => row.assignedStaff?.name || "-",
                  },
                  {
                    key: "visitStatus",
                    label: "Status",
                    render: (row) => <Badge tone={getSiteVisitStatusTone(row.visitStatus)}>{row.visitStatus}</Badge>,
                  },
                  {
                    key: "postVisitResult",
                    label: "Result",
                    render: (row) => row.postVisitResult || "-",
                  },
                  {
                    key: "actions",
                    label: "Actions",
                    searchable: false,
                    render: (row) => (
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className="text-xs text-gold-2" onClick={() => handleCopySiteVisitMessage(row)}>
                          <Copy className="mr-1 inline h-3.5 w-3.5" />
                          Copy
                        </button>
                        <button
                          type="button"
                          className="text-xs text-gold-2"
                          onClick={() => window.open(getSiteVisitWhatsAppUrl(row), "_blank", "noopener,noreferrer")}
                        >
                          <ExternalLink className="mr-1 inline h-3.5 w-3.5" />
                          WhatsApp
                        </button>
                      </div>
                    ),
                  },
                ]}
                rows={siteVisits}
                totalRecords={siteVisits.length}
                loading={false}
                emptyMessage="No appointments saved for this customer."
                searchPlaceholder="Search appointments..."
                defaultRowsPerPage={5}
              />
            </div>
          </div>
        ) : null}

        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
          <div className="flex items-center gap-3">
            <ScrollText className="h-5 w-5 text-gold-2" />
            <h3 className="font-display text-2xl">Notes</h3>
          </div>

          <div className="mt-5 space-y-4">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Customer Notes</p>
              <p className="mt-2 whitespace-pre-wrap break-words text-base font-medium text-ivory">{client.notes || "No customer notes added."}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Internal Notes</p>
              <p className="mt-2 whitespace-pre-wrap break-words text-base font-medium text-ivory">
                {client.internalNotes || "No internal notes added."}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Reminder</p>
              <p className="mt-2 whitespace-pre-wrap break-words text-base font-medium text-ivory">
                {client.lastCallStatus || "No interaction status added."}
              </p>
              <p className="mt-2 text-sm text-muted">
                Next follow-up: {client.nextFollowUpDate ? new Date(client.nextFollowUpDate).toLocaleDateString("en-IN") : "-"}
              </p>
            </div>
          </div>
        </div>

        <ClientMatchingSection
          client={client}
          onClientUpdate={(nextClient) => {
            syncClientState(nextClient);
            refreshTimeline();
          }}
        />
      </div>

      <Modal
        title="Complete Reminder"
        isOpen={Boolean(completionReminder)}
        onClose={() => {
          if (!isSavingReminder) {
            setCompletionReminder(null);
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
            error={reminderError}
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" disabled={isSavingReminder} onClick={() => setCompletionReminder(null)}>
              Cancel
            </Button>
            <Button type="button" icon={CheckCircle2} disabled={isSavingReminder} onClick={handleCompleteReminder}>
              {isSavingReminder ? "Saving..." : "Complete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
