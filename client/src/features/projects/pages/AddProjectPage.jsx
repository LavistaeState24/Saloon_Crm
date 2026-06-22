import { Building2, CalendarDays, MapPin, Save, Shapes, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useLocation } from "react-router-dom";
import Button from "../../../components/common/Button";
import FormInput from "../../../components/common/FormInput";
import MultiSelectDropdown from "../../../components/common/MultiSelectDropdown";
import PageSkeleton from "../../../components/common/PageSkeleton";
import SelectDropdown from "../../../components/common/SelectDropdown";
import UploadBox from "../../../components/common/UploadBox";
import { serviceCategories, durationOptions, serviceAvailabilityOptions } from "../../../constants/theme";
import { projectService } from "../../../services/projectService";
import { uploadService } from "../../../services/uploadService";
import {
  applyServerErrors,
  dateRules,
  getErrorMessage,
  httpsUrlRules,
  numberRules,
  selectRules,
  textRules,
  toOptionalNumber,
} from "../../../utils/validation";

const initialState = {
  projectName: "",
  publicAlias: "",
  location: "",
  area: "",
  propertyType: [],
  configuration: "",
  sizeRange: { label: "", min: "", max: "", unit: "min" },
  priceRange: { min: "", max: "", currencyLabel: "INR" },
  totalPlotSize: "",
  totalBlocks: "",
  totalUnits: "",
  availableUnits: "",
  possessionDate: "",
  amenities: "",
  hasSampleVideo: "false",
  sampleVideoUrl: "",
  internalNotes: "",
  builderDetails: "",
  status: "Available",
  brochure: null,
};

const MAX_BROCHURE_SIZE_BYTES = 1000 * 1024 * 1024;

const normalizePropertyTypeKey = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();

const projectPropertyTypeValueMap = new Map(
  serviceCategories.map((option) => [normalizePropertyTypeKey(option), option])
);

const normalizeServiceCategoryItem = (item) => {
  const raw = String(item || "").trim();
  if (!raw) return "";

  const normalizedKey = normalizePropertyTypeKey(raw);
  return projectPropertyTypeValueMap.get(normalizedKey) || raw;
};

const normalizeServiceCategoryValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(normalizeServiceCategoryItem).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map(normalizeServiceCategoryItem)
      .filter(Boolean);
  }

  return [];
};

const getServiceCategorySource = (service) => {
  const serviceCategoryValue = service?.propertyType;

  if (Array.isArray(serviceCategoryValue) && serviceCategoryValue.length) {
    return serviceCategoryValue;
  }

  if (typeof serviceCategoryValue === "string" && serviceCategoryValue.trim()) {
    return serviceCategoryValue;
  }

  return [];
};

const parseSizeRange = (value) => {
  const normalized = String(value || "")
    .trim()
    .replace(/[â€“â€”]/g, "-")
    .replace(/\bto\b/gi, "-");
  const matches = normalized.match(/\d+(\.\d+)?/g) || [];

  if (!matches.length) {
    return { min: undefined, max: undefined };
  }

  const numbers = matches.map(Number).filter((item) => !Number.isNaN(item));
  return {
    min: numbers[0],
    max: numbers[1] ?? numbers[0],
  };
};

const formatCompactPrice = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "";
  }

  if (amount >= 10000000) {
    return `${(amount / 10000000).toFixed(amount % 10000000 === 0 ? 0 : 1)} Cr`;
  }

  if (amount >= 100000) {
    return `${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)} Lac`;
  }

  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K`;
  }

  return amount.toString();
};

const mapProjectToForm = (project) => (
  {
    projectName: project.projectName || "",
    publicAlias: project.publicAlias || "",
    location: project.location || "",
    area: project.area || "",
    propertyType: normalizeServiceCategoryValue(getServiceCategorySource(project)),
    configuration: project.configuration || "",
    sizeRange: {
      label: project.sizeRange?.label || "",
      min: project.sizeRange?.min?.toString() || "",
      max: project.sizeRange?.max?.toString() || "",
      unit: project.sizeRange?.unit || "min",
    },
    priceRange: {
      min: project.priceRange?.min?.toString() || "",
      max: project.priceRange?.max?.toString() || "",
      currencyLabel: project.priceRange?.currencyLabel || "INR",
    },
    totalPlotSize: project.totalPlotSize || "",
    totalBlocks: project.totalBlocks?.toString() || "",
    totalUnits: project.totalUnits?.toString() || "",
    availableUnits: project.availableUnits?.toString() || "",
    possessionDate: project.possessionDate ? new Date(project.possessionDate).toISOString().slice(0, 10) : "",
    amenities: Array.isArray(project.amenities) ? project.amenities.join(", ") : "",
    hasSampleVideo: project.hasSampleVideo ? "true" : "false",
    sampleVideoUrl: project.sampleVideoUrl || "",
    internalNotes: project.internalNotes || "",
    builderDetails: project.builderDetails || "",
    status: project.status || "Available",
    brochure: project.brochure || null,
  });

const normalizeBrochureAsset = (brochure) => {
  if (!brochure?.url) {
    return null;
  }

  return {
    ...brochure,
    name:
      brochure.name ||
      brochure.filename ||
      brochure.url.split("/").pop()?.replace(/^\d+-/, "") ||
      "Brochure.pdf",
    downloadUrl: brochure.downloadUrl || brochure.url,
  };
};

export default function AddProjectPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const goBackToProjects = () => {
    navigate(searchParams.get("returnTo") || "/projects");
  };
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [formError, setFormError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [isLoadingProject, setIsLoadingProject] = useState(isEditMode);
  const [brochureAsset, setBrochureAsset] = useState(null);
  const [brochureError, setBrochureError] = useState("");
  const [isUploadingBrochure, setIsUploadingBrochure] = useState(false);
  const {
    control,
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors, isSubmitting },
    setError,
    setValue,
    reset,
  } = useForm({
    mode: "onBlur",
    shouldUnregister: false,
    defaultValues: initialState,
  });

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    const loadProject = async () => {
      setIsLoadingProject(true);
      setLoadError("");

      try {
        const project = await projectService.getById(id);
        reset(mapProjectToForm(project));
        const normalizedBrochure = normalizeBrochureAsset(project.brochure);
        setBrochureAsset(normalizedBrochure);
        setValue("brochure", normalizedBrochure, { shouldDirty: false, shouldValidate: false });
      } catch (requestError) {
        setLoadError(requestError.response?.data?.message || "Unable to load service details");
      } finally {
        setIsLoadingProject(false);
      }
    };

    loadProject();
  }, [id, isEditMode, reset, setValue]);

  const totalUnits = watch("totalUnits");
  const hasSampleVideo = watch("hasSampleVideo");
  const priceMinValue = watch("priceRange.min");
  const priceMaxValue = watch("priceRange.max");

  useEffect(() => {
    if (totalUnits !== undefined) {
      trigger("availableUnits");
    }
  }, [totalUnits, trigger]);

  const handleBrochureUpload = async (file) => {
    setBrochureError("");

    if (file.type !== "application/pdf") {
      setBrochureError("Only PDF brochure files are allowed");
      return;
    }

    if (file.size > MAX_BROCHURE_SIZE_BYTES) {
      setBrochureError("Brochure PDF must be 1000MB or smaller");
      return;
    }

    setIsUploadingBrochure(true);

    try {
      const [uploadedAsset] = await uploadService.uploadFiles([file]);
      setBrochureAsset(uploadedAsset);
      setValue("brochure", uploadedAsset, { shouldDirty: true, shouldValidate: true });
    } catch (requestError) {
      setBrochureError(requestError.response?.data?.message || "Unable to upload brochure");
    } finally {
      setIsUploadingBrochure(false);
    }
  };

  const removeBrochure = () => {
    setBrochureAsset(null);
    setBrochureError("");
    setValue("brochure", null, { shouldDirty: true, shouldValidate: true });
  };

  const onSubmit = async (formValues) => {
    setFormError("");

    try {
      const parsedSizeRange = parseSizeRange(formValues.sizeRange.label);
      const normalizedPriceMin = toOptionalNumber(formValues.priceRange.min);
      const normalizedPriceMax = toOptionalNumber(formValues.priceRange.max);

      const payload = {
        ...formValues,
        propertyType: normalizeServiceCategoryValue(formValues.propertyType),
        totalBlocks: toOptionalNumber(formValues.totalBlocks) ?? 0,
        totalUnits: toOptionalNumber(formValues.totalUnits) ?? 0,
        availableUnits: toOptionalNumber(formValues.availableUnits),
        sizeRange: {
          label: formValues.sizeRange.label,
          min: parsedSizeRange.min,
          max: parsedSizeRange.max,
          unit: "min",
        },
        priceRange: {
          min: normalizedPriceMin,
          max: normalizedPriceMax,
          currencyLabel: "INR",
        },
        amenities: formValues.amenities
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        brochure: brochureAsset || null,
        hasSampleVideo: formValues.hasSampleVideo === "true",
        sampleVideoUrl: formValues.hasSampleVideo === "true" ? formValues.sampleVideoUrl : null,
      };

      if (isEditMode) {
        await projectService.update(id, payload);
        goBackToProjects();
        return;
      }

      await projectService.create(payload);
      goBackToProjects();
    } catch (requestError) {
      applyServerErrors(requestError, setError, setFormError);
    }
  };

  if (isLoadingProject) {
    return <PageSkeleton variant="form" />;
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-rose-300">{loadError}</p>
        <Button variant="secondary" onClick={() => navigate("/projects")}>
          Back to Services
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-gold">
          {isEditMode ? "Service Editing" : "Service Onboarding"}
        </p>
        <h2 className="mt-2 font-display text-3xl">
          {isEditMode ? "Update premium service details" : "Add a premium service"}
        </h2>
      </div>

      <form className="grid gap-5 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass lg:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          label="Service Name"
          icon={Building2}
          placeholder="Enter service name"
          error={getErrorMessage(errors.projectName)}
          {...register("projectName", textRules("Service name", { min: 3, max: 100 }))}
        />

        <FormInput
          label="Display Name"
          icon={Building2}
          placeholder="Enter service display name"
          error={getErrorMessage(errors.publicAlias)}
          {...register("publicAlias", textRules("Display name", { min: 3, max: 100 }))}
        />

        <FormInput
          label="Branch"
          icon={MapPin}
          placeholder="Enter branch name"
          error={getErrorMessage(errors.location)}
          {...register("location", textRules("Branch", { min: 2, max: 100 }))}
        />

        <FormInput
          label="Branch Area"
          icon={MapPin}
          placeholder="Enter area name"
          error={getErrorMessage(errors.area)}
          {...register("area", textRules("Branch area", { min: 2, max: 80 }))}
        />

        <Controller
          control={control}
          name="propertyType"
          defaultValue={[]}
          render={({ field }) => (
            <MultiSelectDropdown
              label="Service Category"
              icon={Shapes}
              options={serviceCategories}
              placeholder="Select service type"
              error={getErrorMessage(errors.propertyType)}
              value={field.value || []}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
            />
          )}
        />

        <SelectDropdown
          label="Duration"
          icon={Shapes}
          options={durationOptions}
          placeholder="Select duration"
          error={getErrorMessage(errors.configuration)}
          {...register("configuration", selectRules("Duration"))}
        />

        <FormInput
          label="Service Duration / Session Time"
          placeholder="Example: 30 min / 60 min / 90 min"
          error={getErrorMessage(errors.sizeRange?.label)}
          {...register("sizeRange.label", textRules("Service duration", { min: 1, max: 50 }))}
        />

        <div className="space-y-2">
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              label="Min Service Price"
              icon={Wallet}
              type="number"
              placeholder="Optional minimum price"
              error={getErrorMessage(errors.priceRange?.min)}
              {...register("priceRange.min", numberRules("Minimum price", { required: false, min: 1 }))}
            />
            <FormInput
              label="Max Service Price"
              icon={Wallet}
              type="number"
              placeholder="Optional maximum price"
              error={getErrorMessage(errors.priceRange?.max)}
              {...register("priceRange.max", {
                ...numberRules("Maximum price", { required: false, min: 1 }),
                validate: (value) => {
                  const baseValidation = numberRules("Maximum price", { required: false, min: 1 }).validate(value);

                  if (baseValidation !== true) {
                    return baseValidation;
                  }

                  if (value === "" || value === null || value === undefined) {
                    return true;
                  }

                  const minValue = toOptionalNumber(priceMinValue);
                  const maxValue = toOptionalNumber(value);

                  if (minValue === undefined || maxValue === undefined) {
                    return true;
                  }

                  return maxValue >= minValue || "Maximum price must be greater than or equal to minimum price";
                },
              })}
            />
          </div>
          {formatCompactPrice(priceMinValue) || formatCompactPrice(priceMaxValue) ? (
            <div className="inline-flex rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium text-gold-2">
              {formatCompactPrice(priceMinValue) && formatCompactPrice(priceMaxValue)
                ? `${formatCompactPrice(priceMinValue)} - ${formatCompactPrice(priceMaxValue)}`
                : formatCompactPrice(priceMinValue) || formatCompactPrice(priceMaxValue)}
            </div>
          ) : null}
        </div>

        <FormInput
          label="Total Stock / Capacity"
          placeholder="Enter total stock or capacity"
          error={getErrorMessage(errors.totalPlotSize)}
          {...register("totalPlotSize", textRules("Total stock or capacity", { min: 1, max: 50, required: false }))}
        />

        <FormInput
          label="Total Branches"
          type="number"
          placeholder="Enter number of branches"
          error={getErrorMessage(errors.totalBlocks)}
          {...register("totalBlocks", numberRules("Total branches", { required: true, min: 0, integer: true }))}
        />

        <FormInput
          label="Total Slots"
          type="number"
          placeholder="Enter total slots"
          error={getErrorMessage(errors.totalUnits)}
          {...register("totalUnits", numberRules("Total slots", { required: true, min: 1, integer: true }))}
        />

        <FormInput
          label="Available Slots"
          type="number"
          placeholder="Optional available slots"
          error={getErrorMessage(errors.availableUnits)}
          {...register("availableUnits", {
            ...numberRules("Available slots", { required: false, min: 0, integer: true }),
            validate: (value) => {
              const baseValidation = numberRules("Available slots", { required: false, min: 0, integer: true }).validate(value);

              if (baseValidation !== true) {
                return baseValidation;
              }

              if (value === "" || value === null || value === undefined) {
                return true;
              }

              return Number(value) <= Number(totalUnits || 0) || "Available slots cannot exceed total slots";
            },
          })}
        />

        <FormInput
          label="Availability Date"
          icon={CalendarDays}
          type="date"
          error={getErrorMessage(errors.possessionDate)}
          {...register("possessionDate", dateRules("Availability date", { required: true }))}
        />

        <SelectDropdown
          label="Service Availability"
          options={serviceAvailabilityOptions}
          error={getErrorMessage(errors.status)}
          {...register("status", selectRules("Service availability"))}
        />

        <FormInput
          label="Includes"
          className="lg:col-span-1"
          placeholder="Services, add-ons, perks"
          error={getErrorMessage(errors.amenities)}
          {...register("amenities", textRules("Includes", { min: 3, max: 300 }))}
        />

        <div className="flex flex-col gap-2 lg:col-span-1">
          <span className="text-md text-muted">Service Video</span>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-3 text-sm text-ivory">
                <input
                  type="radio"
                  value="true"
                  className="h-4 w-4 accent-[#c9a35d]"
                  {...register("hasSampleVideo", { required: "Service video selection is required" })}
                />
                <span>Add Video URL</span>
              </label>
              <label className="flex items-center gap-3 text-sm text-ivory">
                <input
                  type="radio"
                  value="false"
                  className="h-4 w-4 accent-[#c9a35d]"
                  {...register("hasSampleVideo", { required: "Service video selection is required" })}
                />
                <span>No Video Available</span>
              </label>
            </div>
            {errors.hasSampleVideo ? (
              <p className="mt-3 text-sm text-rose-300">{getErrorMessage(errors.hasSampleVideo)}</p>
            ) : null}
          </div>
          {hasSampleVideo === "true" ? (
            <FormInput
              label="Video URL"
              placeholder="Paste YouTube / Vimeo / HTTPS link"
              error={getErrorMessage(errors.sampleVideoUrl)}
              {...register("sampleVideoUrl", httpsUrlRules("Video URL", { required: true }))}
            />
          ) : null}
        </div>

        <FormInput
          label="Service Provider Details"
          className="lg:col-span-1"
          placeholder="Enter provider / brand details"
          error={getErrorMessage(errors.builderDetails)}
          {...register("builderDetails", textRules("Provider details", { min: 3, max: 300, required: false }))}
        />

        <FormInput
          label="Internal Notes"
          className="lg:col-span-1"
          placeholder="Add internal notes (not visible to customer)"
          error={getErrorMessage(errors.internalNotes)}
          {...register("internalNotes", textRules("Internal notes", { min: 0, max: 500, required: false }))}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:col-span-1 lg:grid-cols-1">
          <input type="hidden" {...register("brochure")} />
          <UploadBox
            label="Service Brochure Upload"
            helpText="Click to upload or drag and drop a PDF brochure up to 1000MB"
            asset={brochureAsset}
            uploading={isUploadingBrochure}
            error={brochureError || getErrorMessage(errors.brochure)}
            onFileChange={handleBrochureUpload}
            onRemove={removeBrochure}
          />
        </div>

        {formError ? <p className="text-sm text-rose-300 lg:col-span-2">{formError}</p> : null}

        <div className="flex justify-end gap-3 text-right lg:col-span-2">
          {isEditMode ? (
            <Button type="button" variant="secondary" onClick={goBackToProjects}>
              Cancel
            </Button>
          ) : null}
          <Button disabled={isSubmitting} icon={Save}>
            {isSubmitting ? "Saving..." : isEditMode ? "Update Service" : "Save Service"}
          </Button>
        </div>
      </form>
    </div>
  );
}
