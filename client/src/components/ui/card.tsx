import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "./utils";

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "content"> {
  content?: ReactNode;
  footer?: ReactNode;
  header?: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { children, className, content, footer, header, ...rest },
  ref,
) {
  const hasHeader = header !== undefined && header !== null;
  const hasContent = content !== undefined && content !== null;
  const hasFooter = footer !== undefined && footer !== null;

  return (
    <div
      {...rest}
      ref={ref}
      className={cn("overflow-hidden rounded-card border border-border bg-surface shadow-card dark:shadow-card-dark", className)}
    >
      {hasHeader ? <CardHeader>{header}</CardHeader> : null}
      {hasContent ? <CardContent>{content}</CardContent> : children}
      {hasFooter ? <CardFooter>{footer}</CardFooter> : null}
    </div>
  );
});

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CardHeader(
  { className, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={cn("flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6 sm:py-5", className)}
    />
  );
});

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(function CardTitle(
  { className, ...props },
  ref,
) {
  return <h3 {...props} ref={ref} className={cn("text-lg font-semibold text-text-primary", className)} />;
});

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  function CardDescription({ className, ...props }, ref) {
    return <p {...props} ref={ref} className={cn("mt-1 text-sm text-text-secondary", className)} />;
  },
);

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CardContent(
  { className, ...props },
  ref,
) {
  return <div {...props} ref={ref} className={cn("px-5 py-5 sm:px-6", className)} />;
});

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CardFooter(
  { className, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={cn(
        "flex flex-col items-stretch gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:px-6",
        className,
      )}
    />
  );
});
