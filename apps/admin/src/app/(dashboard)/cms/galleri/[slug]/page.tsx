import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { GalleryEditor } from "@/components/cms/gallery-editor";
import { Button } from "@/components/ui/button";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link href="/cms/galleri">
            <ArrowLeft className="size-4" />
            Alle gallerier
          </Link>
        </Button>
        <h1 className="font-semibold text-2xl tracking-tight">Galleri</h1>
        <p className="text-muted-foreground text-sm">
          Vises på /galleri/{slug}. Endringene publiseres umiddelbart.
        </p>
      </div>
      <GalleryEditor slug={slug} />
    </div>
  );
}
