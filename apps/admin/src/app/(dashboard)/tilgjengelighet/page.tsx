import { AvailabilityManager } from "@/components/bookings/availability-manager";

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-semibold text-2xl tracking-tight">Tilgjengelighet</h1>
        <p className="text-muted-foreground text-sm">
          Steng dager Felleshuset ikke er til leie, for eksempel ved vedlikehold eller
          egne arrangementer.
        </p>
      </div>

      <AvailabilityManager space="felleshuset" />
    </div>
  );
}
