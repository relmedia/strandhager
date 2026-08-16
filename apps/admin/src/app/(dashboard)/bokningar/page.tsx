import { BookingsList } from "@/components/bookings/bookings-list";
import { getSession } from "@/server/auth-actions";
import type { BookingStatus } from "@/types/booking";

const STATUSES: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "DECLINED",
  "CANCELLED",
  "COMPLETED",
];

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  // Lets the dashboard link straight to a single tab, e.g. the waiting requests.
  const initialStatus = STATUSES.find((value) => value === status) ?? null;
  // The layout guarantees a session; the name signs manual bookings.
  const session = await getSession();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-semibold text-2xl tracking-tight">Bookinger</h1>
        <p className="text-muted-foreground text-sm">
          Forespørsler og bekreftede leier av Felleshuset.
        </p>
      </div>

      <BookingsList initialStatus={initialStatus} adminName={session?.name ?? ""} />
    </div>
  );
}
