import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import App from "./App";
import DashboardLayout from "../components/layout/DashboardLayout";
import PermissionRoute from "../components/common/PermissionRoute";
import ProtectedRoute from "../components/common/ProtectedRoute";
import PageSkeleton from "../components/common/PageSkeleton";

const LoginPage = lazy(() => import("../features/auth/pages/LoginPage"));
const DashboardPage = lazy(() => import("../features/dashboard/pages/DashboardPage"));
const ProjectsPage = lazy(() => import("../features/projects/pages/ProjectsPage"));
const AddProjectPage = lazy(() => import("../features/projects/pages/AddProjectPage"));
const ProjectDetailsPage = lazy(() => import("../features/projects/pages/ProjectDetailsPage"));
const ClientsPage = lazy(() => import("../features/clients/pages/ClientsPage"));
const PositiveClientsPage = lazy(() => import("../features/clients/pages/PositiveClientsPage"));
const AddClientPage = lazy(() => import("../features/clients/pages/AddClientPage"));
const ClientDetailsPage = lazy(() => import("../features/clients/pages/ClientDetailsPage"));
const FollowupsPage = lazy(() => import("../features/followups/pages/FollowupsPage"));
const SiteVisitsPage = lazy(() => import("../features/siteVisits/pages/SiteVisitsPage"));
const DealNegotiationPage = lazy(() => import("../features/deals/pages/DealNegotiationPage"));
const DealBookingsPage = lazy(() => import("../features/deals/pages/DealBookingsPage"));
const DealClosedDealsPage = lazy(() => import("../features/deals/pages/DealClosedDealsPage"));
const DealAllInvoicesPage = lazy(() => import("../features/deals/pages/DealAllInvoicesPage"));
const DealRevenueSummaryPage = lazy(() => import("../features/deals/pages/DealRevenueSummaryPage"));
const DealUpsertPage = lazy(() => import("../features/deals/pages/DealUpsertPage"));
const DealDetailsPage = lazy(() => import("../features/deals/pages/DealDetailsPage"));
const SharedHistoryPage = lazy(() => import("../features/share/pages/SharedHistoryPage"));
const SharePreviewPage = lazy(() => import("../features/share/pages/SharePreviewPage"));
const SettingsPage = lazy(() => import("../features/settings/pages/SettingsPage"));

const withSuspense = (element) => <Suspense fallback={<PageSkeleton />}>{element}</Suspense>;

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "/login", element: withSuspense(<LoginPage />) },
      { path: "/share-preview/:token", element: withSuspense(<SharePreviewPage />) },
      {
        path: "/",
        element: (
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            path: "dashboard",
            element: withSuspense(
              <PermissionRoute moduleKey="dashboard">
                <DashboardPage />
              </PermissionRoute>
            ),
          },

          // Services - new salon routes
          {
            path: "services",
            element: withSuspense(
              <PermissionRoute moduleKey="projects">
                <ProjectsPage />
              </PermissionRoute>
            ),
          },
          {
            path: "services/new",
            element: withSuspense(
              <PermissionRoute moduleKey="projects" actionKey="create">
                <AddProjectPage />
              </PermissionRoute>
            ),
          },
          {
            path: "services/:id/edit",
            element: withSuspense(
              <PermissionRoute moduleKey="projects" actionKey="update">
                <AddProjectPage />
              </PermissionRoute>
            ),
          },
          {
            path: "services/:id",
            element: withSuspense(
              <PermissionRoute moduleKey="projects">
                <ProjectDetailsPage />
              </PermissionRoute>
            ),
          },

          // Legacy project routes
          { path: "projects", element: <Navigate to="/services" replace /> },
          { path: "projects/new", element: <Navigate to="/services/new" replace /> },
          {
            path: "projects/:id/edit",
            element: withSuspense(
              <PermissionRoute moduleKey="projects" actionKey="update">
                <AddProjectPage />
              </PermissionRoute>
            ),
          },
          {
            path: "projects/:id",
            element: withSuspense(
              <PermissionRoute moduleKey="projects">
                <ProjectDetailsPage />
              </PermissionRoute>
            ),
          },

          // Customers - new salon routes
          {
            path: "customers",
            element: withSuspense(
              <PermissionRoute moduleKey="clients">
                <ClientsPage />
              </PermissionRoute>
            ),
          },
          {
            path: "priority-customers",
            element: withSuspense(
              <PermissionRoute moduleKey="clients">
                <PositiveClientsPage />
              </PermissionRoute>
            ),
          },
          {
            path: "customers/new",
            element: withSuspense(
              <PermissionRoute moduleKey="clients" actionKey="create">
                <AddClientPage />
              </PermissionRoute>
            ),
          },
          {
            path: "customers/:id/edit",
            element: withSuspense(
              <PermissionRoute moduleKey="clients" actionKey="update">
                <AddClientPage />
              </PermissionRoute>
            ),
          },
          {
            path: "customers/:id",
            element: withSuspense(
              <PermissionRoute moduleKey="clients">
                <ClientDetailsPage />
              </PermissionRoute>
            ),
          },

          // Legacy client routes
          { path: "clients", element: <Navigate to="/customers" replace /> },
          { path: "positive-clients", element: <Navigate to="/priority-customers" replace /> },
          { path: "clients/new", element: <Navigate to="/customers/new" replace /> },
          {
            path: "clients/:id",
            element: withSuspense(
              <PermissionRoute moduleKey="clients">
                <ClientDetailsPage />
              </PermissionRoute>
            ),
          },
          {
            path: "projects/:id",
            element: withSuspense(
              <PermissionRoute moduleKey="projects">
                <ProjectDetailsPage />
              </PermissionRoute>
            ),
          },

          {
            path: "followups",
            element: withSuspense(
              <PermissionRoute moduleKey="followups">
                <FollowupsPage />
              </PermissionRoute>
            ),
          },

          // Appointments - new salon routes
          {
            path: "appointments",
            element: withSuspense(
              <PermissionRoute moduleKey="siteVisits">
                <SiteVisitsPage />
              </PermissionRoute>
            ),
          },

          // Legacy appointment route
          { path: "site-visits", element: <Navigate to="/appointments" replace /> },

          // Billing - new salon routes
          { path: "billing", element: <Navigate to="/billing/all" replace /> },
          {
            path: "billing/all",
            element: withSuspense(
              <PermissionRoute moduleKey="deals">
                <DealAllInvoicesPage />
              </PermissionRoute>
            ),
          },
          {
            path: "billing/draft",
            element: withSuspense(
              <PermissionRoute moduleKey="deals">
                <DealNegotiationPage />
              </PermissionRoute>
            ),
          },
          {
            path: "billing/issued",
            element: withSuspense(
              <PermissionRoute moduleKey="deals">
                <DealBookingsPage />
              </PermissionRoute>
            ),
          },
          {
            path: "billing/paid",
            element: withSuspense(
              <PermissionRoute moduleKey="deals">
                <DealClosedDealsPage />
              </PermissionRoute>
            ),
          },
          {
            path: "billing/reports",
            element: withSuspense(
              <PermissionRoute moduleKey="dealReports">
                <DealRevenueSummaryPage />
              </PermissionRoute>
            ),
          },
          {
            path: "billing/new",
            element: withSuspense(
              <PermissionRoute moduleKey="deals" actionKey="create">
                <DealUpsertPage />
              </PermissionRoute>
            ),
          },
          {
            path: "billing/:id/edit",
            element: withSuspense(
              <PermissionRoute moduleKey="deals" actionKey="update">
                <DealUpsertPage />
              </PermissionRoute>
            ),
          },
          {
            path: "billing/:id",
            element: withSuspense(
              <PermissionRoute moduleKey="deals">
                <DealDetailsPage />
              </PermissionRoute>
            ),
          },

          // Legacy deal routes
          { path: "deals", element: <Navigate to="/billing/all" replace /> },
          { path: "deals/all", element: <Navigate to="/billing/all" replace /> },
          { path: "deals/draft", element: <Navigate to="/billing/draft" replace /> },
          { path: "deals/issued", element: <Navigate to="/billing/issued" replace /> },
          { path: "deals/paid", element: <Navigate to="/billing/paid" replace /> },
          { path: "deals/revenue-summary", element: <Navigate to="/billing/reports" replace /> },
          { path: "deals/revenue", element: <Navigate to="/billing/reports" replace /> },
          { path: "deals/new", element: <Navigate to="/billing/new" replace /> },
          {
            path: "deals/:id/edit",
            element: withSuspense(
              <PermissionRoute moduleKey="deals" actionKey="update">
                <DealUpsertPage />
              </PermissionRoute>
            ),
          },
          {
            path: "deals/:id",
            element: withSuspense(
              <PermissionRoute moduleKey="deals">
                <DealDetailsPage />
              </PermissionRoute>
            ),
          },

          {
            path: "shared-history",
            element: withSuspense(
              <PermissionRoute moduleKey="shareRecords">
                <SharedHistoryPage />
              </PermissionRoute>
            ),
          },
          {
            path: "settings",
            element: withSuspense(
              <PermissionRoute moduleKey="settings">
                <SettingsPage />
              </PermissionRoute>
            ),
          },
          {
            path: "settings/users",
            element: <Navigate to="/settings" replace />,
          },
        ],
      },
    ],
  },
]);