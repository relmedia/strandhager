import Link from "next/link";

import { CalendarX2 } from "lucide-react";

import { BookingsTable } from "@/components/bookings/bookings-table";
import { Button } from "@/components/ui/button";
import type { Booking } from "@/types/booking";

/** Enough to see the next few weeks without turning the page into a list. */
const SHOWN = 6;

export function UpcomingBookings({ bookings }: { bookings: Booking[] }) {
  const next = bookings.slice(0, SHOWN);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-medium">Kommende leier</h2>
          <p className="text-muted-foreground text-sm">
            Forespurte og bekreftede dager fra i dag av.
          </p>
        </div>

        <Button variant="outline" size="sm" asChild>
          <Link href="/bokningar">Se alle</Link>
        </Button>
      </div>

      {next.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <CalendarX2 className="size-8 text-muted-foreground" strokeWidth={1.5} />
          <p className="font-medium">Ingenting står i kalenderen</p>
          <p className="max-w-sm text-muted-foreground text-sm">
            Nye forespørsler fra nettsiden dukker opp her med én gang de sendes inn.
          </p>
        </div>
      ) : (
        <BookingsTable bookings={next} />
      )}
    </section>
  );
}
