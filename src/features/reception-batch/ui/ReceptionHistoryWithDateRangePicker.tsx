/**
 * EJEMPLO DE MIGRACIÓN: ReceptionHistory con DateRangePicker
 * 
 * Este archivo muestra cómo migrar de dos inputs de fecha separados
 * a un DateRangePicker con calendario interactivo
 */

import React, { useState } from "react"
import { Search, RotateCcw, Filter } from "lucide-react"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { useBrandList } from "@/features/brands/api/hooks"
import { DateRangePicker } from "@/shared/ui/filters"
import type { DateRange } from "react-day-picker"

interface Props {
    batches: any[]
    pagination?: any
    onEdit: (batch: any) => void
    onDelete: (batchId: string) => void
    isDeleting?: boolean
    page: number
    onPageChange: (page: number) => void
    filters: {
        search: string;
        startDate: string;
        endDate: string;
        brandId: string;
        packingNumber: string;
    }
    onFilterChange: (filters: any) => void
}

export function ReceptionHistoryWithDateRangePicker({ 
    batches, 
    pagination, 
    onEdit, 
    onDelete, 
    isDeleting,
    page,
    onPageChange,
    filters,
    onFilterChange
}: Props) {
    const [showFilters, setShowFilters] = useState(false)
    
    // Convertir strings de filtros a DateRange
    const dateRange: DateRange | undefined = filters.startDate && filters.endDate ? {
        from: new Date(filters.startDate),
        to: new Date(filters.endDate),
    } : undefined;

    const { data: brandsData } = useBrandList({ limit: 100 });
    const brands = brandsData?.data || [];

    const clearFilters = () => {
        onFilterChange({
            search: '',
            startDate: '',
            endDate: '',
            brandId: 'ALL',
            packingNumber: ''
        });
        onPageChange(1);
    };

    const handleDateRangeChange = (range: DateRange | undefined) => {
        onFilterChange({
            ...filters,
            startDate: range?.from ? range.from.toISOString().split('T')[0] : '',
            endDate: range?.to ? range.to.toISOString().split('T')[0] : '',
        });
        onPageChange(1);
    };

    const hasActiveFilters = filters.search || filters.startDate || filters.endDate || filters.brandId !== "ALL" || filters.packingNumber;

    return (
        <div className="space-y-4 h-full flex flex-col pt-2">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-all duration-300">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-xl text-slate-600 shadow-inner">
                            <Filter size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 leading-tight">Panel de Filtros</h3>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Historial de Recepción</p>
                        </div>
                        {hasActiveFilters && (
                            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
                        )}
                    </div>
                    
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={clearFilters}
                            className={`text-slate-500 hover:text-red-600 hover:bg-red-50 h-9 px-4 rounded-lg transition-all border border-transparent ${hasActiveFilters ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Limpiar Filtros
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`h-9 px-5 font-bold rounded-lg border-slate-200 hover:bg-slate-50 transition-all ${showFilters ? 'bg-slate-100 ring-2 ring-slate-100 border-slate-300' : 'bg-white'}`}
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            {showFilters ? 'Menos Filtros' : 'Más Filtros'}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-x-8 gap-y-6">
                    {/* Búsqueda Rápida - 3 cols */}
                    <div className="lg:col-span-3 space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Búsqueda Rápida</label>
                        <div className="relative group">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                            <Input
                                placeholder="Empresaria, N° Recibo..."
                                value={filters.search}
                                onChange={(e) => {
                                    onFilterChange({ ...filters, search: e.target.value });
                                    onPageChange(1);
                                }}
                                className="pl-10 bg-white border-slate-200 focus:ring-emerald-500/20 transition-all h-10 text-sm font-medium rounded-xl shadow-sm"
                            />
                        </div>
                    </div>

                    {/* NUEVO: DateRangePicker - 4 cols */}
                    <div className="lg:col-span-4 space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Periodo de Tiempo</label>
                        <DateRangePicker
                            value={dateRange}
                            onChange={handleDateRangeChange}
                            placeholder="Seleccionar rango de fechas"
                            showLabel={false}
                        />
                    </div>

                    {/* Identificar Packing - 2 cols */}
                    <div className="lg:col-span-2 space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">ID Packing</label>
                        <Input
                            placeholder="Ej: PK-123"
                            value={filters.packingNumber}
                            onChange={(e) => {
                                onFilterChange({ ...filters, packingNumber: e.target.value });
                                onPageChange(1);
                            }}
                            className="bg-white border-slate-200 h-10 text-sm font-bold rounded-xl focus:ring-emerald-500/20 shadow-sm transition-all"
                        />
                    </div>

                    {/* Catálogo - 3 cols */}
                    <div className="lg:col-span-3 space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Catálogo</label>
                        <Select value={filters.brandId} onValueChange={(val) => {
                            onFilterChange({ ...filters, brandId: val });
                            onPageChange(1);
                        }}>
                            <SelectTrigger className="bg-white border-slate-200 h-10 text-sm font-bold rounded-xl focus:ring-emerald-500/20 shadow-sm transition-all">
                                <SelectValue placeholder="Todas las marcas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todos los catálogos</SelectItem>
                                {brands.map((brand: any) => (
                                    <SelectItem key={brand.id} value={brand.id}>
                                        {brand.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Resto del componente... */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex-1">
                {/* Tabla de batches aquí */}
            </div>
        </div>
    );
}
