import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import type { OrderFilterType } from "../model/useOrderFilters"

interface OrderFiltersProps {
    statusFilter: OrderFilterType
    onStatusChange: (filter: OrderFilterType) => void
    searchQuery: string
    onSearchChange: (query: string) => void
}

const FILTERS: { value: OrderFilterType; label: string }[] = [
    { value: 'ALL', label: 'Todos' },
    { value: 'POR_RECIBIR', label: 'Por Recibir' },
    { value: 'RECIBIDO', label: 'Recibido' },
    { value: 'ATRASADO', label: 'Atrasado' },
    { value: 'CANCELADO', label: 'Cancelado' },
]

export function OrderFilters({ statusFilter, onStatusChange, searchQuery, onSearchChange }: OrderFiltersProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
            <div className="flex gap-2 flex-wrap order-2 sm:order-1">
                {FILTERS.map((f) => (
                    <Button
                        key={f.value}
                        variant={statusFilter === f.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => onStatusChange(f.value)}
                        className="rounded-full px-4"
                    >
                        {f.label}
                    </Button>
                ))}
            </div>

            <div className="w-full sm:w-auto sm:min-w-[300px] order-1 sm:order-2">
                <Input
                    placeholder="Buscar cliente, marca, recibo..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="bg-background"
                />
            </div>
        </div>
    )
}
