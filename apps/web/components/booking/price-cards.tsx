import { Sparkles } from "lucide-react";

import { WEEKDAY_NAMES, type Space } from "@/lib/booking";
import { formatPrice } from "@/lib/dates";

/** "mandag til torsdag" for a run of days, "fredag og lørdag" otherwise. */
function describeWeekdays(weekdays: number[]): string {
  const sorted = [...weekdays].sort((a, b) => a - b);
  const names = sorted.map((day) => WEEKDAY_NAMES[day - 1]);

  if (names.length === 1) return names[0];

  const isRun = sorted.every((day, index) => index === 0 || day === sorted[index - 1] + 1);
  if (isRun) return `${names[0]} til ${names[names.length - 1]}`;

  return `${names.slice(0, -1).join(", ")} og ${names[names.length - 1]}`;
}

export function PriceCards({ space }: { space: Space }) {
  return (
    <div>
      <div className="flex items-center gap-4">
        <span data-reveal-rule className="h-px w-10 bg-brand/60" />
        <p className="font-medium text-brand-deep text-xs tracking-[0.26em] uppercase">
          Priser
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {space.rates.map((rate) => (
          <article
            key={rate.id}
            data-reveal
            className="group relative overflow-hidden rounded-sm bg-white p-7 ring-1 ring-ink/10 transition-shadow duration-300 hover:shadow-lg hover:shadow-ink/5"
          >
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-brand transition-transform duration-500 group-hover:scale-x-100"
            />
            <p className="font-medium text-ink text-sm">{rate.label}</p>
            <p className="mt-4 font-display text-4xl text-ink leading-none">
              <span className="mr-1 align-middle font-sans text-base text-ink-muted">kr</span>
              {rate.amount.toLocaleString("nb-NO")}
            </p>
            <p className="mt-2 text-ink-muted text-sm">pr. dag</p>
            <p className="mt-4 border-ink/8 border-t pt-4 text-ink-muted/80 text-sm first-letter:uppercase">
              {describeWeekdays(rate.weekdays)}
            </p>
          </article>
        ))}

        {space.cleaningFee > 0 ? (
          <article
            data-reveal
            className="rounded-sm bg-brand-soft/40 p-7 ring-1 ring-brand/15"
          >
            <p className="flex items-center gap-2 font-medium text-ink text-sm">
              <Sparkles className="size-4 text-brand-deep" strokeWidth={1.75} aria-hidden />
              Utvask
            </p>
            <p className="mt-4 font-display text-4xl text-ink leading-none">
              <span className="mr-1 align-middle font-sans text-base text-ink-muted">kr</span>
              {space.cleaningFee.toLocaleString("nb-NO")}
            </p>
            <p className="mt-2 text-ink-muted text-sm">pr. leie</p>
            <p className="mt-4 border-brand/15 border-t pt-4 text-ink-muted/80 text-sm">
              Legges til automatisk, uansett hvor mange dager du leier.
            </p>
          </article>
        ) : null}
      </div>

      {space.priceNote ? (
        <p data-reveal className="mt-6 text-ink-muted/80 text-xs">
          {space.priceNote}
        </p>
      ) : null}
    </div>
  );
}

/** Compact price line used inside the booking summary. */
export function PriceRow({
  label,
  amount,
  muted,
}: {
  label: string;
  amount: number;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className={muted ? "text-ink-muted" : "text-ink"}>{label}</span>
      <span className={muted ? "text-ink-muted" : "text-ink"}>{formatPrice(amount)}</span>
    </div>
  );
}
