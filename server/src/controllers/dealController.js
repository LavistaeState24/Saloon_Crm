import {
  createDeal,
  getDealById,
  getRevenueSummary,
  getStaffClosingReports,
  listBookingDeals,
  listClosedDeals,
  listDeals,
  listNegotiationDeals,
  updateDeal,
} from "../services/dealService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  validateDealInput,
  validateDealListQuery,
  validateDealReportQuery,
  validateDealUpdateInput,
} from "../validators/dealValidator.js";

export const createDealHandler = asyncHandler(async (req, res) => {
  const payload = validateDealInput(req.body, req.user);
  const deal = await createDeal(payload, req.user);
  res.status(201).json({ success: true, data: deal });
});

export const listDealsHandler = asyncHandler(async (req, res) => {
  const query = validateDealListQuery(req.query);
  const deals = await listDeals(query, req.user);
  res.json({ success: true, data: deals });
});

export const listNegotiationDealsHandler = asyncHandler(async (req, res) => {
  const query = validateDealListQuery(req.query);
  const deals = await listNegotiationDeals(query, req.user);
  res.json({ success: true, data: deals });
});

export const listBookingDealsHandler = asyncHandler(async (req, res) => {
  const query = validateDealListQuery(req.query);
  const deals = await listBookingDeals(query, req.user);
  res.json({ success: true, data: deals });
});

export const listClosedDealsHandler = asyncHandler(async (req, res) => {
  const query = validateDealListQuery(req.query);
  const deals = await listClosedDeals(query, req.user);
  res.json({ success: true, data: deals });
});

export const getDealHandler = asyncHandler(async (req, res) => {
  const deal = await getDealById(req.params.id, req.user);
  res.json({ success: true, data: deal });
});

export const updateDealHandler = asyncHandler(async (req, res) => {
  const payload = validateDealUpdateInput(req.body, req.user);
  const deal = await updateDeal(req.params.id, payload, req.user);
  res.json({ success: true, data: deal });
});

export const getRevenueSummaryHandler = asyncHandler(async (req, res) => {
  const query = validateDealReportQuery(req.query);
  const summary = await getRevenueSummary(req.user, query);
  res.json({ success: true, data: summary });
});

export const getStaffClosingReportsHandler = asyncHandler(async (req, res) => {
  const query = validateDealReportQuery(req.query);
  const reports = await getStaffClosingReports(req.user, query);
  res.json({ success: true, data: reports });
});
