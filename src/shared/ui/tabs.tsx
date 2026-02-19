import * as React from "react"
import { cn } from "@/shared/lib/utils"

const TabsContext = React.createContext<{
    value: string
    onValueChange: (value: string) => void
} | null>(null)

export const Tabs = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { defaultValue: string; value?: string; onValueChange?: (value: string) => void }
>(({ className, defaultValue, value: controlledValue, onValueChange, ...props }, ref) => {
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
    const value = controlledValue ?? uncontrolledValue
    const setValue = onValueChange ?? setUncontrolledValue

    return (
        <TabsContext.Provider value={{ value, onValueChange: setValue }}>
            <div ref={ref} className={cn("", className)} {...props} />
        </TabsContext.Provider>
    )
})
Tabs.displayName = "Tabs"

export const TabsList = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "inline-flex items-center justify-center rounded-lg bg-slate-100 p-1 text-slate-500",
            className
        )}
        {...props}
    />
))
TabsList.displayName = "TabsList"

export const TabsTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }
>(({ className, value: triggerValue, ...props }, ref) => {
    const context = React.useContext(TabsContext)
    const isSelected = context?.value === triggerValue

    return (
        <button
            ref={ref}
            type="button"
            onClick={() => context?.onValueChange(triggerValue)}
            data-state={isSelected ? "active" : "inactive"}
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
                className
            )}
            {...props}
        />
    )
})
TabsTrigger.displayName = "TabsTrigger"

export const TabsContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value: contentValue, ...props }, ref) => {
    const context = React.useContext(TabsContext)
    const isSelected = context?.value === contentValue

    // Render always to submit to DOM, rely on CSS (data-[state=inactive]:hidden) to toggle visibility
    // or if user didn't provide hidden class, we effectively show everything? 
    // No, Radix unmounts by default. 
    // But preserving state is nicer here.
    // The className in usage was `data-[state=inactive]:hidden`.
    // So we MUST set data-state.

    if (!isSelected && !className?.includes('hidden') && !className?.includes('data-[state=inactive]')) {
        // Fallback simple toggle if no CSS class provided for handling state
        return null;
    }

    // Actually, let's keep it simple: matches logic of `ReceptionBatchPage`.
    // If `ReceptionBatchPage` has `data-[state=inactive]:hidden`, then we render and let CSS hide.

    return (
        <div
            ref={ref}
            data-state={isSelected ? "active" : "inactive"}
            className={cn(
                "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                className
            )}
            {...props}
        />
    )
})
TabsContent.displayName = "TabsContent"
