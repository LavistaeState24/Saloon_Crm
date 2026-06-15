import { api } from "./api";

export const authService = {
  login: async (payload) => {
    const { data } = await api.post("/auth/login", payload);
    return data.data;
  },
  register: async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    return data.data;
  },
  me: async () => {
    const { data } = await api.get("/auth/me");
    return data.data;
  },
  updateLastSeen: async () => {
    await api.patch("/auth/last-seen");
  },

};
