import { useState, useMemo } from "react"
import { 
    Search, 
    Send, 
    ArrowLeft, 
    Calendar,
    LayoutList,
    Package,
    Printer,
} from "lucide-react"
import { Card, CardContent } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { PageHeader } from "@/shared/ui/PageHeader"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { orderApi } from "@/entities/order"
import { format } from "date-fns"
import { useAuth } from "@/shared/auth"
import { usePDFPreview } from "@/shared/hooks/usePDFPreview"
import { PDFPreviewModal } from "@/shared/ui/PDFPreviewModal"
import { prepareExchangeShipmentReceiptForPreview } from "../lib/prepareExchangeShipmentReceiptForPreview"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/shared/ui/accordion"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/table"
import { OrderStatusBadge } from "@/features/order-management/ui/OrderStatusBadge"
import { Pagination } from "@/shared/ui/pagination"
import { BrandFilter } from "@/shared/ui/filters/BrandFilter"
import { DateRangePicker } from "@/shared/ui/filters/DateRangePicker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { useBrandList } from "@/features/brands"
import { Label } from "@/shared/ui/label"
import { Input } from "@/shared/ui/input"
import { X, Filter } from "lucide-react"
import type { DateRange } from "react-day-picker"

export function ExchangesShippingHistoryPage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [guideFilter, setGuideFilter] = useState("");
    const [receiptFilter, setReceiptFilter] = useState("");
    const [manualFilter, setManualFilter] = useState("");
    const [brandFilter, setBrandFilter] = useState<string | undefined>();
    const [statusFilter, setStatusFilter] = useState<string | undefined>();
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const limit = 15;

    const { data: brandsResponse } = useBrandList({ limit: 100 });
    const brands = brandsResponse?.data || [];

    const { 
        closePreview, 
        isOpen, 
        pdfDocument, 
        downloadPDF, 
        printPDF,
        openPreview
    } = usePDFPreview({ fileName: 'guia-cambio.pdf' });

    const [pdfTitle, setPdfTitle] = useState("Guía de Envío");
    const [pdfFileName, setPdfFileName] = useState("guia-cambio.pdf");

    const { data: response, isLoading } = useQuery({
        queryKey: ['exchanges-shipping-history', page, searchTerm, guideFilter, receiptFilter, manualFilter, brandFilter, statusFilter, dateRange],
        queryFn: async () => {
            const res = await orderApi.getAll({
                type: 'CAMBIO',
                status: statusFilter || 'POR_RECIBIR,EN_TRANSITO,RECIBIDO_EN_BODEGA,ENTREGADO',
                page,
                limit, 
                search: searchTerm,
                trackingGuide: guideFilter,
                receiptNumber: receiptFilter,
                sourceOrderNumber: manualFilter,
                brandId: brandFilter,
                startDate: dateRange?.from?.toISOString(),
                endDate: dateRange?.to?.toISOString(),
                sortBy: 'updatedAt',
                order: 'desc'
            })
            return res
        }
    })

    const allExchanges = response?.data || []
    const pagination = response?.pagination

    // Group by trackingGuide
    const groupedExchanges = useMemo(() => {
        const groups: Record<string, any[]> = {}
        
        allExchanges
            .filter(o => o.trackingGuide) 
            .forEach(order => {
                const guide = order.trackingGuide!
                if (!groups[guide]) groups[guide] = []
                groups[guide].push(order)
            })

        // Sort groups by date (newest first)
        return Object.entries(groups).sort((a, b) => {
            const dateA = new Date(a[1][0].updatedAt || a[1][0].createdAt).getTime()
            const dateB = new Date(b[1][0].updatedAt || b[1][0].createdAt).getTime()
            return dateB - dateA
        })
    }, [allExchanges])

    return (
        <div className="space-y-6 h-full flex flex-col">
            <PageHeader
                title="Historial de Envíos de Cambios"
                description="Listado de guías enviadas y estado de los cambios en tránsito"
                icon={Send}
                actions={
                    <Button 
                        variant="outline" 
                        onClick={() => navigate('/exchanges')}
                        className="rounded-xl border-slate-200 font-bold"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Gestión
                    </Button>
                }
            />

            <div className="flex flex-col gap-6 flex-1 min-h-0">
                {/* Filters */}
                <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white z-20 relative">
                    <CardContent className="p-5">
                        <div className="flex flex-col gap-5">
                            <div className="flex items-center gap-2 pb-1 border-b border-slate-100 mb-1">
                                <Filter className="h-4 w-4 text-monchito-purple" />
                                <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Filtros de búsqueda</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-9 gap-3 items-end">
                                {/* N° Guía */}
                                <div className="flex flex-col gap-1.5 min-w-[120px]">
                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 mb-0 block">N° Guía</Label>
                                    <Input 
                                        placeholder="Guía..." 
                                        className="h-9 text-xs border-slate-200 rounded-lg"
                                        value={guideFilter}
                                        onChange={(e) => { setGuideFilter(e.target.value); setPage(1); }}
                                    />
                                </div>

                                {/* Search Empresaria */}
                                <div className="flex flex-col gap-1.5 min-w-[140px]">
                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 mb-0 block">Empresaria</Label>
                                    <div className="relative group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-monchito-purple" />
                                        <Input 
                                            placeholder="Nombre..." 
                                            className="h-9 pl-9 text-xs border-slate-200 rounded-lg"
                                            value={searchTerm}
                                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                        />
                                    </div>
                                </div>

                                {/* N° Recibo */}
                                <div className="flex flex-col gap-1.5 min-w-[120px]">
                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 mb-0 block">N° Recibo</Label>
                                    <Input 
                                        placeholder="CAM..." 
                                        className="h-9 text-xs border-slate-200 rounded-lg"
                                        value={receiptFilter}
                                        onChange={(e) => { setReceiptFilter(e.target.value); setPage(1); }}
                                    />
                                </div>

                                {/* N° Cambio Manual */}
                                <div className="flex flex-col gap-1.5 min-w-[120px]">
                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 mb-0 block">N° Cambio M.</Label>
                                    <Input 
                                        placeholder="Manual..." 
                                        className="h-9 text-xs border-slate-200 rounded-lg"
                                        value={manualFilter}
                                        onChange={(e) => { setManualFilter(e.target.value); setPage(1); }}
                                    />
                                </div>

                                {/* Catalogo */}
                                <BrandFilter 
                                    brands={brands}
                                    value={brandFilter}
                                    onChange={(val) => { setBrandFilter(val); setPage(1); }}
                                    label="Catálogo"
                                    showLabel={true}
                                    className="flex flex-col gap-1.5 min-w-[140px]"
                                    buttonClassName="h-9 text-xs"
                                />

                                {/* Estado */}
                                <div className="flex flex-col gap-1.5 min-w-[130px]">
                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 mb-0 block">Estado</Label>
                                    <Select value={statusFilter || "ALL"} onValueChange={(val) => { setStatusFilter(val === "ALL" ? undefined : val); setPage(1); }}>
                                        <SelectTrigger className="h-9 text-xs border-slate-200 rounded-lg">
                                            <SelectValue placeholder="Estado envío" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">Todos los estados</SelectItem>
                                            <SelectItem value="POR_ENVIAR">Por Enviar</SelectItem>
                                            <SelectItem value="POR_RECIBIR">Por Recibir</SelectItem>
                                            <SelectItem value="RECIBIDO_EN_BODEGA">Recibido en Bodega</SelectItem>
                                            <SelectItem value="ENTREGADO">Entregado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Fecha */}
                                <DateRangePicker 
                                    value={dateRange}
                                    onChange={(range) => { setDateRange(range); setPage(1); }}
                                    label="Rango de Fechas"
                                    showLabel={true}
                                    className="flex flex-col gap-1.5 col-span-1 md:col-span-2 xl:min-w-[200px]"
                                    buttonClassName="h-9 text-xs"
                                />

                                {/* Limpiar Filtros */}
                                <div className="flex flex-col gap-1.5">
                                    <div className="h-[15px]" /> {/* Spacer to match labels height */}
                                    <Button 
                                        variant="ghost" 
                                        className="h-9 w-full text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 rounded-lg border border-dashed border-slate-200"
                                        onClick={() => {
                                            setSearchTerm("");
                                            setGuideFilter("");
                                            setReceiptFilter("");
                                            setManualFilter("");
                                            setBrandFilter(undefined);
                                            setStatusFilter(undefined);
                                            setDateRange(undefined);
                                            setPage(1);
                                        }}
                                    >
                                        <X className="mr-2 h-3.5 w-3.5" /> Limpiar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* List Zone */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {isLoading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-3">
                                <div className="h-10 w-10 border-4 border-monchito-purple border-t-transparent rounded-full animate-spin" />
                                <p className="text-xs font-bold text-slate-400">Cargando productos enviados...</p>
                            </div>
                        ) : groupedExchanges.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                                <Package className="h-16 w-16 mb-4 opacity-20" />
                                <p className="text-lg font-bold">No se encontraron envíos</p>
                                <p className="text-sm">Las guías procesadas aparecerán aquí</p>
                            </div>
                        ) : (
                            <Accordion type="multiple" className="w-full">
                                {groupedExchanges.map(([guide, orders]) => {
                                    const firstOrder = orders[0]
                                    const date = firstOrder.updatedAt || firstOrder.createdAt
                                    const totalItems = orders.length
                                    const totalValue = orders.reduce((sum, o) => sum + Number(o.total), 0)

                                    return (
                                        <AccordionItem key={guide} value={guide} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/30 transition-colors">
                                            <AccordionTrigger className="px-6 py-5 hover:no-underline group">
                                                <div className="flex flex-col sm:flex-row flex-1 items-start sm:items-center justify-between gap-4 mr-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="bg-monchito-purple/10 p-3 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                                            <Send className="h-5 w-5 text-monchito-purple" />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Guía de Envío</p>
                                                            <h3 className="text-base font-black text-slate-800 tracking-tight">{guide}</h3>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-8">
                                                        <div className="hidden md:flex flex-col items-end">
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Fecha Envío</p>
                                                            <div className="flex items-center gap-1.5 font-bold text-slate-600">
                                                                <Calendar className="h-3 w-3" />
                                                                <span className="text-[11px]">{format(new Date(date), 'dd/MM/yyyy HH:mm')}</span>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex flex-col items-end min-w-[80px]">
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Guía</p>
                                                            <span className="text-sm font-mono font-black text-emerald-600">${totalValue.toFixed(2)}</span>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <div className="bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                                                <LayoutList className="h-3 w-3 text-slate-400" />
                                                                <span className="text-[11px] font-black text-slate-600 uppercase tracking-tighter">{totalItems} ITEMS</span>
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 w-8 p-0 rounded-lg hover:bg-monchito-purple hover:text-white transition-colors"
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    try {
                                                                        const { document, fileName, title } = await prepareExchangeShipmentReceiptForPreview(
                                                                            orders,
                                                                            user as any,
                                                                            guide
                                                                        );
                                                                        setPdfFileName(fileName);
                                                                        setPdfTitle(title);
                                                                        openPreview(document);
                                                                    } catch (err) {
                                                                        console.error("Error generating PDF", err);
                                                                    }
                                                                }}
                                                            >
                                                                <Printer className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="px-0 pt-0 pb-6 bg-slate-50/50 animate-in fade-in duration-300">
                                                <div className="px-4 overflow-x-auto">
                                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-w-[1400px] mb-4">
                                                        <Table>
                                                            <TableHeader className="bg-slate-50">
                                                                <TableRow>
                                                                    <TableHead className="text-center font-black text-[10px] uppercase tracking-widest w-12">N</TableHead>
                                                                    <TableHead className="font-black text-[10px] uppercase tracking-widest min-w-[150px]">Empresaria</TableHead>
                                                                    <TableHead className="font-black text-[10px] uppercase tracking-widest w-[100px]">Catálogo</TableHead>
                                                                    <TableHead className="text-center font-black text-[10px] uppercase tracking-widest w-[120px]">N° Cambio M.</TableHead>
                                                                    <TableHead className="text-center font-black text-[10px] uppercase tracking-widest w-[60px]">Cant. E</TableHead>
                                                                    <TableHead className="font-black text-[10px] uppercase tracking-widest min-w-[200px]">Descrip. Se Va</TableHead>
                                                                    <TableHead className="font-black text-[10px] uppercase tracking-widest min-w-[200px]">Descrip. Viene</TableHead>
                                                                    <TableHead className="text-center font-black text-[10px] uppercase tracking-widest w-[60px]">Cant. R</TableHead>
                                                                    <TableHead className="text-right font-black text-[10px] uppercase tracking-widest w-[90px]">Valor</TableHead>
                                                                    <TableHead className="text-right font-black text-[10px] uppercase tracking-widest w-[90px]">Abonado</TableHead>
                                                                    <TableHead className="text-right font-black text-[10px] uppercase tracking-widest w-[90px]">Saldo</TableHead>
                                                                    <TableHead className="text-center font-black text-[10px] uppercase tracking-widest w-[120px]">P. Entrega</TableHead>
                                                                    <TableHead className="text-center font-black text-[10px] uppercase tracking-widest w-[110px]">Estado</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {orders.map((order, idx) => {
                                                                    const paid = (order as any).paidAmount || 0;
                                                                    const pending = Number(order.total) - paid;
                                                                    
                                                                    return (
                                                                        <TableRow key={order.id} className="hover:bg-slate-50/50">
                                                                            <TableCell className="text-center text-slate-400 font-bold">{idx + 1}</TableCell>
                                                                            <TableCell className="font-bold text-slate-800 uppercase text-[10px]">{order.clientName}</TableCell>
                                                                            <TableCell className="font-bold text-monchito-purple uppercase text-[10px]">{order.brandName}</TableCell>
                                                                            <TableCell className="text-center font-mono font-black text-slate-500 text-[10px]">{order.sourceOrderNumber || '---'}</TableCell>
                                                                            <TableCell className="text-center font-black text-slate-600 text-[10px]">{order.sourceQuantity || 1}</TableCell>
                                                                            <TableCell className="text-[10px] text-slate-500 italic max-w-[200px] truncate">{order.sourceDescription || '---'}</TableCell>
                                                                            <TableCell className="text-[10px] text-monchito-purple font-medium max-w-[200px] truncate">{order.description || '---'}</TableCell>
                                                                            <TableCell className="text-center font-black text-slate-600 text-[10px]">{order.items?.[0]?.quantity || 1}</TableCell>
                                                                            <TableCell className="text-right font-mono font-bold text-slate-600 text-[10px]">${Number(order.total).toFixed(2)}</TableCell>
                                                                            <TableCell className="text-right font-mono font-bold text-emerald-600 text-[10px]">${Number(paid).toFixed(2)}</TableCell>
                                                                            <TableCell className="text-right font-mono font-bold text-red-500 text-[10px]">${Number(pending).toFixed(2)}</TableCell>
                                                                            <TableCell className="text-center text-slate-600 font-bold text-[10px]">
                                                                                {order.possibleDeliveryDate ? format(new Date(order.possibleDeliveryDate), 'dd/MM/yyyy') : '---'}
                                                                            </TableCell>
                                                                            <TableCell className="text-center">
                                                                                <OrderStatusBadge status={order.status} />
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    )
                                                                })}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    )
                                })}
                            </Accordion>
                        )}
                    </div>
                    
                    {/* Pagination */}
                    {pagination && pagination.pages > 1 && (
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                            <Pagination
                                currentPage={page}
                                totalPages={pagination.pages}
                                onPageChange={setPage}
                                totalItems={pagination.total}
                                itemsPerPage={limit}
                            />
                        </div>
                    )}
                </div>
            </div>
            
            <PDFPreviewModal 
                open={isOpen} 
                onOpenChange={(open: boolean) => !open && closePreview()}
                title={pdfTitle}
                pdfDocument={pdfDocument || <></>}
                fileName={pdfFileName}
                onDownload={() => downloadPDF()}
                onPrint={() => printPDF()}
            />
        </div>
    )
}
