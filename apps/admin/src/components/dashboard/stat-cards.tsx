import type { ReactNode } from "react";

import Link from "next/link";
import { ArrowUpRight, CalendarCheck, Hourglass, Sun, TrendingDown, TrendingUp, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate, formatMoney } from "@/lib/format";
import type { Comparison, Dashboard } from "@/lib/stats";

export function StatCards({ data }: { data: Dashboard }) {
  const next = data.upcoming[0];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Til behandling"
        icon={<Hourglass className="size-4" />}
        value={String(data.pending)}
        href="/bokningar?status=PENDING"
        footnote={
          data.pending === 0
            ? "Ingen forespørsler venter på svar"
            : data.waitingDays === 0
              ? "Kom inn i dag"
              : `Den eldste har ventet ${data.waitingDays} ${data.waitingDays === 1 ? "dag" : "dager"}`
        }
        highlight={data.pending > 0}
      />

      <StatCard
        label="Leiedager i år"
        icon={<Sun className="size-4" />}
        value={String(data.days.value)}
        change={data.days}
        footnote={comparisonNote(data.days, (n) => `${n} dager`)}
      />

      <StatCard
        label="Inntekt hittil i år"
        icon={<Wallet className="size-4" />}
        value={formatMoney(data.revenue.value)}
        change={data.revenue}
        footnote={comparisonNote(data.revenue, formatMoney)}
      />

      <StatCard
        label="Bekreftet framover"
        icon={<CalendarCheck className="size-4" />}
        value={formatMoney(data.upcomingValue)}
        footnote={
          next
            ? `Neste leie ${formatDate(next.startDate)}`
            : "Ingenting er booket framover"
        }
      />
    </div>
  );
}

/** "Mot 12 dager i fjor", or an honest note when last year is empty. */
function comparisonNote(change: Comparison, format: (value: number) => string): string {
  if (change.previous === 0) return "Ingenting å sammenligne med i fjor";
  return `Mot ${format(change.previous)} på samme tid i fjor`;
}

function StatCard({
  label,
  icon,
  value,
  footnote,
  change,
  href,
  highlight,
}: {
  label: string;
  icon: ReactNode;
  value: string;
  footnote: string;
  change?: Comparison;
  href?: string;
  /** Draws attention to a card that is asking for something to be done. */
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "ring-primary/30" : undefined}>
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          {label}
        </CardDescription>

        <CardTitle className="font-semibold text-2xl tabular-nums">{value}</CardTitle>

        {change?.change !== null && change !== undefined ? (
          <CardAction>
            <TrendBadge change={change.change} />
          </CardAction>
        ) : href ? (
          <CardAction>
            <Link
              href={href}
              aria-label={`Åpne ${label.toLowerCase()}`}
              className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ArrowUpRight className="size-4" />
            </Link>
          </CardAction>
        ) : null}
      </CardHeader>

      <CardContent>
        <p className="text-muted-foreground text-xs">{footnote}</p>
      </CardContent>
    </Card>
  );
}

function TrendBadge({ change }: { change: number }) {
  const up = change >= 0;
  const Icon = up ? TrendingUp : TrendingDown;

  return (
    <Badge
      variant="outline"
      className={
        up
          ? "border-emerald-300 text-emerald-700 dark:border-emerald-500/40 dark:text-emerald-300"
          : "border-amber-300 text-amber-700 dark:border-amber-500/40 dark:text-amber-300"
      }
    >
      <Icon className="size-3" aria-hidden />
      {up ? "+" : ""}
      {change} %
    </Badge>
  );
}
