import { WaitlistList } from "@/components/parcels/waitlist-list";

export const metadata = { title: "Venteliste" };

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-semibold text-2xl tracking-tight">Venteliste</h1>
        <p className="text-muted-foreground text-sm">
          Køen for neste ledige parsell, i den rekkefølgen folk meldte seg.
        </p>
      </div>

      <WaitlistList />
    </div>
  );
}
