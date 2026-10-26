import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { Button } from "./button";
import { cn } from "./utils";

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "title"> {
  action?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  title?: ReactNode;
}

export interface ErrorStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "title"> {
  action?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  message?: ReactNode;
  onRetry?: () => void;
  retry?: () => void;
  retryLabel?: string;
  title?: ReactNode;
}

function EmptyIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10" aria-hidden="true">
      <path d="M10 16.5h28v20H10z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="m10 16.5 5-6h18l5 6M18 24h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10" aria-hidden="true">
      <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="2" />
      <path d="M24 16v9m0 6h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { action, className, description, icon, title = "Nothing here yet", ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={cn(
        "flex flex-col items-center justify-center rounded-panel border border-dashed border-border bg-surface p-8 text-center sm:p-10",
        className,
      )}
    >
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-panel bg-surface-secondary text-text-tertiary">
        {icon ?? <EmptyIcon />}
      </div>
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      {description !== undefined && description !== null ? (
        <p className="mt-2 max-w-md text-sm leading-5 text-text-secondary">{description}</p>
      ) : null}
      {action ? <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div> : null}
    </div>
  );
});

export const ErrorState = forwardRef<HTMLDivElement, ErrorStateProps>(function ErrorState(
  {
    action,
    className,
    description,
    icon,
    message,
    onRetry,
    retry,
    retryLabel = "Try again",
    title = "Something went wrong",
    ...props
  },
  ref,
) {
  const resolvedDescription = description ?? message;
  const retryHandler = onRetry ?? retry;

  return (
    <div
      {...props}
      ref={ref}
      role="alert"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center rounded-panel border border-danger/30 bg-danger/5 p-8 text-center sm:p-10",
        className,
      )}
    >
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-panel bg-danger/10 text-danger">
        {icon ?? <ErrorIcon />}
      </div>
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      {resolvedDescription !== undefined && resolvedDescription !== null ? (
        <p className="mt-2 max-w-md text-sm leading-5 text-text-secondary">{resolvedDescription}</p>
      ) : null}
      {retryHandler || action ? (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {retryHandler ? (
            <Button type="button" variant="outline" size="sm" onClick={retryHandler}>
              {retryLabel}
            </Button>
          ) : null}
          {action}
        </div>
      ) : null}
    </div>
  );
});
