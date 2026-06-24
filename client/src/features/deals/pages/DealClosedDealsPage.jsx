import DealPipelinePage from "./DealPipelinePage";

export default function DealClosedDealsPage() {
  return (
    <DealPipelinePage
      status="Paid"
      statusLabel="Paid"
      title="Paid Invoices"
      subtitle="Review completed bills, collected payments, and staff performance."
    />
  );
}
