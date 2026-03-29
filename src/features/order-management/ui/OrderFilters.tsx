import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { DateRangePicker } from "@/shared/ui/filters"
import { cn } from "@/shared/lib/utils"
import { Search } from "lucide-react"
import type { DateRange } from "react-day-picker"
import type { OrderFilterType } from "../model/useOrderFilters"

interface OrderFiltersProps {
    statusFilter: OrderFilterType
    onStatusChange: (filter: OrderFilterType) => void
    searchQuery: string
    onSearchChange: (query: string) => void
    dateRange?: DateRange
    onDateRangeChange: (range: DateRange | undefined) => void
}

const FILTERS: { value: OrderFilterType; label: string }[] = [
    { value: 'ALL', label: 'Todos' },
    { value: 'POR_RECIBIR', label: 'Por Recibir' },
    { value: 'RECIBIDO_EN_BODEGA', label: 'En Bodega' },
    { value: 'ENTREGADO', label: 'Entregados' },
]

export function OrderFilters({ statusFilter, onStatusChange, searchQuery, onSearchChange, dateRange, onDateRangeChange }: OrderFiltersProps) {
    return (
        <div className="flex flex-col lg:flex-row gap-3 items-center mb-6 w-full">
            {/* Buscador - Toma el espacio restante */}
            <div className="w-full lg:flex-1 min-w-0">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar cliente, catálogo, orden (OR-), pedido (PD-)..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 h-10 bg-white border-slate-200 focus-visible:ring-monchito-purple/20 focus-visible:border-monchito-purple/30 rounded-lg shadow-sm"
                    />
                </div>
            </div>

            {/* Fecha - Ancho fijo */}
            <div className="w-full lg:w-64 shrink-0">
                <DateRangePicker
                    value={dateRange}
                    onChange={onDateRangeChange}
                    className="w-full h-10 shadow-sm"
                    showLabel={false}
                />
            </div>

            {/* Estados - Botones compactos estilo segmentado */}
            <div className="w-full lg:w-auto overflow-x-auto no-scrollbar pb-1 lg:pb-0 shrink-0">
                <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg border border-slate-200">
                    {FILTERS.map((f) => (
                        <Button
                            key={f.value}
                            variant="ghost"
                            size="sm"
                            onClick={() => onStatusChange(f.value)}
                            className={cn(
                                "h-8 px-3 text-[10px] font-black uppercase tracking-wider rounded-md transition-all whitespace-nowrap",
                                statusFilter === f.value 
                                    ? "bg-monchito-purple text-white shadow-md hover:bg-monchito-purple/90" 
                                    : "text-slate-500 hover:text-monchito-purple hover:bg-monchito-purple/5"
                            )}
                        >
                            {f.label}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    )
}
