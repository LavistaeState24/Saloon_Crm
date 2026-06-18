import { Eye, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import AdvancedDataTable from "../../../components/common/AdvancedDataTable";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import FormInput from "../../../components/common/FormInput";
import Modal from "../../../components/common/Modal";
import SelectDropdown from "../../../components/common/SelectDropdown";
import { useAuth } from "../../../hooks/useAuth";
import { useCan } from "../../../hooks/useCan";
import { clientService } from "../../../services/clientService";
import { userService } from "../../../services/userService";
import {
  salonCustomerStatusOptions,
  salonFormLabels,
  salonPriorityLevelOptions,
  normalizeSalonCustomerStatus,
} from "../../../config/industryLabels";
import { formatBudgetRange, getInterestLevelTone } from "../clientPipeline";
import LeadImportModal from "../components/LeadImportModal";

const initialFilters = {
  search: "",
  leadStatus: "",
  interestLevel: "",
  assignedStaff: "",
};

export default function ClientsPage() {
  const { user } = useAuth();
  const isSalesUser = user?.role === "sales";
  const canCreateClients = useCan("clients", "create");
  const canUpdateClients = useCan("clients", "update");
  const canDeleteClients = useCan("clients", "delete");
  const [clients, setClients] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [clientToDelete, setClientToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filters, setFilters] = useState(initialFilters);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const loadClients = async () => {
    setIsLoading(true);
    setListError("");

    try {
      const [clientData, assignableUsers] = await Promise.all([clientService.listAll(), userService.listAssignable()]);
      setClients(clientData.items);
      setStaffOptions(
        assignableUsers.map((user) => ({
          value: user.id,
          label: `${user.name} (${user.role})`,
        })),
      );
    } catch (requestError) {
      setListError(requestError.response?.data?.message || "Unable to load customers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleDeleteClient = async () => {
    if (!clientToDelete) {
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      await clientService.remove(clientToDelete._id);
      setClients((currentClients) => currentClients.filter((client) => client._id !== clientToDelete._id));
      setClientToDelete(null);
    } catch (requestError) {
      setDeleteError(requestError.response?.data?.message || "Unable to delete customer");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredClients = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesSearch =
        !normalizedSearch ||
        [client.ownerName, client.clientPhoneNumber, client.premiseName, client.premiseArea, client.areaPreference]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));

      const matchesStatus =
        !filters.leadStatus || normalizeSalonCustomerStatus(client.leadStatus) === filters.leadStatus;
      const matchesInterest = !filters.interestLevel || client.interestLevel === filters.interestLevel;
      const matchesStaff = !filters.assignedStaff || client.assignedStaff?._id === filters.assignedStaff;

      return matchesSearch && matchesStatus && matchesInterest && matchesStaff;
    });
  }, [clients, filters]);


  const formatCustomerAge = (createdAt) => {
    if (!createdAt) return "-";

    const diffMs = Date.now() - new Date(createdAt).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days old`;
  };

  // Shows color based on how long ago the customer was added
  const getCustomerAgeToneClass = (createdAt) => {
    if (!createdAt) {
      return "border-white/10 bg-white/5 text-muted";
    }

    const diffMs = Date.now() - new Date(createdAt).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 3) {
      return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
    }

    if (diffDays <= 7) {
      return "border-yellow-400/30 bg-yellow-500/10 text-yellow-300";
    }

    if (diffDays <= 15) {
      return "border-orange-400/30 bg-orange-500/10 text-orange-300";
    }

    return "border-rose-400/30 bg-rose-500/10 text-rose-300";
  };

  const formatCustomerDate = (createdAt) => {
    if (!createdAt) return "-";

    const date = new Date(createdAt);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);

    const hours = String(date.getHours()).padStart(2, "0");
    const mins = String(date.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${mins}`;
  };

  const actionButtonClassName =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted transition hover:border-gold/50 hover:bg-gold/10 hover:text-gold-2";
  const deleteActionButtonClassName =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted transition hover:border-rose-400/50 hover:bg-rose-500/10 hover:text-rose-300";

  const columns = [
    { key: "ownerName", label: salonFormLabels.customerName },
    {
      key: "assignedStaff",
      label: "Assigned",
      searchValue: (row) => row.assignedStaff?.name || "",
      render: (row) => row.assignedStaff?.name || "Unassigned",
    },
    {
      key: "leadStatus",
      label: salonFormLabels.customerStatus,
      render: (row) => <Badge tone="slate">{normalizeSalonCustomerStatus(row.leadStatus) || "New Customer"}</Badge>,
    },
    {
      key: "interestLevel",
      label: salonFormLabels.priorityLevel,
      render: (row) => <Badge tone={getInterestLevelTone(row.interestLevel)}>{row.interestLevel || "Warm"}</Badge>,
    },
    {
      key: "purpose",
      label: salonFormLabels.serviceInterested,
      render: (row) => row.requirementType || row.purpose || "Not added",
    },
    {
      key: "areaPreference",
      label: salonFormLabels.preferredBranch,
      render: (row) => row.areaPreference || row.premiseArea || "Not added",
    },
    {
      key: "createdAt",
      label: "Added",
      render: (row) => formatCustomerDate(row.createdAt),
    },
    {
      key: "leadAge",
      label: "Added Since",
      render: (row) => (
        <span
          className={`inline-flex rounded-full border px-2 py-2 text-xs font-medium ${getCustomerAgeToneClass(
            row.createdAt
          )}`}
        >
          {formatCustomerAge(row.createdAt)}
        </span>
      ),
    },
    {
      key: "budget",
      label: "Expected Spend Range",
      searchValue: (row) => `${row.budgetMin || ""} ${row.budgetMax || ""}`,
      render: (row) => formatBudgetRange(row.budgetMin, row.budgetMax),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Link to={`/clients/${row._id}`}>
            <button type="button" className={actionButtonClassName} title="View customer" aria-label="View customer">
              <Eye className="h-3.5 w-3.5" />
            </button>
          </Link>
          {canUpdateClients && !isSalesUser ? (
            <Link to={`/clients/${row._id}/edit`}>
              <button type="button" className={actionButtonClassName} title="Edit customer" aria-label="Edit customer">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </Link>
          ) : null}
          {canDeleteClients ? (
            <button
              type="button"
              className={deleteActionButtonClassName}
              onClick={() => {
                setDeleteError("");
                setClientToDelete(row);
              }}
              title="Delete customer"
              aria-label="Delete customer"
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Customer Pipeline</p>
          <h2 className="mt-2 font-display text-3xl">Customer tracking, service interest, and conversion flow</h2>
        </div>
        {canCreateClients ? (
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" icon={Upload} onClick={() => setIsImportOpen(true)}>
              Import Customers
            </Button>
            <Link to="/clients/new">
              <Button icon={Plus}>Add Customer</Button>
            </Link>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-glass md:grid-cols-2 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_auto]">
        <FormInput
          label="Search"
          placeholder="Name, phone, branch..."
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
        />
        <SelectDropdown
          label="Customer Status"
          options={salonCustomerStatusOptions}
          value={filters.leadStatus}
          onChange={(event) => setFilters((current) => ({ ...current, leadStatus: event.target.value }))}
        />
        <SelectDropdown
          label="Priority Level"
          options={salonPriorityLevelOptions}
          value={filters.interestLevel}
          onChange={(event) => setFilters((current) => ({ ...current, interestLevel: event.target.value }))}
        />
        <SelectDropdown
          label="Assigned Staff"
          options={staffOptions}
          value={filters.assignedStaff}
          onChange={(event) => setFilters((current) => ({ ...current, assignedStaff: event.target.value }))}
        />
        <div className="flex items-end">
          <Button type="button" variant="secondary" className="w-full" onClick={() => setFilters(initialFilters)}>
            Reset Filters
          </Button>
        </div>
      </div>

      {listError ? <p className="text-sm text-rose-300">{listError}</p> : null}
      <AdvancedDataTable
        columns={columns}
        rows={filteredClients}
        totalRecords={filteredClients.length}
        loading={isLoading}
        emptyMessage="No customers found."
        searchPlaceholder="Search visible customers..."
        defaultRowsPerPage={10}
      />

      <Modal
        title="Delete Customer"
        isOpen={canDeleteClients && Boolean(clientToDelete)}
        onClose={() => {
          if (!isDeleting) {
            setClientToDelete(null);
            setDeleteError("");
          }
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">Are you sure you want to delete this customer record?</p>
          {deleteError ? <p className="text-sm text-rose-300">{deleteError}</p> : null}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setClientToDelete(null);
                setDeleteError("");
              }}
              disabled={isDeleting}
            >
              No, Cancel
            </Button>
            <Button type="button" onClick={handleDeleteClient} disabled={isDeleting} className="bg-rose-500 text-white hover:opacity-90">
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </Button>
          </div>
        </div>
      </Modal>

      <LeadImportModal isOpen={canCreateClients && isImportOpen} onClose={() => setIsImportOpen(false)} onImported={loadClients} />
    </div>
  );
}
