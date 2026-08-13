"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ArrowUpRight } from "lucide-react";

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
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filter, setFilter] = useState("");

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
        cell: ({ row }) => (
          <div className="text-right">
            <Link
              href={`/gaster/${row.original.id}`}
              aria-label={`Åpne gjest ${row.original.firstName} ${row.original.lastName}`}
              className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        ),
      },
    ],
    [],
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
                  <TableHead key={header.id} className={header.id === "open" ? "w-12" : undefined}>
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
