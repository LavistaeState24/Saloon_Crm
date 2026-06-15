import { usePermissions } from "./usePermissions";

export const useCan = (moduleKey, actionKey) => {
  const permissions = usePermissions();
  return Boolean(permissions?.[moduleKey]?.[actionKey]);
};
