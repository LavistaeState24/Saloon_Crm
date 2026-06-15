import { api } from "./api";
import { toast } from "../utils/toast"; 

export const followupService = {
  list: async (params, requestConfig = {}) => {
    const { data } = await api.get("/followups", { params, ...requestConfig });
    return data.data;
  },
  counts: async () => {
    const { data } = await api.get("/followups/counts");
    return data.data;
  },
  create: async (payload) => {
    const { data } = await api.post("/followups", payload);
    toast.success("Reminder created successfully");
    return data.data;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/followups/${id}`, payload);
    toast.success("Reminder updated successfully");
    return data.data;
  },
  complete: async (id, payload) => {
    const { data } = await api.patch(`/followups/${id}/complete`, payload);
    toast.success("Reminder completed successfully");
    return data.data;
  },
  cancel: async (id) => {
    const { data } = await api.patch(`/followups/${id}/cancel`);
    toast.success("Reminder cancelled successfully");
    return data.data;
  },
  getPendingWorkSummary: async () => {
  const { data } = await api.get("/followups/pending-work/summary");
  return data.data;
},
};
