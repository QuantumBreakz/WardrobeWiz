import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-sm font-mono tracking-widest uppercase transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-none",
  {
    variants: {
      variant: {
        default: "bg-white text-black hover:bg-white/80",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline: "border border-white/20 bg-transparent hover:bg-white/[0.05]",
        secondary: "bg-transparent text-white border-b border-white hover:border-white/50 pb-1",
        ghost: "hover:opacity-70 opacity-100",
        link: "text-white underline-offset-4 hover:underline",
        hero: "bg-white text-black hover:bg-transparent px-8 py-4 text-base",
      },
      size: {
        default: "h-12 px-6 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-14 px-8 text-base",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
