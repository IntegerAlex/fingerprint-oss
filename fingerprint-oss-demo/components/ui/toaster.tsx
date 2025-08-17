"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

/**
 * Client-side React component that renders toast notifications.
 *
 * Uses the `useToast` hook to obtain an array of toast objects and renders them inside a `ToastProvider`.
 * Each toast is mapped to a `Toast` element (keyed by `id`), conditionally rendering `ToastTitle` and
 * `ToastDescription` when present, an optional `action` node, and a `ToastClose` control. A `ToastViewport`
 * is included to display the toasts.
 *
 * @returns A JSX element containing the toast provider and rendered toasts.
 */
export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
