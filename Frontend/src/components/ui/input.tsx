import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full bg-transparent border-0 border-b border-white/20 px-0 py-4 text-xl sm:text-2xl font-light text-white placeholder:text-white/20 focus-visible:outline-none focus-visible:border-white disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-none",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
