import {
  createSiteVisit,
  getSiteVisitById,
  listSiteVisits,
  updateSiteVisit,
} from "../services/siteVisitService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  validateSiteVisitInput,
  validateSiteVisitListQuery,
  validateSiteVisitUpdateInput,
} from "../validators/siteVisitValidator.js";

export const createSiteVisitHandler = asyncHandler(async (req, res) => {
  const payload = validateSiteVisitInput(req.body);
  const siteVisit = await createSiteVisit(payload, req.user._id, req.user);
  res.status(201).json({ success: true, data: siteVisit });
});

export const listSiteVisitsHandler = asyncHandler(async (req, res) => {
  const query = validateSiteVisitListQuery(req.query);
  const siteVisits = await listSiteVisits(query, req.user);
  res.json({ success: true, data: siteVisits });
});

export const getSiteVisitHandler = asyncHandler(async (req, res) => {
  const siteVisit = await getSiteVisitById(req.params.id, req.user);
  res.json({ success: true, data: siteVisit });
});

export const updateSiteVisitHandler = asyncHandler(async (req, res) => {
  const payload = validateSiteVisitUpdateInput(req.body);
  const siteVisit = await updateSiteVisit(req.params.id, payload, req.user);
  res.json({ success: true, data: siteVisit });
});
