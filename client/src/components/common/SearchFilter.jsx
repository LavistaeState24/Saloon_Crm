import { Building2, Landmark, RotateCcw, Search, Wallet, Clock } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { getErrorMessage, numberRules, textRules } from "../../utils/validation";
import Button from "./Button";
import FormInput from "./FormInput";
import SelectDropdown from "./SelectDropdown";

export default function SearchFilter({
  area,
  propertyType,
  bhk,
  minBudget,
  maxBudget,
  propertyTypeOptions,
  onSubmit,
}) {
  const emptyValues = {
    area: "",
    propertyType: "",
    bhk: "",
    minBudget: "",
    maxBudget: "",
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      ...emptyValues,
      area,
      propertyType,
      bhk,
      minBudget,
      maxBudget,
    },
  });

  const watchedMinBudget = watch("minBudget");

  useEffect(() => {
    reset({
      ...emptyValues,
      area,
      propertyType,
      bhk,
      minBudget,
      maxBudget,
    });
  }, [area, propertyType, bhk, minBudget, maxBudget, reset]);

  return (
    <form
      className="grid gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-glass md:grid-cols-2 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_auto]"
      onSubmit={handleSubmit(onSubmit)}
    >
      <FormInput
        label="Branch"
        icon={Landmark}
        placeholder="e.g. Satellite, Navrangpura"
        error={getErrorMessage(errors.area)}
        {...register("area", {
          ...textRules("Branch", { min: 2, max: 80, required: false }),
          validate: (value) => !value || value.length >= 2 || "Branch must be at least 2 characters",
        })}
      />

      <FormInput
        label="Duration"
        icon={Clock}
        placeholder="e.g. 30 min, 60 min"
        error={getErrorMessage(errors.bhk)}
        {...register("bhk", {
          ...textRules("Duration", { min: 2, max: 20, required: false }),
          validate: (value) => !value || value.length >= 2 || "Duration must be at least 2 characters",
        })}
      />

      <SelectDropdown
        label="Service Category"
        icon={Building2}
        options={propertyTypeOptions}
        placeholder="Select service category"
        error={getErrorMessage(errors.propertyType)}
        {...register("propertyType")}
      />

      <FormInput
        label="Min Price"
        icon={Wallet}
        placeholder="e.g. 500"
        error={getErrorMessage(errors.minBudget)}
        {...register("minBudget", numberRules("Minimum price", { required: false, min: 0 }))}
      />

      <FormInput
        label="Max Price"
        icon={Wallet}
        placeholder="e.g. 5000"
        error={getErrorMessage(errors.maxBudget)}
        {...register("maxBudget", {
          ...numberRules("Maximum price", { required: false, min: 0 }),
          validate: (value) => {
            const baseValidation = numberRules("Maximum price", { required: false, min: 0 }).validate(value);

            if (baseValidation !== true) {
              return baseValidation;
            }

            if (!value || !watchedMinBudget) {
              return true;
            }

            return Number(value) >= Number(watchedMinBudget) || "Maximum price must be at least minimum price";
          },
        })}
      />

      <div className="flex items-end gap-3 xl:flex-nowrap">
        <Button
          type="button"
          variant="secondary"
          className="w-full xl:w-auto"
          icon={RotateCcw}
          onClick={() => {
            reset(emptyValues);
            onSubmit(emptyValues);
          }}
        >
          Reset
        </Button>

        <Button type="submit" className="w-full xl:w-auto" icon={Search} disabled={isSubmitting}>
          Search
        </Button>
      </div>
    </form>
  );
}