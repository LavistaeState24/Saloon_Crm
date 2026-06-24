import { useMemo } from "react";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/common/FormInput";
import SelectDropdown from "../../../components/common/SelectDropdown";
import { dealStatusOptions, paymentStatusOptions } from "../dealConfig";

export default function DealForm({
  register,
  errors,
  watch,
  leadOptions = [],
  projectOptions = [],
  closerOptions = [],
  isSaving = false,
  isLocked = false,
  saveLabel = "Save Invoice",
  submitIcon,
  onCancel,
  formError = "",
}) {
  const dealStatus = watch("dealStatus");
  const showClosedFields = dealStatus === "Closed";

  const leadSelectOptions = useMemo(() => leadOptions, [leadOptions]);
  const projectSelectOptions = useMemo(() => projectOptions, [projectOptions]);
  const closerSelectOptions = useMemo(() => closerOptions, [closerOptions]);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <SelectDropdown label="Invoice Status" placeholder="Select invoice status" options={dealStatusOptions} error={errors.dealStatus?.message} {...register("dealStatus")} />

        <SelectDropdown label="Customer" placeholder="Select customer" options={leadSelectOptions} error={errors.leadId?.message} {...register("leadId")} />

        <SelectDropdown label="Final Service" placeholder="Select final service"  options={projectSelectOptions} error={errors.finalProject?.message} {...register("finalProject")} />

        <FormInput
          label="Service / Package Detail"
          placeholder="Hair Spa Package / Bridal Makeup"
          error={errors.finalUnit?.message}
          {...register("finalUnit")}
        />

        <FormInput
          label="Advance Paid"
          type="number"
          placeholder="Enter advance paid"
          error={errors.tokenAmount?.message}
          {...register("tokenAmount")}
        />

        <SelectDropdown
          label="Payment Status"
          options={paymentStatusOptions}
          error={errors.paymentStatus?.message}
          {...register("paymentStatus")}
        />
        <FormInput
          label="Billing Date"
          type="date"
          error={errors.bookingDate?.message}
          {...register("bookingDate")}
        />

        <SelectDropdown
          label="Billed By"
          options={closerSelectOptions}
          error={errors.dealClosedBy?.message}
          {...register("dealClosedBy")}
        />
      </div>

      {showClosedFields ? (
        <div className="grid gap-5 rounded-[28px] lg:grid-cols-2">
          <FormInput
            label="Bill Amount"
            type="number"
            placeholder="Enter bill amount"
            error={errors.finalPrice?.message}
            {...register("finalPrice")}
          />
          <FormInput
            label="Service Notes"
            as="textarea"
            rows={1}
            placeholder="Service details, products used, package notes"
            error={errors.brokerageDetails?.message}
            {...register("brokerageDetails")}
          />
        </div>
      ) : (
        <div className="grid gap-5 rounded-[28px] lg:grid-cols-2">
          <FormInput
            label="Bill Amount"
            type="number"
            placeholder="Enter bill amount"
            error={errors.finalPrice?.message}
            {...register("finalPrice")}
          />
          <FormInput
            label="Service Notes"
            as="textarea"
            rows={4}
            placeholder="Service details, products used, package notes"
            error={errors.brokerageDetails?.message}
            {...register("brokerageDetails")}
          />
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <label className="flex items-top gap-3 rounded-2xl">
          <input type="checkbox" className="h-4 w-4 accent-[#c9a35d]" {...register("documentsPending")} />
          <span className="text-sm text-ivory">Pending Items</span>
        </label>
        <FormInput
          label="Notes"
          as="textarea"
          rows={1}
          placeholder="Pending payment, customer request, product note"
          error={errors.notes?.message}
          {...register("notes")}
        />
      </div>

      {formError ? <p className="text-sm text-rose-300">{formError}</p> : null}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" icon={submitIcon} disabled={isSaving || isLocked}>
          {isSaving ? "Saving..." : saveLabel}
        </Button>
      </div>
    </div>
  );
}
