"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

type SectionPanelProps = {
  title: string;
  description: string;
  saving: boolean;
  onSave: () => void;
  children: React.ReactNode;
};

export function SectionPanel({
  title,
  description,
  saving,
  onSave,
  children,
}: SectionPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
      <CardFooter className="justify-end border-t">
        <Button onClick={onSave} disabled={saving}>
          {saving ? <Spinner className="size-4" /> : null}
          Lagre endringer
        </Button>
      </CardFooter>
    </Card>
  );
}
