import { api } from "./api";
import { fetchAllPaginated } from "./paginatedList";
import { toast } from "../utils/toast";

export const siteVisitService = {
  list: async (params) => {
    const { data } = await api.get("/site-visits", { params });
    return data.data;
  },
  listAll: async (params) => fetchAllPaginated((requestParams) => siteVisitService.list(requestParams), params),
  create: async (payload) => {
    const { data } = await api.post("/site-visits", payload);
    toast.success("Site visit created successfully");
    return data.data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/site-visits/${id}`);
    return data.data;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/site-visits/${id}`, payload);
    toast.success("Site visit updated successfully");
    return data.data;
  },
};
