import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/shared/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/select";
import type { Client } from "@/entities/client/model/types";
import { useOrderList } from "@/entities/order/model/hooks";
import { useBrandList } from "@/features/brands/api/hooks";
import { clientApi } from "@/shared/api/clientApi";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import {
    User,
    ShoppingBag,
    AlertCircle,
    ShieldAlert,
    Search,
    RotateCw,
    Info,
    MapPin,
    MessageSquare,
    History,
    Calendar,
    Target,
    UserCheck,
    Mail,
    Phone,
    Home
} from "lucide-react";
import { Pagination } from "@/shared/ui/pagination";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/shared/lib/utils";

interface ClientDetailModalProps {
    client: Client | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const RiskGauge = ({ value, label, color }: { value: number; label: string; color: string }) => {
    const rotation = (value / 100) * 180;
    return (
        <div className="flex flex-col items-center justify-center">
            <div className="relative w-48 h-28 flex items-end justify-center overflow-hidden">
                <svg viewBox="0 0 200 110" className="w-full h-full">
                    <path d="M 22 100 A 78 78 0 0 1 45 45 L 58 58 A 58 58 0 0 0 40 100 Z" fill="#ef4444" className="opacity-90" />
                    <path d="M 48 42 A 78 78 0 0 1 100 22 L 100 42 A 58 58 0 0 0 61 55 Z" fill="#f97316" className="opacity-90" />
                    <path d="M 100 22 A 78 78 0 0 1 152 42 L 139 55 A 58 58 0 0 0 100 42 Z" fill="#eab308" className="opacity-90" />
                    <path d="M 155 45 A 78 78 0 0 1 178 100 L 160 100 A 58 58 0 0 0 142 58 Z" fill="#22c55e" className="opacity-90" />
                    <circle cx="100" cy="100" r="10" fill="#1e293b" />
                    <circle cx="100" cy="100" r="4" fill="#64748b" />
                    <g transform={`rotate(${rotation} 100 100)`} className="transition-all duration-1000 ease-in-out">
                        <path d="M 100 100 L 35 97 L 28 100 L 35 103 Z" fill="#1e293b" className="drop-shadow-md" />
                    </g>
                </svg>
            </div>
            <div className="mt-2 text-center">
                <div className="flex items-baseline justify-center gap-1 leading-none">
                    <span className="text-3xl font-black text-slate-800 tracking-tighter">{Math.round(value)}</span>
                    <span className="text-xs font-bold text-slate-500 uppercase">Pts</span>
                </div>
                <Badge className={cn("px-4 py-0.5 mt-2 shadow-sm font-bold border-none uppercase text-[10px]", color)}>{label}</Badge>
            </div>
        </div>
    );
};

export function ClientDetailModal({ client: initialClient, open, onOpenChange }: ClientDetailModalProps) {
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [status, setStatus] = useState<string>("ALL");
    const [brandId, setBrandId] = useState<string>("ALL");
    const [search, setSearch] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const { data: client, isLoading: isClientLoading } = useQuery({
        queryKey: ['clients', initialClient?.id],
        queryFn: () => initialClient ? clientApi.getById(initialClient.id) : null,
        enabled: !!initialClient && open,
        initialData: initialClient || undefined
    });

    const { data: brandsResponse } = useBrandList({ limit: 100 });
    const { data: ordersResponse, isLoading: isOrdersLoading, refetch } = useOrderList(
        client ? {
            clientId: client.id,
            page,
            limit,
            status: status === "ALL" ? undefined : (status as any),
            brandId: brandId === "ALL" ? undefined : brandId,
            search: search.length >= 2 ? search : undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
        } : undefined
    );

    const orders = ordersResponse?.data || [];
    const pagination = ordersResponse?.pagination;
    const brands = brandsResponse?.data || [];

    const risk = useMemo(() => {
        if (!orders || orders.length === 0) return { label: "NUEVA", color: "bg-blue-100 text-blue-800", avg: 0, score: 0 };
        const deliveredOrders = orders.filter((o: any) => o.status === 'ENTREGADO' && o.receptionDate && o.deliveryDate);
        if (deliveredOrders.length === 0) return { label: "SIN HISTORIAL", color: "bg-slate-100 text-slate-800", avg: 0, score: 0 };
        const avgDaysInWarehouse = deliveredOrders.reduce((acc: number, o: any) => {
            const start = new Date(o.receptionDate!);
            const end = new Date(o.deliveryDate!);
            return acc + Math.max(0, differenceInDays(end, start));
        }, 0) / deliveredOrders.length;

        let score = 0;
        if (avgDaysInWarehouse <= 3) score = 85 + Math.max(0, 15 - (avgDaysInWarehouse * 5));
        else if (avgDaysInWarehouse <= 7) score = 60 + Math.max(0, 15 - ((avgDaysInWarehouse - 3) * 3));
        else if (avgDaysInWarehouse <= 15) score = 35 + Math.max(0, 15 - ((avgDaysInWarehouse - 7) * 1.5));
        else score = Math.max(5, 20 - (avgDaysInWarehouse - 15));

        if (avgDaysInWarehouse <= 3) return { label: "EXCELENTE (A)", color: "bg-emerald-100 text-emerald-800", avg: avgDaysInWarehouse, score };
        if (avgDaysInWarehouse <= 7) return { label: "BUENA (B)", color: "bg-blue-100 text-blue-800", avg: avgDaysInWarehouse, score };
        if (avgDaysInWarehouse <= 15) return { label: "REGULAR (C)", color: "bg-amber-100 text-amber-800", avg: avgDaysInWarehouse, score };
        return { label: "RIESGOSA (D)", color: "bg-red-100 text-red-800", avg: avgDaysInWarehouse, score };
    }, [orders]);

    const activityStats = useMemo(() => {
        if (!orders) return { total: 0, spent: 0, pending: 0, delivered: 0 };
        return {
            total: orders.length,
            spent: orders.filter((o: any) => o.status === 'ENTREGADO').reduce((acc: number, o: any) => acc + Number(o.total), 0),
            pending: orders.filter((o: any) => o.status === 'POR_RECIBIR' || o.status === 'RECIBIDO_EN_BODEGA').length,
            delivered: orders.filter((o: any) => o.status === 'ENTREGADO').length
        };
    }, [orders]);

    if (!initialClient) return null;

    const resetFilters = () => {
        setStatus("ALL"); setBrandId("ALL"); setSearch(""); setStartDate(""); setEndDate(""); setPage(1);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border-none shadow-2xl">
                {/* HEADER */}
                <DialogHeader className="p-6 pb-4 bg-slate-50 border-b relative z-10">
                    <div className="flex justify-between items-center">
                        <div className="flex gap-5 items-center">
                            <div className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black text-2xl shadow-md border-2 border-white">
                                {client?.firstName.charAt(0)}
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">{client?.firstName}</DialogTitle>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <Badge variant="outline" className="font-mono text-xs px-2 h-5 border-slate-300 font-bold bg-white text-slate-600">
                                        ID: {client?.identificationNumber}
                                    </Badge>
                                    <span className="text-sm font-bold text-slate-500 flex items-center capitalize">
                                        <MapPin className="h-4 w-4 mr-1.5 text-primary opacity-60" /> {client?.city}, {client?.province}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-6 text-right">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-slate-400 leading-none">Fecha Registro</p>
                                <p className="text-sm font-black text-slate-700">{format(new Date(initialClient.createdAt), "dd LLL yyyy", { locale: es })}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-slate-400 leading-none">Registrado Por</p>
                                <p className="text-sm font-black text-primary flex items-center justify-end gap-1.5">
                                    <UserCheck className="h-4 w-4" />
                                    {client?.createdByName || 'SISTEMA'}
                                </p>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 border-b bg-white relative z-10">
                        <TabsList className="bg-transparent h-12 w-full justify-start gap-8 p-0">
                            <TabsTrigger value="info" className="data-[state=active]:bg-transparent border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full px-0 font-bold text-xs uppercase tracking-widest opacity-60 data-[state=active]:opacity-100 transition-all">
                                <User className="h-4 w-4 mr-2" /> INFORMACIÓN GENERAL
                            </TabsTrigger>
                            <TabsTrigger value="orders" className="data-[state=active]:bg-transparent border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full px-0 font-bold text-xs uppercase tracking-widest opacity-60 data-[state=active]:opacity-100 transition-all">
                                <ShoppingBag className="h-4 w-4 mr-2" /> REPORTE DE PEDIDOS
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/10 custom-scrollbar scroll-smooth">
                        <TabsContent value="info" className="m-0 space-y-6 animate-in fade-in duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                {/* IZQUIERDA: SCORE Y ACTIVIDAD */}
                                <div className="md:col-span-4 space-y-5">
                                    <Card className="border-none shadow-md overflow-hidden bg-white">
                                        <CardHeader className="p-4 border-b border-slate-50 bg-slate-50/50">
                                            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center justify-between">
                                                SCORE DE CUMPLIMIENTO
                                                <Target className="h-4 w-4 text-primary" />
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-5 pt-8">
                                            <RiskGauge value={risk.score} label={risk.label} color={risk.color} />
                                        </CardContent>
                                    </Card>

                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50 flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-emerald-600 mb-1">Total Compras (Entregados)</p>
                                                <span className="text-3xl font-black text-slate-800 leading-none">
                                                    ${Number(client?.clientAccount?.totalSpent || activityStats.spent).toLocaleString('es-EC', { minimumFractionDigits: 0 })}
                                                </span>
                                            </div>
                                            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-emerald-600 font-black">
                                                {client?.clientAccount?.totalOrders || activityStats.delivered}
                                            </div>
                                        </div>
                                        <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50 flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-amber-600 mb-1">Pedidos en Gestión</p>
                                                <span className="text-3xl font-black text-slate-800 leading-none">{activityStats.pending}</span>
                                            </div>
                                            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-amber-600">
                                                <History className="h-5 w-5" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* DERECHA: CONTACTO Y UBICACIÓN REAL */}
                                <div className="md:col-span-8 space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                                            <div className="p-3 bg-blue-50 rounded-xl shrink-0">
                                                <Phone className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Línea de Contacto</p>
                                                <p className="text-base font-black text-slate-800">{client?.phone1}</p>
                                                <Badge variant="secondary" className="text-[10px] h-4 px-2 font-bold uppercase mt-1">{client?.operator1}</Badge>
                                            </div>
                                        </div>

                                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                                            <div className="p-3 bg-indigo-50 rounded-xl shrink-0">
                                                <Mail className="h-5 w-5 text-indigo-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Correo Electrónico</p>
                                                <p className="text-sm font-black text-slate-800 truncate">{client?.email || 'SIN CORREO'}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Canal de Catálogos</p>
                                            </div>
                                        </div>

                                        <div className="sm:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 bg-slate-50 rounded-xl shrink-0 border border-slate-100">
                                                    <Home className="h-5 w-5 text-slate-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Ubicación y Domicilio Detallado</p>
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase">País / Provincia</p>
                                                            <p className="text-sm font-bold text-slate-800">{client?.country}, {client?.province}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase">Ciudad / Barrio</p>
                                                            <p className="text-sm font-bold text-slate-800">{client?.city} {client?.neighborhood ? `- ${client.neighborhood}` : ''}</p>
                                                        </div>
                                                        <div className="col-span-2 mt-1">
                                                            <p className="text-[9px] font-black text-slate-400 uppercase">Dirección Exacta</p>
                                                            <p className="text-sm font-bold text-slate-900 bg-slate-50 p-2 rounded-lg border border-dashed border-slate-200 mt-1 italic">
                                                                {client?.address || "No especificada"}
                                                            </p>
                                                        </div>
                                                        {client?.reference && (
                                                            <div className="col-span-2 mt-1">
                                                                <p className="text-[9px] font-black text-primary uppercase">Referencia de Entrega</p>
                                                                <p className="text-xs font-medium text-slate-600 bg-primary/5 p-2 rounded-lg border border-primary/10 mt-1">
                                                                    "{client.reference}"
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-5 w-5 text-primary opacity-60" />
                                            <span className="text-xs font-bold text-slate-600">
                                                Datos verificados por última vez el <span className="text-primary font-black uppercase">
                                                    {client?.lastDataUpdate ? format(new Date(client.lastDataUpdate), "dd 'de' MMMM, yyyy", { locale: es }) : "—"}
                                                </span>
                                            </span>
                                        </div>
                                        <Badge variant="outline" className="bg-white font-black text-[10px] text-primary border-primary/20">CONFIRMADO</Badge>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="orders" className="m-0 space-y-4 animate-in fade-in duration-300">
                            {/* Filtros de Pedidos FIXED GRID */}
                            <Card className="border-slate-200 bg-white shadow-sm overflow-visible relative z-20">
                                <CardContent className="p-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 items-end">
                                        <div className="xl:col-span-2 relative">
                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                            <Input
                                                placeholder="Buscar por recibo o número..."
                                                className="pl-10 h-10 border-slate-200 font-medium text-sm"
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                            />
                                        </div>
                                        
                                        <div className="relative">
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1 ml-1">Estado Gestión</p>
                                            <Select value={status} onValueChange={setStatus}>
                                                <SelectTrigger className="w-full h-10 font-bold text-xs uppercase bg-white border-slate-200">
                                                    <SelectValue placeholder="Estado" />
                                                </SelectTrigger>
                                                <SelectContent className="z-[100] bg-white pointer-events-auto">
                                                    <SelectItem value="ALL">TODOS LOS ESTADOS</SelectItem>
                                                    <SelectItem value="POR_RECIBIR">POR RECIBIR</SelectItem>
                                                    <SelectItem value="RECIBIDO_EN_BODEGA">RECIBIDO BODEGA</SelectItem>
                                                    <SelectItem value="ENTREGADO">ENTREGADOS</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1 ml-1">Desde</p>
                                                <Input type="date" className="h-10 text-xs border-slate-200" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                            </div>
                                            <Button variant="outline" size="icon" onClick={resetFilters} className="h-10 w-10 mt-auto border-slate-200 hover:bg-slate-50 shrink-0">
                                                <RotateCw className="h-4 w-4 text-slate-400" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* TABLA CON SCROLL HORIZONTAL PARA EVITAR TRASPOSICIÓN */}
                            <div className="rounded-2xl border border-slate-100 shadow-sm bg-white overflow-hidden">
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full min-w-[700px] border-collapse">
                                        <thead className="bg-slate-50 border-b border-slate-100">
                                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <th className="px-6 py-4 text-left w-[25%]">Recibo / Fecha</th>
                                                <th className="px-6 py-4 text-left w-[30%]">Catálogo / Marca</th>
                                                <th className="px-6 py-4 text-right w-[20%]">Total Pedido</th>
                                                <th className="px-6 py-4 text-center w-[25%]">Estado Gestión</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {isOrdersLoading ? (
                                                [1, 2, 3].map(i => (
                                                    <tr key={i}><td colSpan={4} className="px-6 py-4"><Skeleton className="h-5 w-full" /></td></tr>
                                                ))
                                            ) : orders.length > 0 ? (
                                                orders.map((order: any) => (
                                                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="font-mono font-black text-slate-700">{order.receiptNumber}</div>
                                                            <div className="text-[11px] font-bold text-slate-400">{format(new Date(order.transactionDate), "dd MMM, yyyy")}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="font-black text-primary uppercase text-xs truncate max-w-[200px]">{order.brandName}</div>
                                                            <div className="text-[11px] font-medium text-slate-500">Canal: {order.salesChannel}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="font-black text-slate-800 text-base">${Number(order.total).toFixed(2)}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <Badge className={cn("font-black text-[9px] h-6 px-3 tracking-tighter uppercase whitespace-nowrap", getStatusStyle(order.status))}>
                                                                {order.status.replace(/_/g, ' ')}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="py-20 text-center">
                                                        <Info className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                                                        <p className="text-sm font-black text-slate-300 uppercase">Sin registros en este periodo</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            {/* PAGINACIÓN */}
                            {pagination && pagination.pages > 1 && (
                                <div className="mt-2 flex justify-end">
                                    <Pagination
                                        currentPage={page}
                                        totalPages={pagination.pages}
                                        onPageChange={setPage}
                                        totalItems={pagination.total}
                                        itemsPerPage={limit}
                                    />
                                </div>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

function getStatusStyle(status: string) {
    switch (status) {
        case 'ENTREGADO': return "bg-emerald-500 text-white border-transparent";
        case 'POR_RECIBIR': return "bg-blue-500 text-white border-transparent";
        case 'RECIBIDO_EN_BODEGA': return "bg-amber-500 text-white border-transparent";
        default: return "bg-slate-500 text-white border-transparent";
    }
}
