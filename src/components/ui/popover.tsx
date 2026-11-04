"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { cn } from "@/lib/utils"

// Lets <PopoverContent closeOnClick> close its own popover after an action.
const PopoverCloseContext = React.createContext<(() => void) | null>(null)

function Popover({ open, defaultOpen, onOpenChange, ...props }: PopoverPrimitive.Root.Props) {
  const [innerOpen, setInnerOpen] = React.useState(Boolean(defaultOpen))
  const isControlled = open !== undefined
  const currentOpen = isControlled ? open : innerOpen

  const handleOpenChange: NonNullable<PopoverPrimitive.Root.Props["onOpenChange"]> = (
    next,
    ...rest
  ) => {
    if (!isControlled) setInnerOpen(next)
    onOpenChange?.(next, ...rest)
  }

  const close = React.useCallback(() => {
    if (!isControlled) setInnerOpen(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(onOpenChange as any)?.(false)
  }, [isControlled, onOpenChange])

  return (
    <PopoverCloseContext.Provider value={close}>
      <PopoverPrimitive.Root
        data-slot="popover"
        open={currentOpen}
        onOpenChange={handleOpenChange}
        {...props}
      />
    </PopoverCloseContext.Provider>
  )
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverPortal({ ...props }: PopoverPrimitive.Portal.Props) {
  return <PopoverPrimitive.Portal data-slot="popover-portal" {...props} />
}

function PopoverContent({
  className,
  align = "start",
  sideOffset = 6,
  closeOnClick = false,
  children,
  onClick,
  ...props
}: PopoverPrimitive.Popup.Props & {
  align?: "start" | "center" | "end"
  sideOffset?: number
  /** Close the popover after a button or link inside it is clicked (action menus). */
  closeOnClick?: boolean
}) {
  const close = React.useContext(PopoverCloseContext)
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        sideOffset={sideOffset}
        align={align}
        className="z-[9999]"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "z-[9999] w-auto rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-2xl outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 backdrop-blur-md",
            className
          )}
          onClick={(e) => {
            onClick?.(e)
            if (closeOnClick && (e.target as HTMLElement).closest("button, a")) close?.()
          }}
          {...props}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverTrigger, PopoverContent, PopoverPortal }
