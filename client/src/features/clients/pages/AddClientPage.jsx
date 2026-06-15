import {
  Building2,
  CalendarDays,
  ClipboardList,
  IndianRupee,
  Mail,
  MapPin,
  Phone,
  Save,
  Shapes,
  UserCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/common/FormInput";
import PageSkeleton from "../../../components/common/PageSkeleton";
import SelectDropdown from "../../../components/common/SelectDropdown";
import {
  interestLevelOptions,
  leadPurposeOptions,
  leadStatusOptions,
  propertyConditionOptions,
  propertySourceOptions,
  propertyStatusOptions,
  propertyTypes,
  requirementTypeOptions,
} from "../../../constants/theme";
import { useAuth } from "../../../hooks/useAuth";
import { clientService } from "../../../services/clientService";
import { userService } from "../../../services/userService";
import {
  applyServerErrors,
  dateRules,
  emailRules,
  getErrorMessage,
  numberRules,
  phoneRules,
  selectRules,
  textRules,
  toOptionalNumber,
} from "../../../utils/validation";
import { formatCompactPrice } from "../clientPipeline";

const initialState = {
  ownerName: "",
  clientPhoneNumber: "",
  email: "",
  address: "",
  premiseName: "",
  premiseArea: "",
  sourceOfProperty: "",
  propertyType: "",
  ownerPrice: "",
  propertyCondition: "",
  propertyAge: "",
  propertySize: "",
  internalNotes: "",
  propertyStatus: "",
  dateOfAddingProperty: "",
  assignedStaff: "",
  leadStatus: "New Lead",
  interestLevel: "Warm",
  source: "",
  purpose: "",
  budgetMin: "",
  budgetMax: "",
  requirementType: "",
  areaPreference: "",
  notes: "",
  lastCallStatus: "",
  nextFollowUpDate: "",
};

const mapClientToForm = (client) => ({
  ownerName: client.ownerName || "",
  clientPhoneNumber: client.clientPhoneNumber || "",
  email: client.email || "",
  address: client.address || "",
  premiseName: client.premiseName || "",
  premiseArea: client.premiseArea || "",
  sourceOfProperty: client.sourceOfProperty || "",
  propertyType: client.propertyType || "",
  ownerPrice: client.ownerPrice?.toString() || "",
  propertyCondition: client.propertyCondition || "",
  propertyAge: client.propertyAge || "",
  propertySize: client.propertySize || "",
  internalNotes: client.internalNotes || "",
  propertyStatus: client.propertyStatus || "",
  dateOfAddingProperty: client.dateOfAddingProperty ? new Date(client.dateOfAddingProperty).toISOString().slice(0, 10) : "",
  assignedStaff: client.assignedStaff?._id || client.assignedStaff || "",
  leadStatus: client.leadStatus || "New Lead",
  interestLevel: client.interestLevel || "Warm",
  source: client.source || "",
  purpose: client.purpose || "",
  budgetMin: client.budgetMin?.toString() || "",
  budgetMax: client.budgetMax?.toString() || "",
  requirementType: client.requirementType || "",
  areaPreference: client.areaPreference || "",
  notes: client.notes || "",
  lastCallStatus: client.lastCallStatus || "",
  nextFollowUpDate: client.nextFollowUpDate ? new Date(client.nextFollowUpDate).toISOString().slice(0, 10) : "",
});

export default function AddClientPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isEditMode = Boolean(id);
  const isSalesEditMode = isEditMode && user?.role === "sales";
  const [formError, setFormError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [staffOptions, setStaffOptions] = useState([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
    reset,
    setValue,
  } = useForm({
    mode: "onBlur",
    defaultValues: initialState,
  });

  useEffect(() => {
    const loadPage = async () => {
      setIsLoadingPage(true);
      setLoadError("");

      try {
        const [assignableUsers, client] = await Promise.all([
          userService.listAssignable(),
          isEditMode ? clientService.getById(id) : Promise.resolve(null),
        ]);

        const nextStaffOptions = assignableUsers.map((user) => ({
          value: user.id,
          label: `${user.name} (${user.role})`,
        }));

        setStaffOptions(nextStaffOptions);

        if (client) {
          reset(mapClientToForm(client));
        } else {
          reset(initialState);

          if (assignableUsers.length === 1) {
            setValue("assignedStaff", assignableUsers[0].id, { shouldDirty: false });
          }
        }
      } catch (requestError) {
        setLoadError(requestError.response?.data?.message || "Unable to load customer details");
      } finally {
        setIsLoadingPage(false);
      }
    };

    loadPage();
  }, [id, isEditMode, reset, setValue]);

  const ownerPrice = watch("ownerPrice");
  const budgetMin = watch("budgetMin");

  const onSubmit = async (formValues) => {
    setFormError("");

    try {
      const payload = {
        ...formValues,
        ownerPrice: toOptionalNumber(formValues.ownerPrice),
        budgetMin: toOptionalNumber(formValues.budgetMin),
        budgetMax: toOptionalNumber(formValues.budgetMax),
      };

      if (!payload.assignedStaff) {
        delete payload.assignedStaff;
      }

      if (isEditMode) {
        await clientService.update(id, payload);
        navigate(`/clients/${id}`);
        return;
      }

      await clientService.create(payload);
      navigate("/clients");
    } catch (requestError) {
      applyServerErrors(requestError, setError, setFormError);
    }
  };

  if (isLoadingPage) {
    return <PageSkeleton variant="form" />;
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-rose-300">{loadError}</p>
        <Button variant="secondary" onClick={() => navigate("/clients")}>
          Back to Customers
        </Button>
      </div>
    );
  }

  if (isSalesEditMode) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted">Sales users can update customers from the customer details quick update panel only.</p>
        <Button variant="secondary" onClick={() => navigate(`/clients/${id}`)}>
          Back to Customer Details
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-md tracking-[0.1em] text-gold">{isEditMode ? "Customer Editing" : "Customer Intake"}</p>
        <h2 className="mt-2 font-display text-3xl">
          {isEditMode ? "Update customer pipeline record" : "Create a new customer pipeline record"}
        </h2>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <section className="grid gap-5 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass lg:grid-cols-2">
          <div className="lg:col-span-2">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">Pipeline Control</p>
            <h3 className="mt-2 font-display text-2xl">Ownership, status, and requirement fit</h3>
          </div>

          <SelectDropdown
            label="Assigned Staff"
            icon={UserCheck}
            options={staffOptions}
            placeholder="Auto assign to creator"
            error={getErrorMessage(errors.assignedStaff)}
            {...register("assignedStaff")}
          />

          <SelectDropdown
            label="Customer Status"
            icon={ClipboardList}
            options={leadStatusOptions}
            error={getErrorMessage(errors.leadStatus)}
            {...register("leadStatus", selectRules("Customer status"))}
          />

          <SelectDropdown
            label="Interest Level"
            icon={Shapes}
            options={interestLevelOptions}
            error={getErrorMessage(errors.interestLevel)}
            {...register("interestLevel", selectRules("Interest level"))}
          />

          <FormInput
            label="Customer Source"
            icon={Shapes}
            placeholder="Website, referral, call, broker..."
            error={getErrorMessage(errors.source)}
            {...register("source", textRules("Customer source", { min: 0, max: 100, required: false }))}
          />

          <SelectDropdown
            label="Purpose"
            icon={Shapes}
            options={leadPurposeOptions}
            placeholder="Select purpose"
            error={getErrorMessage(errors.purpose)}
            {...register("purpose")}
          />

          <SelectDropdown
            label="Requirement Type"
            icon={Shapes}
            options={requirementTypeOptions}
            placeholder="Select requirement type"
            error={getErrorMessage(errors.requirementType)}
            {...register("requirementType")}
          />

          <FormInput
            label="Area Preference"
            icon={MapPin}
            placeholder="Preferred localities or micro-markets"
            error={getErrorMessage(errors.areaPreference)}
            {...register("areaPreference", textRules("Area preference", { min: 0, max: 120, required: false }))}
          />

          <div className="space-y-2">
            <FormInput
              label="Minimum Budget"
              icon={IndianRupee}
              type="number"
              placeholder="Enter minimum budget"
              error={getErrorMessage(errors.budgetMin)}
              {...register("budgetMin", numberRules("Minimum budget", { required: false, min: 0 }))}
            />
            {formatCompactPrice(budgetMin) ? (
              <div className="inline-flex rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium text-gold-2">
                {formatCompactPrice(budgetMin)}
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <FormInput
              label="Maximum Budget"
              icon={IndianRupee}
              type="number"
              placeholder="Enter maximum budget"
              error={getErrorMessage(errors.budgetMax)}
              {...register("budgetMax", {
                ...numberRules("Maximum budget", { required: false, min: 0 }),
                validate: (value) => {
                  const baseValidation = numberRules("Maximum budget", { required: false, min: 0 }).validate(value);

                  if (baseValidation !== true) {
                    return baseValidation;
                  }

                  if (!value || !budgetMin) {
                    return true;
                  }

                  return Number(value) >= Number(budgetMin) || "Maximum budget must be at least minimum budget";
                },
              })}
            />
            {formatCompactPrice(watch("budgetMax")) ? (
              <div className="inline-flex rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium text-gold-2">
                {formatCompactPrice(watch("budgetMax"))}
              </div>
            ) : null}
          </div>

          <FormInput
            label="Customer Notes"
            as="textarea"
            rows={5}
            className="lg:col-span-2"
            placeholder="Conversation summary, next step, objections, urgency..."
            error={getErrorMessage(errors.notes)}
            {...register("notes", textRules("Notes", { min: 0, max: 2000, required: false }))}
          />

          <FormInput
            label="Last Call Status"
            placeholder="Answered, no response, busy..."
            error={getErrorMessage(errors.lastCallStatus)}
            {...register("lastCallStatus", textRules("Last call status", { min: 0, max: 120, required: false }))}
          />

          <FormInput
            label="Next Reminder Date"
            type="date"
            error={getErrorMessage(errors.nextFollowUpDate)}
            {...register("nextFollowUpDate")}
          />
        </section>

        <section className="grid gap-5 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass lg:grid-cols-2">
          <div className="lg:col-span-2">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">Customer Profile</p>
            <h3 className="mt-2 font-display text-2xl">Customer Details</h3>
          </div>

          <FormInput
            label="Customer Name"
            icon={UserRound}
            placeholder="Enter client name"
            error={getErrorMessage(errors.ownerName)}
            {...register("ownerName", textRules("Customer name", { min: 3, max: 80 }))}
          />

          <FormInput
            label="Phone Number"
            icon={Phone}
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="Enter phone number"
            error={getErrorMessage(errors.clientPhoneNumber)}
            {...register(
              "clientPhoneNumber",
              phoneRules({
                requiredMessage: "Customer phone number is required",
                invalidMessage: "Customer phone number must be a valid 10-digit Indian mobile number",
              })
            )}
          />

          <FormInput
            label="Email"
            icon={Mail}
            type="email"
            placeholder="Enter customer email"
            error={getErrorMessage(errors.email)}
            {...register("email", emailRules({ required: false }))}
          />

          <FormInput
            label="Address"
            icon={MapPin}
            placeholder="Enter customer address"
            error={getErrorMessage(errors.address)}
            {...register("address", textRules("Address", { min: 5, max: 200 }))}
          />

          <FormInput
            label="Premise Name"
            icon={Building2}
            placeholder="Enter premise or project name"
            error={getErrorMessage(errors.premiseName)}
            {...register("premiseName", textRules("Premise name", {  min: 0, max: 100, required: false}))}
          />

          <FormInput
            label="Premise Area"
            icon={MapPin}
            placeholder="Enter premise area"
            error={getErrorMessage(errors.premiseArea)}
            {...register("premiseArea", textRules("Premise area", { min: 2, max: 80 }))}
          />

          <SelectDropdown
            label="Source of Property"
            icon={Shapes}
            options={propertySourceOptions}
            error={getErrorMessage(errors.sourceOfProperty)}
            {...register("sourceOfProperty", selectRules("Source of property"))}
          />

          <SelectDropdown
            label="Property Type"
            icon={Shapes}
            options={propertyTypes}
            error={getErrorMessage(errors.propertyType)}
            {...register("propertyType", selectRules("Property type"))}
          />

          <SelectDropdown
            label="Property Status"
            icon={Shapes}
            options={propertyStatusOptions}
            placeholder="Select property status"
            error={getErrorMessage(errors.propertyStatus)}
            {...register("propertyStatus", selectRules("Property status", { requiredMessage: "Property status is required" }))}
          />

          <div className="space-y-2">
            <FormInput
              label="Owner Price"
              icon={IndianRupee}
              type="number"
              placeholder="Enter owner price"
              error={getErrorMessage(errors.ownerPrice)}
              {...register("ownerPrice", numberRules("Owner price", { min: 0 }))}
            />
            {formatCompactPrice(ownerPrice) ? (
              <div className="inline-flex rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium text-gold-2">
                {formatCompactPrice(ownerPrice)}
              </div>
            ) : null}
          </div>

          <SelectDropdown
            label="Property Condition"
            icon={Shapes}
            options={propertyConditionOptions}
            error={getErrorMessage(errors.propertyCondition)}
            {...register("propertyCondition", selectRules("Property condition"))}
          />

          <FormInput
            label="Property Age"
            placeholder="e.g. 5 years"
            error={getErrorMessage(errors.propertyAge)}
            {...register("propertyAge", textRules("Property age", { min: 1, max: 80 }))}
          />

          <FormInput
            label="Size of Property"
            placeholder="e.g. 1450 sq ft (optional)"
            error={getErrorMessage(errors.propertySize)}
            {...register("propertySize", textRules("Size of property", { min: 0, max: 80, required: false }))}
          />

          <FormInput
            label="Date Added"
            icon={CalendarDays}
            type="date"
            className="lg:col-span-2"
            error={getErrorMessage(errors.dateOfAddingProperty)}
            {...register("dateOfAddingProperty", dateRules("Date of adding property", { required: true }))}
          />

          <FormInput
            label="Internal Notes"
            as="textarea"
            rows={4}
            className="lg:col-span-2"
            placeholder="Internal context related to property intake"
            error={getErrorMessage(errors.internalNotes)}
            {...register("internalNotes", textRules("Internal notes", { min: 0, max: 500, required: false }))}
          />
        </section>

        {formError ? <p className="text-sm text-rose-300">{formError}</p> : null}

        <div className="flex justify-end gap-3 text-center">
          {isEditMode ? (
            <Button type="button" variant="secondary" onClick={() => navigate(`/clients/${id}`)}>
              Cancel
            </Button>
          ) : null}
          <Button disabled={isSubmitting} icon={Save}>
            {isSubmitting ? "Saving..." : isEditMode ? "Update Lead" : "Save Lead"}
          </Button>
        </div>
      </form>
    </div>
  );
}
