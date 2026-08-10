import { ParcellantsList } from "@/components/parcels/parcellants-list";

export const metadata = { title: "Parsellanter" };

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-semibold text-2xl tracking-tight">Parsellanter</h1>
        <p className="text-muted-foreground text-sm">
          De som eier en parsell, med kontaktopplysninger.
        </p>
      </div>

      <ParcellantsList />
    </div>
  );
}
