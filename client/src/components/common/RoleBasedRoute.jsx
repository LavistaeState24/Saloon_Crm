import { useEffect } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import { toast } from "../../utils/toast";

export default function RoleBasedRoute({ allowedRoles, children }) {
  const { user } = useAuth();

  useEffect(() => {
    if (user && !allowedRoles.includes(user.role)) {
      toast.error("You do not have access to this resource");
    }
  }, [allowedRoles, user]);

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
