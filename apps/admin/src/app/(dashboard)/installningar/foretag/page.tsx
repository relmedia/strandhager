import { OrgSettingsForm } from "@/components/settings/org-settings-form";

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-semibold text-2xl tracking-tight">Bedrift</h1>
        <p className="text-muted-foreground text-sm">
          Opplysningene om foreningen som brukes på leieavtalene.
        </p>
      </div>

      <OrgSettingsForm />
    </div>
  );
}
