import { BookingCalendar } from "@/components/bookings/booking-calendar";

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-semibold text-2xl tracking-tight">Kalender</h1>
        <p className="text-muted-foreground text-sm">
          Hvilke dager Felleshuset er opptatt. Trykk på en booking for å åpne den.
        </p>
      </div>

      <BookingCalendar />
    </div>
  );
}
