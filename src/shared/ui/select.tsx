import * as React from "react"
import { cn } from "@/shared/lib/utils"
import { Search } from "lucide-react"

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

interface SelectContextType {
  value?: string
  onValueChange?: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  searchValue: string
  setSearchValue: (val: string) => void
  labels: Record<string, string>
  registerLabel: (value: string, label: string) => void
}

const SelectContext = React.createContext<SelectContextType>({
  open: false,
  setOpen: () => {},
  searchValue: "",
  setSearchValue: () => {},
  labels: {},
  registerLabel: () => {},
})

export const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const [labels, setLabels] = React.useState<Record<string, string>>({})

  const registerLabel = React.useCallback((val: string, label: string) => {
    setLabels(prev => {
      if (prev[val] === label) return prev
      return { ...prev, [val]: label }
    })
  }, [])

  // Limpiar búsqueda al cerrar
  React.useEffect(() => {
    if (!open) setSearchValue("")
  }, [open])

  return (
    <SelectContext.Provider value={{ 
      value, 
      onValueChange, 
      open, 
      setOpen, 
      searchValue, 
      setSearchValue, 
      labels, 
      registerLabel 
    }}>
      <div className="relative">
        {children}
        {/* Render children hidden to collect labels on mount */}
        <div className="hidden" aria-hidden="true">
          {children}
        </div>
      </div>
    </SelectContext.Provider>
  )
}

export const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    const { setOpen, open } = React.useContext(SelectContext)
    
    return (
      <button
        ref={ref}
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
        <svg
          className={cn("h-4 w-4 opacity-50 transition-transform", open && "rotate-180")}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    )
  }
)
SelectTrigger.displayName = "SelectTrigger"

export const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => {
  const { value, labels } = React.useContext(SelectContext)
  const label = value ? labels[value] : undefined
  
  return (
    <span className={cn("block truncate", !label && "text-muted-foreground")}>
      {label || placeholder}
    </span>
  )
}

export const SelectContent: React.FC<{ children: React.ReactNode; searchable?: boolean }> = ({ 
  children, 
  searchable = false 
}) => {
  const { open, setOpen, searchValue, setSearchValue } = React.useContext(SelectContext)
  
  if (!open) return null
  
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-transparent"
        onClick={() => setOpen(false)}
      />
      <div className={cn(
        "absolute z-50 mt-1 max-h-96 w-full flex flex-col overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
        "bottom-full mb-1 lg:bottom-auto lg:top-full lg:mt-1"
      )}>
        {searchable && (
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-8 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Buscar..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              autoFocus
            />
          </div>
        )}
        <div className="p-1 overflow-auto">
          {children}
        </div>
      </div>
    </>
  )
}

export const SelectItem: React.FC<{ value: string; children: React.ReactNode }> = ({ value, children }) => {
  const { value: selectedValue, onValueChange, setOpen, registerLabel, searchValue } = React.useContext(SelectContext)
  const isSelected = selectedValue === value
  
  const label = React.useMemo(() => {
    if (typeof children === "string") return children
    // Fallback simple para elementos que contienen texto
    return React.Children.toArray(children)
      .filter(child => typeof child === "string" || typeof child === "number")
      .join("")
  }, [children])

  React.useEffect(() => {
    registerLabel(value, label)
  }, [value, label, registerLabel])

  // Filtrado por búsqueda
  if (searchValue && !label.toLowerCase().includes(searchValue.toLowerCase())) {
    return null
  }
  
  return (
    <div
      onClick={() => {
        onValueChange?.(value)
        setOpen(false)
      }}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors",
        isSelected && "bg-accent text-accent-foreground"
      )}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      {children}
    </div>
  )
}

export const SelectGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="p-1">{children}</div>
}

export const SelectLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="py-1.5 pl-8 pr-2 text-sm font-semibold text-muted-foreground">{children}</div>
}

export const SelectSeparator: React.FC = () => {
  return <div className="-mx-1 my-1 h-px bg-muted" />
}

