import { useEffect } from "react";
import { useForm } from "react-hook-form";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/common/FormInput";
import SelectDropdown from "../../../components/common/SelectDropdown";
import { applyServerErrors, dateRules, getErrorMessage, selectRules, textRules } from "../../../utils/validation";
import { postVisitResultOptions, siteVisitStatusOptions } from "../siteVisitConfig";

const defaultValues = {
  leadId: "",
  projectId: "",
  assignedStaff: "",
  visitDateTime: "",
  pickupRequired: false,
  visitStatus: "Booked",
  clientFeedback: "",
  nextAction: "",
  postVisitResult: "",
};

export default function SiteVisitForm({
  initialValues,
  leadOptions = [],
  projectOptions = [],
  staffOptions = [],
  isSaving = false,
  saveLabel = "Save Appointment",
  onSubmit,
  onCancel,
  submitIcon: SubmitIcon,
  lockLead = false,
  hideLead = false,
  disabled = false,
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      ...defaultValues,
      ...initialValues,
    },
  });

  const visitStatus = watch("visitStatus");
  const isCompleted = visitStatus === "Completed";

  useEffect(() => {
    reset({
      ...defaultValues,
      ...initialValues,
    });
  }, [initialValues, reset]);

  return (
    <form
      className="space-y-4 sm:space-y-5"
      onSubmit={handleSubmit(async (values) => {
        try {
          await onSubmit(values);
        } catch (requestError) {
          applyServerErrors(requestError, setError, () => { });
        }
      })}
    >
      {hideLead ? <input type="hidden" {...register("leadId")} /> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {!hideLead ? (
          <SelectDropdown
            label="Customer"
            options={leadOptions}
            disabled={lockLead || disabled}
            error={getErrorMessage(errors.leadId)}
            {...register("leadId", selectRules("Customer"))}
          />
        ) : null}

        <SelectDropdown
          label="Service"
          options={projectOptions}
          disabled={disabled}
          error={getErrorMessage(errors.projectId)}
          {...register("projectId", selectRules("Service"))}
        />

        <SelectDropdown
          label="Assigned Staff"
          options={staffOptions}
          disabled={disabled}
          error={getErrorMessage(errors.assignedStaff)}
          {...register("assignedStaff", selectRules("Assigned staff"))}
        />

        <FormInput
          label="Appointment Date Time"
          type="datetime-local"
          disabled={disabled}
          error={getErrorMessage(errors.visitDateTime)}
          {...register("visitDateTime", dateRules("Appointment date time", { required: true }))}
        />

        <SelectDropdown
          label="Appointment Status"
          options={siteVisitStatusOptions}
          disabled={disabled}
          error={getErrorMessage(errors.visitStatus)}
          {...register("visitStatus", selectRules("Appointment status"))}
        />

        <SelectDropdown
          label="Appointment Result"
          options={postVisitResultOptions}
          placeholder="Select appointment result"
          disabled={disabled}
          error={getErrorMessage(errors.postVisitResult)}
          {...register("postVisitResult")}
        />
      </div>

      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm font-semibold text-ivory sm:p-4">
        <input type="checkbox" className="h-4 w-4 accent-gold" disabled={disabled} {...register("pickupRequired")} />
        Assistance Required
      </label>

      <FormInput
        label="Customer Feedback"
        as="textarea"
        rows={4}
        placeholder={isCompleted ? "Required when appointment is completed" : "Optional customer feedback"}
        disabled={disabled}
        error={getErrorMessage(errors.clientFeedback)}
        {...register("clientFeedback", {
          ...textRules("Customer feedback", { min: 3, max: 1000, required: false }),
          validate: (value) =>
            !isCompleted || (String(value || "").trim().length >= 3 ? true : "Customer feedback is required"),
        })}
      />

      <FormInput
        label="Next Follow-up"
        as="textarea"
        rows={3}
        placeholder={isCompleted ? "Required when appointment is completed" : "Optional next follow-up"}
        disabled={disabled}
        error={getErrorMessage(errors.nextAction)}
        {...register("nextAction", {
          ...textRules("Next follow-up", { min: 3, max: 500, required: false }),
          validate: (value) =>
            !isCompleted || (String(value || "").trim().length >= 3 ? true : "Next follow-up is required"),
        })}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
        ) : null}

        <Button type="submit" className="w-full sm:w-auto" icon={SubmitIcon} disabled={isSaving || disabled}>
          {isSaving ? "Saving..." : saveLabel}
        </Button>
      </div>
    </form>
  );
}