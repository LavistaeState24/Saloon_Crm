import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link2, ScrollText, Send, Sparkles } from "lucide-react";
import { useParams } from "react-router-dom";

import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import FormInput from "../../../components/common/FormInput";
import Modal from "../../../components/common/Modal";
import PageSkeleton from "../../../components/common/PageSkeleton";
import { useAuth } from "../../../hooks/useAuth";
import { useCan } from "../../../hooks/useCan";
import { projectService } from "../../../services/projectService";
import { shareRecordService } from "../../../services/shareRecordService";
import { resolveAssetUrl } from "../../../services/uploadService";
import { authStorage } from "../../../utils/storage";
import {
  applyServerErrors,
  emailRules,
  getErrorMessage,
  phoneRules,
  textRules,
} from "../../../utils/validation";

const formatWhatsAppPhone = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
};

const buildWhatsAppMessage = (safeProject) => {
  const includesValue = safeProject.includes?.length ? safeProject.includes.join(", ") : null;
  const photosValue = safeProject.photos?.length ? safeProject.photos.join(", ") : null;

  const format = (label, value) => (value ? `• *${label}:* ${value}` : null);

  const lines = [
    "*Salon Service Details*",
    "",
    format("Branch", safeProject.location),
    format("Branch Area", safeProject.area),
    format("Service Category", safeProject.propertyType),
    format("Duration", safeProject.configuration),
    format("Service Duration / Session Time", safeProject.size),
    format("Service Price", safeProject.priceRange),
    format("Service Availability Date", safeProject.availabilityDate),
    format("Includes", includesValue),
    format("Service Brochure", safeProject.brochureUrl),
    format("Service Video", safeProject.sampleVideoUrl),
    format("Gallery", photosValue),
    "",
    "*For Booking & Service Details:*",
    safeProject.contact?.name ? `*${safeProject.contact.name}*` : null,
    safeProject.contact?.phone || null,
    "",
    "WhatsApp us for appointment booking and service availability",
  ];

  return lines.filter(Boolean).join("\n");
};

const formatPropertyTypes = (value) => (Array.isArray(value) ? value.join(", ") : value || "Not added");

const formatPrice = (value) => {
  if (!value?.min) {
    return "Not added";
  }

  if (!value.max || value.min === value.max) {
    return value.min.toLocaleString("en-IN");
  }

  return `${value.min.toLocaleString("en-IN")} - ${value.max.toLocaleString("en-IN")}`;
};

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const canCreateShareRecords = useCan("shareRecords", "create");
  const [project, setProject] = useState(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareError, setShareError] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      clientName: "",
      clientPhone: "",
      clientEmail: "",
      clientRequirement: "",
    },
  });

  useEffect(() => {
    const loadProject = async () => {
      const data = await projectService.getById(id);
      setProject(data);
    };

    loadProject();
  }, [id]);

  const handleWhatsAppShare = async (formValues) => {
    setShareError("");

    if (!authStorage.getRawToken()) {
      setShareError("Your session has expired. Please log in again before sharing.");
      return;
    }

    if (!user?.id || !user?.name || !user?.phone) {
      setShareError("Your account details are incomplete. Please log in again before sharing.");
      return;
    }

    const formattedPhone = formatWhatsAppPhone(formValues.clientPhone);

    if (!formattedPhone) {
      setShareError("Enter a valid WhatsApp number before sharing.");
      return;
    }

    const popupWindow = window.open("", "_blank");

    try {
      const safeProject = await projectService.getClientShare(id);
      const whatsappMessage = buildWhatsAppMessage(safeProject);

      await shareRecordService.create({
        clientName: formValues.clientName,
        clientPhone: formValues.clientPhone,
        clientEmail: formValues.clientEmail || undefined,
        clientRequirement: formValues.clientRequirement || undefined,
        projectId: id,
        projectPublicAlias: safeProject.publicAlias,
        sharedBy: user.id,
        sharedByName: user.name,
        sharedByPhone: user.phone,
        sharedFields: {
          branchArea: safeProject.area,
          duration: safeProject.configuration,
          sessionTime: safeProject.size,
          servicePrice: safeProject.priceRange,
          availabilityDate: safeProject.availabilityDate,
          includes: safeProject.includes?.map((item) =>
            item.length > 100 ? item.slice(0, 90) + "..." : item
          ),
          brochureUrl: safeProject.brochureUrl,
          sampleVideoUrl: safeProject.sampleVideoUrl,
          photos: safeProject.photos,
        },
        shareChannel: "WhatsApp",
        whatsappMessage,
        status: "shared",
      });

      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(whatsappMessage)}`;

      if (popupWindow) {
        popupWindow.location.href = whatsappUrl;
      } else {
        window.location.assign(whatsappUrl);
      }

      setIsShareOpen(false);
      reset();
    } catch (requestError) {
      if (popupWindow) {
        popupWindow.close();
      }

      applyServerErrors(requestError, setError, setShareError);
    }
  };

  if (!project) {
    return <PageSkeleton variant="detail" />;
  }

  const brochureUrl = resolveAssetUrl(project.brochure?.url);
  const sampleVideoUrl = resolveAssetUrl(project.sampleVideoUrl);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">{project.location}</p>
          <h2 className="mt-2 font-display text-4xl">{project.projectName}</h2>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone="green">{project.status}</Badge>
          {canCreateShareRecords ? (
            <Button onClick={() => setIsShareOpen(true)} icon={Link2}>
              Share Service
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-2">
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-gold-2" />
            <h3 className="font-display text-2xl">Service Details</h3>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              ["Service Name", project.projectName],
              ["Display Name", project.publicAlias],
              ["Branch", project.location],
              ["Branch Area", project.area],
              ["Service Category", formatPropertyTypes(project.propertyType)],
              ["Duration", project.configuration],
              ["Service Duration / Session Time", project.sizeRange?.label || `${project.sizeRange?.min || "-"} - ${project.sizeRange?.max || "-"}`],
              ["Service Price", formatPrice(project.priceRange)],
              ["Total Stock / Capacity", project.totalPlotSize],
              ["Total Branches", project.totalBlocks],
              ["Total Slots", project.totalUnits],
              ["Available Slots", project.availableUnits],
              ["Availability Date", project.possessionDate ? new Date(project.possessionDate).toLocaleDateString("en-IN") : "Not added"],
              ["Service Availability", project.status],
              ["Includes", Array.isArray(project.amenities) ? project.amenities.join(", ") : project.amenities],
              ["Service Video", sampleVideoUrl],
            ].map(([label, value]) => (
              <div key={label} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{label}</p>
                <p className="mt-2 break-words text-base font-medium text-ivory">{value || "Not added"}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
          <div className="flex items-center gap-3">
            <ScrollText className="h-5 w-5 text-gold-2" />
            <h3 className="font-display text-2xl">Internal Details</h3>
          </div>

          <div className="mt-5 space-y-4">
            {[
              ["Service Provider Details", project.builderDetails],
              ["Internal Notes", project.internalNotes],
              ["Service Documents", project.floorPlans?.length ? `${project.floorPlans.length} file(s) added` : ""],
              ["Service Images", project.projectImages?.length ? `${project.projectImages.length} image(s) added` : ""],
            ].map(([label, value]) => (
              <div key={label} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{label}</p>
                <p className="mt-2 break-words text-base font-medium text-ivory">{value || "Not added"}</p>
              </div>
            ))}
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Brochure</p>
              {brochureUrl ? (
                <a
                  href={brochureUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex break-all text-base font-medium text-gold-2 hover:text-gold"
                >
                  Open brochure PDF
                </a>
              ) : (
                <p className="mt-2 break-words text-base font-medium text-ivory">Not added</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal title="Share Customer-Safe Service Details" isOpen={canCreateShareRecords && isShareOpen} onClose={() => setIsShareOpen(false)}>
        <form className="space-y-4" onSubmit={handleSubmit(handleWhatsAppShare)}>
          <FormInput
            label="Customer Name"
            placeholder="Enter customer name"
            error={getErrorMessage(errors.clientName)}
            {...register("clientName", textRules("Customer name", { min: 3, max: 60 }))}
          />
          <FormInput
            label="Customer WhatsApp Number"
            placeholder="Enter 10 digit mobile number"
            error={getErrorMessage(errors.clientPhone)}
            {...register("clientPhone", phoneRules())}
          />
          <FormInput
            label="Customer Email"
            placeholder="Enter customer email"
            error={getErrorMessage(errors.clientEmail)}
            {...register("clientEmail", emailRules({ required: false }))}
          />
          <FormInput
            label="Customer Service Requirement"
            placeholder="Optional service requirement"
            error={getErrorMessage(errors.clientRequirement)}
            {...register("clientRequirement", textRules("Service requirement", { min: 3, max: 200, required: false }))}
          />

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-muted">
            <p className="text-ivory">Shared by</p>
            <p className="mt-2">{user?.name}</p>
            <p>{user?.phone}</p>
          </div>

          {shareError ? <p className="text-sm text-rose-300">{shareError}</p> : null}

          <div className="flex justify-end">
            <Button disabled={isSubmitting} icon={Send}>
              {isSubmitting ? "Preparing..." : "Open WhatsApp"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
