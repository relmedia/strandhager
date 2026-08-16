"use client";

import { useEffect, useState } from "react";

import { addDays, format } from "date-fns";
import { nb } from "date-fns/locale";
import { Plus } from "lucide-react";
import type { DateRange, Matcher } from "react-day-picker";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createManualBooking,
  getAvailability,
  getQuote,
  type PriceQuote,
} from "@/lib/booking";
import { formatDateRange, formatMoney } from "@/lib/format";

const SPACE = "felleshuset";

/** How far ahead the calendar reaches: a year covers every realistic booking. */
const HORIZON_DAYS = 365;

const BLANK = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  purpose: "",
  guests: "1",
  notes: "",
};

/**
 * "Ny booking": the dashboard enters a booking by hand for a guest who got in
 * touch by phone or e-mail. Days already taken are greyed out in the
 * calendar, the price follows the configured rates, and the guest can get
 * the usual confirmation e-mail with agreement and payment link.
 */
export function NewBookingDialog({
  adminName,
  onCreated,
}: {
  adminName: string;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>();
  const [form, setForm] = useState(BLANK);
  const [notify, setNotify] = useState(true);
  const [saving, setSaving] = useState(false);

  const [unavailable, setUnavailable] = useState<Date[]>([]);
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Fetch the taken and closed days once per open, for the whole horizon.
  useEffect(() => {
    if (!open) return;

    const from = format(new Date(), "yyyy-MM-dd");
    const to = format(addDays(new Date(), HORIZON_DAYS), "yyyy-MM-dd");

    getAvailability(SPACE, from, to)
      .then((availability) =>
        setUnavailable(
          [...availability.bookedDates, ...availability.closedDates].map(
            (day) => new Date(`${day}T00:00:00`),
          ),
        ),
      )
      .catch(() => toast.error("Klarte ikke å hente ledige dager"));
  }, [open]);

  // Price the chosen days as soon as the range is complete.
  useEffect(() => {
    if (!range?.from) {
      setQuote(null);
      setQuoteError(null);
      return;
    }

    const start = format(range.from, "yyyy-MM-dd");
    const end = format(range.to ?? range.from, "yyyy-MM-dd");
    let stale = false;

    getQuote(SPACE, start, end)
      .then((result) => {
        if (stale) return;
        setQuote(result);
        setQuoteError(null);
      })
      .catch((cause: unknown) => {
        if (stale) return;
        setQuote(null);
        setQuoteError(cause instanceof Error ? cause.message : "Klarte ikke å hente pris");
      });

    return () => {
      stale = true;
    };
  }, [range]);

  const disabled: Matcher[] = [
    { before: new Date() },
    { after: addDays(new Date(), HORIZON_DAYS) },
    ...unavailable,
  ];

  function set<K extends keyof typeof BLANK>(key: K) {
    return (value: string) => setForm((current) => ({ ...current, [key]: value }));
  }

  function reset() {
    setRange(undefined);
    setForm(BLANK);
    setNotify(true);
    setQuote(null);
    setQuoteError(null);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (!range?.from) {
      toast.error("Velg dagene i kalenderen først");
      return;
    }

    setSaving(true);
    try {
      const booking = await createManualBooking({
        space: SPACE,
        startDate: format(range.from, "yyyy-MM-dd"),
        endDate: format(range.to ?? range.from, "yyyy-MM-dd"),
        guests: Number(form.guests),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.replace(/\s/g, ""),
        company: form.company.trim() || undefined,
        purpose: form.purpose.trim() || undefined,
        notes: form.notes.trim() || undefined,
        notify,
        confirmedByName: adminName || undefined,
      });

      toast.success(
        notify
          ? `Booking ${booking.reference} er lagt inn, og bekreftelsen er sendt på e-post`
          : `Booking ${booking.reference} er lagt inn`,
      );
      setOpen(false);
      reset();
      onCreated();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Klarte ikke å lage bookingen");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button type="button">
          <Plus className="size-4" />
          Ny booking
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Ny booking</DialogTitle>
          <DialogDescription>
            Legg inn en booking for en gjest som har tatt kontakt. Opptatte og stengte
            dager er grået ut. Bookingen blir bekreftet med én gang.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-6 md:grid-cols-[auto_1fr]">
          <div className="space-y-3">
            <Calendar
              mode="range"
              locale={nb}
              numberOfMonths={1}
              selected={range}
              onSelect={setRange}
              disabled={disabled}
              excludeDisabled
              className="rounded-lg border"
            />

            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              {range?.from ? (
                <>
                  <p className="font-medium">
                    {formatDateRange(
                      format(range.from, "yyyy-MM-dd"),
                      format(range.to ?? range.from, "yyyy-MM-dd"),
                    )}
                  </p>
                  {quote ? (
                    <p className="mt-1 text-muted-foreground">
                      {quote.days.length} {quote.days.length === 1 ? "dag" : "dager"} +
                      vask — totalt{" "}
                      <span className="font-medium text-foreground">
                        {formatMoney(quote.total)}
                      </span>
                    </p>
                  ) : quoteError ? (
                    <p className="mt-1 text-destructive">{quoteError}</p>
                  ) : (
                    <p className="mt-1 text-muted-foreground">Henter pris …</p>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">Velg dagene i kalenderen.</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nb-firstname">Fornavn</Label>
                <Input
                  id="nb-firstname"
                  required
                  minLength={2}
                  value={form.firstName}
                  onChange={(event) => set("firstName")(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nb-lastname">Etternavn</Label>
                <Input
                  id="nb-lastname"
                  required
                  minLength={2}
                  value={form.lastName}
                  onChange={(event) => set("lastName")(event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nb-email">E-post</Label>
                <Input
                  id="nb-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(event) => set("email")(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nb-phone">Telefon</Label>
                <Input
                  id="nb-phone"
                  type="tel"
                  required
                  placeholder="95782508"
                  value={form.phone}
                  onChange={(event) => set("phone")(event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nb-guests">Antall gjester</Label>
                <Input
                  id="nb-guests"
                  type="number"
                  min={1}
                  required
                  value={form.guests}
                  onChange={(event) => set("guests")(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nb-purpose">Anledning</Label>
                <Input
                  id="nb-purpose"
                  placeholder="F.eks. bursdag"
                  value={form.purpose}
                  onChange={(event) => set("purpose")(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nb-company">Firma / organisasjon (valgfritt)</Label>
              <Input
                id="nb-company"
                value={form.company}
                onChange={(event) => set("company")(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nb-notes">Interne notater (vises ikke for gjesten)</Label>
              <Textarea
                id="nb-notes"
                rows={2}
                value={form.notes}
                onChange={(event) => set("notes")(event.target.value)}
              />
            </div>

            <label className="flex items-start gap-2 text-sm" htmlFor="nb-notify">
              <Checkbox
                id="nb-notify"
                checked={notify}
                onCheckedChange={(checked) => setNotify(checked === true)}
                className="mt-0.5"
              />
              <span>
                Send bekreftelse på e-post til gjesten
                <span className="block text-muted-foreground text-xs">
                  Med leieavtalen som PDF og betalingslenke når Vipps er satt opp.
                </span>
              </span>
            </label>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Avbryt
              </Button>
              <Button type="submit" disabled={saving || !range?.from || !quote}>
                {saving ? "Lagrer …" : "Legg inn booking"}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
