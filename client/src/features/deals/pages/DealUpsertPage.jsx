import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

import Button from "../../../components/common/Button";
import PageSkeleton from "../../../components/common/PageSkeleton";
import { useAuth } from "../../../hooks/useAuth";
import { dealService } from "../../../services/dealService";
import { clientService } from "../../../services/clientService";
import { projectService } from "../../../services/projectService";
import { userService } from "../../../services/userService";
import { applyServerErrors } from "../../../utils/validation";
import DealForm from "../components/DealForm";

const initialValues = {
  leadId: "",
  finalProject: "",
  finalUnit: "",
  finalPrice: "",
  brokerageDetails: "",
  tokenAmount: "",
  bookingDate: "",
  paymentStatus: "Pending",
  documentsPending: false,
  dealClosedBy: "",
  dealStatus: "Negotiation",
  notes: "",
};

const mapDealToForm = (deal) => ({
  leadId: deal.leadId || deal.lead?._id || "",
  finalProject: deal.finalProject || deal.project?._id || "",
  finalUnit: deal.finalUnit || "",
  finalPrice: deal.finalPrice ?? "",
  brokerageDetails: deal.brokerageDetails || "",
  tokenAmount: deal.tokenAmount ?? "",
  bookingDate: deal.bookingDate ? new Date(deal.bookingDate).toISOString().slice(0, 10) : "",
  paymentStatus: deal.paymentStatus || "Pending",
  documentsPending: Boolean(deal.documentsPending),
  dealClosedBy: deal.dealClosedBy || deal.closedBy?._id || "",
  dealStatus: deal.dealStatus || "Negotiation",
  notes: deal.notes || "",
});

export default function DealUpsertPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isEditMode = Boolean(id);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [leadOptions, setLeadOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [closerOptions, setCloserOptions] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [formError, setFormError] = useState("");
  const [loadError, setLoadError] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onBlur",
    defaultValues: initialValues,
  });
  const selectedLeadId = watch("leadId");

  useEffect(() => {
    const loadDependencies = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const [leadsData, projectsData, assignableUsers] = await Promise.all([
          clientService.listAll(),
          projectService.listAll(),
          userService.listAssignable(),
        ]);

        setLeadOptions((leadsData.items || []).map((lead) => ({ value: lead._id, label: `${lead.ownerName} (${lead.clientPhoneNumber})` })));
        setProjectOptions((projectsData.items || []).map((project) => ({ value: project._id, label: `${project.projectName} (${project.publicAlias})` })));
        setCloserOptions(
          assignableUsers.map((account) => ({
            value: account.id,
            label: `${account.name} (${account.role})`,
          })),
        );

        if (isEditMode) {
          const deal = await dealService.getById(id);
          reset(mapDealToForm(deal));
        } else {
          reset({
            ...initialValues,
            dealClosedBy: user?.id || "",
          });
        }
      } catch (requestError) {
        setLoadError(requestError.response?.data?.message || "Unable to load invoice form");
      } finally {
        setIsLoading(false);
      }
    };

    loadDependencies();
  }, [id, isEditMode, reset, user?.id]);

  useEffect(() => {
    if (isEditMode || !selectedLeadId) {
      setSelectedLead(null);
      return;
    }

    let active = true;

    const loadSelectedLead = async () => {
      try {
        const data = await clientService.getById(selectedLeadId);

        if (active) {
          setSelectedLead(data);
        }
      } catch (_error) {
        if (active) {
          setSelectedLead(null);
        }
      }
    };

    loadSelectedLead();

    return () => {
      active = false;
    };
  }, [isEditMode, selectedLeadId]);

  const onSubmit = async (formValues) => {
    setFormError("");

    try {
      const payload = {
        ...formValues,
        finalPrice: formValues.finalPrice === "" ? undefined : Number(formValues.finalPrice),
        tokenAmount: formValues.tokenAmount === "" ? undefined : Number(formValues.tokenAmount),
        documentsPending: Boolean(formValues.documentsPending),
        bookingDate: formValues.bookingDate || undefined,
        dealClosedBy: formValues.dealClosedBy || (formValues.dealStatus === "Closed" ? user?.id : undefined),
      };

      if (isEditMode) {
        await dealService.update(id, payload);
        navigate(`/deals/${id}`);
        return;
      }

      const createdDeal = await dealService.create(payload);
      navigate(`/deals/${createdDeal._id}`);
    } catch (requestError) {
      applyServerErrors(requestError, setError, setFormError);
    }
  };

  const pageTitle = useMemo(
    () => (isEditMode ? "Update invoice details" : "Create a new invoice record"),
    [isEditMode],
  );
  const isLeadReminderLocked = Boolean(selectedLead?.hasOverdueReminder) && user?.role !== "super-admin";

  if (isLoading) {
    return <PageSkeleton variant="form" />;
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-rose-300">{loadError}</p>
        <Button variant="secondary" onClick={() => navigate("/deals/draft")}>
          Back to Billing
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-gold">{isEditMode ? "Edit Invoice" : "New Invoice"}</p>
        <h2 className="mt-2 font-display text-3xl">{pageTitle}</h2>
        <p className="mt-2 text-sm text-muted"> Manage customer billing, payments, services, and invoice records.</p>
      </div>

      {!isEditMode && isLeadReminderLocked ? (
        <div className="rounded-[28px] border border-amber-400/30 bg-amber-500/10 px-5 py-4 text-amber-50 shadow-glass">
          <p className="text-xs uppercase tracking-[0.24em] text-amber-200">Reminder lock active</p>
          <p className="mt-2 text-sm leading-6">
            This customer has an overdue reminder. Complete the reminder with a discussion note before creating an invoice.
          </p>
        </div>
      ) : null}

      <form className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass" onSubmit={handleSubmit(onSubmit)}>
        <DealForm
          register={register}
          errors={errors}
          watch={watch}
          leadOptions={leadOptions}
          projectOptions={projectOptions}
          closerOptions={closerOptions}
          isSaving={isSubmitting}
          isLocked={!isEditMode && isLeadReminderLocked}
          saveLabel={isEditMode ? "Update Invoice" : "Create Invoice"}
          submitIcon={Save}
          onCancel={() => navigate(isEditMode ? `/deals/${id}` : "/deals/draft")}
          formError={formError}
        />
      </form>
    </div>
  );
}
