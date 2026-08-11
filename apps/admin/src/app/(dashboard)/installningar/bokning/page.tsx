import { BookingSettingsForm } from "@/components/settings/booking-settings-form";

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-semibold text-2xl tracking-tight">Booking</h1>
        <p className="text-muted-foreground text-sm">
          Regler for hvordan gjester kan booke Felleshuset på nettsiden.
        </p>
      </div>

      <BookingSettingsForm slug="felleshuset" />
    </div>
  );
}
