"use client";

import { useMemo, useState } from "react";

import { CalendarX2, RefreshCw, Search } from "lucide-react";

import { BookingsTable } from "@/components/bookings/bookings-table";
import { STATUS_LABELS } from "@/components/bookings/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useBookings } from "@/hooks/use-bookings";
import type { BookingStatus } from "@/types/booking";

/** Tabs across the top. `null` is the catch-all "everything" tab. */
const TABS: { value: BookingStatus | null; label: string }[] = [
  { value: null, label: "Alle" },
  { value: "PENDING", label: STATUS_LABELS.PENDING },
  { value: "CONFIRMED", label: STATUS_LABELS.CONFIRMED },
  { value: "CANCELLED", label: STATUS_LABELS.CANCELLED },
  { value: "DECLINED", label: STATUS_LABELS.DECLINED },
  { value: "COMPLETED", label: STATUS_LABELS.COMPLETED },
];

export function BookingsList({
  initialStatus = null,
}: {
  initialStatus?: BookingStatus | null;
}) {
  const [status, setStatus] = useState<BookingStatus | null>(initialStatus);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");

  const filters = useMemo(
    () => ({ status: status ?? undefined, q: search || undefined }),
    [status, search],
  );

  const { data, counts, loading, error, reload } = useBookings(filters);
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((tab) => {
          const count = tab.value === null ? total : counts[tab.value];
          const active = tab.value === status;

          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => setStatus(tab.value)}
              aria-pressed={active}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-medium text-sm transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {tab.label}
              <span
                className={`tabular-nums text-xs ${active ? "opacity-80" : "opacity-60"}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setSearch(query.trim());
        }}
      >
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Søk på referanse, navn eller e-post"
            className="pl-9"
          />
        </div>

        <Button type="submit" variant="outline">
          Søk
        </Button>

        {search ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setQuery("");
              setSearch("");
            }}
          >
            Nullstill
          </Button>
        ) : null}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Oppdater listen"
          onClick={() => void reload()}
          className="ml-auto"
        >
          <RefreshCw className="size-4" />
        </Button>
      </form>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <Empty search={search} status={status} />
      ) : (
        <BookingsTable bookings={data} />
      )}
    </div>
  );
}

function Empty({ search, status }: { search: string; status: BookingStatus | null }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-12 text-center">
      <CalendarX2 className="size-8 text-muted-foreground" strokeWidth={1.5} />
      <p className="font-medium">
        {search
          ? `Ingen treff på «${search}»`
          : status
            ? `Ingen bookinger med status ${STATUS_LABELS[status].toLowerCase()}`
            : "Ingen bookinger ennå"}
      </p>
      <p className="max-w-sm text-muted-foreground text-sm">
        {search || status
          ? "Prøv et annet søk, eller velg en annen fane."
          : "Forespørsler fra nettsiden dukker opp her med én gang de sendes inn."}
      </p>
    </div>
  );
}
