import { BackToPages } from "@/components/cms/back-to-pages";
import { SiteContentEditor } from "@/components/cms/site-content-editor";

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <BackToPages />
        <h1 className="font-semibold text-2xl tracking-tight">Forside</h1>
        <p className="text-muted-foreground text-sm">
          Rediger alt innhold på nettsiden. Endringene publiseres umiddelbart.
        </p>
      </div>
      <SiteContentEditor />
    </div>
  );
}
