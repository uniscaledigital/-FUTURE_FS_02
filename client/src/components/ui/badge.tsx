import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-sm shadow-primary/10",
        admin: "border border-destructive/20 bg-destructive/10 text-destructive",
        sales: "border border-primary/20 bg-primary/10 text-primary",
        viewer: "border border-slate-200 bg-slate-100 text-slate-700",
        success: "border border-success/20 bg-success/10 text-success",
        warning: "border border-warning/20 bg-warning/10 text-warning",
        destructive: "border border-destructive/20 bg-destructive/10 text-destructive",
        secondary: "border border-secondary/20 bg-secondary/10 text-secondary",
        outline: "border border-border bg-background text-foreground hover:bg-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
