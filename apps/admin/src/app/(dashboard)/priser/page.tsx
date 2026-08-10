import { PricesForm } from "@/components/bookings/prices-form";

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-semibold text-2xl tracking-tight">Priser</h1>
        <p className="text-muted-foreground text-sm">
          Dagsprisene som vises på nettsiden og brukes til å regne ut hva en booking
          koster.
        </p>
      </div>

      <PricesForm slug="felleshuset" />
    </div>
  );
}
