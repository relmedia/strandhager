import { BookingDetail } from "@/components/bookings/booking-detail";
import { getSession } from "@/server/auth-actions";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // The layout guarantees a session; the name signs the confirmation.
  const session = await getSession();

  return <BookingDetail id={id} adminName={session?.name ?? ""} />;
}
