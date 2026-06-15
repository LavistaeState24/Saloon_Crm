import {
  createProject,
  deleteProject,
  getClientSafeProjectShare,
  getDashboardSummary,
  getProjectById,
  getProjects,
  updateProject,
} from "../services/projectService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createProjectHandler = asyncHandler(async (req, res) => {
  const project = await createProject(req.body, req.user._id);
  res.status(201).json({ success: true, data: project });
});

export const listProjectsHandler = asyncHandler(async (req, res) => {
  const result = await getProjects(req.query, req.user);
  res.json({ success: true, data: result });
});

export const getProjectHandler = asyncHandler(async (req, res) => {
  const project = await getProjectById(req.params.id, req.user);
  res.json({ success: true, data: project });
});

export const getClientSafeProjectShareHandler = asyncHandler(async (req, res) => {
  const origin = `${req.protocol}://${req.get("host")}`;
  const project = await getClientSafeProjectShare(req.params.id, req.user, origin);
  res.json({ success: true, data: project });
});

export const updateProjectHandler = asyncHandler(async (req, res) => {
  const project = await updateProject(req.params.id, req.body, req.user);
  res.json({ success: true, data: project });
});

export const deleteProjectHandler = asyncHandler(async (req, res) => {
  await deleteProject(req.params.id, req.user);
  res.json({ success: true, message: "Project deleted successfully" });
});

export const dashboardSummaryHandler = asyncHandler(async (req, res) => {
  const summary = await getDashboardSummary(req.user);
  res.json({ success: true, data: summary });
});
