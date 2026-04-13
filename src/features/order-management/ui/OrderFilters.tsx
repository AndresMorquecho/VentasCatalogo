import { Input } from "@/shared/ui/input"
import { DateRangePicker } from "@/shared/ui/filters"
import { Filter, User, BookOpen, Tag } from "lucide-react"
import type { DateRange } from "react-day-picker"
import type { OrderFilterType } from "../model/useOrderFilters"
import { SearchableSelect } from "@/shared/ui/SearchableSelect"
import { useClientList } from "@/features/clients/api/hooks"
import { useBrandList } from "@/features/brands/api/hooks"

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
    dateRange?: DateRange
    onDateRangeChange: (range: DateRange | undefined) => void
    // Expanded Filters
    clientId?: string
    onClientChange: (id: string) => void
    brandId?: string
    onBrandChange: (id: string) => void
    receiptNumber?: string
    onReceiptNumberChange: (rn: string) => void
    orderNumber?: string
    onOrderNumberChange: (on: string) => void
    typeFilter?: string
    onTypeChange: (t: string) => void
}

const STATUS_FILTERS: { value: OrderFilterType; label: string }[] = [
    { value: 'ALL', label: 'Todos los estados' },
    { value: 'POR_RECIBIR', label: 'Por Recibir' },
    { value: 'RECIBIDO_EN_BODEGA', label: 'En Bodega' },
    { value: 'ENTREGADO', label: 'Entregados' },
    { value: 'DESMANTELADO', label: 'Desmantelados' },
]

const TYPE_FILTERS = [
    { value: '', label: 'Cualquier Tipo' },
    { value: 'NORMAL', label: 'Normal' },
    { value: 'CAMBIO', label: 'Cambio' },
    { value: 'REPROGRAMACION', label: 'Repro' },
    { value: 'PREVENTA', label: 'Preventa' },
]

export function OrderFilters({ 
    statusFilter, onStatusChange, 
    dateRange, onDateRangeChange,
    clientId, onClientChange,
    brandId, onBrandChange,
    receiptNumber, onReceiptNumberChange,
    orderNumber, onOrderNumberChange,
    typeFilter, onTypeChange
}: OrderFiltersProps) {
    const { data: clientsResponse } = useClientList({ limit: 1000 })
    const { data: catalogsResponse } = useBrandList({ limit: 100 })

    const clientOptions = (clientsResponse?.data || []).map(c => ({
        id: c.id,
        label: c.firstName,
        subLabel: c.identificationNumber
    }))

    const catalogOptions = (catalogsResponse?.data || []).map(c => ({
        id: c.id,
        label: c.name
    }))

    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm mb-6 space-y-4">
            {/* Fila 1: Filtros Primarios (3 items) */}
            <div className="flex flex-wrap md:flex-nowrap items-end gap-4 w-full">
                {/* Fechas */}
                <div className="flex-[1.4] min-w-[220px] space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                        Rango de Fechas
                    </label>
                    <DateRangePicker
                        value={dateRange}
                        onChange={onDateRangeChange}
                        className="w-full h-10"
                        buttonClassName="h-10 rounded-xl text-xs border-slate-200 bg-slate-50/30"
                        showLabel={false}
                    />
                </div>

                {/* Estado */}
                <div className="flex-1 min-w-[170px] space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                        Estado del Pedido
                    </label>
                    <Select value={statusFilter} onValueChange={(val) => onStatusChange(val as OrderFilterType)}>
                        <SelectTrigger className="h-10 bg-slate-50/30 border-slate-200 rounded-xl shadow-sm text-xs">
                            <div className="flex items-center gap-2">
                                <Filter className="h-3.5 w-3.5 text-slate-400" />
                                <SelectValue placeholder="Estado" />
                            </div>
                        </SelectTrigger>
                        <SelectContent searchable={true}>
                            {STATUS_FILTERS.map((f) => (
                                <SelectItem key={f.value} value={f.value}>
                                    {f.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Cliente */}
                <div className="flex-[1.4] min-w-[200px] space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                        <User className="h-3 w-3" /> Empresaria / Cliente
                    </label>
                    <SearchableSelect
                        options={clientOptions}
                        value={clientId || ''}
                        onChange={onClientChange}
                        placeholder="Buscar..."
                        className="h-10 text-xs bg-slate-50/30"
                    />
                </div>
            </div>

            {/* Fila 2: Filtros de Detalle (4 items) */}
            <div className="flex flex-wrap md:flex-nowrap items-end gap-4 w-full pt-1">
                {/* Marca */}
                <div className="flex-1 min-w-[150px] space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                        <BookOpen className="h-3 w-3" /> Catálogo
                    </label>
                    <SearchableSelect
                        options={catalogOptions}
                        value={brandId || ''}
                        onChange={onBrandChange}
                        placeholder="Todas las marcas"
                        className="h-10 text-xs bg-slate-50/30"
                    />
                </div>

                {/* N° Recibo */}
                <div className="flex-1 min-w-[130px] space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                        N° Recibo
                    </label>
                    <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input
                            placeholder="OR-..."
                            value={receiptNumber || ''}
                            onChange={(e) => onReceiptNumberChange(e.target.value)}
                            className="pl-9 h-10 text-xs bg-slate-50/30 border-slate-200 rounded-xl shadow-none"
                        />
                    </div>
                </div>

                {/* N° Pedido */}
                <div className="flex-1 min-w-[130px] space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                        N° Pedido
                    </label>
                    <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input
                            placeholder="PD-..."
                            value={orderNumber || ''}
                            onChange={(e) => onOrderNumberChange(e.target.value)}
                            className="pl-9 h-10 text-xs bg-slate-50/30 border-slate-200 rounded-xl shadow-none"
                        />
                    </div>
                </div>

                {/* Tipo */}
                <div className="flex-[0.7] min-w-[110px] space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                        Tipo
                    </label>
                    <Select value={typeFilter || ''} onValueChange={onTypeChange}>
                        <SelectTrigger className="h-10 bg-slate-50/30 border-slate-200 rounded-xl shadow-sm text-xs">
                            <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            {TYPE_FILTERS.map((t) => (
                                <SelectItem key={t.value} value={t.value || "ALL"}>
                                    {t.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    )
}
