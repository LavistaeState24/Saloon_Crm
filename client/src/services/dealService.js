import { api } from "./api";
import { fetchAllPaginated } from "./paginatedList";
import { toast } from "../utils/toast";

export const dealService = {
  list: async (params) => {
    const { data } = await api.get("/deals", { params });
    return data.data;
  },
  listAll: async (params) => fetchAllPaginated((requestParams) => dealService.list(requestParams), params),
  listNegotiation: async (params) => {
    const { data } = await api.get("/deals/negotiation", { params });
    return data.data;
  },
  listBookings: async (params) => {
    const { data } = await api.get("/deals/bookings", { params });
    return data.data;
  },
  listClosed: async (params) => {
    const { data } = await api.get("/deals/closed", { params });
    return data.data;
  },
  summary: async (params) => {
    const { data } = await api.get("/deals/summary", { params });
    return data.data;
  },
  staffReports: async (params) => {
    const { data } = await api.get("/deals/staff-reports", { params });
    return data.data;
  },
  create: async (payload) => {
    const { data } = await api.post("/deals", payload);
    toast.success("Deal created successfully");
    return data.data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/deals/${id}`);
    return data.data;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/deals/${id}`, payload);
    toast.success("Deal updated successfully");
    return data.data;
  },
};
