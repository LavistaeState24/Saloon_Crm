import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Copy,
  History,
  IndianRupee,
  Phone,
  ScrollText,
  UserCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";

import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import SelectDropdown from "../../../components/common/SelectDropdown";
import PageSkeleton from "../../../components/common/PageSkeleton";
import { clientService } from "../../../services/clientService";

const activityCategoryOptions = [
  { value: "all", label: "All activity" },
  { value: "lead", label: "Lead changes" },
  { value: "calls", label: "Calls" },
  { value: "followups", label: "Follow-ups" },
  { value: "shares", label: "Property shares" },
  { value: "visits", label: "Site visits" },
  { value: "deals", label: "Deals" },
];

const activityTypeLabels = {
  "lead.created": "Lead created",
  "lead.assigned": "Lead assigned",
  "lead.reassigned": "Lead reassigned",
  "lead.status_changed": "Lead status",
  "lead.notes_updated": "Notes",
  "lead.internal_notes_updated": "Internal notes",
  "call.logged": "Call",
  "followup.created": "Follow-up",
  "followup.updated": "Follow-up",
  "followup.completed": "Follow-up complete",
  "followup.cancelled": "Follow-up cancelled",
  "share.created": "Share",
  "site_visit.created": "Visit",
  "site_visit.updated": "Visit updated",
  "deal.created": "Deal",
  "deal.updated": "Deal updated",
  "deal.status_changed": "Deal status",
};

const activityTypeIcons = {
  "lead.created": UserRound,
  "lead.assigned": UserCheck,
  "lead.reassigned": UserCheck,
  "lead.status_changed": ClipboardList,
  "lead.notes_updated": ScrollText,
  "lead.internal_notes_updated": ScrollText,
  "call.logged": Phone,
  "followup.created": Bell,
  "followup.updated": Bell,
  "followup.completed": CheckCircle2,
  "followup.cancelled": Bell,
  "share.created": Copy,
  "site_visit.created": CalendarDays,
  "site_visit.updated": CalendarDays,
  "deal.created": IndianRupee,
  "deal.updated": IndianRupee,
  "deal.status_changed": IndianRupee,
};

const toneStyles = {
  gold: {
    marker: "bg-gold-2",
    panel: "border-gold/20 bg-gold/10 text-gold-2",
  },
  green: {
    marker: "bg-emerald-400",
    panel: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
  },
  rose: {
    marker: "bg-rose-400",
    panel: "border-rose-400/20 bg-rose-500/10 text-rose-200",
  },
  amber: {
    marker: "bg-amber-400",
    panel: "border-amber-400/20 bg-amber-500/10 text-amber-200",
  },
  blue: {
    marker: "bg-sky-400",
    panel: "border-sky-400/20 bg-sky-500/10 text-sky-200",
  },
  slate: {
    marker: "bg-slate-300",
    panel: "border-white/10 bg-white/5 text-muted",
  },
};

const formatDateTime = (value) => (value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-");

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "object") {
    if (value.name) {
      return value.role ? `${value.name} (${value.role})` : value.name;
    }

    if (value.ownerName) {
      return value.ownerName;
    }

    if (value.projectName || value.publicAlias) {
      return `${value.projectName || value.publicAlias}${value.publicAlias && value.projectName ? ` (${value.publicAlias})` : ""}`;
    }

    return JSON.stringify(value);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toLocaleString("en-IN");
  }

  if (String(value).includes("T")) {
    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return formatDateTime(date);
    }
  }

  if (/^[a-f\d]{24}$/i.test(String(value))) {
    return `${String(value).slice(0, 6)}…${String(value).slice(-4)}`;
  }

  return String(value);
};

const getTone = (activity) => {
  const statusValue =
    activity?.newValues?.leadStatus ||
    activity?.newValues?.dealStatus ||
    activity?.newValues?.status ||
    activity?.metadata?.status ||
    "";

  if (/cancel|lost|reject/i.test(statusValue)) {
    return "rose";
  }

  if (/closed|completed|paid/i.test(statusValue)) {
    return "green";
  }

  if (/booking|negotiation|pending|planned/i.test(statusValue)) {
    return "amber";
  }

  if (/assigned|reassigned|updated/i.test(activity.activityType)) {
    return "blue";
  }

  return "gold";
};

const renderDiff = (label, oldValue, newValue) => {
  if (oldValue === undefined && newValue === undefined) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{label}</p>
      <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Before</p>
          <p className="mt-1 break-words text-ivory">{formatValue(oldValue)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">After</p>
          <p className="mt-1 break-words text-ivory">{formatValue(newValue)}</p>
        </div>
      </div>
    </div>
  );
};

export default function ClientActivityTimeline({ leadId, refreshKey = 0 }) {
  const [category, setCategory] = useState("all");
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 8, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const loadTimeline = async (targetPage = 1, append = false) => {
    if (!leadId) {
      return;
    }

    setError("");
    setLoading(targetPage === 1 && !append);
    setLoadingMore(targetPage > 1 || append);

    try {
      const response = await clientService.getActivityTimeline(leadId, {
        category,
        page: targetPage,
        limit: 8,
      });

      setMeta(response.meta || { page: targetPage, limit: 8, total: 0, totalPages: 0 });
      setItems((current) => (append ? [...current, ...(response.items || [])] : response.items || []));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load activity timeline");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadFirstPage = async () => {
      if (!leadId) {
        return;
      }

      setItems([]);
      setMeta({ page: 1, limit: 8, total: 0, totalPages: 0 });

      setError("");
      setLoading(true);

      try {
        const response = await clientService.getActivityTimeline(leadId, {
          category,
          page: 1,
          limit: 8,
        });

        if (cancelled) {
          return;
        }

        setMeta(response.meta || { page: 1, limit: 8, total: 0, totalPages: 0 });
        setItems(response.items || []);
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.response?.data?.message || "Unable to load activity timeline");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadFirstPage();

    return () => {
      cancelled = true;
    };
  }, [category, leadId, refreshKey]);

  const canLoadMore = meta.totalPages > meta.page;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glass sm:rounded-[32px] sm:p-6">
      <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <History className="h-5 w-5 text-gold-2" />
          <div>
            <h3 className="font-display text-xl sm:text-2xl">Activity Timeline</h3>
            <p className="text-sm text-muted">Calls, follow-ups, shares, visits, deals, and lead changes.</p>
          </div>
        </div>
        <div className="w-full lg:w-64">
          <SelectDropdown
            label="Filter"
            options={activityCategoryOptions}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Select activity type"
          />
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

      <div className=" max-h-[40vh] overflow-y-auto pr-1 sm:mt-5 sm:pr-2">
        {loading && !items.length ? <PageSkeleton variant="table" className="rounded-[32px]" /> : null}

        {!loading && !items.length ? <p className="text-sm text-muted">No activity recorded for this lead yet.</p> : null}

        {items.map((activity) => {
          const Icon = activityTypeIcons[activity.activityType] || History;
          const tone = getTone(activity);
          const style = toneStyles[tone] || toneStyles.slate;
          const showDiffs = /assigned|reassigned|updated|status_changed|notes_updated|internal_notes_updated|completed|cancelled/i.test(
            activity.activityType,
          );
          const changeEntries = showDiffs
            ? [
              ["Assigned Staff", activity.oldValues?.assignedStaff, activity.newValues?.assignedStaff],
              ["Lead Status", activity.oldValues?.leadStatus, activity.newValues?.leadStatus],
              ["Notes", activity.oldValues?.notes, activity.newValues?.notes],
              ["Internal Notes", activity.oldValues?.internalNotes, activity.newValues?.internalNotes],
              ["Deal Status", activity.oldValues?.dealStatus, activity.newValues?.dealStatus],
              ["Visit Status", activity.oldValues?.visitStatus, activity.newValues?.visitStatus],
              ["Follow-up Status", activity.oldValues?.status, activity.newValues?.status],
            ].filter(([, oldValue, newValue]) => oldValue !== undefined || newValue !== undefined)
            : [];

          return (
            <div key={activity._id} className="relative min-h-[30vh] mt-5 overflow-y-auto pl-6 sm:pl-8">
              {/* Timeline dot */}
              <span
                className={`absolute left-0 top-7 h-3.5 w-3.5 rounded-full border-2 border-black shadow-lg ring-4 ring-white/10 ${style.marker}`}
              />

              {/* Timeline card */}
              <div className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-sm transition hover:border-gold/30 hover:bg-white/[0.05] sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    {/* Icon */}
                    <div className={`shrink-0 rounded-xl border p-2.5 shadow-inner ${style.panel}`}>
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                        <h4 className="break-words text-sm font-semibold text-ivory sm:text-base">
                          {activity.title}
                        </h4>

                        <Badge tone={tone}>
                          {activityTypeLabels[activity.activityType] || activity.activityType}
                        </Badge>
                      </div>

                      <p className="mt-2 text-sm leading-relaxed text-muted">
                        {activity.description || "Activity recorded."}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                        <span className="inline-flex items-center gap-1">
                          By <span className="text-ivory/80">{activity.performedBy?.name || "System"}</span>
                        </span>

                        <span>{formatDateTime(activity.createdAt)}</span>

                        {activity.relatedModule ? (
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 capitalize">
                            {activity.relatedModule}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                {changeEntries.length ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {changeEntries.map(([label, oldValue, newValue]) => (
                      <div
                        key={label}
                        className="rounded-xl border border-white/10 bg-black/20 p-3"
                      >
                        {renderDiff(label, oldValue, newValue)}
                      </div>
                    ))}
                  </div>
                ) : null}

                {activity.metadata?.description ? (
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-sm leading-relaxed text-muted">
                      {activity.metadata.description}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {canLoadMore ? (
        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            disabled={loadingMore}
            onClick={() => loadTimeline((meta.page || 1) + 1, true)}
          >
            {loadingMore ? "Loading more" : "Load more"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
