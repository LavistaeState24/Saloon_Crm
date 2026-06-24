import DealPipelinePage from "./DealPipelinePage";

export default function DealNegotiationPage() {
  return (
    <DealPipelinePage
      status="Draft"
      statusLabel="Draft"
      title="Draft Invoices"
      subtitle="Track draft invoices, pending approvals, and services awaiting billing."
    />
  );
}
