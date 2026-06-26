import { Copy, ExternalLink, Link2, RefreshCw, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import AdvancedDataTable from "../../../components/common/AdvancedDataTable";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import FormInput from "../../../components/common/FormInput";
import Modal from "../../../components/common/Modal";
import SelectDropdown from "../../../components/common/SelectDropdown";
import { clientService } from "../../../services/clientService";
import { resolveAssetUrl } from "../../../services/uploadService";
import { buildClientSafeShareMessage, formatWhatsAppPhone } from "../../../utils/whatsappMessage";

const reminderTypes = ["Call", "WhatsApp", "Details Send", "Site Visit", "Payment", "Document"];
const reminderTypeOptions = reminderTypes.map((type) => ({
  value: type,
  label: type === "Site Visit" ? "Appointment" : type,
}));
const sortOptions = [
  { value: "matchScore", label: "Best match" },
  { value: "priceLowToHigh", label: "Price low to high" },
  { value: "priceHighToLow", label: "Price high to low" },
  { value: "possessionSoonest", label: "Possession soonest" },
  { value: "newest", label: "Newest first" },
];
const availabilityOptions = [
  { value: "true", label: "Available units only" },
  { value: "false", label: "Include sold inventory" },
];

const openAsset = (url) => {
  if (!url) {
    return;
  }

  window.open(resolveAssetUrl(url), "_blank", "noopener,noreferrer");
};

export default function ClientMatchingSection({ client, onClientUpdate }) {
  const [matches, setMatches] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filters, setFilters] = useState({
    sortBy: "matchScore",
    availability: "true",
  });
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [matchMeta, setMatchMeta] = useState({ total: 0 });
  const [matchError, setMatchError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareChannel, setShareChannel] = useState("WhatsApp");
  const [reminderType, setReminderType] = useState("Details Send");
  const [reminderDateTime, setReminderDateTime] = useState("");
  const [reminderNote, setReminderNote] = useState("");
  const [shareError, setShareError] = useState("");
  const [isSubmittingShare, setIsSubmittingShare] = useState(false);

  const selectedProjects = useMemo(
    () => matches.filter((project) => selectedIds.includes(project._id)),
    [matches, selectedIds],
  );

  const previewMessage = useMemo(() => {
    if (!selectedProjects.length) {
      return "";
    }

    return buildClientSafeShareMessage(
      selectedProjects.map((project) => project.sharePreview),
      selectedProjects[0]?.sharePreview?.contact,
    );
  }, [selectedProjects]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    setHistoryError("");

    try {
      const data = await clientService.getShareHistory(client._id);
      setHistory(data);
    } catch (requestError) {
      setHistoryError(requestError.response?.data?.message || "Unable to load share history");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadMatches = async () => {
    setIsLoadingMatches(true);
    setMatchError("");

    try {
      const data = await clientService.getMatchingProjects(client._id, filters);
      setMatches(data.items || []);
      setMatchMeta(data.meta || { total: 0 });
      setSelectedIds((current) => current.filter((id) => data.items.some((project) => project._id === id)));
    } catch (requestError) {
      setMatchError(requestError.response?.data?.message || "Unable to load matching services");
    } finally {
      setIsLoadingMatches(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [client._id]);

  const toggleSelectedProject = (projectId) => {
    setSelectedIds((current) =>
      current.includes(projectId) ? current.filter((id) => id !== projectId) : [...current, projectId],
    );
  };

  const handleCopyExistingMessage = async (message) => {
    await navigator.clipboard.writeText(message);
  };

  const resetShareModal = () => {
    setShareChannel("WhatsApp");
    setReminderType("Details Send");
    setReminderDateTime("");
    setReminderNote("");
    setShareError("");
  };

  const handleOpenShare = (channel) => {
    setShareChannel(channel);
    setShareError("");
    setIsShareOpen(true);
  };

  const handleShare = async () => {
    if (!selectedIds.length) {
      setShareError("Select at least one service to share");
      return;
    }

    if (!reminderDateTime || !reminderNote.trim()) {
      setShareError("Next follow-up reminder and note are required");
      return;
    }

    const popupWindow = shareChannel === "WhatsApp" ? window.open("", "_blank") : null;
    setIsSubmittingShare(true);
    setShareError("");

    try {
      const result = await clientService.shareProjects(client._id, {
        projectIds: selectedIds,
        shareChannel,
        clientRequirement: client.requirementType || "",
        reminderType,
        reminderDateTime,
        reminderNote,
      });

      if (shareChannel === "Copy") {
        await navigator.clipboard.writeText(result.message);
      } else {
        const whatsappUrl = `https://wa.me/${formatWhatsAppPhone(client.clientPhoneNumber)}?text=${encodeURIComponent(result.message)}`;

        if (popupWindow) {
          popupWindow.location.href = whatsappUrl;
        } else {
          window.location.assign(whatsappUrl);
        }
      }

      onClientUpdate(result.client);
      setHistory((current) => [result.shareRecord, ...current]);
      setIsShareOpen(false);
      resetShareModal();
    } catch (requestError) {
      if (popupWindow) {
        popupWindow.close();
      }

      setShareError(requestError.response?.data?.message || "Unable to share selected services");
    } finally {
      setIsSubmittingShare(false);
    }
  };

  const matchColumns = [
    {
      key: "select",
      label: "Select",
      searchable: false,
      render: (row) => (
        <input
          type="checkbox"
          className="h-4 w-4 accent-gold"
          checked={selectedIds.includes(row._id)}
          onChange={() => toggleSelectedProject(row._id)}
          aria-label={`Select ${row.projectName}`}
        />
      ),
    },
    { key: "projectName", label: "Service" },
    {
      key: "matchScore",
      label: "Match",
      render: (row) => (
        <div className="space-y-1">
          <Badge tone="gold">{row.matchScore}</Badge>
          <p className="text-xs text-muted">{row.matchedOn?.join(", ") || "general match"}</p>
        </div>
      ),
    },
    { key: "location", label: "Location" },
    { key: "configuration", label: "Configuration" },
    {
      key: "priceRange",
      label: "Price Range",
      render: (row) =>
        row.sharePreview?.priceRange || (row.priceRange?.min ? row.priceRange.min.toLocaleString("en-IN") : "Not added"),
    },
    {
      key: "availableUnits",
      label: "Units",
      render: (row) => `${row.availableUnits ?? 0} available`,
    },
    {
      key: "assets",
      label: "Assets",
      searchable: false,
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          {row.sharePreview?.brochureUrl ? (
            <button type="button" className="text-xs text-gold-2" onClick={() => openAsset(row.sharePreview.brochureUrl)}>
              Brochure
            </button>
          ) : null}
          {row.sharePreview?.sampleVideoUrl ? (
            <button type="button" className="text-xs text-gold-2" onClick={() => openAsset(row.sharePreview.sampleVideoUrl)}>
              Video
            </button>
          ) : null}
          {row.sharePreview?.photos?.length ? (
            <button type="button" className="text-xs text-gold-2" onClick={() => openAsset(row.sharePreview.photos[0])}>
              Photos
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  const historyColumns = [
    {
      key: "sharedAt",
      label: "Shared At",
      render: (row) => new Date(row.sharedAt || row.createdAt).toLocaleString("en-IN"),
    },
    {
      key: "shareChannel",
      label: "Channel",
      render: (row) => <Badge tone={row.shareChannel === "Copy" ? "slate" : "green"}>{row.shareChannel}</Badge>,
    },
    {
      key: "projects",
      label: "Services",
      render: (row) => (row.projectPublicAliases?.length ? row.projectPublicAliases.join(", ") : row.projectPublicAlias),
    },
    {
      key: "sharedByName",
      label: "Shared By",
      render: (row) => row.sharedByName || row.sharedBy?.name || "-",
    },
    {
      key: "followUpDate",
      label: "Next Follow-up",
      render: (row) => (row.followUpDate ? new Date(row.followUpDate).toLocaleString("en-IN") : "-"),
    },
    {
      key: "message",
      label: "Message",
      searchable: false,
      render: (row) => (
        <div className="flex items-center gap-2">
          <button type="button" className="text-xs text-gold-2" onClick={() => handleCopyExistingMessage(row.sharedMessage || row.whatsappMessage)}>
            Copy
          </button>
          {row.shareChannel === "WhatsApp" ? (
            <button
              type="button"
              className="text-xs text-gold-2"
              onClick={() =>
                window.open(
                  `https://wa.me/${formatWhatsAppPhone(client.clientPhoneNumber)}?text=${encodeURIComponent(row.sharedMessage || row.whatsappMessage)}`,
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              Re-share
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glass sm:rounded-[32px] sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link2 className="h-5 w-5 text-gold-2" />
            <h3 className="font-display text-xl sm:text-2xl">Find Matching Services</h3>
          </div>
          <p className="mt-2 text-sm text-muted">
            Match by budget, package, branch preference, service category, schedule, and availability.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <SelectDropdown
            label="Sort By"
            options={sortOptions}
            value={filters.sortBy}
            onChange={(event) => setFilters((current) => ({ ...current, sortBy: event.target.value }))}
          />
          <SelectDropdown
            label="Inventory"
            options={availabilityOptions}
            value={filters.availability}
            onChange={(event) => setFilters((current) => ({ ...current, availability: event.target.value }))}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Button type="button" icon={RefreshCw} variant="secondary" className="w-full sm:w-auto" onClick={loadMatches} disabled={isLoadingMatches}>
          {isLoadingMatches ? "Finding..." : "Find Matching Services"}
        </Button>
        <Badge tone="slate">{matchMeta.total || 0} matches</Badge>
        <Badge tone="green">{selectedIds.length} selected</Badge>
        <Button type="button" icon={Copy} variant="secondary" className="w-full sm:w-auto" onClick={() => handleOpenShare("Copy")} disabled={!selectedIds.length}>
          Copy Client-safe Message
        </Button>
        <Button type="button" icon={Send} className="w-full sm:w-auto" onClick={() => handleOpenShare("WhatsApp")} disabled={!selectedIds.length}>
          Share on WhatsApp
        </Button>
      </div>

      {matchError ? <p className="mt-4 text-sm text-rose-300">{matchError}</p> : null}

      <div className="mt-5">
        <AdvancedDataTable
          columns={matchColumns}
          rows={matches}
          totalRecords={matchMeta.total}
          loading={isLoadingMatches}
          emptyMessage="No matching services found for this customer."
          searchPlaceholder="Search matching services..."
          defaultRowsPerPage={5}
        />
      </div>

      <div className="mt-8 border-t border-white/10 pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="font-display text-lg sm:text-xl">Share History</h4>
            <p className="mt-1 text-sm text-muted">Client-safe messages sent for this customer.</p>
          </div>
          <Button type="button" variant="secondary" icon={RefreshCw} className="w-full sm:w-auto" onClick={loadHistory} disabled={isLoadingHistory}>
            {isLoadingHistory ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {historyError ? <p className="mt-4 text-sm text-rose-300">{historyError}</p> : null}

        <div className="mt-5">
          <AdvancedDataTable
            columns={historyColumns}
            rows={history}
            loading={isLoadingHistory}
            emptyMessage="No share history saved for this customer."
            searchPlaceholder="Search share history..."
            defaultRowsPerPage={5}
          />
        </div>
      </div>

      <Modal
        title={shareChannel === "Copy" ? "Copy Client-safe Message" : "Share Matching Services"}
        isOpen={isShareOpen}
        onClose={() => {
          if (!isSubmittingShare) {
            setIsShareOpen(false);
            resetShareModal();
          }
        }}
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-muted sm:p-4">
            <p className="text-ivory">{selectedProjects.length} service(s) selected</p>
            <p className="mt-2 break-words">{selectedProjects.map((project) => project.projectName).join(", ")}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <SelectDropdown
              label="Reminder Type"
              options={reminderTypeOptions}
              value={reminderType}
              onChange={(event) => setReminderType(event.target.value)}
            />
            <FormInput
              label="Next Follow-up"
              type="datetime-local"
              value={reminderDateTime}
              onChange={(event) => setReminderDateTime(event.target.value)}
            />
          </div>

          <FormInput
            label="Reminder Note"
            as="textarea"
            rows={3}
            value={reminderNote}
            onChange={(event) => setReminderNote(event.target.value)}
            placeholder="Required before confirming share"
          />

          <div className="rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ivory">Client-safe preview</p>
              <button type="button" className="inline-flex items-center gap-1 text-xs text-gold-2" onClick={() => handleCopyExistingMessage(previewMessage)}>
                <Copy className="h-3.5 w-3.5" />
                Copy Preview
              </button>
            </div>
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words text-sm text-muted">{previewMessage || "Select projects to preview."}</pre>
          </div>

          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-3 text-xs text-amber-100 sm:p-4">
            Private service-provider details, internal notes, and backend IDs are excluded.
          </div>

          {shareError ? <p className="text-sm text-rose-300">{shareError}</p> : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => setIsShareOpen(false)} disabled={isSubmittingShare}>
              Cancel
            </Button>
            <Button type="button" className="w-full sm:w-auto" icon={shareChannel === "Copy" ? Copy : ExternalLink} onClick={handleShare} disabled={isSubmittingShare}>
              {isSubmittingShare ? "Sharing..." : shareChannel === "Copy" ? "Copy and Save" : "Open WhatsApp"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
