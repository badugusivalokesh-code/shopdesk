import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "./utils";

export type ButtonVariant = "primary" | "secondary" | "outline" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingLabel?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-brand-foreground shadow-sm hover:bg-brand-light hover:shadow-md disabled:opacity-60",
  secondary:
    "border border-border bg-surface-secondary text-text-primary shadow-sm hover:border-brand/30 hover:bg-surface disabled:border-border disabled:bg-surface-secondary disabled:text-text-tertiary",
  outline:
    "border border-border bg-surface text-text-primary shadow-sm hover:border-brand/40 hover:bg-surface-secondary disabled:border-border disabled:bg-surface disabled:text-text-tertiary",
  destructive:
    "bg-danger text-danger-foreground shadow-sm hover:bg-danger/90 hover:shadow-md disabled:opacity-60",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 text-xs",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-5 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    "aria-label": ariaLabel,
    children,
    className,
    disabled,
    loading = false,
    loadingLabel = "Loading",
    size = "md",
    type,
    variant = "primary",
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...rest}
      ref={ref}
      type={type ?? "button"}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-label={ariaLabel ?? (loading ? loadingLabel : undefined)}
      className={cn(
        "inline-flex min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-control font-medium leading-5 transition-[background-color,border-color,box-shadow,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-page disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : null}
      {children}
    </button>
  );
});
