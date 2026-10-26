import { useState, type ChangeEvent } from "react";

import { Input, type InputProps } from "./input";

export interface SearchInputProps
  extends Omit<InputProps, "endAdornment" | "startAdornment" | "type"> {
  clearLabel?: string;
  clearable?: boolean;
  onClear?: () => void;
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="m14.5 14.5 3 3m-1.75-7.25a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="m6 6 8 8m0-8-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function SearchInput({
  clearLabel = "Clear search",
  clearable = true,
  defaultValue,
  onChange,
  onClear,
  placeholder = "Search",
  value,
  ...rest
}: SearchInputProps) {
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(() =>
    defaultValue === undefined ? "" : String(defaultValue),
  );
  const currentValue = isControlled ? String(value ?? "") : uncontrolledValue;
  const hasValue = currentValue.length > 0;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) {
      setUncontrolledValue(event.target.value);
    }
    onChange?.(event);
  };

  const handleClear = () => {
    if (!isControlled) {
      setUncontrolledValue("");
    }
    onClear?.();
  };

  return (
    <Input
      {...rest}
      type="search"
      value={currentValue}
      onChange={handleChange}
      placeholder={placeholder}
      startAdornment={<SearchIcon />}
      endAdornment={
        clearable && hasValue ? (
          <button
            type="button"
            aria-label={clearLabel}
            onClick={handleClear}
            className="flex h-7 w-7 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 focus-visible:ring-offset-page"
          >
            <ClearIcon />
          </button>
        ) : undefined
      }
    />
  );
}
