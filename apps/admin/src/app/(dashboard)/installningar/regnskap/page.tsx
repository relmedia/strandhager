import { TripletexSettingsForm } from "@/components/settings/tripletex-settings-form";

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-semibold text-2xl tracking-tight">Regnskap</h1>
        <p className="text-muted-foreground text-sm">
          Kobling til Tripletex: bekreftede bookinger blir fakturaer, og Vipps-betalinger og
          refusjoner følger med.
        </p>
      </div>

      <TripletexSettingsForm />
    </div>
  );
}
