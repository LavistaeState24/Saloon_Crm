import { api } from "./api";
import { fetchAllPaginated } from "./paginatedList";
import { toast } from "../utils/toast";

export const projectService = {
  list: async (params) => {
    const { data } = await api.get("/projects", { params });
    return data.data;
  },
  listAll: async (params) => fetchAllPaginated((requestParams) => projectService.list(requestParams), params),
  create: async (payload) => {
    const { data } = await api.post("/projects", payload);
    toast.success("Project created successfully");
    return data.data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/projects/${id}`);
    return data.data;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/projects/${id}`, payload);
    toast.success("Project updated successfully");
    return data.data;
  },
  remove: async (id) => {
    const { data } = await api.delete(`/projects/${id}`);
    toast.success("Project deleted successfully");
    return data;
  },
  getClientShare: async (id) => {
    const { data } = await api.get(`/projects/${id}/client-share`);
    return data.data;
  },
  dashboardSummary: async () => {
    const { data } = await api.get("/projects/dashboard-summary");
    return data.data;
  },
};
