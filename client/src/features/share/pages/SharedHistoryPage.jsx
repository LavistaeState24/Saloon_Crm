import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Copy, Eye, MessageSquareShare, PencilLine, Save, Send, Trash2 } from "lucide-react";

import AdvancedDataTable from "../../../components/common/AdvancedDataTable";
import Button from "../../../components/common/Button";
import FormInput from "../../../components/common/FormInput";
import Modal from "../../../components/common/Modal";
import SelectDropdown from "../../../components/common/SelectDropdown";
import { shareRecordStatuses } from "../../../constants/theme";
import { useCan } from "../../../hooks/useCan";
import { shareRecordService } from "../../../services/shareRecordService";
import { getErrorMessage, textRules } from "../../../utils/validation";

const formatWhatsAppPhone = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
};

const toLocalDateTimeInputValue = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (number) => String(number).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function SharedHistoryPage() {
  const canUpdateShareRecords = useCan("shareRecords", "update");
  const canDeleteShareRecords = useCan("shareRecords", "delete");
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [actionType, setActionType] = useState("");
  const [actionError, setActionError] = useState("");
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      status: "shared",
      notes: "",
      followUpDate: "",
    },
  });

  const loadRecords = async () => {
    setIsLoading(true);

    try {
      const data = await shareRecordService.list();
      setRecords(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const openActionModal = (record, type) => {
    setSelectedRecord(record);
    setActionType(type);
    setActionError("");
    reset({
      status: record.status || "shared",
      notes: record.notes || "",
      followUpDate: toLocalDateTimeInputValue(record.followUpDate),
    });
  };

  const closeActionModal = () => {
    setSelectedRecord(null);
    setActionType("");
    setActionError("");
  };

  const handleDeleteRecord = async () => {
    if (!recordToDelete) {
      return;
    }

    setIsDeleting(true);
    setActionError("");

    try {
      await shareRecordService.remove(recordToDelete._id);
      setRecords((currentRecords) => currentRecords.filter((record) => record._id !== recordToDelete._id));
      setRecordToDelete(null);
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || "Unable to delete shared record");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyMessage = async (message) => {
    await navigator.clipboard.writeText(message);
  };

  const handleReshare = (record) => {
    const whatsappUrl = `https://wa.me/${formatWhatsAppPhone(record.clientPhone)}?text=${encodeURIComponent(record.whatsappMessage)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const submitAction = async (formValues) => {
    if (!selectedRecord) {
      return;
    }

    setActionError("");

    try {
      if (actionType === "status") {
        await shareRecordService.updateStatus(selectedRecord._id, {
          status: formValues.status,
          followUpDate: formValues.followUpDate || undefined,
        });
      } else if (actionType === "notes") {
        await shareRecordService.updateNotes(selectedRecord._id, {
          notes: formValues.notes,
          followUpDate: formValues.followUpDate || undefined,
        });
      }

      await loadRecords();
      closeActionModal();
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || "Unable to update shared record");
    }
  };

  const actionButtonClassName =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted transition hover:border-gold/50 hover:bg-gold/10 hover:text-gold-2";
  const deleteActionButtonClassName =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted transition hover:border-rose-400/50 hover:bg-rose-500/10 hover:text-rose-300";

  const columns = [
    { key: "clientName", label: "Customer Name" },
    { key: "clientPhone", label: "Customer Phone" },
    { key: "projectPublicAlias", label: "Service Alias" },
    { key: "sharedByName", label: "Shared By" },
    {
      key: "createdAt",
      label: "Shared Date",
      searchValue: (row) => new Date(row.createdAt).toLocaleString("en-IN"),
      render: (row) => new Date(row.createdAt).toLocaleString("en-IN"),
    },
    { key: "status", label: "Status" },
    {
      key: "followUpDate",
      label: "Follow-up Date",
      searchValue: (row) => (row.followUpDate ? new Date(row.followUpDate).toLocaleDateString("en-IN") : ""),
      render: (row) => (row.followUpDate ? new Date(row.followUpDate).toLocaleDateString("en-IN") : "-"),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <button
            type="button"
            className={actionButtonClassName}
            onClick={() => openActionModal(row, "view")}
            title="View shared message"
            aria-label="View shared message"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className={actionButtonClassName}
            onClick={() => handleCopyMessage(row.whatsappMessage)}
            title="Copy WhatsApp message"
            aria-label="Copy WhatsApp message"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className={actionButtonClassName}
            onClick={() => handleReshare(row)}
            title="Re-share on WhatsApp"
            aria-label="Re-share on WhatsApp"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
          {canUpdateShareRecords ? (
            <button
              type="button"
              className={actionButtonClassName}
              onClick={() => openActionModal(row, "status")}
              title="Update status"
              aria-label="Update status"
            >
              <MessageSquareShare className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {canUpdateShareRecords ? (
            <button
              type="button"
              className={actionButtonClassName}
              onClick={() => openActionModal(row, "notes")}
              title="Add notes"
              aria-label="Add notes"
            >
              <PencilLine className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {canDeleteShareRecords ? (
            <button
              type="button"
              className={deleteActionButtonClassName}
              onClick={() => {
                setActionError("");
                setRecordToDelete(row);
              }}
              title="Delete shared record"
              aria-label="Delete shared record"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      ),
      searchable: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Shared History</p>
        <h2 className="mt-2 font-display text-3xl">Customer-safe service sharing history</h2>
      </div>

      <AdvancedDataTable
        columns={columns}
        rows={records}
        loading={isLoading}
        emptyMessage="No shared records found."
        searchPlaceholder="Search shared history..."
        defaultRowsPerPage={10}
      />

      <Modal
        title={
          actionType === "view"
            ? "Shared WhatsApp Message"
            : actionType === "status"
              ? "Update Share Status"
              : "Add Notes"
        }
        isOpen={Boolean(selectedRecord)}
        onClose={closeActionModal}
      >
        {selectedRecord && actionType === "view" ? (
          <div className="space-y-4 text-sm text-muted">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 whitespace-pre-wrap text-ivory">
              {selectedRecord.whatsappMessage}
            </div>
            <div className="flex justify-end">
              <Button variant="secondary" icon={Copy} onClick={() => handleCopyMessage(selectedRecord.whatsappMessage)}>
                Copy Message
              </Button>
            </div>
          </div>
        ) : null}

        {selectedRecord && actionType !== "view" && canUpdateShareRecords ? (
          <form className="space-y-4" onSubmit={handleSubmit(submitAction)}>
            {actionType === "status" ? (
              <SelectDropdown
                label="Status"
                options={shareRecordStatuses}
                error={getErrorMessage(errors.status)}
                {...register("status", { required: "Status is required" })}
              />
            ) : (
              <FormInput
                label="Notes"
                placeholder="Add notes about this shared record"
                error={getErrorMessage(errors.notes)}
                {...register("notes", textRules("Notes", { min: 3, max: 1000, required: false }))}
              />
            )}

            <FormInput
              label="Follow-up Date & Time"
              type="datetime-local"
              error={getErrorMessage(errors.followUpDate)}
              {...register("followUpDate", {
                required: "Follow-up date and time is required",
              })}
            />

            {actionError ? <p className="text-sm text-rose-300">{actionError}</p> : null}

            <div className="flex justify-end">
              <Button disabled={isSubmitting} icon={Save}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        title="Delete Shared Record"
        isOpen={canDeleteShareRecords && Boolean(recordToDelete)}
        onClose={() => {
          if (!isDeleting) {
            setRecordToDelete(null);
            setActionError("");
          }
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">Are you sure you want to delete this shared history record?</p>
          {actionError ? <p className="text-sm text-rose-300">{actionError}</p> : null}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setRecordToDelete(null);
                setActionError("");
              }}
              disabled={isDeleting}
            >
              No, Cancel
            </Button>
            <Button type="button" onClick={handleDeleteRecord} disabled={isDeleting} className="bg-rose-500 text-white hover:opacity-90">
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
