import {
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "./utils";

export type ToastPosition =
  | "bottom-center"
  | "bottom-left"
  | "bottom-right"
  | "top-center"
  | "top-left"
  | "top-right";
export type ToastVariant = "error" | "info" | "success";

export interface ToastOptions {
  description?: ReactNode;
  duration?: number;
  title?: ReactNode;
  variant?: ToastVariant;
}

export interface ToastData extends ToastOptions {
  id: string;
}

export type ToastInput = ReactNode | ToastOptions;

export interface ToastContextValue {
  dismiss: (id: string) => void;
  error: (input: ToastInput) => string;
  info: (input: ToastInput) => string;
  success: (input: ToastInput) => string;
  toast: (input: ToastInput) => string;
  toasts: ToastData[];
}

export interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number;
  position?: ToastPosition;
}

export interface ToastProps {
  onDismiss: (id: string) => void;
  toast: ToastData;
}

export interface ToastViewportProps extends HTMLAttributes<HTMLDivElement> {
  position?: ToastPosition;
}

const toastContext = createContext<ToastContextValue | undefined>(undefined);

const positionClasses: Record<ToastPosition, string> = {
  "bottom-center": "bottom-0 left-1/2 -translate-x-1/2 items-center",
  "bottom-left": "bottom-0 left-0 items-start",
  "bottom-right": "bottom-0 right-0 items-end",
  "top-center": "left-1/2 top-0 -translate-x-1/2 items-center",
  "top-left": "left-0 top-0 items-start",
  "top-right": "right-0 top-0 items-end",
};

const variantClasses: Record<ToastVariant, string> = {
  success: "border-success/30 border-l-success",
  error: "border-danger/30 border-l-danger",
  info: "border-info/30 border-l-info",
};

const iconClasses: Record<ToastVariant, string> = {
  success: "bg-success/15 text-success",
  error: "bg-danger/15 text-danger",
  info: "bg-info/15 text-info",
};

const iconLabels: Record<ToastVariant, string> = {
  success: "✓",
  error: "!",
  info: "i",
};

function isToastOptions(input: ToastInput): input is ToastOptions {
  if (typeof input !== "object" || input === null || isValidElement(input)) {
    return false;
  }

  return "title" in input || "description" in input || "duration" in input || "variant" in input;
}

function normalizeToast(input: ToastInput, variant?: ToastVariant): Omit<ToastData, "id"> {
  if (isToastOptions(input)) {
    return {
      ...input,
      variant: variant ?? input.variant ?? "info",
    };
  }

  return {
    title: input,
    variant: variant ?? "info",
  };
}

export function Toast({ onDismiss, toast }: ToastProps) {
  const { description, duration = 5000, id, title, variant = "info" } = toast;

  useEffect(() => {
    if (duration <= 0) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => onDismiss(id), duration);
    return () => window.clearTimeout(timeoutId);
  }, [duration, id, onDismiss]);

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      aria-atomic="true"
      className={cn(
        "pointer-events-auto flex w-full items-start gap-3 rounded-panel border border-l-4 bg-surface-elevated p-4 text-text-primary shadow-card dark:shadow-card-dark",
        variantClasses[variant],
      )}
    >
      <span
        aria-hidden="true"
        className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-sm font-bold", iconClasses[variant])}
      >
        {iconLabels[variant]}
      </span>
      <div className="min-w-0 flex-1">
        {title !== undefined && title !== null ? <p className="text-sm font-semibold leading-5">{title}</p> : null}
        {description !== undefined && description !== null ? (
          <p className={cn("text-sm leading-5 text-text-secondary", title !== undefined && title !== null && "mt-1")}>
            {description}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(id)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 focus-visible:ring-offset-surface-elevated"
      >
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
          <path d="m6 6 8 8m0-8-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

export function ToastViewport({ className, position = "bottom-right", ...props }: ToastViewportProps) {
  const { dismiss, toasts } = useToast();

  return (
    <div
      {...props}
      aria-label="Notifications"
      className={cn(
        "pointer-events-none fixed z-50 flex w-full max-w-sm flex-col gap-2.5 p-4 sm:p-6",
        positionClasses[position],
        className,
      )}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>
  );
}

export function ToastProvider({ children, maxToasts = 4, position = "bottom-right" }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const nextId = useRef(0);
  const toastLimit = Math.max(1, maxToasts);

  const dismiss = useCallback((id: string) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (input: ToastInput, variant?: ToastVariant) => {
      const id = `toast-${nextId.current}`;
      nextId.current += 1;
      const nextToast: ToastData = { id, ...normalizeToast(input, variant) };
      setToasts((currentToasts) => [...currentToasts, nextToast].slice(-toastLimit));
      return id;
    },
    [toastLimit],
  );

  const toast = useCallback((input: ToastInput) => showToast(input), [showToast]);
  const success = useCallback((input: ToastInput) => showToast(input, "success"), [showToast]);
  const error = useCallback((input: ToastInput) => showToast(input, "error"), [showToast]);
  const info = useCallback((input: ToastInput) => showToast(input, "info"), [showToast]);
  const value = useMemo<ToastContextValue>(
    () => ({ dismiss, error, info, success, toast, toasts }),
    [dismiss, error, info, success, toast, toasts],
  );

  return (
    <toastContext.Provider value={value}>
      {children}
      <ToastViewport position={position} />
    </toastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(toastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}
