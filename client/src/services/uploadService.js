import { api } from "./api";
import { toast } from "../utils/toast";

export const resolveAssetUrl = (url) => {
  return url || "";
};

export const uploadService = {
  uploadFiles: async (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const { data } = await api.post("/uploads", formData);
    toast.success("Files uploaded successfully");

    return data.data;
  },
};
