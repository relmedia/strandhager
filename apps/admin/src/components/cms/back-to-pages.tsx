import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export function BackToPages() {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
      <Link href="/cms/sider">
        <ArrowLeft className="size-4" />
        Alle sider
      </Link>
    </Button>
  );
}
