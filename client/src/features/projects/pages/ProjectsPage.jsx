import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import AdvancedDataTable from "../../../components/common/AdvancedDataTable";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import { useCan } from "../../../hooks/useCan";
import SearchFilter from "../../../components/common/SearchFilter";
import { projectSearchTypeOptions } from "../../../constants/theme";
import { projectService } from "../../../services/projectService";

const formatPropertyTypes = (value) => (Array.isArray(value) ? value.join(", ") : value || "");
const formatPrice = (value) => {
  if (!value?.min) {
    return "-";
  }

  if (!value.max || value.min === value.max) {
    return value.min.toLocaleString("en-IN");
  }

  return `${value.min.toLocaleString("en-IN")} - ${value.max.toLocaleString("en-IN")}`;
};

export default function ProjectsPage() {
  const canCreateProjects = useCan("projects", "create");
  const canUpdateProjects = useCan("projects", "update");
  const canDeleteProjects = useCan("projects", "delete");
  const [projects, setProjects] = useState([]);
  const [totalProjects, setTotalProjects] = useState(0);
  const [filters, setFilters] = useState({
    area: "",
    propertyType: "",
    bhk: "",
    minBudget: "",
    maxBudget: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadProjects = async (params = filters) => {
    setIsLoading(true);
    setListError("");

    try {
      const data = await projectService.listAll(params);
      setProjects(data.items);
      setTotalProjects(data.meta?.total ?? data.items.length);
    } catch (requestError) {
      setListError(requestError.response?.data?.message || "Unable to load services");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleDeleteProject = async () => {
    if (!projectToDelete) {
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      await projectService.remove(projectToDelete._id);
      setProjects((currentProjects) => currentProjects.filter((project) => project._id !== projectToDelete._id));
      setTotalProjects((currentTotalProjects) => Math.max(0, currentTotalProjects - 1));
      setProjectToDelete(null);
    } catch (requestError) {
      setDeleteError(requestError.response?.data?.message || "Unable to delete service");
    } finally {
      setIsDeleting(false);
    }
  };

  const getSavedProjectsTableState = () => {
    try {
      return JSON.parse(sessionStorage.getItem("projectsTableState")) || {};
    } catch {
      return {};
    }
  };

  const [searchParams] = useSearchParams();

  const savedTableState = getSavedProjectsTableState();

  const initialTablePage =
    Number(searchParams.get("page")) ||
    savedTableState.page ||
    1;

  const initialTableRows =
    Number(searchParams.get("rows")) ||
    savedTableState.rowsPerPage ||
    10;

  const handleProjectsTableStateChange = (state) => {
    sessionStorage.setItem("projectsTableState", JSON.stringify(state));
  };

  const actionButtonClassName =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted transition hover:border-gold/50 hover:bg-gold/10 hover:text-gold-2";
  const deleteActionButtonClassName =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted transition hover:border-rose-400/50 hover:bg-rose-500/10 hover:text-rose-300";

  const getProjectsReturnPath = () => {
    const state = JSON.parse(sessionStorage.getItem("projectsTableState") || "{}");
    const page = state.page || 1;
    const rows = state.rowsPerPage || 10;

    return `/projects?page=${page}&rows=${rows}`;
  };

  const columns = [
    {
      key: "projectName",
      label: "Service",
      render: (row) => (
        <div>
          <p className="font-medium text-ivory">{row.projectName}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">{row.publicAlias}</p>
        </div>
      ),
      searchValue: (row) => `${row.projectName} ${row.publicAlias}`,
    },
    { key: "location", label: "Location" },
    {
      key: "propertyType",
      label: "BHK",
      searchValue: (row) =>
        Array.isArray(row.propertyType)
          ? row.propertyType.join(" ")
          : row.propertyType || "",

      render: (row) =>
        Array.isArray(row.propertyType)
          ? row.propertyType.join(", ")
          : row.propertyType || "-",
    },
    {
      key: "configuration",
      label: "Category",
      searchValue: (row) => `${row.configuration || ""} ${formatPropertyTypes(row.requirementType)}`,
      render: (row) => row.configuration || formatPropertyTypes(row.requirementType),
    },
    {
      key: "priceRange",
      label: "Price",
      searchValue: (row) => `${row.priceRange?.min || ""} ${row.priceRange?.max || ""}`,
      render: (row) => formatPrice(row.priceRange),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <Badge tone={row.status === "active" ? "green" : "slate"}>{row.status}</Badge>,
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Link
            to={`/projects/${row._id}?returnTo=${encodeURIComponent(getProjectsReturnPath())}`}
          >
            <button type="button" className={actionButtonClassName} title="View service" aria-label="View service">
              <Eye className="h-3.5 w-3.5" />
            </button>
          </Link>
          {canUpdateProjects ? (
            <Link
              to={`/projects/${row._id}/edit?returnTo=${encodeURIComponent(getProjectsReturnPath())}`}
            >
              <button type="button" className={actionButtonClassName} title="Edit service" aria-label="Edit service">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </Link>
          ) : null}
          {canDeleteProjects ? (
            <button
              type="button"
              className={deleteActionButtonClassName}
              onClick={() => {
                setDeleteError("");
                setProjectToDelete(row);
              }}
              title="Delete service"
              aria-label="Delete service"
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
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Service Library</p>
          <h2 className="mt-2 font-display text-3xl">Search by service requirement, not guesswork</h2>
        </div>
        {canCreateProjects ? (
          <Link to="/projects/new">
            <Button icon={Plus}>Add Service</Button>
          </Link>
        ) : null}
      </div>

      <SearchFilter
        {...filters}
        propertyTypeOptions={projectSearchTypeOptions}
        onSubmit={(formValues) => {
          setFilters(formValues);
          loadProjects(formValues);
        }}
      />

      {listError ? <p className="text-sm text-rose-300">{listError}</p> : null}
      <AdvancedDataTable
        columns={columns}
        rows={projects}
        totalRecords={totalProjects}
        loading={isLoading}
        emptyMessage="No services found."
        searchPlaceholder="Search services..."
        defaultRowsPerPage={10}
        initialPage={initialTablePage}
        initialRowsPerPage={initialTableRows}
        onTableStateChange={handleProjectsTableStateChange}
      />

      <Modal
        title="Delete Service"
        isOpen={canDeleteProjects && Boolean(projectToDelete)}
        onClose={() => {
          if (!isDeleting) {
            setProjectToDelete(null);
            setDeleteError("");
          }
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">Are you sure you want to delete this service?</p>
          {deleteError ? <p className="text-sm text-rose-300">{deleteError}</p> : null}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setProjectToDelete(null);
                setDeleteError("");
              }}
              disabled={isDeleting}
            >
              No, Cancel
            </Button>
            <Button type="button" onClick={handleDeleteProject} disabled={isDeleting} className="bg-rose-500 text-white hover:opacity-90">
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
