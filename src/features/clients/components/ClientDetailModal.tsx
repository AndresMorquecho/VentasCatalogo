import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/shared/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import type { Client } from "@/entities/client/model/types";
import { useOrderList } from "@/entities/order/model/hooks";
import { differenceInDays } from "date-fns";
import { 
    User, 
    ShoppingBag, 
    Clock, 
    BookOpen, 
    AlertCircle, 
    CheckCircle2, 
    TrendingDown, 
    TrendingUp,
    ShieldAlert,
    PackageCheck
} from "lucide-react";

interface ClientDetailModalProps {
    client: Client | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ClientDetailModal({ client, open, onOpenChange }: ClientDetailModalProps) {
    const { data: ordersResponse } = useOrderList(
        client ? { clientId: client.id, limit: 100 } : undefined
    );

    const orders = ordersResponse?.data || [];
    
    // Risk Rating logic
    const calculateRisk = () => {
        if (orders.length === 0) return { label: "NUEVA", color: "bg-blue-100 text-blue-800", score: 0 };
        
        const deliveredOrders = orders.filter(o => o.status === 'ENTREGADO' && o.receptionDate && o.deliveryDate);
        if (deliveredOrders.length === 0) return { label: "SIN HISTORIAL", color: "bg-slate-100 text-slate-800", score: 0 };

        const avgDaysInWarehouse = deliveredOrders.reduce((acc, o) => {
            const start = new Date(o.receptionDate!);
            const end = new Date(o.deliveryDate!);
            return acc + Math.max(0, differenceInDays(end, start));
        }, 0) / deliveredOrders.length;

        if (avgDaysInWarehouse <= 3) return { label: "EXCELENTE (A)", color: "bg-emerald-100 text-emerald-800", icon: <TrendingUp className="h-4 w-4" />, avg: avgDaysInWarehouse };
        if (avgDaysInWarehouse <= 7) return { label: "BUENA (B)", color: "bg-blue-100 text-blue-800", icon: <CheckCircle2 className="h-4 w-4" />, avg: avgDaysInWarehouse };
        if (avgDaysInWarehouse <= 15) return { label: "REGULAR (C)", color: "bg-amber-100 text-amber-800", icon: <AlertCircle className="h-4 w-4" />, avg: avgDaysInWarehouse };
        return { label: "RIESGOSA (D)", color: "bg-red-100 text-red-800", icon: <TrendingDown className="h-4 w-4" />, avg: avgDaysInWarehouse };
    };

    const risk = calculateRisk();

    if (!client) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2 border-b">
                    <div className="flex justify-between items-start">
                        <div className="flex gap-4">
                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xl">
                                {client.firstName.charAt(0)}
                            </div>
                            <div>
                                <DialogTitle className="text-2xl">{client.firstName}</DialogTitle>
                                <p className="text-sm text-muted-foreground">{client.identificationNumber} • {client.city}, {client.province}</p>
                            </div>
                        </div>
                        <Badge className={risk.color + " px-3 py-1 font-bold text-[10px] tracking-wider uppercase border-transparent"}>
                            {risk.label}
                        </Badge>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 border-b bg-slate-50/50">
                        <TabsList className="bg-transparent h-12 w-full justify-start gap-4 p-0">
                            <TabsTrigger value="info" className="data-[state=active]:bg-white data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full px-4">
                                <User className="h-4 w-4 mr-2" /> Info General
                            </TabsTrigger>
                            <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full px-4">
                                <ShoppingBag className="h-4 w-4 mr-2" /> Todos los Pedidos
                            </TabsTrigger>
                            <TabsTrigger value="pending" className="data-[state=active]:bg-white data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full px-4">
                                <Clock className="h-4 w-4 mr-2" /> Por Recibir
                            </TabsTrigger>
                            <TabsTrigger value="received" className="data-[state=active]:bg-white data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full px-4">
                                <PackageCheck className="h-4 w-4 mr-2" /> Recibidos
                            </TabsTrigger>
                            <TabsTrigger value="catalogs" className="data-[state=active]:bg-white data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full px-4">
                                <BookOpen className="h-4 w-4 mr-2" /> Catálogos
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                        <TabsContent value="info" className="m-0 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="border-slate-100 shadow-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                            <ShieldAlert className="h-4 w-4 text-primary" /> Calificación de Riesgo
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Calificación actual</span>
                                            <Badge className={risk.color}>{risk.label}</Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Promedio días en bodega</span>
                                            <span className="font-bold">{risk.avg !== undefined ? risk.avg.toFixed(1) : '0'} días</span>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-lg text-xs text-muted-foreground leading-relaxed">
                                            La calificación se mide según el tiempo que transcurre desde que el pedido llega a bodega hasta que la empresaria lo retira.
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-slate-100 shadow-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-semibold">Detalles de Contacto</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Teléfono Principal</span>
                                            <span className="font-medium">{client.phone1} ({client.operator1})</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Email</span>
                                            <span className="font-medium lowercase">{client.email}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Dirección</span>
                                            <span className="font-medium text-right max-w-[150px]">{client.address}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="all" className="m-0">
                            <OrderMiniTable orders={orders} />
                        </TabsContent>

                        <TabsContent value="pending" className="m-0">
                            <OrderMiniTable orders={orders.filter(o => o.status === 'POR_RECIBIR')} />
                        </TabsContent>

                        <TabsContent value="received" className="m-0">
                            <OrderMiniTable orders={orders.filter(o => o.status === 'RECIBIDO_EN_BODEGA')} />
                        </TabsContent>

                        <TabsContent value="catalogs" className="m-0">
                            <div className="h-40 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl">
                                <BookOpen className="h-8 w-8 mb-2 opacity-20" />
                                <p className="text-sm">Gestión de catálogos próximamente</p>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

function OrderMiniTable({ orders }: { orders: any[] }) {
    if (orders.length === 0) return <div className="text-center py-8 text-muted-foreground text-sm">No hay pedidos en esta sección</div>;

    return (
        <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                    <tr>
                        <th className="px-4 py-2 text-left font-semibold">Recibo</th>
                        <th className="px-4 py-2 text-left font-semibold">Catálogo</th>
                        <th className="px-4 py-2 text-right font-semibold">Total</th>
                        <th className="px-4 py-2 text-center font-semibold">Estado</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {orders.map(order => (
                        <tr key={order.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2 font-mono text-xs">{order.receiptNumber}</td>
                            <td className="px-4 py-2 text-xs font-semibold text-primary">{order.brandName}</td>
                            <td className="px-4 py-2 text-right font-medium">${Number(order.total).toFixed(2)}</td>
                            <td className="px-4 py-2 text-center">
                                <Badge variant="outline" className="text-[9px] px-2 py-0 h-4 uppercase font-bold">
                                    {order.status}
                                </Badge>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
