import * as React from "react"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  indicatorClassName?: string
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, indicatorClassName, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative h-4 w-full overflow-hidden rounded-full bg-lavender-100", className)}
        {...props}
      >
        <div
          className={cn("h-full w-full flex-1 bg-lavender-600 transition-all", indicatorClassName)}
          style={{ transform: `translateX(-${100 - (value / max) * 100}%)` }}
        />
      </div>
    )
  },
)
Progress.displayName = "Progress"

export { Progress }
