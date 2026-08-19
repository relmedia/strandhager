import { MediaLibrary } from "@/components/media/media-library";

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-semibold text-2xl tracking-tight">Media</h1>
        <p className="text-muted-foreground text-sm">
          Alle bildene på nettsiden. Last opp flere om gangen, og bruk dem i
          innholdet med «Velg fra media»-knappene.
        </p>
      </div>

      <MediaLibrary />
    </div>
  );
}
