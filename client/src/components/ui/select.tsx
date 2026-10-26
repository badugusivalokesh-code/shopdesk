import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from "react";

import { cn } from "./utils";

export interface SelectOption {
  disabled?: boolean;
  label: string;
  value: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: ReactNode;
  hint?: ReactNode;
  label?: ReactNode;
  options?: readonly SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    children,
    className,
    disabled,
    error,
    hint,
    id,
    label,
    options,
    placeholder,
    required,
    ...selectProps
  },
  ref,
) {
  const generatedId = useId().replace(/:/g, "");
  const selectId = id ?? `select-${generatedId}`;
  const hintId = `${selectId}-hint`;
  const errorId = `${selectId}-error`;
  const hasError = error !== undefined && error !== null && error !== false;
  const hasHint = hint !== undefined && hint !== null && hint !== false;
  const hasLabel = label !== undefined && label !== null && label !== false;
  const hasPlaceholder = placeholder !== undefined && placeholder !== null;
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
        <label htmlFor={selectId} className="block text-xs font-semibold tracking-[0.01em] text-text-primary">
          {label}
        </label>
      ) : null}

      <div className="relative">
        <select
          {...selectProps}
          ref={ref}
          id={selectId}
          disabled={disabled}
          required={required}
          aria-invalid={hasError ? true : ariaInvalid}
          aria-describedby={describedBy || undefined}
          className={cn(
            "block min-h-11 w-full appearance-none rounded-control border border-border bg-surface px-3.5 py-2.5 pr-10 text-sm leading-5 text-text-primary shadow-sm outline-none transition-[background-color,border-color,box-shadow,color] duration-150 hover:border-brand/30 focus:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20 focus-visible:ring-offset-1 focus-visible:ring-offset-page disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-text-tertiary disabled:hover:border-border",
            hasError && "border-danger hover:border-danger focus:border-danger focus-visible:ring-danger/20",
            className,
          )}
        >
          {hasPlaceholder ? (
            <option value="" disabled={required}>
              {placeholder}
            </option>
          ) : null}
          {options
            ? options.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))
            : children}
        </select>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary"
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
            <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
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
