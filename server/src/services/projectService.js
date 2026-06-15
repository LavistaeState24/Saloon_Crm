import { Project } from "../models/Project.js";
import { ApiError } from "../utils/ApiError.js";
import { buildPagination, buildProjectFilters } from "../utils/query.js";
import { applyScopedFilter, assertDocumentScope, getModuleScope } from "../utils/accessControl.js";

const formatAssetUrl = (origin, assetUrl) => {
  if (!assetUrl) {
    return null;
  }

  if (/^https?:\/\//i.test(assetUrl)) {
    return assetUrl;
  }

  return `${origin}${assetUrl.startsWith("/") ? assetUrl : `/${assetUrl}`}`;
};

const formatIndianCurrency = (value) =>
  typeof value === "number" ? value.toLocaleString("en-IN") : null;

const formatPropertyTypes = (value) =>
  Array.isArray(value) ? value.join(", ") : value || null;

const formatDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

export const buildClientSafeProjectPayload = (project, user, origin) => {
  const brochureUrl = formatAssetUrl(origin, project.brochure?.url);
  const photos = (project.projectImages || [])
    .map((image) => formatAssetUrl(origin, image?.url))
    .filter(Boolean);

  return {
    projectId: String(project._id),
    publicAlias: project.publicAlias,
    location: project.location,
    area: project.area,
    configuration: project.configuration || formatPropertyTypes(project.propertyType),
    size: project.sizeRange?.label
      ? project.sizeRange.label
      : project.sizeRange?.min && project.sizeRange?.max
        ? `${project.sizeRange.min} - ${project.sizeRange.max} ${project.sizeRange.unit || "sqft"}`
        : null,
    priceRange: project.priceRange?.min
      ? project.priceRange.min === project.priceRange.max || !project.priceRange?.max
        ? `Rs${formatIndianCurrency(project.priceRange.min)}`
        : `Rs${formatIndianCurrency(project.priceRange.min)} - Rs${formatIndianCurrency(project.priceRange.max)}`
      : null,
    possession: formatDate(project.possessionDate),
    amenities: project.amenities || [],
    brochureUrl,
    sampleVideoUrl: project.hasSampleVideo ? formatAssetUrl(origin, project.sampleVideoUrl) : null,
    photos,
    contact: {
      name: user.name,
      phone: user.phone,
    },
  };
};

export const createProject = async (payload, userId) =>
  Project.create({
    ...payload,
    createdBy: userId,
  });

export const getProjects = async (query, currentUser) => {
  const filters = buildProjectFilters(query);
  const { page, limit, skip } = buildPagination(query);
  const scopedFilters = applyScopedFilter(filters, getModuleScope(currentUser, "projects"), currentUser, {
    assigned: ["createdBy"],
    own: ["createdBy"],
  });

  const [items, total] = await Promise.all([
    Project.find(scopedFilters)
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Project.countDocuments(scopedFilters),
  ]);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getProjectById = async (projectId, currentUser) => {
  const project = await Project.findById(projectId).populate("createdBy", "name role");

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  assertDocumentScope(project, getModuleScope(currentUser, "projects"), currentUser, {
    assigned: ["createdBy"],
    own: ["createdBy"],
  });

  return project;
};

export const getClientSafeProjectShare = async (projectId, user, origin) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  assertDocumentScope(project, getModuleScope(user, "projects"), user, {
    assigned: ["createdBy"],
    own: ["createdBy"],
  });

  return buildClientSafeProjectPayload(project, user, origin);
};

export const updateProject = async (projectId, payload, currentUser) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  assertDocumentScope(project, getModuleScope(currentUser, "projects"), currentUser, {
    assigned: ["createdBy"],
    own: ["createdBy"],
  });

  project.set(payload);
  await project.save();

  return project;
};

export const deleteProject = async (projectId, currentUser) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  assertDocumentScope(project, getModuleScope(currentUser, "projects"), currentUser, {
    assigned: ["createdBy"],
    own: ["createdBy"],
  });

  await project.deleteOne();
};

export const getDashboardSummary = async (currentUser) => {
  const projectsScope = getModuleScope(currentUser, "projects");

  if (projectsScope === "none") {
    return {
      totalProjects: 0,
      activeProjects: 0,
      upcomingProjects: 0,
    };
  }

  const projectFilters = applyScopedFilter({}, projectsScope, currentUser, {
    assigned: ["createdBy"],
    own: ["createdBy"],
  });

  const [totalProjects, activeProjects, upcomingProjects] = await Promise.all([
  Project.countDocuments(projectFilters),
    Project.countDocuments({ ...projectFilters, status: "active" }),
    Project.countDocuments({ ...projectFilters, status: "upcoming" }),
  ]);

  return {
    totalProjects,
    activeProjects,
    upcomingProjects,
  };
};
