import { MailSettingsForm } from "@/components/settings/mail-settings-form";

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-semibold text-2xl tracking-tight">E-post</h1>
        <p className="text-muted-foreground text-sm">
          Oppsett for utgående e-post: bookingbekreftelser, venteliste og henvendelser.
        </p>
      </div>

      <MailSettingsForm />
    </div>
  );
}
