import { CircleCheck, CircleSlash, Hourglass, Sprout, UserCheck, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ParcelStatus, WaitlistStatus } from "@/types/parcel";

export const PARCEL_STATUS_LABELS: Record<ParcelStatus, string> = {
  OWNED: "Eid",
  VACANT: "Ledig",
  UNAVAILABLE: "Utilgjengelig",
};

const PARCEL_STYLES: Record<ParcelStatus, { className: string; Icon: typeof Sprout }> = {
  OWNED: {
    className:
      "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300",
    Icon: UserCheck,
  },
  VACANT: {
    className: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300",
    Icon: Sprout,
  },
  UNAVAILABLE: {
    className: "bg-muted text-muted-foreground",
    Icon: Wrench,
  },
};

export function ParcelStatusBadge({ status }: { status: ParcelStatus }) {
  const { className, Icon } = PARCEL_STYLES[status];

  return (
    <Badge variant="secondary" className={className}>
      <Icon className="size-3" aria-hidden />
      {PARCEL_STATUS_LABELS[status]}
    </Badge>
  );
}

export const WAITLIST_STATUS_LABELS: Record<WaitlistStatus, string> = {
  WAITING: "Venter",
  OFFERED: "Tilbudt",
  ACCEPTED: "Fikk parsell",
  DECLINED: "Takket nei",
};

const WAITLIST_STYLES: Record<WaitlistStatus, { className: string; Icon: typeof Sprout }> =
  {
    WAITING: {
      className: "bg-muted text-muted-foreground",
      Icon: Hourglass,
    },
    OFFERED: {
      className: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300",
      Icon: Sprout,
    },
    ACCEPTED: {
      className:
        "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300",
      Icon: CircleCheck,
    },
    DECLINED: {
      className: "bg-muted text-muted-foreground",
      Icon: CircleSlash,
    },
  };

export function WaitlistStatusBadge({ status }: { status: WaitlistStatus }) {
  const { className, Icon } = WAITLIST_STYLES[status];

  return (
    <Badge variant="secondary" className={className}>
      <Icon className="size-3" aria-hidden />
      {WAITLIST_STATUS_LABELS[status]}
    </Badge>
  );
}
