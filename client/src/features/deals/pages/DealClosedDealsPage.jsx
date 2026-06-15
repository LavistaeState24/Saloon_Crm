import DealPipelinePage from "./DealPipelinePage";

export default function DealClosedDealsPage() {
  return (
    <DealPipelinePage
      status="Closed"
      statusLabel="Closed"
      title="Closed Invoices"
      subtitle="Review closed wins, pricing outcomes, and closure ownership."
    />
  );
}
