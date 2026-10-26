import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "./utils";

export type LoadingIndicatorSize = "sm" | "md" | "lg";

export interface LoadingIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  showLabel?: boolean;
  size?: LoadingIndicatorSize;
}

const sizeClasses: Record<LoadingIndicatorSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-9 w-9 border-[3px]",
};

export const LoadingIndicator = forwardRef<HTMLDivElement, LoadingIndicatorProps>(function LoadingIndicator(
  { "aria-label": ariaLabel, className, label = "Loading", showLabel = false, size = "md", ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel ?? label}
      className={cn("inline-flex items-center gap-2.5 text-sm font-medium text-text-secondary", className)}
    >
      <span
        aria-hidden="true"
        className={cn("shrink-0 animate-spin rounded-full border-brand/25 border-t-brand", sizeClasses[size])}
      />
      {showLabel ? <span>{label}</span> : <span className="sr-only">{label}</span>}
    </div>
  );
});
