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
import {
  salonCustomerStatusOptions,
  salonCustomerTypeOptions,
  salonFormLabels,
  salonPriorityLevelOptions,
  normalizeSalonCustomerStatus,
  salonServiceInterestedOptions
} from "../../../config/industryLabels";
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
  leadStatus: "New Customer",
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
  propertyStatus: normalizeSalonCustomerStatus(client.propertyStatus) || "",
  dateOfAddingProperty: client.dateOfAddingProperty ? new Date(client.dateOfAddingProperty).toISOString().slice(0, 10) : "",
  assignedStaff: client.assignedStaff?._id || client.assignedStaff || "",
  leadStatus: normalizeSalonCustomerStatus(client.leadStatus) || "New Customer",
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
  const propertyTypeValue = watch("propertyType");
  const propertyStatusValue = watch("propertyStatus");
  const purposeValue = watch("purpose");
  const sourceOfPropertyValue = watch("sourceOfProperty");
  const requirementTypeValue = watch("requirementType");
  const propertyConditionValue = watch("propertyCondition");

  const sourceOptions = sourceOfPropertyValue && !["Walk-in", "Referral", "Instagram", "Phone", "Website"].includes(sourceOfPropertyValue)
    ? [sourceOfPropertyValue, "Walk-in", "Referral", "Instagram", "Phone", "Website"]
    : ["Walk-in", "Referral", "Instagram", "Phone", "Website"];

  const purposeOptions =
    purposeValue && !["Walk-in", "Appointment", "Consultation", "Package"].includes(purposeValue)
      ? [purposeValue, "Walk-in", "Appointment", "Consultation", "Package"]
      : ["Walk-in", "Appointment", "Consultation", "Package"];

  const customerTypeOptions =
    propertyTypeValue && !salonCustomerTypeOptions.includes(propertyTypeValue)
      ? [propertyTypeValue, ...salonCustomerTypeOptions]
      : salonCustomerTypeOptions;

  const customerStatusOptions =
    propertyStatusValue && !salonCustomerStatusOptions.includes(propertyStatusValue)
      ? [propertyStatusValue, ...salonCustomerStatusOptions]
      : salonCustomerStatusOptions;

  const serviceInterestedOptions =
    requirementTypeValue && !salonServiceInterestedOptions.includes(requirementTypeValue)
      ? [requirementTypeValue, ...salonServiceInterestedOptions]
      : salonServiceInterestedOptions;

  const serviceConditionOptions =
    propertyConditionValue && !["First time", "Regular", "Premium", "Package", "Trial"].includes(propertyConditionValue)
      ? [propertyConditionValue, "First time", "Regular", "Premium", "Package", "Trial"]
      : ["First time", "Regular", "Premium", "Package", "Trial"];

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
          {isEditMode ? "Update customer profile" : "Create a new customer profile"}
        </h2>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <section className="grid gap-5 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass lg:grid-cols-2">
          <div className="lg:col-span-2">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">Customer Intake</p>
            <h3 className="mt-2 font-display text-2xl">Appointment & Service Information</h3>
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
            label={salonFormLabels.customerStatus}
            icon={ClipboardList}
            options={customerStatusOptions}
            error={getErrorMessage(errors.leadStatus)}
            {...register("leadStatus", selectRules("Customer status"))}
          />

          <SelectDropdown
            label={salonFormLabels.priorityLevel}
            icon={Shapes}
            options={salonPriorityLevelOptions}
            error={getErrorMessage(errors.interestLevel)}
            {...register("interestLevel", selectRules("Priority level"))}
          />

          <FormInput
            label="Referral Source"
            icon={Shapes}
            placeholder="Walk-in, Instagram, referral, call..."
            error={getErrorMessage(errors.source)}
            {...register("source", textRules("Source", { min: 0, max: 100, required: false }))}
          />

          <SelectDropdown
            label="Appointment Type"
            icon={Shapes}
            options={purposeOptions}
            placeholder="Select appointment type"
            error={getErrorMessage(errors.purpose)}
            {...register("purpose")}
          />

          <SelectDropdown
            label={salonFormLabels.serviceInterested}
            icon={Shapes}
            options={salonServiceInterestedOptions}
            placeholder="Select service interested"
            error={getErrorMessage(errors.requirementType)}
            {...register("requirementType", selectRules("Service interested"))}
          />

          <FormInput
            label={salonFormLabels.preferredBranch}
            icon={MapPin}
            placeholder="Preferred branch or location"
            error={getErrorMessage(errors.areaPreference)}
            {...register("areaPreference", textRules("Preferred branch", { min: 0, max: 120, required: false }))}
          />

          <div className="space-y-2">
            <FormInput
              label={salonFormLabels.expectedSpendMin}
              icon={IndianRupee}
              type="number"
              placeholder="Enter expected spend min"
              error={getErrorMessage(errors.budgetMin)}
              {...register("budgetMin", numberRules("Expected spend min", { required: false, min: 0 }))}
            />
            {formatCompactPrice(budgetMin) ? (
              <div className="inline-flex rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium text-gold-2">
                {formatCompactPrice(budgetMin)}
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <FormInput
              label={salonFormLabels.expectedSpendMax}
              icon={IndianRupee}
              type="number"
              placeholder="Enter expected spend max"
              error={getErrorMessage(errors.budgetMax)}
              {...register("budgetMax", {
                ...numberRules("Expected spend max", { required: false, min: 0 }),
                validate: (value) => {
                  const baseValidation = numberRules("Expected spend max", { required: false, min: 0 }).validate(value);

                  if (baseValidation !== true) {
                    return baseValidation;
                  }

                  if (!value || !budgetMin) {
                    return true;
                  }

                  return Number(value) >= Number(budgetMin) || "Expected spend max must be at least expected spend min";
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
            label={salonFormLabels.notes}
            as="textarea"
            rows={5}
            className="lg:col-span-2"
            placeholder="Service notes, preferences, allergies, occasion details..."
            error={getErrorMessage(errors.notes)}
            {...register("notes", textRules("Notes", { min: 0, max: 2000, required: false }))}
          />

          <FormInput
            label="Last Interaction Status"
            placeholder="Contacted, no response, appointment planned..."
            error={getErrorMessage(errors.lastCallStatus)}
            {...register("lastCallStatus", textRules("Last contact status", { min: 0, max: 120, required: false }))}
          />

          <FormInput
            label="Next Follow-up Date"
            type="date"
            error={getErrorMessage(errors.nextFollowUpDate)}
            {...register("nextFollowUpDate")}
          />
        </section>

        <section className="grid gap-5 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass lg:grid-cols-2">
          <div className="lg:col-span-2">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">Customer Profile</p>
            <h3 className="mt-2 font-display text-2xl">Customer Information</h3>
          </div>  

          <FormInput
            label={salonFormLabels.customerName}
            icon={UserRound}
            placeholder="Enter customer name"
            error={getErrorMessage(errors.ownerName)}
            {...register("ownerName", textRules("Customer name", { min: 3, max: 80 }))}
          />

          <FormInput
            label="Phone Number"
            icon={Phone}
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="Enter customer phone number"
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
            label="Branch Name"
            icon={Building2}
            placeholder="Enter branch name"
            error={getErrorMessage(errors.premiseName)}
            {...register("premiseName", textRules("Salon name", { min: 0, max: 100, required: false }))}
          />

          <FormInput
            label="Branch Location"
            icon={MapPin}
            placeholder="Enter branch location"
            error={getErrorMessage(errors.premiseArea)}
            {...register("premiseArea", textRules("Branch area", { min: 2, max: 80 }))}
          />

          <SelectDropdown
            label="Source"
            icon={Shapes}
            options={sourceOptions}
            error={getErrorMessage(errors.sourceOfProperty)}
            {...register("sourceOfProperty", selectRules("Source"))}
          />

          <SelectDropdown
            label={salonFormLabels.customerType}
            icon={Shapes}
            options={customerTypeOptions}
            error={getErrorMessage(errors.propertyType)}
            {...register("propertyType", selectRules("Customer type"))}
          />

          <SelectDropdown
            label={salonFormLabels.customerStatus}
            icon={Shapes}
            options={customerStatusOptions}
            placeholder="Select customer status"
            error={getErrorMessage(errors.propertyStatus)}
            {...register("propertyStatus", selectRules("Customer status", { requiredMessage: "Customer status is required" }))}
          />

          <div className="space-y-2">
            <FormInput
              label="Expected Spend"
              icon={IndianRupee}
              type="number"
              placeholder="Enter expected spend"
              error={getErrorMessage(errors.ownerPrice)}
              {...register("ownerPrice", numberRules("Expected spend", { min: 0 }))}
            />
            {formatCompactPrice(ownerPrice) ? (
              <div className="inline-flex rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium text-gold-2">
                {formatCompactPrice(ownerPrice)}
              </div>
            ) : null}
          </div>

          <SelectDropdown
            label="Service Preference"
            icon={Shapes}
            options={serviceConditionOptions}
            error={getErrorMessage(errors.propertyCondition)}
            {...register("propertyCondition", selectRules("Service preference"))}
          />

          <FormInput
            label="Customer Age"
            placeholder="e.g. 25 years"
            error={getErrorMessage(errors.propertyAge)}
            {...register("propertyAge", textRules("Customer age", { min: 1, max: 80 }))}
          />

          <FormInput
            label="Package / Duration"
            placeholder="e.g. 60 min, bridal package, premium service"
            error={getErrorMessage(errors.propertySize)}
            {...register("propertySize", textRules("Package / duration", { min: 0, max: 80, required: false }))}
          />

          <FormInput
            label="Date Added"
            icon={CalendarDays}
            type="date"
            className="lg:col-span-2"
            error={getErrorMessage(errors.dateOfAddingProperty)}
            {...register("dateOfAddingProperty", dateRules("Date added", { required: true }))}
          />

          <FormInput
            label="Internal Notes"
            as="textarea"
            rows={4}
            className="lg:col-span-1"
            placeholder="Internal context related to customer intake"
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
            {isSubmitting ? "Saving..." : isEditMode ? "Update Customer" : "Save Customer"}
          </Button>
        </div>
      </form>
    </div>
  );
}
