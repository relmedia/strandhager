"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowUpRight } from "lucide-react";

import { PaymentBadge, StatusBadge } from "@/components/bookings/status-badge";
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

export function BookingsTable({ bookings }: { bookings: Booking[] }) {
  const router = useRouter();

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
            <TableHead className="w-10" />
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
                <Link
                  href={`/bokningar/${booking.id}`}
                  aria-label={`Åpne booking ${booking.reference}`}
                  className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <ArrowUpRight className="size-4" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
