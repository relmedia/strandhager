import { BackToPages } from "@/components/cms/back-to-pages";
import { GalleriesList } from "@/components/cms/galleries-list";

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <BackToPages />
        <h1 className="font-semibold text-2xl tracking-tight">Gallerier</h1>
        <p className="text-muted-foreground text-sm">
          Hvert galleri får sin egen side på /galleri/&lt;adresse&gt;.
        </p>
      </div>
      <GalleriesList />
    </div>
  );
}
