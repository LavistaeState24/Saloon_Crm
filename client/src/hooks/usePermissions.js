import { useAuth } from "./useAuth";

export const usePermissions = () => {
  const { user } = useAuth();
  return user?.permissions || {};
};
