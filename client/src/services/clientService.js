import { api } from "./api";
import { fetchAllPaginated } from "./paginatedList";
import { toast } from "../utils/toast";

export const clientService = {
  list: async (params) => {
    const { data } = await api.get("/clients", { params });
    return data.data;
  },
  listAll: async (params) => fetchAllPaginated((requestParams) => clientService.list(requestParams), params),
  listPositive: async (params) => {
    const { data } = await api.get("/clients/positive", { params });
    return data.data;
  },
  listAllPositive: async (params) => fetchAllPaginated((requestParams) => clientService.listPositive(requestParams), params),
  create: async (payload) => {
    const { data } = await api.post("/clients", payload);
    toast.success("Customer created successfully");
    return data.data;
  },
  importLeads: async (payload) => {
    const { data } = await api.post("/clients/import", payload);
    toast.success("Customers imported successfully");
    return data.data;
  },
  getImportHistory: async (params) => {
    const { data } = await api.get("/clients/import-history", { params });
    return data.data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/clients/${id}`);
    return data.data;
  },
  getMatchingProjects: async (id, params) => {
    const { data } = await api.get(`/clients/${id}/matching-projects`, { params });
    return data.data;
  },
  getShareHistory: async (id) => {
    const { data } = await api.get(`/clients/${id}/share-history`);
    return data.data;
  },
  getActivityTimeline: async (id, params) => {
    const { data } = await api.get(`/clients/${id}/activity-timeline`, { params });
    return data.data;
  },
  shareProjects: async (id, payload) => {
    const { data } = await api.post(`/clients/${id}/share-projects`, payload);
    toast.success("Services shared successfully");
    return data.data;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/clients/${id}`, payload);
    toast.success("Customer updated successfully");
    return data.data;
  },
  listCallLogs: async (id) => {
    const { data } = await api.get(`/clients/${id}/call-logs`);
    return data.data;
  },
  createCallLog: async (id, payload) => {
    const { data } = await api.post(`/clients/${id}/call-logs`, payload);
    toast.success("Call log saved successfully");
    return data.data;
  },
  remove: async (id) => {
    const { data } = await api.delete(`/clients/${id}`);
    toast.success("Customer deleted successfully");
    return data;
  },
};
