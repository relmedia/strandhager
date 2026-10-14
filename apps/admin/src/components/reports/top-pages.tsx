import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCount, type TopPageRow } from "@/lib/analytics-shared";

export function TopPages({ pages }: { pages: TopPageRow[] }) {
  return (
    <Card className="h-full gap-2">
      <CardHeader>
        <CardTitle className="font-normal">Mest besøkte sider</CardTitle>
      </CardHeader>

      <CardContent className="px-0">
        {pages.length === 0 ? (
          <p className="px-4 py-8 text-center text-muted-foreground text-sm">Ingen sidevisninger i perioden ennå.</p>
        ) : (
          <Table className="[&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4">
            <TableHeader className="[&_tr]:border-border/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-8" />
                <TableHead className="h-8 w-24 text-right font-normal">Visninger</TableHead>
                <TableHead className="h-8 w-24 text-right font-normal">Besøkende</TableHead>
                <TableHead className="h-8 w-20 text-right font-normal">Andel</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="[&_tr]:border-border/50">
              {pages.map((page) => (
                <TableRow className="hover:bg-transparent" key={page.path}>
                  <TableCell className="max-w-0 truncate py-4 font-medium">{page.path}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCount(page.views)}</TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {formatCount(page.visitors)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {(page.share * 100).toLocaleString("nb-NO", { maximumFractionDigits: 1 })} %
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
