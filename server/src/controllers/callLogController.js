import { createCallLog, listCallLogs } from "../services/callLogService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateCallLogInput } from "../validators/callLogValidator.js";

export const listClientCallLogsHandler = asyncHandler(async (req, res) => {
  const callLogs = await listCallLogs(req.params.id, req.user);
  res.json({ success: true, data: callLogs });
});

export const createClientCallLogHandler = asyncHandler(async (req, res) => {
  const payload = validateCallLogInput(req.body);
  const callLog = await createCallLog(req.params.id, payload, req.user);
  res.status(201).json({ success: true, data: callLog });
});
