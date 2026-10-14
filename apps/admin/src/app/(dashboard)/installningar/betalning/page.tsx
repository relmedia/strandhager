import { VippsSettingsForm } from "@/components/settings/vipps-settings-form";

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-semibold text-2xl tracking-tight">Betaling</h1>
        <p className="text-muted-foreground text-sm">
          Oppsett for Vipps: nøkler, miljø og webhook for automatisk betalingsstatus.
        </p>
      </div>

      <VippsSettingsForm />
    </div>
  );
}
