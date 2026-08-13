import { GuestsTable } from "@/components/guests/guests-table";
import { listGuests } from "@/lib/guest";

export default async function Page() {
  const guests = await listGuests();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-semibold text-2xl tracking-tight">Gjester</h1>
        <p className="text-muted-foreground text-sm">
          Alle som har booket Felleshuset, med bookinghistorikken deres.
        </p>
      </div>

      <GuestsTable guests={guests} />
    </div>
  );
}
