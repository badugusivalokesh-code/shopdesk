import {
  forwardRef,
  type HTMLAttributes,
  type TableHTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from "react";

import { cn } from "./utils";

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  wrapperClassName?: string;
}

export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(
  { className, wrapperClassName, ...props },
  ref,
) {
  return (
    <div
      className={cn(
        "relative w-full overscroll-x-contain overflow-x-auto rounded-panel border border-border bg-surface",
        wrapperClassName,
      )}
    >
      <table {...props} ref={ref} className={cn("min-w-[44rem] border-collapse text-left align-middle text-sm", className)} />
    </div>
  );
});

export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(function TableHeader({ className, ...props }, ref) {
  return <thead {...props} ref={ref} className={cn("border-b border-border bg-surface-secondary", className)} />;
});

export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  function TableBody({ className, ...props }, ref) {
    return <tbody {...props} ref={ref} className={cn("divide-y divide-border", className)} />;
  },
);

export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(function TableRow(
  { className, ...props },
  ref,
) {
  return (
    <tr
      {...props}
      ref={ref}
      className={cn("transition-colors duration-150 hover:bg-surface-secondary focus-within:bg-surface-secondary", className)}
    />
  );
});

export const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(
  function TableHead({ className, scope = "col", ...props }, ref) {
    return (
      <th
        {...props}
        ref={ref}
        scope={scope}
        className={cn("whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary", className)}
      />
    );
  },
);

export const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(
  function TableCell({ className, ...props }, ref) {
    return <td {...props} ref={ref} className={cn("px-4 py-3 text-sm text-text-primary", className)} />;
  },
);
