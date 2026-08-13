import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  CalendarRange,
  Mail,
  Phone,
  UserRound,
  Wallet,
} from "lucide-react";

import { PaymentBadge, StatusBadge } from "@/components/bookings/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateRange, formatMoney, formatShortDate } from "@/lib/format";
import { getGuest } from "@/lib/guest";
import { getInitials } from "@/lib/utils";
import type { GuestDetail } from "@/types/guest";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let guest: GuestDetail;
  try {
    guest = await getGuest(id);
  } catch {
    notFound();
  }

  const name = `${guest.firstName} ${guest.lastName}`;
  // Bookings arrive newest first, so the head of the list is the latest stay.
  const lastStay = guest.bookings[0] ?? null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* --- Profile header ------------------------------------------------ */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar className="size-16 shadow-xs">
            <AvatarFallback className="bg-muted font-semibold text-lg">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate font-semibold text-2xl tracking-tight">{name}</h1>
              {guest.company ? (
                <Badge variant="secondary" className="gap-1 font-normal">
                  <Building2 className="size-3" aria-hidden />
                  {guest.company}
                </Badge>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-sm">
              <a
                href={`mailto:${guest.email}`}
                className="inline-flex items-center gap-1.5 underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                <Mail className="size-3.5" aria-hidden />
                {guest.email}
              </a>
              {guest.phone ? (
                <>
                  <Separator
                    orientation="vertical"
                    className="hidden data-[orientation=vertical]:h-3.5 sm:block"
                  />
                  <a
                    href={`tel:${guest.phone}`}
                    className="inline-flex items-center gap-1.5 tabular-nums underline-offset-4 transition-colors hover:text-foreground hover:underline"
                  >
                    <Phone className="size-3.5" aria-hidden />
                    {guest.phone}
                  </a>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <Button asChild variant="outline">
          <a href={`mailto:${guest.email}`}>
            <Mail className="size-4" aria-hidden />
            Send e-post
          </a>
        </Button>
      </div>

      {/* --- Key figures --------------------------------------------------- */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={CalendarDays}
          label="Bookinger"
          value={String(guest.bookings.length)}
        />
        <StatCard
          icon={Wallet}
          label="Totalt leid for"
          value={formatMoney(guest.totalSpent)}
          hint="Bekreftede og gjennomførte leier"
        />
        <StatCard
          icon={CalendarRange}
          label="Siste opphold"
          value={lastStay ? formatDateRange(lastStay.startDate, lastStay.endDate) : "—"}
          compact
        />
        <StatCard
          icon={UserRound}
          label="Gjest siden"
          value={formatShortDate(guest.createdAt.slice(0, 10))}
          compact
        />
      </div>

      {/* --- Booking history ------------------------------------------------ */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-semibold text-lg tracking-tight">Bookinghistorikk</h2>
          <p className="text-muted-foreground text-sm tabular-nums">
            {guest.bookings.length === 1
              ? "1 booking"
              : `${guest.bookings.length} bookinger`}
          </p>
        </div>

        {guest.bookings.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-12 text-center">
            <CalendarDays className="size-8 text-muted-foreground" strokeWidth={1.5} />
            <p className="font-medium">Ingen bookinger ennå</p>
            <p className="max-w-sm text-muted-foreground text-sm">
              Når {guest.firstName} booker Felleshuset dukker leien opp her.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Dato</TableHead>
                  <TableHead className="hidden md:table-cell">Anledning</TableHead>
                  <TableHead className="text-right">Personer</TableHead>
                  <TableHead className="text-right">Sum</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Betaling</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {guest.bookings.map((booking) => (
                  <TableRow key={booking.id} className="group">
                    <TableCell className="py-3">
                      <span className="font-medium">
                        {formatDateRange(booking.startDate, booking.endDate)}
                      </span>
                      <span className="block font-mono text-muted-foreground text-xs tracking-wider">
                        {booking.reference}
                      </span>
                    </TableCell>

                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {booking.purpose ?? "—"}
                    </TableCell>

                    <TableCell className="text-right tabular-nums">{booking.guests}</TableCell>

                    <TableCell className="text-right font-medium tabular-nums">
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
                        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground opacity-60 transition-all hover:bg-accent hover:text-foreground group-hover:opacity-100"
                      >
                        <ArrowUpRight className="size-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  compact,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  hint?: string;
  /** For long values like date ranges, which need a smaller size to fit. */
  compact?: boolean;
}) {
  return (
    <Card className="gap-0 py-0 shadow-xs">
      <CardContent className="flex h-full flex-col gap-2.5 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground text-sm">{label}</p>
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Icon className="size-4 text-muted-foreground" aria-hidden />
          </div>
        </div>
        <div className="space-y-0.5">
          <p
            className={`font-semibold tabular-nums tracking-tight ${compact ? "text-lg/7" : "text-2xl/7"}`}
          >
            {value}
          </p>
          {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
