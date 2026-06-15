import { Client } from "../models/Client.js";
import { Deal } from "../models/Deal.js";
import { Project } from "../models/Project.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { buildPagination } from "../utils/query.js";
import { buildReminderLockOverrideActivity, createReminderLockError, shouldBlockReminderAction } from "../utils/reminderLock.js";
import { createActivityLog, recordDealActivity, recordLeadChangeActivities } from "./activityLogService.js";
import { hasOverdueReminderForLead } from "./reminderService.js";

const toObjectId = (value) => value?._id || value || null;
const toObjectIdString = (value) => String(toObjectId(value) || "");

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const populateDealUsers = (query) =>
  query
    .populate("leadId", "ownerName clientPhoneNumber leadStatus assignedStaff assignedTo createdBy")
    .populate("finalProject", "projectName publicAlias location area configuration priceRange status")
    .populate("dealClosedBy", "name role managerId")
    .populate("createdBy", "name role managerId")
    .populate("updatedBy", "name role managerId");

const normalizeDeal = (deal) => {
  const record = typeof deal.toObject === "function" ? deal.toObject() : { ...deal };

  return {
    ...record,
    lead: record.leadId || null,
    project: record.finalProject || null,
    closedBy: record.dealClosedBy || null,
    leadId: record.leadId?._id || record.leadId || null,
    finalProject: record.finalProject?._id || record.finalProject || null,
    dealClosedBy: record.dealClosedBy?._id || record.dealClosedBy || null,
  };
};

const getAssignedUserId = (client) => toObjectId(client.assignedStaff) || toObjectId(client.assignedTo) || null;

const buildClientVisibilityFilter = async (currentUser) => {
  if (["super-admin", "admin"].includes(currentUser.role)) {
    return {};
  }

  if (currentUser.role === "manager") {
    const teamMembers = await User.find({
      isActive: true,
      $or: [{ _id: currentUser._id }, { role: "sales", managerId: currentUser._id }],
    }).select("_id");
    const teamUserIds = teamMembers.map((user) => user._id);

    return {
      $or: [{ assignedStaff: { $in: teamUserIds } }, { assignedTo: { $in: teamUserIds } }, { createdBy: { $in: teamUserIds } }],
    };
  }

  return {
    $or: [{ assignedStaff: currentUser._id }, { assignedTo: currentUser._id }],
  };
};

const assertLeadAccess = async (lead, currentUser) => {
  if (["super-admin", "admin"].includes(currentUser.role)) {
    return;
  }

  const assignedUserId = getAssignedUserId(lead);

  if (currentUser.role === "manager") {
    const relatedUserIds = [assignedUserId, toObjectId(lead.createdBy)].filter(Boolean);
    const managedSalesCount = await User.countDocuments({
      role: "sales",
      managerId: currentUser._id,
      _id: { $in: relatedUserIds },
    });

    const hasAccess =
      toObjectIdString(assignedUserId) === toObjectIdString(currentUser._id) ||
      toObjectIdString(lead.createdBy) === toObjectIdString(currentUser._id) ||
      managedSalesCount > 0;

    if (hasAccess) {
      return;
    }
  } else if (toObjectIdString(assignedUserId) === toObjectIdString(currentUser._id)) {
    return;
  }

  throw new ApiError(403, "You do not have access to this resource");
};

const getAccessibleLead = async (leadId, currentUser) => {
  const lead = await Client.findById(leadId);

  if (!lead) {
    throw new ApiError(404, "Lead not found");
  }

  await assertLeadAccess(lead, currentUser);
  return lead;
};

const assertProjectExists = async (projectId) => {
  const project = await Project.findById(projectId).select("_id projectName publicAlias");

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  return project;
};

const assertValidCloser = async (dealClosedBy, currentUser) => {
  const closerId = dealClosedBy || currentUser._id;
  const user = await User.findOne({ _id: closerId, isActive: true }).select("_id role managerId");

  if (!user || user.role === "super-admin") {
    throw new ApiError(400, "Deal closed by is invalid");
  }

  if (currentUser.role === "sales" && toObjectIdString(user._id) !== toObjectIdString(currentUser._id)) {
    throw new ApiError(403, "Sales users can only close their own deals");
  }

  if (currentUser.role === "manager") {
    const isSelf = toObjectIdString(user._id) === toObjectIdString(currentUser._id);
    const isManagedSales = user.role === "sales" && toObjectIdString(user.managerId) === toObjectIdString(currentUser._id);

    if (!isSelf && !isManagedSales) {
      throw new ApiError(403, "Managers can only close deals for their own team");
    }
  }

  return user._id;
};

const ensureNoDuplicateActiveDeal = async (leadId, currentDealId = null) => {
  const activeDeal = await Deal.findOne({
    leadId,
    dealStatus: { $ne: "Cancelled" },
    ...(currentDealId ? { _id: { $ne: currentDealId } } : {}),
  }).select("_id dealStatus");

  if (activeDeal) {
    throw new ApiError(409, "An active deal already exists for this lead");
  }
};

const updateLeadStatus = async (leadId, dealStatus) => {
  const lead = await Client.findById(leadId);

  if (!lead) {
    return null;
  }

  const statusMap = {
    Negotiation: "Negotiation",
    Booking: "Booking",
    Closed: "Closed",
    Cancelled: "Lost",
  };

  lead.leadStatus = statusMap[dealStatus] || lead.leadStatus;
  await lead.save();

  return lead;
};

const buildDealFilters = async (query = {}, currentUser) => {
  const filters = {};
  const leadVisibilityFilter = await buildClientVisibilityFilter(currentUser);

  if (query.leadId) {
    const lead = await getAccessibleLead(query.leadId, currentUser);
    filters.leadId = lead._id;
  } else if (Object.keys(leadVisibilityFilter).length) {
    const visibleLeads = await Client.find(leadVisibilityFilter).select("_id");
    filters.leadId = { $in: visibleLeads.map((lead) => lead._id) };
  }

  if (query.finalProject) {
    filters.finalProject = query.finalProject;
  }

  if (query.dealStatus) {
    filters.dealStatus = query.dealStatus;
  }

  if (query.paymentStatus) {
    filters.paymentStatus = query.paymentStatus;
  }

  if (query.dealClosedBy) {
    filters.dealClosedBy = query.dealClosedBy;
  }

  if (query.documentsPending === "true" || query.documentsPending === true) {
    filters.documentsPending = true;
  }

  if (query.documentsPending === "false" || query.documentsPending === false) {
    filters.documentsPending = false;
  }

  if (query.dateFrom || query.dateTo) {
    filters.bookingDate = {};

    if (query.dateFrom) {
      const fromDate = new Date(query.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filters.bookingDate.$gte = fromDate;
    }

    if (query.dateTo) {
      const toDate = new Date(query.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filters.bookingDate.$lte = toDate;
    }
  }

  if (query.search) {
    const pattern = new RegExp(escapeRegex(query.search), "i");
    const leadSearchFilter = Object.keys(leadVisibilityFilter).length
      ? {
          $and: [
            leadVisibilityFilter,
            {
              $or: [
                { ownerName: pattern },
                { clientPhoneNumber: pattern },
                { premiseName: pattern },
                { premiseArea: pattern },
                { areaPreference: pattern },
              ],
            },
          ],
        }
      : {
          $or: [
            { ownerName: pattern },
            { clientPhoneNumber: pattern },
            { premiseName: pattern },
            { premiseArea: pattern },
            { areaPreference: pattern },
          ],
        };

    const [leadMatches, projectMatches] = await Promise.all([
      Client.find(leadSearchFilter).select("_id"),
      Project.find({
        $or: [{ projectName: pattern }, { publicAlias: pattern }, { location: pattern }, { area: pattern }],
      }).select("_id"),
    ]);

    const searchClauses = [
      { finalUnit: pattern },
      { brokerageDetails: pattern },
      { notes: pattern },
      { paymentStatus: pattern },
      { dealStatus: pattern },
    ];

    if (leadMatches.length) {
      searchClauses.push({ leadId: { $in: leadMatches.map((lead) => lead._id) } });
    }

    if (projectMatches.length) {
      searchClauses.push({ finalProject: { $in: projectMatches.map((project) => project._id) } });
    }

    filters.$and = [...(filters.$and || []), { $or: searchClauses }];
  }

  return filters;
};

const buildClosedDealBaseFilter = async (currentUser, query = {}) => {
  const filters = await buildDealFilters({ ...query, dealStatus: "Closed" }, currentUser);

  if (query.dateFrom || query.dateTo) {
    return filters;
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return {
    ...filters,
    bookingDate: {
      $gte: start,
    },
  };
};

export const createDeal = async (payload, currentUser) => {
  const lead = await getAccessibleLead(payload.leadId, currentUser);
  const previousLead = lead.toObject();
  const hasOverdueReminder = await hasOverdueReminderForLead(lead._id);

  if (shouldBlockReminderAction(currentUser.role, hasOverdueReminder)) {
    throw createReminderLockError();
  }

  if (hasOverdueReminder && currentUser.role === "super-admin") {
    await createActivityLog(
      buildReminderLockOverrideActivity({
        performedBy: currentUser._id,
        targetId: lead._id,
        module: "deals",
        message: "Super Admin bypassed overdue reminder lock",
        metadata: {
          source: "deal-create",
        },
      })
    );
  }

  await assertProjectExists(payload.finalProject);
  const dealClosedBy = payload.dealStatus === "Closed" ? await assertValidCloser(payload.dealClosedBy, currentUser) : null;

  await ensureNoDuplicateActiveDeal(lead._id);

  const deal = await Deal.create({
    ...payload,
    leadId: lead._id,
    finalProject: payload.finalProject,
    dealClosedBy,
    createdBy: currentUser._id,
    updatedBy: currentUser._id,
  });

  const updatedLead = await updateLeadStatus(deal.leadId, deal.dealStatus);

  await recordDealActivity({
    lead,
    deal,
    performedBy: currentUser._id,
    action: "created",
    newValues: {
      dealStatus: deal.dealStatus,
      finalProject: deal.finalProject,
      finalUnit: deal.finalUnit,
      finalPrice: deal.finalPrice,
      bookingDate: deal.bookingDate,
      dealClosedBy: deal.dealClosedBy,
    },
  });

  if (updatedLead) {
    await recordLeadChangeActivities({
      lead: updatedLead,
      before: previousLead,
      after: updatedLead,
      performedBy: currentUser._id,
      metadata: {
        source: "deal-created",
      },
    });
  }

  return normalizeDeal(await populateDealUsers(Deal.findById(deal._id)));
};

export const listDeals = async (query = {}, currentUser) => {
  const { page, limit, skip } = buildPagination(query);
  const filters = await buildDealFilters(query, currentUser);

  const [items, total] = await Promise.all([
    populateDealUsers(Deal.find(filters))
      .sort({ bookingDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Deal.countDocuments(filters),
  ]);

  return {
    items: items.map(normalizeDeal),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const listNegotiationDeals = (query, currentUser) => listDeals({ ...query, dealStatus: "Negotiation" }, currentUser);
export const listBookingDeals = (query, currentUser) => listDeals({ ...query, dealStatus: "Booking" }, currentUser);
export const listClosedDeals = (query, currentUser) => listDeals({ ...query, dealStatus: "Closed" }, currentUser);

export const getDealById = async (dealId, currentUser) => {
  const deal = await populateDealUsers(Deal.findById(dealId));

  if (!deal) {
    throw new ApiError(404, "Deal not found");
  }

  await getAccessibleLead(deal.leadId?._id || deal.leadId, currentUser);
  return normalizeDeal(deal);
};

export const updateDeal = async (dealId, payload, currentUser) => {
  const deal = await Deal.findById(dealId);

  if (!deal) {
    throw new ApiError(404, "Deal not found");
  }

  const currentLead = await getAccessibleLead(deal.leadId, currentUser);
  const previousDeal = deal.toObject();
  const nextPayload = { ...payload };
  const nextLeadId = nextPayload.leadId || deal.leadId;
  const nextStatus = nextPayload.dealStatus || deal.dealStatus;

  if (nextPayload.leadId && toObjectIdString(nextPayload.leadId) !== toObjectIdString(deal.leadId)) {
    await getAccessibleLead(nextPayload.leadId, currentUser);
  }

  if (nextPayload.finalProject) {
    await assertProjectExists(nextPayload.finalProject);
  }

  if (nextPayload.dealClosedBy) {
    nextPayload.dealClosedBy = await assertValidCloser(nextPayload.dealClosedBy, currentUser);
  } else if (nextStatus === "Closed" && !deal.dealClosedBy) {
    nextPayload.dealClosedBy = await assertValidCloser(currentUser._id, currentUser);
  }

  if (nextStatus !== "Cancelled") {
    await ensureNoDuplicateActiveDeal(nextLeadId, deal._id);
  }

  deal.set({
    ...nextPayload,
    updatedBy: currentUser._id,
  });
  await deal.save();

  if (toObjectIdString(nextLeadId) !== toObjectIdString(currentLead._id) && nextPayload.leadId) {
    await updateLeadStatus(nextLeadId, nextStatus);
  } else {
    await updateLeadStatus(deal.leadId, nextStatus);
  }

  const refreshedLead = await getAccessibleLead(nextLeadId, currentUser);
  const previousLead = currentLead.toObject();
  const refreshedDeal = await Deal.findById(deal._id);

  await Promise.all([
    recordDealActivity({
      lead: refreshedLead,
      deal: refreshedDeal,
      performedBy: currentUser._id,
      action: previousDeal.dealStatus !== nextStatus ? "status_changed" : "updated",
      oldValues: {
        dealStatus: previousDeal.dealStatus,
        finalProject: previousDeal.finalProject,
        finalUnit: previousDeal.finalUnit,
        finalPrice: previousDeal.finalPrice,
        brokerageDetails: previousDeal.brokerageDetails,
        tokenAmount: previousDeal.tokenAmount,
        bookingDate: previousDeal.bookingDate,
        paymentStatus: previousDeal.paymentStatus,
        documentsPending: previousDeal.documentsPending,
        dealClosedBy: previousDeal.dealClosedBy,
      },
      newValues: {
        dealStatus: refreshedDeal.dealStatus,
        finalProject: refreshedDeal.finalProject,
        finalUnit: refreshedDeal.finalUnit,
        finalPrice: refreshedDeal.finalPrice,
        brokerageDetails: refreshedDeal.brokerageDetails,
        tokenAmount: refreshedDeal.tokenAmount,
        bookingDate: refreshedDeal.bookingDate,
        paymentStatus: refreshedDeal.paymentStatus,
        documentsPending: refreshedDeal.documentsPending,
        dealClosedBy: refreshedDeal.dealClosedBy,
      },
        metadata: previousDeal.dealStatus !== nextStatus ? { description: `Deal status changed from ${previousDeal.dealStatus} to ${nextStatus}.` } : {},
    }),
  ]);

  if (toObjectIdString(nextLeadId) === toObjectIdString(currentLead._id)) {
    await recordLeadChangeActivities({
      lead: refreshedLead,
      before: previousLead,
      after: refreshedLead,
      performedBy: currentUser._id,
      metadata: {
        source: "deal-updated",
      },
    });
  }

  return normalizeDeal(await populateDealUsers(Deal.findById(deal._id)));
};

export const getRevenueSummary = async (currentUser, query = {}) => {
  const baseFilters = await buildDealFilters(query, currentUser);
  const closedFilters = await buildClosedDealBaseFilter(currentUser, query);

  const [statusBreakdown, revenueStats, monthlyRevenue] = await Promise.all([
    Deal.aggregate([
      { $match: baseFilters },
      {
        $group: {
          _id: "$dealStatus",
          count: { $sum: 1 },
        },
      },
    ]),
    Deal.aggregate([
      { $match: { ...baseFilters, dealStatus: "Closed" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $ifNull: ["$finalPrice", 0] } },
          totalTokens: { $sum: { $ifNull: ["$tokenAmount", 0] } },
          closedDeals: { $sum: 1 },
          documentsPending: {
            $sum: {
              $cond: [{ $eq: ["$documentsPending", true] }, 1, 0],
            },
          },
        },
      },
    ]),
    Deal.aggregate([
      { $match: closedFilters },
      {
        $group: {
          _id: null,
          currentMonthRevenue: { $sum: { $ifNull: ["$finalPrice", 0] } },
          currentMonthBookings: { $sum: 1 },
        },
      },
    ]),
  ]);

  const breakdown = {
    Negotiation: 0,
    Booking: 0,
    Closed: 0,
    Cancelled: 0,
  };

  statusBreakdown.forEach((entry) => {
    if (entry?._id) {
      breakdown[entry._id] = entry.count;
    }
  });

  const totals = revenueStats[0] || {};
  const monthly = monthlyRevenue[0] || {};
  const totalTrackedDeals = breakdown.Negotiation + breakdown.Booking + breakdown.Closed + breakdown.Cancelled;
  const closingRate = totalTrackedDeals ? Math.round((breakdown.Closed / totalTrackedDeals) * 100) : 0;

  return {
    statusBreakdown: breakdown,
    totalDeals: totalTrackedDeals,
    closedDeals: totals.closedDeals || 0,
    totalRevenue: totals.totalRevenue || 0,
    totalTokens: totals.totalTokens || 0,
    documentsPending: totals.documentsPending || 0,
    currentMonthRevenue: monthly.currentMonthRevenue || 0,
    currentMonthBookings: monthly.currentMonthBookings || 0,
    closingRate,
  };
};

export const getStaffClosingReports = async (currentUser, query = {}) => {
  const filters = await buildDealFilters({ ...query, dealStatus: "Closed" }, currentUser);
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: "$dealClosedBy",
        closedDeals: { $sum: 1 },
        totalRevenue: { $sum: { $ifNull: ["$finalPrice", 0] } },
        totalTokens: { $sum: { $ifNull: ["$tokenAmount", 0] } },
        pendingDocuments: {
          $sum: {
            $cond: [{ $eq: ["$documentsPending", true] }, 1, 0],
          },
        },
      },
    },
    { $sort: { closedDeals: -1, totalRevenue: -1 } },
  ];

  const rows = await Deal.aggregate(pipeline);
  const closerIds = rows.map((row) => row._id).filter(Boolean);
  const closers = closerIds.length
    ? await User.find({ _id: { $in: closerIds } }).select("_id name role")
    : [];
  const closerMap = new Map(closers.map((user) => [toObjectIdString(user._id), user]));

  return rows.map((row) => {
    const user = closerMap.get(toObjectIdString(row._id));

    return {
      closerId: row._id,
      closerName: user?.name || "Unknown",
      closerRole: user?.role || "",
      closedDeals: row.closedDeals,
      totalRevenue: row.totalRevenue,
      totalTokens: row.totalTokens,
      pendingDocuments: row.pendingDocuments,
    };
  });
};
