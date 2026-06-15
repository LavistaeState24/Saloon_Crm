import { useEffect } from "react";
import { Navigate } from "react-router-dom";

import { useCan } from "../../hooks/useCan";
import { toast } from "../../utils/toast";

export default function PermissionRoute({ moduleKey, actionKey = "view", children }) {
  const canAccess = useCan(moduleKey, actionKey);

  useEffect(() => {
    if (!canAccess) {
      toast.error("You do not have access to this resource");
    }
  }, [canAccess]);

  if (!canAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
