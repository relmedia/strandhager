import { DocumentLibrary } from "@/components/media/document-library";

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-semibold text-2xl tracking-tight">Dokumenter</h1>
        <p className="text-muted-foreground text-sm">
          Alle PDF-ene på nettsiden – leievilkår, parselldokumenter og annet som er
          lastet opp. Last opp flere om gangen, og del lenken der den trengs.
        </p>
      </div>

      <DocumentLibrary />
    </div>
  );
}
