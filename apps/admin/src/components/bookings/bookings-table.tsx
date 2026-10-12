"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

import { PaymentBadge, StatusBadge } from "@/components/bookings/status-badge";
import { ConfirmDelete } from "@/components/cms/confirm-delete";
import { deleteBooking } from "@/lib/booking";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateRange, formatMoney } from "@/lib/format";
import type { Booking } from "@/types/booking";

export function BookingsTable({
  bookings,
  onDeleted,
}: {
  bookings: Booking[];
  /** Reloads the list once a row is gone. */
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function remove(booking: Booking) {
    setDeleting(booking.id);
    try {
      await deleteBooking(booking.id);
      toast.success(`Booking ${booking.reference} er slettet`);
      onDeleted?.();
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Klarte ikke å slette bookingen",
      );
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dato</TableHead>
            <TableHead>Gjest</TableHead>
            <TableHead className="hidden md:table-cell">Anledning</TableHead>
            <TableHead className="text-right">Personer</TableHead>
            <TableHead className="text-right">Sum</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Betaling</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {bookings.map((booking) => (
            <TableRow
              key={booking.id}
              className="group cursor-pointer"
              onClick={() => router.push(`/bokningar/${booking.id}`)}
            >
              <TableCell>
                <span className="font-medium">
                  {formatDateRange(booking.startDate, booking.endDate)}
                </span>
                <span className="block font-mono text-muted-foreground text-xs tracking-wider">
                  {booking.reference}
                </span>
              </TableCell>

              <TableCell>
                <span className="font-medium">
                  {booking.guest.firstName} {booking.guest.lastName}
                </span>
                <span className="block text-muted-foreground text-xs">
                  {booking.guest.company ?? booking.guest.email}
                </span>
              </TableCell>

              <TableCell className="hidden text-muted-foreground md:table-cell">
                {booking.purpose ?? "—"}
              </TableCell>

              <TableCell className="text-right tabular-nums">{booking.guests}</TableCell>

              <TableCell className="text-right tabular-nums">
                {formatMoney(booking.total)}
              </TableCell>

              <TableCell>
                <StatusBadge status={booking.status} />
              </TableCell>

              <TableCell className="hidden lg:table-cell">
                <PaymentBadge status={booking.paymentStatus} />
              </TableCell>

              <TableCell>
                {/* The whole row navigates, so the controls inside it must not
                    let the click through — otherwise deleting also opens the
                    booking being deleted. */}
                <div
                  className="flex items-center justify-end gap-0.5"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                  role="presentation"
                >
                  <Link
                    href={`/bokningar/${booking.id}`}
                    aria-label={`Åpne booking ${booking.reference}`}
                    className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <ArrowUpRight className="size-4" />
                  </Link>

                  <ConfirmDelete
                    label={`Slett booking ${booking.reference}`}
                    title="Slette bookingen?"
                    confirmLabel={deleting === booking.id ? "Sletter …" : "Slett"}
                    description={
                      <>
                        {booking.guest.firstName} {booking.guest.lastName} ·{" "}
                        {formatDateRange(booking.startDate, booking.endDate)} ·{" "}
                        {booking.reference}
                        <br />
                        Bookingen fjernes for godt, sammen med signaturen og
                        avtalen. Dagene blir ledige igjen med én gang.
                        {booking.paymentStatus === "PAID" ? (
                          <>
                            <br />
                            <strong>
                              Denne bookingen er betalt. Refunder den før du sletter,
                              ellers finnes det ikke lenger noe spor av betalingen her.
                            </strong>
                          </>
                        ) : null}
                      </>
                    }
                    onConfirm={() => void remove(booking)}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
