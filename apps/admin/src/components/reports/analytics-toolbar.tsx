"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { parseAnalyticsRange } from "@/lib/analytics-shared";

export function AnalyticsToolbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const range = parseAnalyticsRange(searchParams.get("range") ?? undefined);

  return (
    <Select
      value={range}
      onValueChange={(value) => {
        router.replace(`/rapporter?range=${value}`, { scroll: false });
      }}
    >
      <SelectTrigger className="w-38">
        <SelectValue placeholder="Velg periode" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="last-7-days">Siste 7 dager</SelectItem>
          <SelectItem value="last-4-weeks">Siste 4 uker</SelectItem>
          <SelectItem value="last-3-months">Siste 3 måneder</SelectItem>
          <SelectItem value="year-to-date">Hittil i år</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
