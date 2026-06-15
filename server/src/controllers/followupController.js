import {
  cancelFollowup,
  completeFollowup,
  createFollowup,
  getFollowupCounts,
  listFollowups,
  updateFollowup,
  getPendingWorkSummary as getPendingWorkSummaryService,
} from "../services/followupService.js";
import * as followupService from "../services/followupService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateFollowupCompletionInput, validateFollowupInput, validateFollowupUpdateInput } from "../validators/followupValidator.js";

export const createFollowupHandler = asyncHandler(async (req, res) => {
  const payload = validateFollowupInput(req.body);
  const followup = await createFollowup(payload, req.user._id, req.user);
  res.status(201).json({ success: true, data: followup });
});

export const listFollowupsHandler = asyncHandler(async (req, res) => {
  const followups = await listFollowups(req.query, req.user);
  res.json({ success: true, data: followups });
});

export const getFollowupCountsHandler = asyncHandler(async (req, res) => {
  const counts = await getFollowupCounts(req.user);
  res.json({ success: true, data: counts });
});

export const updateFollowupHandler = asyncHandler(async (req, res) => {
  const payload = validateFollowupUpdateInput(req.body);
  const followup = await updateFollowup(req.params.id, payload, req.user);
  res.json({ success: true, data: followup });
});

export const completeFollowupHandler = asyncHandler(async (req, res) => {
  const payload = validateFollowupCompletionInput(req.body);
  const followup = await completeFollowup(req.params.id, payload, req.user);
  res.json({ success: true, data: followup });
});

export const cancelFollowupHandler = asyncHandler(async (req, res) => {
  const followup = await cancelFollowup(req.params.id, req.user);
  res.json({ success: true, data: followup });
});

export const getPendingWorkSummary = async (req, res) => {
  const data = await getPendingWorkSummaryService(req.user);

  res.json({
    success: true,
    data,
  });
};
