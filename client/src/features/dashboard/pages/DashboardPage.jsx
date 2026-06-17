import { useEffect, useState } from "react";
import { ArrowRight, CalendarClock, IndianRupee, ReceiptText, Scissors, TicketCheck, Users} from "lucide-react";
import { Link } from "react-router-dom";

import AdvancedDataTable from "../../../components/common/AdvancedDataTable";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import PageSkeleton from "../../../components/common/PageSkeleton";
import StatCard from "../../../components/common/StatCard";
import ClientCard from "../../../components/cards/ClientCard";
import { useCan } from "../../../hooks/useCan";
import { projectService } from "../../../services/projectService";
import { clientService } from "../../../services/clientService";
import { siteVisitService } from "../../../services/siteVisitService";
import { followupService } from "../../../services/followupService";
import { dealService } from "../../../services/dealService";
import DealSummaryCards from "../../deals/components/DealSummaryCards";
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
  const canViewProjects = useCan("projects", "view");
  const canViewClients = useCan("clients", "view");
  const canViewSiteVisits = useCan("siteVisits", "view");
  const canViewFollowups = useCan("followups", "view");
  const canViewDealReports = useCan("dealReports", "view");
  const [projects, setProjects] = useState([]);
  const [totalProjects, setTotalProjects] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [todaysAppointments, setTodaysAppointments] = useState(0);
  const [pendingFollowups, setPendingFollowups] = useState(0);
  const [clients, setClients] = useState([]);
  const [dealSummary, setDealSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);

      try {
        const [projectData, clientData, siteVisitData, pendingWorkData, dealSummaryData] = await Promise.all([
          canViewProjects ? projectService.listAll() : Promise.resolve({ items: [], meta: { total: 0 } }),
          canViewClients ? clientService.list({ limit: 3 }) : Promise.resolve({ items: [], meta: { total: 0 } }),
          canViewSiteVisits ? siteVisitService.list({ today: true, limit: 1 }) : Promise.resolve({ items: [], meta: { total: 0 } }),
          canViewFollowups ? followupService.getPendingWorkSummary() : Promise.resolve({ pendingFollowups: 0 }),
          canViewDealReports ? dealService.summary() : Promise.resolve(null),
        ]);

        setProjects(projectData.items);
        setTotalProjects(projectData.meta?.total ?? projectData.items.length);
        setClients(clientData.items);
        setTotalCustomers(clientData.meta?.total ?? clientData.items.length);
        setTodaysAppointments(siteVisitData.meta?.total ?? siteVisitData.items.length);
        setPendingFollowups(pendingWorkData?.pendingFollowups ?? 0);
        setDealSummary(dealSummaryData);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [canViewClients, canViewDealReports, canViewFollowups, canViewProjects, canViewSiteVisits]);

  const projectColumns = [
  {
    key: "projectName",
    label: "Service",
    searchValue: (row) => `${row.projectName} ${row.publicAlias}`,
    render: (row) => (
      <div>
        <p className="font-medium text-ivory">{row.projectName}</p>
        <p className="text-xs uppercase tracking-[0.2em] text-muted">{row.publicAlias}</p>
      </div>
    ),
  },
  { key: "location", label: "Category" },
  {
    key: "configuration",
    label: "Details",
    searchValue: (row) => `${row.configuration || ""} ${formatPropertyTypes(row.propertyType)}`,
    render: (row) => row.configuration || formatPropertyTypes(row.propertyType),
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
];

  if (isLoading) {
    return <PageSkeleton variant="dashboard" />;
  }

  const formatCount = (value) => (typeof value === "number" ? value.toLocaleString("en-IN") : value);
  const formatCurrency = (value) =>
    typeof value === "number"
      ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value)
      : value;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5">
        <StatCard
          label={industryLabels.dashboardCards.totalCustomers}
          value={canViewClients ? formatCount(totalCustomers) : "--"}
          accent="gold"
          meta={industryLabels.dashboard.customers}
          icon={Users}
        />
        <StatCard
          label={industryLabels.dashboardCards.todaysAppointments}
          value={canViewSiteVisits ? formatCount(todaysAppointments) : "--"}
          accent="wine"
          meta={industryLabels.dashboard.appointments}
          icon={TicketCheck}
        />
        <StatCard
          label={industryLabels.dashboardCards.pendingFollowups}
          value={canViewFollowups ? formatCount(pendingFollowups) : "--"}
          accent="rose"
          meta={industryLabels.dashboard.reminders}
          icon={CalendarClock}
        />
        <StatCard
          label={industryLabels.dashboardCards.paidInvoices}
          value={canViewDealReports ? formatCount(dealSummary?.closedDeals ?? 0) : "--"}
          accent="green"
          meta={industryLabels.dashboard.billing}
          icon={ReceiptText}
        />
        <StatCard
          label={industryLabels.dashboardCards.monthlyRevenue}
          value={canViewDealReports ? formatCurrency(dealSummary?.currentMonthRevenue ?? 0) : "--"}
          accent="gold"
          meta="This month"
          icon={IndianRupee}
        />
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
                    <h3 className="mt-2 font-display text-2xl">VIP Customers</h3>
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
                <h3 className="mt-2 font-display text-2xl">Recent Services</h3>
              </div>
              <Link to="/projects">
                <Button variant="secondary" icon={Scissors} iconRight={ArrowRight}>
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
