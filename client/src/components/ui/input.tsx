import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "./utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  endAdornment?: ReactNode;
  error?: ReactNode;
  hint?: ReactNode;
  label?: ReactNode;
  startAdornment?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    className,
    disabled,
    endAdornment,
    error,
    hint,
    id,
    label,
    startAdornment,
    ...inputProps
  },
  ref,
) {
  const generatedId = useId().replace(/:/g, "");
  const inputId = id ?? `input-${generatedId}`;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const hasError = error !== undefined && error !== null && error !== false;
  const hasHint = hint !== undefined && hint !== null && hint !== false;
  const hasLabel = label !== undefined && label !== null && label !== false;
  const describedBy = [
    ariaDescribedBy,
    hasHint ? hintId : undefined,
    hasError ? errorId : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-2">
      {hasLabel ? (
        <label htmlFor={inputId} className="block text-xs font-semibold tracking-[0.01em] text-text-primary">
          {label}
        </label>
      ) : null}

      <div className="relative">
        {startAdornment ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
          >
            {startAdornment}
          </span>
        ) : null}

        <input
          {...inputProps}
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={hasError ? true : ariaInvalid}
          aria-describedby={describedBy || undefined}
          className={cn(
              "block min-h-11 w-full rounded-control border border-border bg-surface px-3.5 py-2.5 text-sm leading-5 text-text-primary shadow-sm outline-none transition-[background-color,border-color,box-shadow,color] duration-150 placeholder:text-text-tertiary hover:border-brand/30 focus:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20 focus-visible:ring-offset-1 focus-visible:ring-offset-page disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-text-tertiary disabled:hover:border-border",
              startAdornment ? "pl-10" : undefined,
              endAdornment ? "pr-10" : undefined,
              hasError && "border-danger hover:border-danger focus:border-danger focus-visible:ring-danger/20",
              className,
          )}
        />

        {endAdornment ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">
            {endAdornment}
          </span>
        ) : null}
      </div>

      {hasHint ? (
        <p id={hintId} className="text-xs leading-5 text-text-secondary">
          {hint}
        </p>
      ) : null}
      {hasError ? (
        <p id={errorId} role="alert" className="text-xs leading-5 text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
});
