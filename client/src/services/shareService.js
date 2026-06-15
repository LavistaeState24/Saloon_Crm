import { api } from "./api";

export const shareService = {
  create: async (payload) => {
    const { data } = await api.post("/share-links", payload);
    return data.data;
  },
  getPreview: async (token) => {
    const { data } = await api.get(`/share-links/public/${token}`);
    return data.data;
  },
};

