"use client";

import { useId, type ReactNode } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@cabin/ui/select";

/**
 * The label sits inside the control and lifts out of the way once the field is
 * focused or holds a value. Both states are driven off `:placeholder-shown`,
 * so every control needs a placeholder even when nothing should be shown.
 */
const CONTROL =
  "peer w-full rounded-sm border border-ink/15 bg-white px-3.5 pt-6 pb-2 text-ink text-sm outline-none transition-colors placeholder:text-ink-muted/50 placeholder:opacity-0 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:placeholder:opacity-100";

const LABEL =
  "pointer-events-none absolute left-3.5 text-ink-muted text-sm transition-all duration-200 peer-focus:text-brand-deep peer-focus:text-xs peer-[:not(:placeholder-shown)]:text-xs";

/** Where the label rests before it lifts, and where it lands afterwards. */
const REST = {
  center: "-translate-y-1/2 top-1/2 peer-focus:top-3.5 peer-[:not(:placeholder-shown)]:top-3.5",
  top: "top-5 peer-focus:top-3.5 peer-[:not(:placeholder-shown)]:top-3.5",
} as const;

const LIFTED =
  "peer-focus:translate-y-0 peer-[:not(:placeholder-shown)]:translate-y-0";

type FieldProps = {
  label: string;
  children: (props: { id: string; className: string }) => ReactNode;
  hint?: string;
  anchor?: keyof typeof REST;
  className?: string;
};

function Field({ label, hint, children, anchor = "center", className }: FieldProps) {
  const id = useId();

  return (
    <div className={className}>
      <div className="relative">
        {children({ id, className: CONTROL })}
        <label htmlFor={id} className={`${LABEL} ${REST[anchor]} ${LIFTED}`}>
          {label}
        </label>
      </div>
      {hint ? <p className="mt-1.5 text-ink-muted/80 text-xs">{hint}</p> : null}
    </div>
  );
}

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "tel" | "number";
  placeholder?: string;
  hint?: string;
  required?: boolean;
  min?: number;
  max?: number;
  maxLength?: number;
  pattern?: string;
  inputMode?: "text" | "email" | "tel" | "numeric";
  /** Shown by the browser when the value does not match `pattern`. */
  title?: string;
  /** Drops characters the field should never hold, as they are typed. */
  clean?: (value: string) => string;
  autoComplete?: string;
  className?: string;
};

export function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  hint,
  required,
  min,
  max,
  maxLength,
  pattern,
  inputMode,
  title,
  clean,
  autoComplete,
  className,
}: TextFieldProps) {
  return (
    <Field label={label} hint={hint} className={className}>
      {(props) => (
        <input
          {...props}
          type={type}
          value={value}
          onChange={(event) =>
            onChange(clean ? clean(event.target.value) : event.target.value)
          }
          placeholder={placeholder ?? " "}
          required={required}
          min={min}
          max={max}
          maxLength={maxLength}
          pattern={pattern}
          inputMode={inputMode}
          title={title}
          autoComplete={autoComplete}
        />
      )}
    </Field>
  );
}

/** Digits only, with a leading + kept so foreign numbers still work. */
export function phoneDigits(value: string): string {
  const digits = value.replace(/\D/g, "");
  return value.trimStart().startsWith("+") ? `+${digits}` : digits;
}

/** Something before the @, something after it, and a real domain ending. */
export const EMAIL_PATTERN = "[^@\\s]+@[^@\\s.]+\\.[^@\\s]{2,}";

/**
 * Same look as the text fields, built on the shared shadcn Select. The chosen
 * option is always visible, so the label sits permanently lifted.
 */
export function SelectField({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  const id = useId();

  return (
    <div className={className}>
      <div className="relative">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger
            id={id}
            className="w-full cursor-pointer rounded-sm border-ink/15 bg-white px-3.5 pt-6 pb-2 text-ink text-sm focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20 data-[size=default]:h-auto [&_svg]:text-ink-muted"
          >
            <SelectValue />
          </SelectTrigger>
          {/* Above the contact dialog overlay, which sits at z-100. */}
          <SelectContent position="popper" className="z-[120] w-full rounded-sm">
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="cursor-pointer px-3.5 py-2.5 text-sm"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label
          htmlFor={id}
          className="pointer-events-none absolute top-3.5 left-3.5 text-ink-muted text-xs"
        >
          {label}
        </label>
      </div>
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <Field label={label} anchor="top" className={className}>
      {(props) => (
        <textarea
          {...props}
          value={value}
          rows={rows}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder ?? " "}
          className={`${props.className} resize-y`}
        />
      )}
    </Field>
  );
}
