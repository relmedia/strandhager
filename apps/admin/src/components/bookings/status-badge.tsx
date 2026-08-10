import {
  Ban,
  CircleCheck,
  CircleSlash,
  Hourglass,
  PartyPopper,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { BookingStatus, PaymentStatus } from "@/types/booking";

export const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "Forespurt",
  CONFIRMED: "Bekreftet",
  DECLINED: "Avslått",
  CANCELLED: "Avbestilt",
  COMPLETED: "Gjennomført",
};

const STATUS_STYLES: Record<BookingStatus, { className: string; Icon: typeof Hourglass }> =
  {
    PENDING: {
      className: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300",
      Icon: Hourglass,
    },
    CONFIRMED: {
      className:
        "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300",
      Icon: CircleCheck,
    },
    DECLINED: {
      className: "bg-muted text-muted-foreground",
      Icon: Ban,
    },
    CANCELLED: {
      className: "bg-muted text-muted-foreground",
      Icon: CircleSlash,
    },
    COMPLETED: {
      className: "bg-sky-100 text-sky-900 dark:bg-sky-500/15 dark:text-sky-300",
      Icon: PartyPopper,
    },
  };

export function StatusBadge({ status }: { status: BookingStatus }) {
  const { className, Icon } = STATUS_STYLES[status];

  return (
    <Badge variant="secondary" className={className}>
      <Icon className="size-3" aria-hidden />
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Ikke betalt",
  PARTIALLY_PAID: "Delvis betalt",
  PAID: "Betalt",
  REFUNDED: "Refundert",
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge
      variant="outline"
      className={
        status === "PAID"
          ? "border-emerald-300 text-emerald-800 dark:border-emerald-500/40 dark:text-emerald-300"
          : "text-muted-foreground"
      }
    >
      {PAYMENT_LABELS[status]}
    </Badge>
  );
}
