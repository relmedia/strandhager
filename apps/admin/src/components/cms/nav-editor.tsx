"use client";

import { useId } from "react";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GripVertical, Plus, TriangleAlert } from "lucide-react";

import { ConfirmDelete } from "@/components/cms/confirm-delete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { NavItem } from "@/types/site-content";

/** Sentinel for the "type your own link" option in the destination dropdown. */
const CUSTOM = "__custom__";

export type NavTarget = {
  /** The href to write, e.g. "#utleie" or "/galleri/felleshuset". */
  value: string;
  label: string;
};

const selectClass =
  "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs";

function hrefWarning(href: string, targets: NavTarget[]): string | null {
  if (!href.trim()) {
    return "Menypunktet mangler lenke, så det gjør ingenting når man klikker på det.";
  }
  if (href.startsWith("#") && !targets.some((target) => target.value === href)) {
    return `Det finnes ingen seksjon med ankeret ${href} på forsiden, så lenken gjør ingenting.`;
  }
  return null;
}

type NavRowProps = {
  id: string;
  item: NavItem;
  targets: NavTarget[];
  onChange: (item: NavItem) => void;
  onRemove: () => void;
};

function NavRow({ id, item, targets, onChange, onRemove }: NavRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const isCustom = !targets.some((target) => target.value === item.href);
  const warning = hrefWarning(item.href, targets);

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
        transition,
      }}
      className={`rounded-lg border bg-card p-2 ${isDragging ? "z-10 shadow-md" : ""}`}
    >
      <div className="grid gap-2 sm:grid-cols-[32px_1fr_1fr_36px] sm:items-center">
        <button
          type="button"
          className="flex h-9 w-8 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden active:cursor-grabbing"
          aria-label={`Flytt ${item.label || "menypunkt"}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>

        <Input
          value={item.label}
          placeholder="Tekst"
          onChange={(event) => onChange({ ...item, label: event.target.value })}
        />

        <select
          value={isCustom ? CUSTOM : item.href}
          className={selectClass}
          aria-label="Lenkemål"
          onChange={(event) => {
            const next = event.target.value;
            onChange({ ...item, href: next === CUSTOM ? "" : next });
          }}
        >
          {targets.map((target) => (
            <option key={target.value} value={target.value}>
              {target.label}
            </option>
          ))}
          <option value={CUSTOM}>Egendefinert lenke …</option>
        </select>

        <ConfirmDelete
          label="Fjern menypunkt"
          title="Fjerne menypunkt?"
          description={`"${item.label || "Uten navn"}" forsvinner fra menyen i toppen og bunnen av nettsiden når du lagrer.`}
          onConfirm={onRemove}
        />
      </div>

      {isCustom ? (
        <div className="mt-2 sm:pr-11 sm:pl-10">
          <Input
            value={item.href}
            placeholder="#seksjon, /side eller https://…"
            onChange={(event) => onChange({ ...item, href: event.target.value })}
          />
        </div>
      ) : null}

      {warning ? (
        <p className="mt-2 flex items-start gap-2 text-destructive text-xs sm:pr-11 sm:pl-10">
          <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
          {warning}
        </p>
      ) : null}
    </div>
  );
}

type NavEditorProps = {
  value: NavItem[];
  onChange: (value: NavItem[]) => void;
  /** Real destinations on the site, offered in the dropdown. */
  targets: NavTarget[];
};

export function NavEditor({ value, onChange, targets }: NavEditorProps) {
  const baseId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Rows have no stable identity of their own, and the list cannot change while
  // a drag is in progress, so positional ids are safe here.
  const ids = value.map((_, index) => `${baseId}-${index}`);

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;

    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;

    onChange(arrayMove(value, from, to));
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs">
        Dra i håndtaket for å endre rekkefølgen. Rekkefølgen gjelder både toppmenyen og bunnteksten.
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {value.map((item, index) => (
              <NavRow
                key={ids[index]}
                id={ids[index]}
                item={item}
                targets={targets}
                onChange={(next) => onChange(value.map((n, i) => (i === index ? next : n)))}
                onRemove={() => onChange(value.filter((_, i) => i !== index))}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...value, { label: "", href: targets[0]?.value ?? "" }])}
      >
        <Plus className="size-4" />
        Legg til menypunkt
      </Button>
    </div>
  );
}
