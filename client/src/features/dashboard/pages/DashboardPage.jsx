import { useEffect, useState } from "react";
import { ArrowRight, Building2, CalendarClock, FolderKanban, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";

import AdvancedDataTable from "../../../components/common/AdvancedDataTable";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import PageSkeleton from "../../../components/common/PageSkeleton";
import StatCard from "../../../components/common/StatCard";
import ClientCard from "../../../components/cards/ClientCard";
import { useCan } from "../../../hooks/useCan";
import { dealService } from "../../../services/dealService";
import { projectService } from "../../../services/projectService";
import { clientService } from "../../../services/clientService";
import { followupService } from "../../../services/followupService";
import DealSummaryCards from "../../deals/components/DealSummaryCards";
import { useAuth } from "../../../hooks/useAuth";
import { industryLabels } from "../../../config/industryLabels";

const formatPropertyTypes = (value) => (Array.isArray(value) ? value.join(", ") : value || "-");
const formatPrice = (value) => {
  if (!value?.min) {
    return "-";
  }

  if (!value.max || value.min === value.max) {
    return value.min.toLocaleString("en-IN");
  }

  return `${value.min.toLocaleString("en-IN")} - ${value.max.toLocaleString("en-IN")}`;
};



export default function DashboardPage() {
  const { user } = useAuth();
  const canViewProjects = useCan("projects", "view");
  const canViewClients = useCan("clients", "view");
  const canViewFollowups = useCan("followups", "view");
  const canViewDealReports = useCan("dealReports", "view");
  const [summary, setSummary] = useState(null);
  const [projects, setProjects] = useState([]);
  const [totalProjects, setTotalProjects] = useState(0);
  const [clients, setClients] = useState([]);
  const [reminderCounts, setReminderCounts] = useState({ today: 0, overdue: 0 });
  const [dealSummary, setDealSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);

      try {
        const [summaryData, projectData, clientData, followupData, dealSummaryData] = await Promise.all([
          projectService.dashboardSummary(),
          canViewProjects ? projectService.listAll() : Promise.resolve({ items: [], meta: { total: 0 } }),
          canViewClients ? clientService.list({ limit: 3 }) : Promise.resolve({ items: [] }),
          canViewFollowups ? followupService.counts() : Promise.resolve({ today: 0, overdue: 0 }),
          canViewDealReports ? dealService.summary() : Promise.resolve(null),
        ]);

        setSummary(summaryData);
        setProjects(projectData.items);
        setTotalProjects(projectData.meta?.total ?? projectData.items.length);
        setClients(clientData.items);
        setReminderCounts(followupData);
        setDealSummary(dealSummaryData);

      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [canViewClients, canViewDealReports, canViewFollowups, canViewProjects]);

  const projectColumns = [
    {
      key: "projectName",
      label: "Project",
      searchValue: (row) => `${row.projectName} ${row.publicAlias}`,
      render: (row) => (
        <div>
          <p className="font-medium text-ivory">{row.projectName}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">{row.publicAlias}</p>
        </div>
      ),
    },
    { key: "location", label: "Location" },
    {
      key: "configuration",
      label: "Config",
      searchValue: (row) => `${row.configuration || ""} ${formatPropertyTypes(row.propertyType)}`,
      render: (row) => row.configuration || formatPropertyTypes(row.propertyType),
    },
    {
      key: "priceRange",
      label: "Budget",
      searchValue: (row) => `${row.priceRange?.min || ""} ${row.priceRange?.max || ""}`,
      render: (row) => formatPrice(row.priceRange),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <Badge tone={row.status === "active" ? "green" : "slate"}>{row.status}</Badge>,
    },
  ];

  if (isLoading) {
    return <PageSkeleton variant="dashboard" />;
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5">
        <StatCard label={`Total ${industryLabels.dashboard.services}`} value={summary?.totalProjects ?? "--"} accent="gold" meta={industryLabels.dashboard.services} icon={FolderKanban} />
        <StatCard label={`Active ${industryLabels.dashboard.services}`} value={summary?.activeProjects ?? "--"} accent="green" meta="Live" icon={TrendingUp} />
        <StatCard
          label={`Upcoming ${industryLabels.dashboard.appointments}`}
          value={summary?.upcomingProjects ?? "--"}
          accent="wine"
          meta="Pipeline"
          icon={CalendarClock}
        />
        <StatCard label={`Today ${industryLabels.dashboard.reminders}`} value={canViewFollowups ? reminderCounts.today : "--"} accent="gold" meta="Due today" icon={CalendarClock} />
        <StatCard label={`Overdue ${industryLabels.dashboard.reminders}`} value={canViewFollowups ? reminderCounts.overdue : "--"} accent="rose" meta="Overdue" icon={CalendarClock} />
        
      </section>

      {canViewDealReports ? (
        <section className="space-y-4 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold">{industryLabels.dashboard.billing}</p>
            <h3 className="mt-2 font-display text-2xl">Billing pipeline snapshot</h3>
          </div>
          <DealSummaryCards summary={dealSummary} />
        </section>
      ) : null}

      <section className="grid gap-6 grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1">

        {canViewClients ? (
          <div className="space-y-6">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gold-2" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-gold">{industryLabels.dashboard.customers}</p>
                    <h3 className="mt-2 font-display text-2xl">Priority customers</h3>
                  </div>
                </div>
                <Link to="/clients">
                  <Button variant="secondary" icon={Users} iconRight={ArrowRight}>
                    View all
                  </Button>
                </Link>
              </div>
              <div className="mt-5 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
                {clients.map((client) => (
                  <ClientCard key={client._id} client={client} />
                ))}
              </div>
            </div>
          </div>
        ) : null}
        {canViewProjects ? (
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gold">{industryLabels.dashboard.services}</p>
                <h3 className="mt-2 font-display text-2xl">Fresh service additions</h3>
              </div>
              <Link to="/projects">
                <Button variant="secondary" icon={Building2} iconRight={ArrowRight}>
                  View all
                </Button>
              </Link>
            </div>
            <AdvancedDataTable
              columns={projectColumns}
              rows={projects}
              totalRecords={totalProjects}
              loading={isLoading}
              emptyMessage={`No recent ${industryLabels.dashboard.services.toLowerCase()} found.`}
              searchPlaceholder={`Search fresh ${industryLabels.dashboard.services.toLowerCase()}...`}
              defaultRowsPerPage={5}
            />
          </div>
        ) : null}


      </section>
    </div>
  );
}
