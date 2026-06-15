import { api } from "./api";
import { toast } from "../utils/toast";

export const shareRecordService = {
  create: async (payload) => {
    const { data } = await api.post("/share-records", payload);
    toast.success("Share record created successfully");
    return data.data;
  },
  list: async (requestConfig = {}) => {
    const { data } = await api.get("/share-records", requestConfig);
    return data.data;
  },
  listByClientPhone: async (clientPhone) => {
    const { data } = await api.get(`/share-records/client/${clientPhone}`);
    return data.data;
  },
  listByProjectId: async (projectId) => {
    const { data } = await api.get(`/share-records/project/${projectId}`);
    return data.data;
  },
  updateStatus: async (id, payload) => {
    const { data } = await api.patch(`/share-records/${id}/status`, payload);
    toast.success("Share record status updated successfully");
    return data.data;
  },
  updateNotes: async (id, payload) => {
    const { data } = await api.patch(`/share-records/${id}/notes`, payload);
    toast.success("Share record notes updated successfully");
    return data.data;
  },
  remove: async (id) => {
    const { data } = await api.delete(`/share-records/${id}`);
    toast.success("Share record deleted successfully");
    return data;
  },
};
