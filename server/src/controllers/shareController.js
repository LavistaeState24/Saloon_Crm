import { createShareLink, getShareLinkPreview } from "../services/shareService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createShareLinkHandler = asyncHandler(async (req, res) => {
  const shareLink = await createShareLink(req.body, req.user._id);
  res.status(201).json({
    success: true,
    data: {
      ...shareLink.toObject(),
      shareUrl: `${req.protocol}://${req.get("host")}/api/share-links/public/${shareLink.token}`,
    },
  });
});

export const getShareLinkPreviewHandler = asyncHandler(async (req, res) => {
  const preview = await getShareLinkPreview(req.params.token);
  res.json({ success: true, data: preview });
});

