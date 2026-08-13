"use client";

import { useMemo, useState, type ReactNode } from "react";

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
import { ArrowUpDown, MoreHorizontal, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatShortDate } from "@/lib/format";
import { getInitials } from "@/lib/utils";
import { deleteAdminUser, type AdminUserRow } from "@/server/auth-actions";

function sortableHeader(label: string) {
  return function Header({
    column,
  }: {
    column: { toggleSorting: (desc?: boolean) => void; getIsSorted: () => false | "asc" | "desc" };
  }) {
    return (
      <Button
        variant="ghost"
        className="-ml-2.5"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {label}
        <ArrowUpDown className="size-3.5" />
      </Button>
    );
  };
}

export function AdminUsersTable({
  users,
  currentUserId,
  actions,
}: {
  users: AdminUserRow[];
  currentUserId?: string;
  /** Rendered at the right end of the toolbar row, e.g. the invite button. */
  actions?: ReactNode;
}) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filter, setFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminUserRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const columns = useMemo<ColumnDef<AdminUserRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: sortableHeader("Navn"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <Avatar className="size-8 rounded-lg">
              <AvatarFallback>{getInitials(row.original.name)}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{row.original.name}</span>
            {row.original.id === currentUserId ? (
              <span className="text-muted-foreground text-xs">(deg)</span>
            ) : null}
            {row.original.mustChangePassword ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-900 text-xs">
                Venter på første innlogging
              </span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: sortableHeader("E-post"),
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
      },
      {
        accessorKey: "createdAt",
        header: sortableHeader("Opprettet"),
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums">
            {formatShortDate(row.original.createdAt.slice(0, 10))}
          </span>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const user = row.original;
          const isSelf = user.id === currentUserId;

          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={`Handlinger for ${user.name}`}>
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Handlinger</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href={`/installningar/anvandare/${user.id}`}>
                      <UserRound />
                      {isSelf ? "Min konto" : "Vis konto"}
                    </Link>
                  </DropdownMenuItem>
                  {isSelf ? null : (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        // Deferred so the closing dropdown's events don't hit the
                        // fresh alert dialog and dismiss it immediately.
                        onSelect={() => setTimeout(() => setDeleteTarget(user), 0)}
                      >
                        <Trash2 />
                        Slett bruker
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [currentUserId],
  );

  const table = useReactTable({
    data: users,
    columns,
    state: { sorting, globalFilter: filter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Input
          placeholder="Søk etter navn eller e-post …"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="max-w-sm"
          aria-label="Filtrer brukere"
        />
        {actions}
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className={header.id === "actions" ? "w-12" : undefined}>
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
                  Ingen brukere funnet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett bruker</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `${deleteTarget.name} (${deleteTarget.email}) mister tilgangen til dashbordet med en gang. Dette kan ikke angres.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deleting}
              onClick={async (event) => {
                event.preventDefault();
                if (!deleteTarget) return;

                setDeleting(true);
                const result = await deleteAdminUser(deleteTarget.id);
                setDeleting(false);

                if (result.error) {
                  toast.error(result.error);
                  return;
                }

                toast.success(`${deleteTarget.name} er slettet.`);
                setDeleteTarget(null);
                router.refresh();
              }}
            >
              {deleting ? "Sletter …" : "Slett bruker"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
