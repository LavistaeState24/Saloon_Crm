import { useEffect } from "react";

import { useAuth } from "../../hooks/useAuth";
import { followupService } from "../../services/followupService";
import { toast } from "../../utils/toast";

export default function PendingWorkGuard() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user?.id) return;
    if (user.role !== "sales") return;

    const checkPendingWork = async () => {
      const summary = await followupService.getPendingWorkSummary();

      if (summary.total > 0) {
        toast.info("You have pending follow-ups or site visits to complete.", {
          id: `pending-work:${user.id}`,
          duration: 6000,
        });
      }
    };

    checkPendingWork();
  }, [loading, user?.id, user?.role]);

  return null;
}
