import {
  useEffect,
  useId,
  useRef,
  type HTMLAttributes,
  type MouseEventHandler,
  type ReactNode,
} from "react";

import { cn } from "./utils";

export type DialogSize = "sm" | "md" | "lg";

export interface DialogProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "title"> {
  children?: ReactNode;
  closeLabel?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  description?: ReactNode;
  onClose: () => void;
  open: boolean;
  showCloseButton?: boolean;
  size?: DialogSize;
  title?: ReactNode;
}

const sizeClasses: Record<DialogSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function Dialog({
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  "aria-labelledby": ariaLabelledBy,
  children,
  className,
  closeLabel = "Close dialog",
  closeOnBackdrop = true,
  closeOnEscape = true,
  description,
  onClose,
  onClick,
  open,
  showCloseButton = true,
  size = "md",
  title,
  ...dialogAttributes
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const idPrefix = useId().replace(/:/g, "");
  const titleId = `${idPrefix}-title`;
  const descriptionId = `${idPrefix}-description`;
  const hasTitle = title !== undefined && title !== null;
  const hasDescription = description !== undefined && description !== null;

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previouslyFocusedElement = document.activeElement;
    dialogRef.current?.focus();

    return () => {
      if (previouslyFocusedElement instanceof HTMLElement) {
        previouslyFocusedElement.focus();
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEscape) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = dialogRef.current
        ? Array.from(
            dialogRef.current.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
            ),
          )
        : [];

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus({ preventScroll: true });
        return;
      }

      const firstFocusableElement = focusableElements[0];
      const lastFocusableElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstFocusableElement) {
        event.preventDefault();
        lastFocusableElement.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === lastFocusableElement) {
        event.preventDefault();
        firstFocusableElement.focus({ preventScroll: true });
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeOnEscape, onClose, open]);

  if (!open) {
    return null;
  }

  const handleBackdropClick: MouseEventHandler<HTMLDivElement> = (event) => {
    if (closeOnBackdrop && event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleDialogClick: MouseEventHandler<HTMLDivElement> = (event) => {
    onClick?.(event);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-overlay p-4 backdrop-blur-sm sm:p-6"
      onClick={handleBackdropClick}
      data-dialog-backdrop="true"
    >
      <div
        {...dialogAttributes}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={hasTitle ? titleId : ariaLabelledBy}
        aria-describedby={hasDescription ? descriptionId : ariaDescribedBy}
        aria-label={ariaLabel ?? (!hasTitle ? "Dialog" : undefined)}
        tabIndex={-1}
        onClick={handleDialogClick}
        className={cn(
          "relative my-auto max-h-[calc(100dvh-2rem)] w-full overscroll-contain overflow-y-auto rounded-panel border border-border bg-surface-elevated p-5 text-text-primary shadow-card outline-none dark:shadow-card-dark sm:max-h-[calc(100dvh-3rem)] sm:p-7",
          sizeClasses[size],
          className,
        )}
      >
        {showCloseButton ? (
          <button
            type="button"
            aria-label={closeLabel}
            onClick={onClose}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated sm:right-4 sm:top-4"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
              <path d="m6 6 8 8m0-8-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        ) : null}

        {hasTitle || hasDescription ? (
          <div className="mb-6 pr-10">
            {hasTitle ? (
              <h2 id={titleId} className="text-lg font-semibold leading-6 text-text-primary">
                {title}
              </h2>
            ) : null}
            {hasDescription ? (
              <p id={descriptionId} className="mt-1 text-sm text-text-secondary">
                {description}
              </p>
            ) : null}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

export interface ModalProps extends Omit<DialogProps, "open"> {
  isOpen?: boolean;
  open?: boolean;
}

export function Modal({ isOpen, open, ...props }: ModalProps) {
  return <Dialog {...props} open={isOpen ?? open ?? false} />;
}

export const DialogHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div {...props} className={cn("mb-6", className)} />
);

export const DialogTitle = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h2 {...props} className={cn("text-lg font-semibold leading-6 text-text-primary", className)} />
);

export const DialogDescription = ({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
  <p {...props} className={cn("mt-2 text-sm leading-5 text-text-secondary", className)} />
);

export const DialogFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    {...props}
    className={cn(
      "mt-7 flex flex-col items-stretch gap-2.5 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-end",
      className,
    )}
  />
);
