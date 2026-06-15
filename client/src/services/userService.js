import { api } from "./api";
import { toast } from "../utils/toast";

export const userService = {
  list: async () => {
    const { data } = await api.get("/users");
    return data.data;
  },
  listAssignable: async () => {
    const { data } = await api.get("/users/assignable");
    return data.data;
  },
  create: async (payload) => {
    const { data } = await api.post("/users", payload);
    toast.success("User created successfully");
    return data.data;
  },
};
