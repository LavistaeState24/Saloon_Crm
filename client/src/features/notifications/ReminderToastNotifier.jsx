import { useEffect, useRef } from "react";

import { useAuth } from "../../hooks/useAuth";
import { useCan } from "../../hooks/useCan";
import { followupService } from "../../services/followupService";
import { shareRecordService } from "../../services/shareRecordService";
import { toast } from "../../utils/toast";
import {
  buildReminderToastMessage,
  buildShareRecordToastMessage,
  getReminderToastStage,
  getShareRecordToastStage,
} from "./reminderToastUtils";

const POLL_INTERVAL_MS = 10000;
const STORAGE_PREFIX = "pmcrm_reminder_toasts_v1";

const getCacheKey = (userId) => `${STORAGE_PREFIX}:${userId || "anonymous"}`;

const isShareRecordTerminal = (record) => ["closed", "not-interested"].includes(String(record?.status || "").toLowerCase());

const readNotifiedIds = (userId) => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(getCacheKey(userId));
    const parsed = raw ? JSON.parse(raw) : {};

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return parsed;
  } catch (_error) {
    return {};
  }
};

const writeNotifiedIds = (userId, value) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(getCacheKey(userId), JSON.stringify(value));
  } catch (_error) {
    // Ignore quota or storage failures. The poller will still avoid repeats in-memory.
  }
};

const getReminderOrigin = (reminder) => {
  if (reminder?.relatedModule === "shareRecord" && reminder.relatedId) {
    return { source: "shareRecord", originId: String(reminder.relatedId) };
  }

  return { source: "followup", originId: String(reminder?._id || "") };
};

export default function ReminderToastNotifier() {
  const { user, loading } = useAuth();
  const canViewFollowups = useCan("followups", "view");
  const canViewShareRecords = useCan("shareRecords", "view");
  const isPollingRef = useRef(false);
  const activeRef = useRef(true);
  const notifiedRef = useRef({});

  useEffect(() => {
    activeRef.current = true;

    return () => {
      activeRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!user?.id || loading || (!canViewFollowups && !canViewShareRecords)) {
      return;
    }

    notifiedRef.current = readNotifiedIds(user.id);

    const pollDueReminders = async () => {
      if (!activeRef.current || isPollingRef.current) {
        return;
      }

      isPollingRef.current = true;

      try {
        const [followupResult, shareRecords] = await Promise.all([
          canViewFollowups
            ? followupService.list(
                {
                  status: "Pending",
                  limit: 100,
                },
                {
                  skipToast: true,
                },
              )
            : Promise.resolve({ items: [] }),
          canViewShareRecords
            ? shareRecordService.list({
                skipToast: true,
              })
            : Promise.resolve([]),
        ]);

        if (!activeRef.current) {
          return;
        }

        const notifiedIds = readNotifiedIds(user.id);
        let hasUpdates = false;

        for (const reminder of followupResult.items || []) {
          const { source, originId } = getReminderOrigin(reminder);
          const stage = getReminderToastStage(reminder);
          if (!reminder?._id || !stage) {
            continue;
          }

          const notificationKey = `${source}:${originId}:${stage}`;

          if (notifiedIds[notificationKey]) {
            continue;
          }

          toast.info(buildReminderToastMessage(reminder, stage), {
            id: `reminder-due:${source}:${originId}:${stage}`,
            duration: 10000,
          });

          notifiedIds[notificationKey] = {
            reminderId: reminder._id,
            stage,
            dueAt: reminder.reminderDateTime || reminder.dueDate || null,
            remindedAt: Date.now(),
          };
          hasUpdates = true;
        }

        for (const record of shareRecords || []) {
          if (!record?._id || isShareRecordTerminal(record)) {
            continue;
          }

          const stage = getShareRecordToastStage(record);
          if (!stage) {
            continue;
          }

          const notificationKey = `shareRecord:${record._id}:${stage}`;

          if (notifiedIds[notificationKey]) {
            continue;
          }

          toast.info(buildShareRecordToastMessage(record, stage), {
            id: `reminder-due:shareRecord:${record._id}:${stage}`,
            duration: 10000,
          });

          notifiedIds[notificationKey] = {
            reminderId: record._id,
            stage,
            dueAt: record.followUpDate || null,
            remindedAt: Date.now(),
          };
          hasUpdates = true;
        }

        if (hasUpdates) {
          notifiedRef.current = notifiedIds;
          writeNotifiedIds(user.id, notifiedIds);
        }
      } catch (_error) {
        // Background polling should fail quietly to avoid noisy user-facing errors.
      } finally {
        isPollingRef.current = false;
      }
    };

    pollDueReminders();
    const intervalId = window.setInterval(pollDueReminders, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [canViewFollowups, canViewShareRecords, loading, user?.id]);

  return null;
}
