import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "./utils";

export type StatusBadgeSize = "sm" | "md";
export type StatusBadgeTone = "danger" | "info" | "neutral" | "success" | "warning";
export type StatusBadgeStatus =
  | "pending"
  | "Pending"
  | "shipped"
  | "Shipped"
  | "delivered"
  | "Delivered"
  | "cancelled"
  | "Cancelled"
  | "low-stock"
  | "Low Stock"
  | "approved"
  | "active"
  | "inactive"
  | "draft"
  | "processing"
  | "in-progress"
  | "completed"
  | "failed"
  | "error"
  | "success"
  | "info"
  | "warning"
  | "neutral"
  | "done";

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  label?: ReactNode;
  size?: StatusBadgeSize;
  status: StatusBadgeStatus | (string & {});
  tone?: StatusBadgeTone;
}

const statusTones: Record<string, StatusBadgeTone> = {
  active: "success",
  approved: "success",
  completed: "success",
  delivered: "success",
  done: "success",
  success: "success",
  shipped: "info",
  info: "info",
  "in-progress": "info",
  processing: "info",
  cancelled: "danger",
  error: "danger",
  failed: "danger",
  inactive: "danger",
  "low-stock": "warning",
  pending: "warning",
  warning: "warning",
  draft: "neutral",
  neutral: "neutral",
};

const toneClasses: Record<StatusBadgeTone, string> = {
  success: "bg-success/15 text-success ring-success/30 dark:bg-success/20",
  info: "bg-info/15 text-info ring-info/30 dark:bg-info/20",
  warning: "bg-warning/20 text-warning-foreground ring-warning/40 dark:bg-warning/25",
  danger: "bg-danger/15 text-danger ring-danger/30 dark:bg-danger/20",
  neutral: "bg-surface-secondary text-text-secondary ring-border",
};

const sizeClasses: Record<StatusBadgeSize, string> = {
  sm: "min-h-6 px-2 py-1 text-[11px] leading-none",
  md: "min-h-7 px-2.5 py-1.5 text-xs leading-none",
};

function normalizeStatus(status: string): string {
  return status.trim().toLowerCase().replace(/[\s_]+/g, "-");
}

function formatStatus(status: string): string {
  return status
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(function StatusBadge(
  { className, label, size = "md", status, tone, ...rest },
  ref,
) {
  const normalizedStatus = normalizeStatus(status);
  const resolvedTone = tone ?? statusTones[normalizedStatus] ?? "neutral";

  return (
    <span
      {...rest}
      ref={ref}
      data-status={normalizedStatus}
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-pill font-semibold tracking-[0.01em] ring-1 ring-inset",
        toneClasses[resolvedTone],
        sizeClasses[size],
        className,
      )}
    >
      {label ?? formatStatus(status)}
    </span>
  );
});
