// components/ui/alert.tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

// Si no tienes este helper, crea uno simple:
// export function cn(...classes: Array<string | undefined | null | false>) {
//   return classes.filter(Boolean).join(" ");
// }
import { cn } from "../../lib/utils";

const alertVariants = cva(
  [
    "relative w-full rounded-2xl border p-4 shadow-sm",
    "bg-background text-foreground border-border",
    // Colocación automática del icono (primer hijo <svg>)
    "[&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
    "[&>svg~*]:pl-8",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive/50",
        success:
          "border-green-500/40 text-green-700 dark:text-green-400 dark:border-green-600/50",
        warning:
          "border-yellow-500/40 text-yellow-700 dark:text-yellow-400 dark:border-yellow-600/50",
        info:
          "border-blue-500/40 text-blue-700 dark:text-blue-400 dark:border-blue-600/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-sm opacity-90", className)} {...props} />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription, alertVariants };
