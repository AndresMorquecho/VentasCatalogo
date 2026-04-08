import { useState, useRef, useEffect } from "react"
import { Input } from "@/shared/ui/input"

interface Option {
    id: string
    label: string
    subLabel?: string
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder,
    disabled = false,
    onKeyDownNavigation,
    navId,
    className,
}: {
    options: Option[],
    value: string,
    onChange: (val: string) => void,
    placeholder: string,
    disabled?: boolean,
    onKeyDownNavigation?: (e: React.KeyboardEvent) => void,
    navId?: string,
    className?: string
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const wrapperRef = useRef<HTMLDivElement>(null)

    const selectedOption = options.find(o => o.id === value)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const [highlightedIndex, setHighlightedIndex] = useState(-1)

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (option.subLabel && option.subLabel.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    // Reset highlighted index when search or open state changes
    useEffect(() => {
        setHighlightedIndex(-1)
    }, [searchTerm, isOpen])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;
        
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                setIsOpen(true);
                setSearchTerm("");
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
                    onChange(filteredOptions[highlightedIndex].id);
                    setIsOpen(false);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                break;
            case 'Tab':
                // Let tab function normally but close the dropdown
                setIsOpen(false);
                break;
        }
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div
                tabIndex={disabled ? -1 : 0}
                className={`flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm items-center justify-between overflow-hidden focus:outline-none focus:ring-1 focus:ring-monchito-purple ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-monchito-purple/50 transition-colors'} ${className ?? ''}`}
                onClick={() => {
                    if (disabled) return;
                    setIsOpen(!isOpen)
                    if (!isOpen) setSearchTerm("") // Reset search on open
                }}
                onKeyDown={(e) => {
                    handleKeyDown(e);
                    if (!isOpen && onKeyDownNavigation) {
                        onKeyDownNavigation(e);
                    }
                }}
                data-nav={navId}
            >
                <span className={`truncate flex-1 text-left ${selectedOption ? "text-foreground" : "text-muted-foreground"} text-inherit`}>
                    {selectedOption ? `${selectedOption.label} ${selectedOption.subLabel ? `(${selectedOption.subLabel})` : ''}` : placeholder}
                </span>
                <span className="opacity-50 text-[9px] text-muted-foreground ml-2 shrink-0">▼</span>
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-lg bg-white dark:bg-slate-950 ring-1 ring-black ring-opacity-5">
                    <div className="p-2 border-b">
                        <Input
                            autoFocus
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="h-8"
                        />
                    </div>
                    <div className="max-h-[250px] overflow-auto py-1">
                        {filteredOptions.length === 0 ? (
                            <div className="px-2 py-3 text-sm text-muted-foreground text-center">No se encontraron resultados</div>
                        ) : (
                            filteredOptions.map((option, idx) => (
                                <div
                                    key={option.id}
                                    className={`relative flex cursor-default select-none items-center rounded-sm px-3 py-2 text-sm outline-none transition-colors ${idx === highlightedIndex ? "bg-monchito-purple/10 text-monchito-purple font-bold" : "hover:bg-indigo-50 hover:text-indigo-900"} ${option.id === value ? "bg-monchito-purple/5" : ""}`}
                                    onClick={() => {
                                        onChange(option.id)
                                        setIsOpen(false)
                                    }}
                                >
                                    <div className="flex flex-col">
                                        <span>{option.label}</span>
                                        {option.subLabel && <span className="text-[10px] opacity-70">{option.subLabel}</span>}
                                    </div>
                                    {option.id === value && (
                                        <div className="ml-auto w-2 h-2 rounded-full bg-monchito-purple" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
