"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ArrowUpRight, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDelete } from "@/components/cms/confirm-delete";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateRange, formatMoney } from "@/lib/format";
import { deleteGuest } from "@/lib/guest";
import { getInitials } from "@/lib/utils";
import type { GuestRow } from "@/types/guest";

function sortableHeader(label: string, align?: "right") {
  return function Header({
    column,
  }: {
    column: { toggleSorting: (desc?: boolean) => void; getIsSorted: () => false | "asc" | "desc" };
  }) {
    return (
      <Button
        variant="ghost"
        className={align === "right" ? "-mr-2.5 float-right" : "-ml-2.5"}
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {label}
        <ArrowUpDown className="size-3.5" />
      </Button>
    );
  };
}

export function GuestsTable({ guests }: { guests: GuestRow[] }) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filter, setFilter] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  async function remove(guest: GuestRow) {
    setDeleting(guest.id);
    try {
      await deleteGuest(guest.id);
      toast.success(`${guest.firstName} ${guest.lastName} er slettet`);
      // The list is rendered on the server, so ask for it again.
      router.refresh();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Klarte ikke å slette gjesten");
    } finally {
      setDeleting(null);
    }
  }

  const columns = useMemo<ColumnDef<GuestRow>[]>(
    () => [
      {
        id: "name",
        accessorFn: (row) => `${row.firstName} ${row.lastName}`,
        header: sortableHeader("Navn"),
        cell: ({ row }) => {
          const guest = row.original;
          const name = `${guest.firstName} ${guest.lastName}`;

          return (
            <div className="flex items-center gap-2.5">
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback>{getInitials(name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <span className="block font-medium">{name}</span>
                {guest.company ? (
                  <span className="block truncate text-muted-foreground text-xs">
                    {guest.company}
                  </span>
                ) : null}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: sortableHeader("Kontakt"),
        cell: ({ row }) => (
          <div className="min-w-0">
            <span className="block truncate text-muted-foreground">{row.original.email}</span>
            {row.original.phone ? (
              <span className="block text-muted-foreground text-xs tabular-nums">
                {row.original.phone}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "bookingCount",
        header: sortableHeader("Bookinger", "right"),
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">{row.original.bookingCount}</span>
        ),
      },
      {
        id: "lastStay",
        accessorFn: (row) => row.lastStay?.startDate ?? "",
        header: sortableHeader("Siste opphold"),
        cell: ({ row }) =>
          row.original.lastStay ? (
            <span className="text-muted-foreground tabular-nums">
              {formatDateRange(row.original.lastStay.startDate, row.original.lastStay.endDate)}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "totalSpent",
        header: sortableHeader("Totalt leid for", "right"),
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">
            {formatMoney(row.original.totalSpent)}
          </span>
        ),
      },
      {
        id: "open",
        cell: ({ row }) => {
          const guest = row.original;
          const name = `${guest.firstName} ${guest.lastName}`;
          // A booking cannot exist without its guest, so someone who has booked
          // is not deletable. Shown as a disabled control with the reason,
          // rather than a button that always fails.
          const held = guest.bookingCount > 0;

          return (
            <div className="flex items-center justify-end gap-0.5">
              <Link
                href={`/gaster/${guest.id}`}
                aria-label={`Åpne gjest ${name}`}
                className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <ArrowUpRight className="size-4" />
              </Link>

              {held ? (
                <span
                  className="inline-flex size-8 cursor-not-allowed items-center justify-center rounded-md text-muted-foreground/40"
                  title={`${name} har ${guest.bookingCount} ${
                    guest.bookingCount === 1 ? "booking" : "bookinger"
                  } og kan ikke slettes. Slett bookingene først.`}
                  aria-label={`${name} kan ikke slettes fordi gjesten har bookinger`}
                >
                  <Trash2 className="size-4" aria-hidden />
                </span>
              ) : (
                <ConfirmDelete
                  label={`Slett gjest ${name}`}
                  title="Slette gjesten?"
                  confirmLabel={deleting === guest.id ? "Sletter …" : "Slett"}
                  description={
                    <>
                      {name} · {guest.email}
                      <br />
                      Gjesten har ingen bookinger, så ingenting annet forsvinner
                      med dem. De dukker opp igjen hvis de booker på nytt.
                    </>
                  }
                  onConfirm={() => void remove(guest)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [deleting],
  );

  const table = useReactTable({
    data: guests,
    columns,
    state: { sorting, globalFilter: filter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // Search across everything shown, plus phone and company.
    globalFilterFn: (row, _columnId, value: string) => {
      const guest = row.original;
      const haystack =
        `${guest.firstName} ${guest.lastName} ${guest.email} ${guest.phone ?? ""} ${guest.company ?? ""}`.toLowerCase();
      return haystack.includes(value.toLowerCase());
    },
  });

  return (
    <div className="space-y-3">
      <Input
        placeholder="Søk etter navn, e-post eller telefon …"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        className="max-w-sm"
        aria-label="Filtrer gjester"
      />

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className={header.id === "open" ? "w-20" : undefined}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-20 text-center text-muted-foreground">
                  {filter
                    ? `Ingen treff på «${filter}»`
                    : "Ingen gjester ennå. Alle som booker via nettsiden dukker opp her."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
