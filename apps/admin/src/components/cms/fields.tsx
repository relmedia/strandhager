"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
};

export function TextField({ label, value, onChange, placeholder, hint }: TextFieldProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
    </div>
  );
}

type TextareaFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
};

export function TextareaField({ label, value, onChange, rows = 4 }: TextareaFieldProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea value={value} rows={rows} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

type StringListFieldProps = {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  addLabel?: string;
};

export function StringListField({
  label,
  values,
  onChange,
  addLabel = "Legg til",
}: StringListFieldProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="space-y-2">
        {values.map((value, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional and editable
          <div key={index} className="flex gap-2">
            <Input
              value={value}
              onChange={(event) =>
                onChange(values.map((v, i) => (i === index ? event.target.value : v)))
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Fjern"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...values, ""])}>
        <Plus className="size-4" />
        {addLabel}
      </Button>
    </div>
  );
}
