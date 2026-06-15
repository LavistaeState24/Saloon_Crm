import { api } from "./api";

export const permissionService = {
  list: async () => {
    const { data } = await api.get("/permissions");
    return data.data;
  },
  getByRole: async (role) => {
    const { data } = await api.get(`/permissions/${role}`);
    return data.data;
  },
  update: async (role, permissions) => {
    const { data } = await api.put(`/permissions/${role}`, { permissions });
    return data.data;
  },
};
