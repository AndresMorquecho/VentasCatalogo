import { Input } from "@/shared/ui/input"
import { DateRangePicker } from "@/shared/ui/filters"
import { Search, Filter } from "lucide-react"
import type { DateRange } from "react-day-picker"
import type { OrderFilterType } from "../model/useOrderFilters"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/select"

interface OrderFiltersProps {
    statusFilter: OrderFilterType
    onStatusChange: (filter: OrderFilterType) => void
    searchQuery: string
    onSearchChange: (query: string) => void
    dateRange?: DateRange
    onDateRangeChange: (range: DateRange | undefined) => void
}

const FILTERS: { value: OrderFilterType; label: string }[] = [
    { value: 'ALL', label: 'Todos los estados' },
    { value: 'POR_RECIBIR', label: 'Por Recibir' },
    { value: 'RECIBIDO_EN_BODEGA', label: 'En Bodega' },
    { value: 'ENTREGADO', label: 'Entregados' },
    { value: 'CAMBIADO', label: 'Cambiados' },
    { value: 'RECOLECTADO', label: 'Recolectados (Logística)' },
    { value: 'DESMANTELADO', label: 'Desmantelados' },
    { value: 'POR_ENVIAR', label: 'Por Enviar (Empresa)' },
    { value: 'EN_TRANSITO', label: 'En Tránsito' },
    { value: 'ANULADO', label: 'Anulados' },
]

export function OrderFilters({ statusFilter, onStatusChange, searchQuery, onSearchChange, dateRange, onDateRangeChange }: OrderFiltersProps) {
    return (
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center mb-6 w-full">
            {/* Buscador - Toma el espacio restante */}
            <div className="w-full md:flex-1 min-w-0">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar cliente, catálogo, orden (OR-), pedido (PD-)..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 h-11 bg-white border-slate-200 focus-visible:ring-monchito-purple/20 focus-visible:border-monchito-purple/30 rounded-xl shadow-sm text-sm"
                    />
                </div>
            </div>

            {/* Fecha - Ancho fijo */}
            <div className="w-full md:w-64 shrink-0">
                <DateRangePicker
                    value={dateRange}
                    onChange={onDateRangeChange}
                    className="w-full h-11 shadow-sm"
                    buttonClassName="h-11 rounded-xl text-sm"
                    showLabel={false}
                />
            </div>

            {/* Estados - Selector Dropdown (Buscador Selector) */}
            <div className="w-full md:w-64 shrink-0">
                <Select value={statusFilter} onValueChange={(val) => onStatusChange(val as OrderFilterType)}>
                    <SelectTrigger className="h-11 bg-white border-slate-200 focus:ring-monchito-purple/20 rounded-xl shadow-sm text-sm">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-slate-400" />
                            <SelectValue placeholder="Filtrar por estado" />
                        </div>
                    </SelectTrigger>
                    <SelectContent searchable={true}>
                        {FILTERS.map((f) => (
                            <SelectItem key={f.value} value={f.value}>
                                {f.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}
