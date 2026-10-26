import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "./utils";

export interface PageHeadingProps extends Omit<HTMLAttributes<HTMLElement>, "children" | "title"> {
  action?: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
}

export const PageHeading = forwardRef<HTMLElement, PageHeadingProps>(function PageHeading(
  { action, className, description, eyebrow, title, ...props },
  ref,
) {
  return (
    <header
      {...props}
      ref={ref}
      className={cn("flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between", className)}
    >
      <div>
        {eyebrow !== undefined && eyebrow !== null ? (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-secondary">{eyebrow}</p>
        ) : null}
        <h1 className="text-2xl font-bold leading-tight tracking-tight text-text-primary">{title}</h1>
        {description !== undefined && description !== null ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0 sm:pt-1">{action}</div> : null}
    </header>
  );
});
