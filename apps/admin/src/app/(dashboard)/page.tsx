import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-semibold text-2xl tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Oversikt over bookinger, inntekt og hva som venter på svar.
        </p>
      </div>

      <DashboardOverview />
    </div>
  );
}
