import { Download, FileSpreadsheet, RefreshCw, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import MultiSelectDropdown from "../../../components/common/MultiSelectDropdown";
import SelectDropdown from "../../../components/common/SelectDropdown";
import { useAuth } from "../../../hooks/useAuth";
import { clientService } from "../../../services/clientService";
import { userService } from "../../../services/userService";
import { toast } from "../../../utils/toast";
import {
  inferImportColumnMap,
  leadImportFields,
  leadImportSourceOptions,
  mapImportRows,
  parseLeadImportFile,
  previewMappedRows,
} from "../leadImportParser";

const assignmentModeOptions = [
  { value: "file", label: "Keep assigned staff from file" },
  { value: "single", label: "Assign all to one user" },
  { value: "roundRobin", label: "Round robin assignment" },
];

const duplicateHandlingOptions = [
  { value: "skip", label: "Skip duplicates" },
  { value: "mark", label: "Mark duplicates" },
];

const buildEmptyColumnMap = () =>
  leadImportFields.reduce((mapping, field) => {
    mapping[field.key] = "";
    return mapping;
  }, {});

const normalizeSelectionList = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const buildFailedRowsWorkbook = async (rows, fileName) => {
  const XLSX = await import("xlsx");
  const sheet = XLSX.utils.json_to_sheet(
    rows.map((row) => ({
      rowNumber: row.rowNumber,
      clientName: row.clientName || "",
      phone: row.phone || "",
      email: row.email || "",
      propertyType: row.propertyType || "",
      requirementType: row.requirementType || "",
      budgetMin: row.budgetMin || "",
      budgetMax: row.budgetMax || "",
      areaPreference: row.areaPreference || "",
      source: row.source || "",
      assignedStaff: row.assignedStaff || "",
      leadStatus: row.leadStatus || "",
      interestLevel: row.interestLevel || "",
      notes: row.notes || "",
      reason: row.reason || row.errors?.join(", ") || "",
      status: row.status || "",
    }))
  );
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Failed Rows");
  XLSX.writeFile(workbook, `${String(fileName || "lead-import").replace(/\.[^.]+$/, "")}-failed-rows.xlsx`);
};

export default function LeadImportModal({ isOpen, onClose, onImported }) {
  const { user } = useAuth();
  const currentUserId = String(user?.id || user?._id || "");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [columnMap, setColumnMap] = useState(buildEmptyColumnMap());
  const [importSource, setImportSource] = useState("Import");
  const [assignmentMode, setAssignmentMode] = useState("file");
  const [assignedUserId, setAssignedUserId] = useState("");
  const [roundRobinUserIds, setRoundRobinUserIds] = useState([]);
  const [duplicateHandling, setDuplicateHandling] = useState("skip");
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const userOptions = useMemo(
    () =>
      users.map((candidate) => ({
        value: candidate.id,
        label: `${candidate.name} (${candidate.role})`,
      })),
    [users]
  );

  const previewRows = useMemo(() => previewMappedRows(rawRows, columnMap, importSource), [rawRows, columnMap, importSource]);
  const mappedRows = useMemo(() => mapImportRows(rawRows, columnMap, importSource), [rawRows, columnMap, importSource]);
  const localDuplicatePhones = useMemo(() => {
    const seen = new Set();
    const duplicates = new Set();

    mappedRows.forEach((row) => {
      const phone = String(row.phone || "").trim();
      if (!phone) {
        return;
      }

      if (seen.has(phone)) {
        duplicates.add(phone);
        return;
      }

      seen.add(phone);
    });

    return duplicates;
  }, [mappedRows]);
  const missingRequiredFields = useMemo(
    () => leadImportFields.filter((field) => field.required && !columnMap[field.key]),
    [columnMap]
  );
  const canImport = rawRows.length > 0 && missingRequiredFields.length === 0 && !isParsing && !isImporting;

  const resetState = () => {
    setFileName("");
    setHeaders([]);
    setRawRows([]);
    setColumnMap(buildEmptyColumnMap());
    setImportSource("Import");
    setAssignmentMode("file");
    setAssignedUserId("");
    setRoundRobinUserIds([]);
    setDuplicateHandling("skip");
    setSummary(null);
    setError("");
    setIsParsing(false);
    setIsImporting(false);
  };

  const loadAssignableUsers = async () => {
    setIsLoadingUsers(true);

    try {
      const assignableUsers = await userService.listAssignable();
      setUsers(assignableUsers);

      if (!assignedUserId && assignableUsers.length) {
        setAssignedUserId(currentUserId || String(assignableUsers[0].id));
      }
    } catch (requestError) {
    setError(requestError.response?.data?.message || "Unable to load assignable staff");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadHistory = async () => {
    setIsLoadingHistory(true);

    try {
      const result = await clientService.getImportHistory({ limit: 10 });
      setHistory(result.items || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load import history");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      resetState();
      return;
    }

    loadAssignableUsers();
    loadHistory();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !users.length) {
      return;
    }

    if (!assignedUserId) {
      setAssignedUserId(currentUserId || String(users[0].id));
    }
  }, [assignedUserId, currentUserId, isOpen, users]);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    setSummary(null);
    setError("");

    if (!file) {
      return;
    }

    setIsParsing(true);

    try {
      const parsed = await parseLeadImportFile(file);
      setFileName(parsed.fileName);
      setHeaders(parsed.headers);
      setRawRows(parsed.rows);
      setColumnMap(inferImportColumnMap(parsed.headers));
    } catch {
      toast.error("Unable to read this file. Use a valid CSV, XLS, or XLSX file.");
      setError("Unable to read this file. Use a valid CSV, XLS, or XLSX file.");
      setHeaders([]);
      setRawRows([]);
      setColumnMap(buildEmptyColumnMap());
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    setError("");
    setSummary(null);
    setIsImporting(true);

    try {
      const summaryData = await clientService.importLeads({
        rows: mappedRows,
        source: importSource,
        assignmentMode,
        assignedUserId,
        roundRobinUserIds,
        duplicateHandling,
        fileName,
      });

      setSummary(summaryData);
      await loadHistory();
      await onImported?.();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to import customers");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadFailedRows = async () => {
    if (!summary?.failedRows?.length) {
      return;
    }

    await buildFailedRowsWorkbook(summary.failedRows, fileName || "customer-import");
  };

  const closeModal = () => {
    if (isParsing || isImporting) {
      return;
    }

    onClose?.();
    resetState();
  };

  return (
    <Modal title="Import Customers" isOpen={isOpen} onClose={closeModal}>
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-5 w-5 text-gold-2" />
              <div>
                <p className="text-sm font-semibold text-ivory">{fileName || "CSV, XLS, or XLSX file"}</p>
                <p className="mt-1 text-xs text-muted">
                  Supports Facebook, Instagram, Housing.com, 99acres, MagicBricks, Rental, Broker, Reseller, and Manual Excel sheets.
                </p>
              </div>
            </div>
            <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-ivory transition hover:border-gold/50 hover:bg-white/10">
              Choose File
              <input
                type="file"
                accept=".csv,.xls,.xlsx"
                className="sr-only"
                onChange={handleFileChange}
                disabled={isParsing || isImporting}
              />
            </label>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <SelectDropdown
            label="Import Source"
            options={leadImportSourceOptions}
            value={importSource}
            onChange={(event) => setImportSource(event.target.value)}
          />
          <SelectDropdown
            label="Duplicate Handling"
            options={duplicateHandlingOptions}
            value={duplicateHandling}
            onChange={(event) => setDuplicateHandling(event.target.value)}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <SelectDropdown
            label="Assignment Mode"
            options={assignmentModeOptions}
            value={assignmentMode}
            onChange={(event) => setAssignmentMode(event.target.value)}
          />
          {assignmentMode === "single" ? (
            <SelectDropdown
              label="Assign To"
              options={userOptions}
              value={assignedUserId}
              onChange={(event) => setAssignedUserId(event.target.value)}
              placeholder={isLoadingUsers ? "Loading staff..." : "Select staff"}
            />
          ) : null}
        </div>

        {assignmentMode === "roundRobin" ? (
          <MultiSelectDropdown
            label="Round Robin Staff"
            options={userOptions}
            value={roundRobinUserIds}
            onChange={(nextValues) => setRoundRobinUserIds(normalizeSelectionList(nextValues))}
            placeholder={isLoadingUsers ? "Loading staff..." : "Select staff"}
          />
        ) : null}

        {isParsing ? <p className="text-sm text-muted">Reading import file...</p> : null}
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        {headers.length ? (
          <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="slate">{rawRows.length} rows loaded</Badge>
              <Badge tone="gold">{previewRows.length} row preview</Badge>
              {localDuplicatePhones.size ? <Badge tone="rose">{localDuplicatePhones.size} duplicate phone(s) in file</Badge> : null}
            </div>
            {missingRequiredFields.length ? (
              <p className="text-sm text-rose-300">
                Missing required mapping: {missingRequiredFields.map((field) => field.label).join(", ")}
              </p>
            ) : (
              <p className="text-sm text-muted">Map columns once and the mapping will apply to all rows.</p>
            )}
            <div className="max-h-80 overflow-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="sticky top-0 bg-ink-2 text-xs uppercase tracking-[0.16em] text-muted">
                  <tr>
                    <th className="px-3 py-2">CRM Field</th>
                    <th className="px-3 py-2">File Column</th>
                    <th className="px-3 py-2">Sample Value</th>
                  </tr>
                </thead>
                <tbody>
                  {leadImportFields.map((field) => {
                    const sampleValue = previewRows.find((row) => row[field.key])?.[field.key] || "";

                    return (
                      <tr key={field.key} className="border-t border-white/10">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-ivory">{field.label}</span>
                            {field.required ? <Badge tone="rose">Required</Badge> : <Badge tone="slate">Optional</Badge>}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <select
                            value={columnMap[field.key] || ""}
                            onChange={(event) => setColumnMap((current) => ({ ...current, [field.key]: event.target.value }))}
                            className="w-full rounded-2xl border border-white/10 bg-ink-2 px-3 py-2 text-sm text-ivory outline-none transition focus:border-gold/50"
                          >
                            <option value="">Not mapped</option>
                            {headers.map((header) => (
                              <option key={header} value={header}>
                                {header}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-3 text-muted">{sampleValue || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted">Preview shows the first 5 mapped rows.</p>
          </div>
        ) : null}

        {previewRows.length ? (
          <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-ivory">Row Preview</h3>
              <Badge tone="slate">First 5 rows</Badge>
            </div>
            <div className="max-h-72 overflow-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-[1120px] text-left text-sm">
                <thead className="sticky top-0 bg-ink-2 text-xs uppercase tracking-[0.16em] text-muted">
                  <tr>
                    <th className="px-3 py-2">Row</th>
                    <th className="px-3 py-2">Client</th>
                    <th className="px-3 py-2">Phone</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Service Type</th>
                    <th className="px-3 py-2">Requirement</th>
                    <th className="px-3 py-2">Budget Min</th>
                    <th className="px-3 py-2">Budget Max</th>
                    <th className="px-3 py-2">Area</th>
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2">Assigned</th>
                    <th className="px-3 py-2">Customer Status</th>
                    <th className="px-3 py-2">Interest</th>
                    <th className="px-3 py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row) => (
                    <tr key={`${row.rowNumber}-${row.phone}`} className="border-t border-white/10">
                      <td className="px-3 py-2 text-muted">{row.rowNumber}</td>
                      <td className="px-3 py-2 text-ivory">{row.clientName || "-"}</td>
                      <td className="px-3 py-2 text-ivory">{row.phone || "-"}</td>
                      <td className="px-3 py-2 text-muted">{row.email || "-"}</td>
                      <td className="px-3 py-2 text-muted">{row.propertyType || "-"}</td>
                      <td className="px-3 py-2 text-muted">{row.requirementType || "-"}</td>
                      <td className="px-3 py-2 text-muted">{row.budgetMin || "-"}</td>
                      <td className="px-3 py-2 text-muted">{row.budgetMax || "-"}</td>
                      <td className="px-3 py-2 text-muted">{row.areaPreference || "-"}</td>
                      <td className="px-3 py-2 text-muted">{row.source || "-"}</td>
                      <td className="px-3 py-2 text-muted">{row.assignedStaff || "Auto"}</td>
                      <td className="px-3 py-2 text-muted">{row.leadStatus || "New Customer"}</td>
                      <td className="px-3 py-2 text-muted">{row.interestLevel || "Warm"}</td>
                      <td className="px-3 py-2 text-muted">{row.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {summary ? (
          <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="green">Imported {summary.imported}</Badge>
              <Badge tone="slate">Skipped {summary.skipped}</Badge>
              <Badge tone="gold">
                {summary.duplicateHandling === "mark" ? "Marked" : "Duplicate"} {summary.duplicates}
              </Badge>
              <Badge tone="rose">Failed {summary.invalid}</Badge>
              <Badge tone="slate">Total {summary.totalRows}</Badge>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="secondary" icon={Download} onClick={handleDownloadFailedRows} disabled={!summary.failedRows?.length}>
                Failed Rows Download
              </Button>
              <Button type="button" variant="secondary" icon={RefreshCw} onClick={loadHistory}>
                Refresh History
              </Button>
            </div>
            {summary.failedRows?.length ? (
              <div className="max-h-56 overflow-auto rounded-2xl border border-white/10">
                <table className="w-full min-w-[720px] text-left text-xs">
                  <thead className="bg-white/5 uppercase tracking-[0.16em] text-muted">
                    <tr>
                      <th className="px-3 py-2">Row</th>
                      <th className="px-3 py-2">Phone</th>
                      <th className="px-3 py-2">Client</th>
                      <th className="px-3 py-2">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.failedRows.map((row) => (
                      <tr key={`${row.rowNumber}-${row.phone}-${row.status}`} className="border-t border-white/10">
                        <td className="px-3 py-2 text-muted">{row.rowNumber}</td>
                        <td className="px-3 py-2 text-ivory">{row.phone || "-"}</td>
                        <td className="px-3 py-2 text-ivory">{row.clientName || "-"}</td>
                        <td className="px-3 py-2 text-muted">{row.reason || row.errors?.join(", ") || row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-ivory">Import History</h3>
            <Button type="button" variant="secondary" icon={RefreshCw} onClick={loadHistory} disabled={isLoadingHistory}>
              Refresh
            </Button>
          </div>
          {isLoadingHistory ? <p className="text-sm text-muted">Loading import history...</p> : null}
          {history.length ? (
            <div className="max-h-64 overflow-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-white/5 text-xs uppercase tracking-[0.16em] text-muted">
                  <tr>
                    <th className="px-3 py-2">Imported At</th>
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2">File</th>
                    <th className="px-3 py-2">Assignment</th>
                    <th className="px-3 py-2">Duplicate Policy</th>
                    <th className="px-3 py-2">Duplicates</th>
                    <th className="px-3 py-2">Imported</th>
                    <th className="px-3 py-2">Failed</th>
                    <th className="px-3 py-2">By</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry) => (
                    <tr key={entry.batchId} className="border-t border-white/10">
                      <td className="px-3 py-2 text-muted">{new Date(entry.importedAt).toLocaleString()}</td>
                      <td className="px-3 py-2 text-ivory">{entry.source || "Import"}</td>
                      <td className="px-3 py-2 text-muted">{entry.fileName || "-"}</td>
                      <td className="px-3 py-2 text-muted">{entry.assignmentMode || "-"}</td>
                      <td className="px-3 py-2 text-muted">{entry.duplicateHandling || "-"}</td>
                      <td className="px-3 py-2 text-muted">{entry.duplicates}</td>
                      <td className="px-3 py-2 text-muted">{entry.imported}</td>
                      <td className="px-3 py-2 text-muted">{entry.invalid}</td>
                      <td className="px-3 py-2 text-muted">{entry.importedBy?.name || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted">No import history available yet.</p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={closeModal} disabled={isParsing || isImporting}>
            Cancel
          </Button>
          <Button type="button" icon={Upload} disabled={!canImport} onClick={handleImport}>
            {isImporting ? "Importing..." : "Import Customers"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
