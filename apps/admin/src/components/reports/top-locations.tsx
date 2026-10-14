import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CityRow, CountryRow } from "@/lib/analytics-shared";
import { formatCount } from "@/lib/analytics-shared";

function EmptyState() {
  return <p className="py-8 text-center text-muted-foreground text-sm">Ingen data i perioden ennå.</p>;
}

function CountryList({ countries }: { countries: CountryRow[] }) {
  if (countries.length === 0) return <EmptyState />;

  return (
    <ul className="flex flex-col">
      {countries.map((country) => (
        <li key={country.code} className="flex items-center gap-3 border-border/50 border-b py-2.5 last:border-b-0">
          <span
            aria-hidden="true"
            className={`flag:${country.code} shrink-0 rounded-xs text-lg ring-1 ring-foreground/10`}
          />
          <span className="min-w-0 flex-1 truncate text-sm">{country.name}</span>
          <span className="text-muted-foreground text-xs tabular-nums">
            {(country.share * 100).toLocaleString("nb-NO", { maximumFractionDigits: 1 })} %
          </span>
          <span className="w-10 text-right text-sm tabular-nums">{formatCount(country.visitors)}</span>
        </li>
      ))}
    </ul>
  );
}

function CityList({ cities }: { cities: CityRow[] }) {
  if (cities.length === 0) return <EmptyState />;

  return (
    <ul className="flex flex-col">
      {cities.map((city) => (
        <li
          key={`${city.countryCode ?? "??"}-${city.city}`}
          className="flex items-center gap-3 border-border/50 border-b py-2.5 last:border-b-0"
        >
          {city.countryCode ? (
            <span
              aria-hidden="true"
              className={`flag:${city.countryCode} shrink-0 rounded-xs text-lg ring-1 ring-foreground/10`}
            />
          ) : (
            <span className="size-5 shrink-0" />
          )}
          <span className="min-w-0 flex-1 truncate text-sm">{city.city}</span>
          <span className="w-10 text-right text-sm tabular-nums">{formatCount(city.visitors)}</span>
        </li>
      ))}
    </ul>
  );
}

export function TopLocations({ countries, cities }: { countries: CountryRow[]; cities: CityRow[] }) {
  return (
    <Card className="h-full gap-2">
      <CardHeader>
        <CardTitle className="font-normal">Geografi</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-1 text-muted-foreground text-xs uppercase tracking-wider">Land</h3>
            <CountryList countries={countries} />
          </div>
          <div>
            <h3 className="mb-1 text-muted-foreground text-xs uppercase tracking-wider">Byer</h3>
            <CityList cities={cities} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
