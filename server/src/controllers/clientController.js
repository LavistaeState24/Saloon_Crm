import {
  createClient,
  deleteClient,
  getClientById,
  getPositiveClients,
  getClientShareHistory,
  getClientImportHistory,
  getClients,
  getMatchingProjectsForClient,
  importClients,
  shareMatchingProjectsWithClient,
  updateClient,
} from "../services/clientService.js";
import { getClientActivityTimeline } from "../services/activityLogService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createClientHandler = asyncHandler(async (req, res) => {
  const client = await createClient(req.body, req.user);
  res.status(201).json({ success: true, data: client });
});

export const listClientsHandler = asyncHandler(async (req, res) => {
  const clients = await getClients(req.query, req.user);
  res.json({ success: true, data: clients });
});

export const listPositiveClientsHandler = asyncHandler(async (req, res) => {
  const clients = await getPositiveClients(req.query, req.user);
  res.json({ success: true, data: clients });
});

export const importClientsHandler = asyncHandler(async (req, res) => {
  const summary = await importClients(req.body, req.user);
  res.status(201).json({ success: true, data: summary });
});

export const getClientImportHistoryHandler = asyncHandler(async (req, res) => {
  const history = await getClientImportHistory(req.query, req.user);
  res.json({ success: true, data: history });
});

export const getClientHandler = asyncHandler(async (req, res) => {
  const client = await getClientById(req.params.id, req.user);
  res.json({ success: true, data: client });
});

export const getMatchingProjectsForClientHandler = asyncHandler(async (req, res) => {
  const origin = `${req.protocol}://${req.get("host")}`;
  const result = await getMatchingProjectsForClient(req.params.id, req.query, req.user, origin);
  res.json({ success: true, data: result });
});

export const shareMatchingProjectsWithClientHandler = asyncHandler(async (req, res) => {
  const origin = `${req.protocol}://${req.get("host")}`;
  const result = await shareMatchingProjectsWithClient(req.params.id, req.body, req.user, origin);
  res.status(201).json({ success: true, data: result });
});

export const getClientShareHistoryHandler = asyncHandler(async (req, res) => {
  const history = await getClientShareHistory(req.params.id, req.user);
  res.json({ success: true, data: history });
});

export const getClientActivityTimelineHandler = asyncHandler(async (req, res) => {
  const timeline = await getClientActivityTimeline(req.params.id, req.query, req.user);
  res.json({ success: true, data: timeline });
});

export const updateClientHandler = asyncHandler(async (req, res) => {
  const client = await updateClient(req.params.id, req.body, req.user);
  res.json({ success: true, data: client });
});

export const deleteClientHandler = asyncHandler(async (req, res) => {
  await deleteClient(req.params.id, req.user);
  res.json({ success: true, message: "Client deleted successfully" });
});
