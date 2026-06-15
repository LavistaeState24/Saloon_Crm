import assert from "node:assert/strict";

import {
  buildReminderLockOverrideActivity,
  createReminderLockError,
  shouldBlockReminderAction,
  shouldBlockReminderCreation,
} from "../src/utils/reminderLock.js";
import { Followup } from "../src/models/Followup.js";
import { hasOverdueReminderForLead } from "../src/services/reminderService.js";

const tests = [
  ["Sales users are blocked by the reminder lock", () => assert.equal(shouldBlockReminderAction("sales", true), true)],
  ["Managers are blocked by the reminder lock", () => assert.equal(shouldBlockReminderAction("manager", true), true)],
  ["Admins are blocked by the reminder lock", () => assert.equal(shouldBlockReminderAction("admin", true), true)],
  ["Super Admin can bypass the reminder lock", () => assert.equal(shouldBlockReminderAction("super-admin", true), false)],
  ["Reminder creation is blocked for overdue leads", () => assert.equal(shouldBlockReminderCreation("sales", true), true)],
  ["Super Admin can create reminders on overdue leads", () => assert.equal(shouldBlockReminderCreation("super-admin", true), false)],
  [
    "Overdue reminder lookup is scoped to the current lead",
    async () => {
      const originalExists = Followup.exists;
      const overdueLeadIds = new Set(["lead-a"]);

      Followup.exists = async (query) => {
        const clientId = String(query.client || "");
        return overdueLeadIds.has(clientId) ? { _id: `reminder-${clientId}` } : null;
      };

      try {
        const results = await Promise.all([
          hasOverdueReminderForLead("lead-a"),
          hasOverdueReminderForLead("lead-b"),
          hasOverdueReminderForLead("lead-c"),
          hasOverdueReminderForLead("lead-d"),
          hasOverdueReminderForLead("lead-e"),
        ]);

        assert.deepEqual(results, [true, false, false, false, false]);
      } finally {
        Followup.exists = originalExists;
      }
    },
  ],
  [
    "Reminder lock override activity payload is created",
    () => {
      const payload = buildReminderLockOverrideActivity({
        performedBy: "user-1",
        targetId: "lead-1",
      });

      assert.deepEqual(payload, {
        action: "REMINDER_LOCK_OVERRIDDEN",
        module: "reminders",
        performedBy: "user-1",
        targetId: "lead-1",
        leadId: "lead-1",
        message: "Super Admin bypassed overdue reminder lock",
        metadata: {
          bypassed: true,
        },
      });
    },
  ],
  [
    "Reminder lock error uses the required message",
    () => {
      const error = createReminderLockError();

      assert.equal(error.statusCode, 403);
      assert.equal(error.message, "Complete overdue reminder before continuing");
    },
  ],
];

let failures = 0;

for (const [name, fn] of tests) {
  try {
    await Promise.resolve(fn());
    console.log(`ok - ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`not ok - ${name}`);
    console.error(error);
  }
}

if (failures) {
  process.exitCode = 1;
  console.error(`\n${failures} test(s) failed`);
} else {
  console.log(`\n${tests.length} test(s) passed`);
}
