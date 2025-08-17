import { cn } from "@/lib/utils"

/**
 * A simple skeleton (loading) placeholder div.
 *
 * Renders a div with default pulse, rounded, and muted background classes. Any
 * `className` provided is merged with the defaults via `cn`, and all other
 * standard HTML div attributes are forwarded to the rendered element.
 *
 * @param className - Additional CSS class names to merge with the default styles.
 * @returns A JSX element representing the skeleton placeholder.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
