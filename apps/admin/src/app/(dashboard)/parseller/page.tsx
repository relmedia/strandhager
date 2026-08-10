import { ParcelsBoard } from "@/components/parcels/parcels-board";

export const metadata = { title: "Parseller" };

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-semibold text-2xl tracking-tight">Parseller</h1>
        <p className="text-muted-foreground text-sm">
          Alle parsellene i hagen. Velg en for å se hvem som eier den.
        </p>
      </div>

      <ParcelsBoard />
    </div>
  );
}
