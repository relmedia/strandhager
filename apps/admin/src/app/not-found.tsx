"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center space-y-2 text-center">
      <h1 className="font-semibold text-2xl">Siden ble ikke funnet.</h1>
      <p className="text-muted-foreground">Siden du leter etter finnes ikke.</p>
      <Link prefetch={false} replace href="/">
        <Button variant="outline">Gå til startsiden</Button>
      </Link>
    </div>
  );
}
