import { useState, useRef, useEffect, useMemo } from "react"
import { useFormik } from "formik"
import { useNavigate, useParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import * as Yup from "yup"
import { ArrowLeft, Plus, RefreshCw, Printer, FileText, PackageOpen, Pencil, Save, Trash2, Pin, PinOff } from "lucide-react"

import { Input } from "@/shared/ui/input"
import { DecimalTextField } from "@/shared/ui/DecimalTextField"
import { Button } from "@/shared/ui/button"
import { AsyncButton } from "@/shared/ui/async-button"
import { Label } from "@/shared/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import { PageHeader } from "@/shared/ui/PageHeader"

import { useOrder, useReceiptOrders } from "@/entities/order/model/hooks"
import type { SalesChannel, OrderType } from "@/entities/order/model/types"
import { getPaidAmount } from "@/entities/order/model/model"
import { orderApi } from "@/entities/order/model/api"
import { useClientList } from "@/features/clients/api/hooks"
import { useBrandList } from "@/features/brands/api/hooks"
import { getActiveBrands } from "@/entities/brand/model/model"
import { useNotifications } from "@/shared/lib/notifications"
import { prepareExchangeReceiptForPreview } from "../lib/prepareExchangeReceiptForPreview"
import { useAuth } from "@/shared/auth"
import { PaymentModal, type PaymentModalData } from "@/shared/ui/PaymentModal"
import { usePDFPreview } from "@/shared/hooks/usePDFPreview"
import { PDFPreviewModal } from "@/shared/ui/PDFPreviewModal"
import { ExchangeEditModal } from "./ExchangeEditModal"
import { useBankAccountList } from "@/features/bank-accounts/api/hooks"

const validationSchema = Yup.object({
  clientId: Yup.string().required("El cliente es requerido"),
  receiptNumber: Yup.string().optional(),
  salesChannel: Yup.string().required("El canal es requerido"),
  brandItems: Yup.array().of(
    Yup.object({
      brandId: Yup.string().required("Requerido"),
      brandName: Yup.string().required("Requerido"),
      quantity: Yup.number().min(1).required("Requerido"),
      total: Yup.number().min(0).required("Requerido"),
      type: Yup.string().required("Requerido"),
      possibleDeliveryDate: Yup.string().required("Requerido"),
    })
  ).min(1, "Al menos un ítem es requerido"),
  createdAt: Yup.string().required("Requerido"),
})

const parseExchangeNotesDetailed = (notes: string) => {
  const regex = /CAMBIO DE \[([^\s]+)\s+(.*?)\s*x(\d+):\s*([\s\S]*?)\]\s*POR\s*\[(.*?)\s*x(\d+):\s*([\s\S]*?)\]/i;
  const match = notes?.match(regex);
  if (match) return { originalOrder: match[1], originalBrand: match[2], originalQty: match[3], originalDesc: match[4], newBrand: match[5], newQty: match[6], newDesc: match[7] };
  return { originalOrder: '', originalBrand: '', originalQty: '-', originalDesc: notes || 'Sin detalles', newBrand: '', newQty: '-', newDesc: '' };
};

function SearchableSelect({ options, value, onChange, placeholder, disabled = false }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o: any) => o.id === value);
  useEffect(() => {
    const click = (e: any) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener("mousedown", click); return () => document.removeEventListener("mousedown", click);
  }, []);
  const filtered = options.filter((o: any) =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    (o.subLabel && o.subLabel.toLowerCase().includes(search.toLowerCase()))
  );
  return (
    <div className="relative w-full" ref={ref}>
      <div onClick={() => !disabled && setIsOpen(!isOpen)} className={`h-8 w-full flex items-center justify-between px-2 border rounded-lg text-[11px] bg-white cursor-pointer shadow-sm ${disabled ? 'opacity-50' : 'hover:border-monchito-purple transition-all'}`}>
        <span className="truncate pr-1">{selected ? selected.label : placeholder}</span>
        <span className="opacity-40 text-[8px]">▼</span>
      </div>
      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white border rounded-lg shadow-2xl max-h-60 overflow-auto left-0 min-w-[200px]">
          <div className="p-2 sticky top-0 bg-white border-b"><Input autoFocus placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="h-7 text-[11px] rounded-md" /></div>
          {filtered.length === 0 ? <div className="p-3 text-[11px] text-slate-400 text-center">No hay resultados</div> :
            <div className="py-1">
              {filtered.map((o: any) => (
                <div key={o.id} onClick={() => { onChange(o.id); setIsOpen(false); }} className={`px-3 py-1.5 text-[11px] hover:bg-monchito-purple/10 cursor-pointer flex flex-col ${o.id === value ? 'bg-monchito-purple/5 font-bold text-monchito-purple' : ''}`}>
                  <span>{o.label}</span>
                  {o.subLabel && <span className="text-[9px] opacity-60 font-normal">{o.subLabel}</span>}
                </div>
              ))}
            </div>
          }
        </div>
      )}
    </div>
  )
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export function NewExchangePage() {
  const { id, receiptNumber } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!(id || receiptNumber);
  const { notifySuccess, notifyError } = useNotifications();
  const { user } = useAuth();

  const { data: receiptOrders, isLoading: isLoadingReceiptOrders } = useReceiptOrders(receiptNumber || "");
  const { isLoading: isLoadingOrder } = useOrder(id || "");
  const { data: clientsResponse } = useClientList({ limit: 5000 });
  const { data: brandsResponse } = useBrandList({ limit: 500 });
  const { data: bankAccountsResponse } = useBankAccountList();

  const clients = clientsResponse?.data || [];
  const brands = brandsResponse?.data || [];
  const bankAccounts = bankAccountsResponse?.data || [];

  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<any>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'POR_ENVIAR' | 'EN_TRANSITO'>('POR_ENVIAR');
  const [pinnedColumns, setPinnedColumns] = useState<Set<string>>(new Set(['total', 'deposit', 'saldo', 'possibleDeliveryDate', 'action']));

  const togglePin = (colId: string) => {
    const newPinned = new Set(pinnedColumns);
    if (newPinned.has(colId)) newPinned.delete(colId);
    else newPinned.add(colId);
    setPinnedColumns(newPinned);
  };

  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');
  const pdfPreview = usePDFPreview({
    fileName: pdfFileName,
    onDownloadComplete: () => notifySuccess('PDF descargado'),
    onError: () => notifyError(null, 'Error PDF')
  });

  const [currentItem, setCurrentItem] = useState({
    clientId: "", clientName: "", brandId: "", brandName: "", quantity: 1, total: 0, type: "CAMBIO" as OrderType,
    possibleDeliveryDate: new Date().toISOString().split('T')[0], salesChannel: "OFICINA" as SalesChannel, orderNumber: "", description: "",
    deposit: 0, sourceOrderId: "", sourceOrderNumber: "", sourceBrandId: "", sourceBrandName: "", sourceQuantity: 1, sourceDescription: ""
  });

  const [isRowEditModalOpen, setIsRowEditModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<any>(null);

  const initialValues = useMemo(() => ({
    clientId: "", receiptNumber: "", salesChannel: "OFICINA" as SalesChannel,
    brandItems: [] as any[], deposit: 0, creditToUse: 0,
    createdAt: new Date().toISOString().split('T')[0],
    transactionDate: new Date().toISOString().split('T')[0],
    paymentMethod: "EFECTIVO", notes: "", trackingGuide: "",
    orderNumber: "",
  }), []);

  const formik = useFormik({
    initialValues,
    validationSchema,
    enableReinitialize: false, // Turned off to prevent infinite loops from reference changes
    onSubmit: () => { }
  });


  const totalPedidos = formik.values.brandItems.reduce((sum: number, item: any) => sum + Number(item.total || 0), 0);
  const totalAbonos = formik.values.brandItems.reduce((sum: number, item: any) => sum + Number(item.deposit || 0), 0);

  const handleOpenRowEdit = (item: any) => { 
    // Validation: Only editable if status is POR_ENVIAR or EN_TRANSITO (not yet processed for reception)
    const BLOCKED_STATUSES = ['POR_RECIBIR', 'RECIBIDO_EN_BODEGA', 'ENTREGADO', 'CAMBIADO'];
    if (BLOCKED_STATUSES.includes(item.status)) {
      return notifyError(null, `No se puede editar: el pedido ya está en estado ${item.status}.`);
    }

    // Validation: Only editable if it ONLY has the initial payment (length <= 1)
    // If it has more than 1 payment, it means it received extra payments from the Abonos module
    if (item.payments && item.payments.length > 1) {
      return notifyError(null, "No se puede editar: el pedido ya tiene abonos adicionales registrados desde el módulo de abonos.");
    }

    setItemToEdit(item); 
    setIsRowEditModalOpen(true); 
  };
  const handleSaveRowEdit = (updated: any) => { 
    const newItems = formik.values.brandItems.map((it: any) => it.id === updated.id ? updated : it);
    formik.setFieldValue("brandItems", newItems);
    setIsRowEditModalOpen(false);
  };

  const generateNextOrderNumber = async () => {
    try {
      formik.setFieldValue("orderNumber", "");
      const { orderNumber } = await orderApi.generateExchangeReceiptNumber();
      formik.setFieldValue("orderNumber", orderNumber);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { if (!isEditing) generateNextOrderNumber(); }, [isEditing]);

  useEffect(() => {
    if (formik.values.orderNumber) {
      setCurrentItem(prev => ({ ...prev, orderNumber: formik.values.orderNumber }));
    }
  }, [formik.values.orderNumber]);

  useEffect(() => {
    if (receiptNumber && !isLoadingReceiptOrders && receiptOrders && receiptOrders.length > 0) {
      const first = receiptOrders[0];
      formik.setValues({
        clientId: first.clientId || "",
        receiptNumber: first.receiptNumber || "",
        salesChannel: (first.salesChannel as SalesChannel) || "OFICINA",
        createdAt: first.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        transactionDate: first.transactionDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        paymentMethod: first.paymentMethod || "EFECTIVO",
        notes: (first as any).receipt?.notes || "",
        trackingGuide: first.trackingGuide || "",
        orderNumber: first.orderNumber || "",
        brandItems: receiptOrders.map((o: any) => {
          const parsed = parseExchangeNotesDetailed(o.notes || '');
          const brandId = o.brandId || o.brand_id || "";
          return {
            id: o.id, 
            brandId, 
            brandName: o.brand?.name || o.brandName || parsed.newBrand,
            quantity: o.items?.[0]?.quantity || 1, total: Number(o.total), type: o.type,
            possibleDeliveryDate: o.possibleDeliveryDate?.split('T')[0], orderNumber: o.orderNumber,
            deposit: getPaidAmount(o) || 0, status: o.status,
            payments: o.payments || [],
            paymentMethod: o.paymentMethod || "EFECTIVO",
            bankAccountId: o.bankAccountId || "",
            sourceOrderNumber: o.sourceOrderNumber || parsed.originalOrder,
            sourceBrandName: o.sourceBrandName || parsed.originalBrand,
            sourceQuantity: o.sourceQuantity || 1,
            sourceDescription: o.sourceDescription || parsed.originalDesc,
            description: o.description || parsed.newDesc,
            sourceOrderId: o.sourceOrderId
          };
        }),
        deposit: 0, creditToUse: 0
      });
    }
  }, [receiptNumber, receiptOrders, isLoadingReceiptOrders]);

  const handleAddItem = async () => {
    if (!formik.values.clientId) return notifyError(null, "Debe seleccionar una empresaria primero");
    if (!currentItem.brandId) return notifyError(null, "Seleccione un catálogo");
    // Permitimos total 0 para cambios mano a mano
    
    if (isEditing) {
      setIsSubmitting(true);
      try {
        const payload = {
          ...currentItem,
          clientId: formik.values.clientId,
          receiptNumber: formik.values.receiptNumber,
          status: 'POR_ENVIAR',
          createdAt: formik.values.createdAt,
          deposit: Number(currentItem.deposit || 0),
          payments: [],
          paymentMethod: 'EFECTIVO',
          bankAccountId: '',
            items: [{ 
              productName: currentItem.brandName || "Cambio", 
              quantity: Math.max(1, Number(currentItem.quantity) || 1), 
              unitPrice: (Number(currentItem.total) || 0) / Math.max(1, Number(currentItem.quantity) || 1)
            }],
            clientName: clients.find(c => c.id === formik.values.clientId)?.firstName || ""
        };
        await orderApi.create(payload as any);
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['receiptOrders', formik.values.receiptNumber] });
        
        // Reset item fields for the next entry
        setCurrentItem(prev => ({
          ...prev,
          brandId: "",
          brandName: "",
          quantity: 1,
          total: 0,
          orderNumber: "",
          description: "",
          deposit: 0,
          sourceOrderId: "",
          sourceOrderNumber: "",
          sourceBrandId: "",
          sourceBrandName: "",
          sourceQuantity: 1,
          sourceDescription: ""
        }));
        
        notifySuccess("Ítem agregado a la lista");
      } catch (e) { notifyError(e, "Error al agregar"); } finally { setIsSubmitting(false); }
    } else {
      formik.setFieldValue("brandItems", [
        ...formik.values.brandItems, 
        { 
          ...currentItem, 
          id: crypto.randomUUID(), 
          deposit: Number(currentItem.deposit || 0),
          clientName: clients.find(c => c.id === formik.values.clientId)?.firstName || ""
        }
      ]);

      // Reset ALL item fields for the next entry
      setCurrentItem(prev => ({
        ...prev,
        brandId: "",
        brandName: "",
        quantity: 1,
        total: 0,
        orderNumber: "",
        description: "",
        deposit: 0,
        sourceOrderId: "",
        sourceOrderNumber: "",
        sourceBrandId: "",
        sourceBrandName: "",
        sourceQuantity: 1,
        sourceDescription: ""
      }));
      notifySuccess("Ítem agregado a la lista");
    }
  };

  const removeItem = (idx: number) => {
    const item = formik.values.brandItems[idx];
    if (isEditing && item.id) {
      setOrderToDelete(item);
      setDeleteConfirmOpen(true);
    } else {
      formik.setFieldValue("brandItems", formik.values.brandItems.filter((_: any, i: number) => i !== idx));
    }
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    try {
      await orderApi.delete(orderToDelete.id);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['receiptOrders', formik.values.receiptNumber] });
      notifySuccess("Eliminado");
    } catch (e) { notifyError(e, "Error al eliminar"); } finally { setDeleteConfirmOpen(false); setOrderToDelete(null); }
  }

  const handleSaveNotes = async () => {
    if (!receiptNumber) return;
    setIsSavingNotes(true);
    try {
      await orderApi.updateReceiptHeader(receiptNumber, { notes: formik.values.notes });
      notifySuccess("Notas guardadas");
    } catch (e) { notifyError(e, "Error al guardar notas"); } finally { setIsSavingNotes(false); }
  };



  const handlePaymentSubmit = async (paymentData: PaymentModalData) => {
    console.log("Submit attempt - current brandItems:", formik.values.brandItems);
    
    // Robust validation for brand IDs before processing
    const invalidItems = formik.values.brandItems.filter((item: any) => {
      const bId = (item.brandId || item.brand_id || "").toString().trim();
      return !bId || bId === "" || bId === "undefined" || bId === "null";
    });

    if (invalidItems.length > 0) {
      console.error("Validation failed - invalid items detected:", invalidItems);
      return notifyError(null, `Error: Hay ${invalidItems.length} ítems que no tienen un catálogo asociado. Por favor verifique que todas las filas tengan una marca válida.`);
    }

    setIsSubmitting(true);
    try {
      const activePayments = paymentData.payments.filter(p => p.amount >= 0);
      const totalAmount = activePayments.reduce((sum, p) => sum + p.amount, 0);
      
      const payload = {
        receiptNumber: formik.values.orderNumber || formik.values.receiptNumber, 
        clientId: formik.values.clientId,
        salesChannel: formik.values.salesChannel || "OFICINA", 
        createdAt: new Date().toISOString(),
        paymentMethod: activePayments[0]?.method || "EFECTIVO",
        bankAccountId: activePayments[0]?.bankAccountId,
        clientName: clients.find(c => c.id === formik.values.clientId)?.firstName || "",
        transactionDate: new Date().toISOString(),

        initialPayment: {
          amount: totalAmount,
          method: activePayments[0]?.method || "EFECTIVO",
          reference: activePayments[0]?.transactionReference || undefined
        },
        deposit: totalAmount, 
        notes: formik.values.notes,
        orders: formik.values.brandItems
          .filter((item: any) => (item.brandId || item.brand_id))
          .map((item: any, idx: number) => {
          const finalBrandId = (item.brandId || item.brand_id || "").toString().trim();
          console.log(`Mapping item ${idx}: brandId=${finalBrandId}, brandName=${item.brandName}`);
          
          return {
            brandId: finalBrandId,
            brandName: item.brandName || "Cambio",
            total: Number(item.total), 
            deposit: Number(item.deposit || 0),
            status: saveStatus, 
            type: item.type || "CAMBIO",
            possibleDeliveryDate: item.possibleDeliveryDate || new Date().toISOString().split('T')[0],
            items: [{ 
              productName: item.brandName || "Cambio", 
              quantity: Math.max(1, Number(item.quantity) || 1), 
              unitPrice: (Number(item.total) || 0) / Math.max(1, Number(item.quantity) || 1)
            }],
            notes: null,
            sourceOrderId: item.sourceOrderId || null,
            sourceBrandName: item.sourceBrandName || null,
            sourceOrderNumber: item.sourceOrderNumber || null,
            sourceQuantity: Math.max(1, Number(item.sourceQuantity) || 1),
            sourceDescription: item.sourceDescription || null,
            orderNumber: formik.values.orderNumber || item.orderNumber,
            description: item.description || null,
            clientName: clients.find(c => c.id === formik.values.clientId)?.firstName || ""
          };

        })
      };

      console.log("FINAL PAYLOAD TO SERVER:", JSON.stringify(payload, null, 2));

      const created = await orderApi.batchCreate(payload as any);
      await queryClient.invalidateQueries({ queryKey: ["orders"] });

      // Generate the new specialized Exchange PDF
      const { document, fileName, title } =
        await prepareExchangeReceiptForPreview(
          created,
          {
            id: user?.id || "1",
            username: user?.username || "Vendedor",
          } as any,
          formik.values.orderNumber || formik.values.receiptNumber,
          formik.values.notes
        );

      setPdfTitle(title);
      setPdfFileName(fileName);
      pdfPreview.openPreview(document);

      notifySuccess("Cambio guardado exitosamente");
      
      // Reset form and generate NEW consecutive for next transaction
      if (!isEditing) {
        formik.resetForm();
        setTimeout(() => {
          generateNextOrderNumber();
        }, 100);
      }
    } catch (e) {
      notifyError(e, "Error al guardar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = async () => {
    if (!receiptOrders || receiptOrders.length === 0) {
      notifyError(null, "No hay pedidos para imprimir");
      return;
    }
    
    try {
      const { document, fileName, title } = await prepareExchangeReceiptForPreview(
        receiptOrders,
        {
          id: user?.id || "1",
          username: user?.username || "Vendedor",
        } as any,
        formik.values.orderNumber || formik.values.receiptNumber,
        formik.values.notes
      );

      setPdfTitle(title);
      setPdfFileName(fileName);
      pdfPreview.openPreview(document);
    } catch (error) {
      notifyError(error, "Error al generar el PDF");
    }
  };



  const handleMainSave = (status: 'POR_ENVIAR' | 'EN_TRANSITO') => {
    if (formik.values.brandItems.length === 0) return notifyError(null, "Agregue ítems");
    setSaveStatus(status);
    setPaymentModalOpen(true);
  };

  const clientOptions = clients.map(c => ({ id: c.id, label: c.firstName, subLabel: c.identificationNumber }));
  const brandOptions = getActiveBrands(brands).map(b => ({ id: b.id, label: b.name }));

  if (isEditing && (isLoadingOrder || isLoadingReceiptOrders)) return <div className="h-[60vh] flex items-center justify-center"><RefreshCw className="animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-6">
      <PageHeader title={isEditing ? 'Editar Cambio' : 'Nuevo Cambio'} description="Gestión de cambios de mercadería" icon={FileText} actions={<Button variant="outline" onClick={() => navigate('/exchanges')} className="rounded-xl"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button>} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
        {/* Column 1: Header Inputs */}
        <Card className="lg:col-span-3 shadow-sm border-slate-200 bg-white rounded-2xl flex flex-col h-full">
          <CardHeader className="py-2 px-4 bg-monchito-purple/5 border-b border-monchito-purple/10 rounded-t-2xl shrink-0">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-monchito-purple">Encabezado Cambio</CardTitle>
          </CardHeader>
          <CardContent className="p-3 grid grid-cols-1 md:grid-cols-12 gap-4 items-center flex-1">
            <div className="md:col-span-3 space-y-1">
              <Label className="text-xs font-bold text-slate-600">N° Consecutivo (CAM = N° reg. envío):</Label>
              <div className="h-8 w-full px-3 border border-slate-200 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-black tracking-tight flex items-center cursor-not-allowed select-none">
                {formik.values.orderNumber || '—'}
              </div>
            </div>
            <div className="md:col-span-3 space-y-1">
              <Label className="text-xs font-bold text-slate-600">Fecha:</Label>
              <Input type="date" value={formik.values.createdAt} onChange={formik.handleChange} name="createdAt" className="h-8 text-[11px] font-medium border-slate-200 bg-slate-50/30 rounded-lg px-3 focus:ring-1 focus:ring-monchito-purple outline-none" />
            </div>
            <div className="md:col-span-6 space-y-1">
              <Label className="text-xs font-bold text-slate-600">Empresaria / Cliente:</Label>
              <SearchableSelect options={clientOptions} value={formik.values.clientId} onChange={(val: any) => formik.setFieldValue('clientId', val)} placeholder="Seleccionar Empresaria..." disabled={isEditing} />
            </div>
          </CardContent>
        </Card>

        {/* Column 2: Financial Summary */}
        <Card className="lg:col-span-1 shadow-sm border-slate-200 bg-white rounded-2xl flex flex-col h-full">
          <CardHeader className="py-2 px-4 bg-monchito-purple/5 border-b border-monchito-purple/10 rounded-t-2xl shrink-0">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-monchito-purple">Valores</CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2 flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-500">Total pedidos:</span>
                <span className="font-bold text-slate-900">{formatCurrency(totalPedidos)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-emerald-700">
                <span className="font-bold">Total abono:</span>
                <span className="font-bold">{formatCurrency(totalAbonos)}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Saldo:</span>
              <span className={`text-xl font-black ${totalPedidos - totalAbonos > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                {formatCurrency(totalPedidos - totalAbonos)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl shadow-sm border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col gap-6">
            {/* ROW 1: ORIGEN */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="col-span-1 sm:col-span-3 flex flex-col gap-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Catálogo</Label>
                <SearchableSelect options={brandOptions} value={currentItem.brandId} onChange={(val: any) => { const b = brands.find(x => x.id === val); setCurrentItem({ ...currentItem, brandId: val, brandName: b?.name || "" }) }} placeholder="Seleccionar Marca..." className="text-[11px] font-medium h-9 w-full" />
              </div>
              <div className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">N° Cambio</Label>
                <Input value={currentItem.sourceOrderNumber} onChange={e => setCurrentItem({ ...currentItem, sourceOrderNumber: e.target.value })} className="h-9 rounded-lg text-[11px] font-medium px-4 border-slate-200" placeholder="N°..." />
              </div>
              <div className="col-span-1 sm:col-span-1 flex flex-col gap-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Cant. E.</Label>
                <Input type="number" value={currentItem.sourceQuantity} onChange={e => setCurrentItem({ ...currentItem, sourceQuantity: Number(e.target.value) })} className="h-9 rounded-lg text-center text-[11px] font-medium border-slate-200" />
              </div>
              <div className="col-span-1 sm:col-span-6 flex flex-col gap-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">DESCRIPCIÓN DE CAMBIO</Label>
                <Input value={currentItem.sourceDescription} onChange={e => setCurrentItem({ ...currentItem, sourceDescription: e.target.value })} className="h-9 rounded-lg text-[11px] font-medium px-4 border-slate-200" placeholder="¿Qué entrega?" />
              </div>
            </div>

            {/* ROW 2: DESTINO */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="col-span-1 sm:col-span-1 flex flex-col gap-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Cant. R.</Label>
                <Input type="number" value={currentItem.quantity} onChange={e => setCurrentItem({ ...currentItem, quantity: Number(e.target.value) })} className="h-9 rounded-lg text-center text-[11px] font-medium border-slate-200" />
              </div>
              <div className="col-span-1 sm:col-span-5 flex flex-col gap-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">CAMBIO POR</Label>
                <Input value={currentItem.description} onChange={e => setCurrentItem({ ...currentItem, description: e.target.value })} className="h-9 rounded-lg text-[11px] font-medium px-4 border-slate-200" placeholder="¿Qué recibe?" />
              </div>
              <div className="col-span-1 sm:col-span-1 flex flex-col gap-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-right pr-2">Valor</Label>
                <DecimalTextField value={Number(currentItem.total) || 0} onValueChange={(n) => setCurrentItem({ ...currentItem, total: n })} className="h-9 rounded-lg text-right text-[11px] font-medium text-emerald-600 px-4 border-slate-200" placeholder="0" />
              </div>
              <div className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Entrega</Label>
                <Input type="date" value={currentItem.possibleDeliveryDate} onChange={e => setCurrentItem({ ...currentItem, possibleDeliveryDate: e.target.value })} className="h-9 rounded-lg text-[11px] font-medium px-2 border-slate-200" />
              </div>
              <div className="col-span-1 sm:col-span-3 flex flex-col gap-1.5 justify-end mt-2 sm:mt-0">
                <AsyncButton onClick={handleAddItem} isLoading={isSubmitting} className="h-10 w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/20 font-black text-[11px] uppercase tracking-widest transition-all active:scale-95"><Plus className="h-4 w-4 mr-2" /> AGREGAR A LA LISTA</AsyncButton>
              </div>
            </div>
          </div>
          <div className="mb-10" />

          <div className="rounded-2xl border border-monchito-purple/10 bg-white shadow-[0_20px_50px_rgba(107,33,168,0.05)] overflow-hidden transition-all duration-300">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full border-collapse table-auto min-w-max">
                <thead className="bg-monchito-purple/[0.03] border-b border-monchito-purple/5">
                  <tr className="whitespace-nowrap">
                    <th className="px-4 py-4 text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center w-[50px] bg-slate-50 lg:sticky left-0 z-10">#</th>
                    <th className={`px-4 py-4 text-[10px] font-black text-monchito-purple uppercase tracking-widest text-left min-w-[150px] transition-all bg-slate-50 ${pinnedColumns.has('empresaria') ? 'lg:sticky left-[50px] z-10 ring-r-2 ring-monchito-purple/5' : ''}`}>
                      <div className="flex items-center gap-2">Empresaria <button onClick={() => togglePin('empresaria')} className="hidden lg:block">{pinnedColumns.has('empresaria') ? <Pin className="h-3 w-3 fill-monchito-purple" /> : <PinOff className="h-3 w-3 opacity-30" />}</button></div>
                    </th>
                    <th className={`px-4 py-4 text-[10px] font-black text-monchito-purple uppercase tracking-widest text-left min-w-[120px] bg-slate-50 transition-all ${pinnedColumns.has('brandName') ? 'lg:sticky left-[200px] z-10 ring-r-2 ring-monchito-purple/5' : ''}`}>
                      <div className="flex items-center gap-2">Catálogo <button onClick={() => togglePin('brandName')} className="hidden lg:block">{pinnedColumns.has('brandName') ? <Pin className="h-3 w-3 fill-monchito-purple" /> : <PinOff className="h-3 w-3 opacity-30" />}</button></div>
                    </th>
                    <th className={`px-4 py-4 text-[10px] font-black text-monchito-purple uppercase tracking-widest text-left min-w-[120px] bg-slate-50 transition-all ${pinnedColumns.has('sourceOrderNumber') ? 'lg:sticky left-[320px] z-10 ring-r-2 ring-monchito-purple/5' : ''}`}>
                      <div className="flex items-center gap-2">N° Cambio <button onClick={() => togglePin('sourceOrderNumber')} className="hidden lg:block">{pinnedColumns.has('sourceOrderNumber') ? <Pin className="h-3 w-3 fill-monchito-purple" /> : <PinOff className="h-3 w-3 opacity-30" />}</button></div>
                    </th>
                    <th className={`px-4 py-4 text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center w-[70px] bg-slate-50 transition-all ${pinnedColumns.has('sourceQuantity') ? 'lg:sticky left-[440px] z-10 ring-r-2 ring-monchito-purple/5' : ''}`}>
                      <div className="flex items-center justify-center gap-2">Cant E. <button onClick={() => togglePin('sourceQuantity')} className="hidden lg:block">{pinnedColumns.has('sourceQuantity') ? <Pin className="h-3 w-3 fill-monchito-purple" /> : <PinOff className="h-3 w-3 opacity-30" />}</button></div>
                    </th>
                    <th className={`px-6 py-4 text-[10px] font-black text-monchito-purple uppercase tracking-widest text-left min-w-[300px] bg-slate-50 transition-all ${pinnedColumns.has('sourceDescription') ? 'lg:sticky left-[510px] z-10 ring-r-2 ring-monchito-purple/5' : ''}`}>
                      <div className="flex items-center gap-2">DESCRIPCIÓN DE CAMBIO <button onClick={() => togglePin('sourceDescription')} className="hidden lg:block">{pinnedColumns.has('sourceDescription') ? <Pin className="h-3 w-3 fill-monchito-purple" /> : <PinOff className="h-3 w-3 opacity-30" />}</button></div>
                    </th>
                    <th className={`px-4 py-4 text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center w-[70px] bg-slate-50 transition-all ${pinnedColumns.has('quantity') ? 'lg:sticky left-[810px] z-10 ring-r-2 ring-monchito-purple/5' : ''}`}>
                      <div className="flex items-center justify-center gap-2">Cant R. <button onClick={() => togglePin('quantity')} className="hidden lg:block">{pinnedColumns.has('quantity') ? <Pin className="h-3 w-3 fill-monchito-purple" /> : <PinOff className="h-3 w-3 opacity-30" />}</button></div>
                    </th>
                    <th className={`px-6 py-4 text-[10px] font-black text-monchito-purple uppercase tracking-widest text-left min-w-[300px] bg-slate-50 transition-all ${pinnedColumns.has('description') ? 'lg:sticky left-[880px] z-10 ring-r-2 ring-monchito-purple/5' : ''}`}>
                      <div className="flex items-center gap-2">CAMBIO POR <button onClick={() => togglePin('description')} className="hidden lg:block">{pinnedColumns.has('description') ? <Pin className="h-3 w-3 fill-monchito-purple" /> : <PinOff className="h-3 w-3 opacity-30" />}</button></div>
                    </th>
                    <th className={`px-6 py-4 text-[10px] font-black text-monchito-purple uppercase tracking-widest text-right w-[110px] bg-slate-50 transition-all ${pinnedColumns.has('total') ? 'lg:sticky right-[450px] z-10 ring-l-2 ring-monchito-purple/5' : ''}`}>
                      <div className="flex items-center justify-end gap-2"><button onClick={() => togglePin('total')} className="hidden lg:block">{pinnedColumns.has('total') ? <Pin className="h-3 w-3 fill-monchito-purple" /> : <PinOff className="h-3 w-3 opacity-30" />}</button> Valor</div>
                    </th>
                    <th className={`px-6 py-4 text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center w-[130px] bg-slate-50 transition-all ${pinnedColumns.has('deposit') ? 'lg:sticky right-[320px] z-10 ring-l-2 ring-monchito-purple/5' : ''}`}>
                      <div className="flex items-center justify-center gap-2"><button onClick={() => togglePin('deposit')} className="hidden lg:block">{pinnedColumns.has('deposit') ? <Pin className="h-3 w-3 fill-monchito-purple" /> : <PinOff className="h-3 w-3 opacity-30" />}</button> Abono</div>
                    </th>
                    <th className={`px-6 py-4 text-[10px] font-black text-monchito-purple uppercase tracking-widest text-right w-[110px] bg-slate-50 transition-all ${pinnedColumns.has('saldo') ? 'lg:sticky right-[210px] z-10 ring-l-2 ring-monchito-purple/5' : ''}`}>
                      <div className="flex items-center justify-end gap-2"><button onClick={() => togglePin('saldo')} className="hidden lg:block">{pinnedColumns.has('saldo') ? <Pin className="h-3 w-3 fill-monchito-purple" /> : <PinOff className="h-3 w-3 opacity-30" />}</button> Saldo</div>
                    </th>
                    <th className={`px-6 py-4 text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center w-[110px] bg-slate-50 transition-all ${pinnedColumns.has('possibleDeliveryDate') ? 'lg:sticky right-[100px] z-10 ring-l-2 ring-monchito-purple/5' : ''}`}>
                      <div className="flex items-center justify-center gap-2"><button onClick={() => togglePin('possibleDeliveryDate')} className="hidden lg:block">{pinnedColumns.has('possibleDeliveryDate') ? <Pin className="h-3 w-3 fill-monchito-purple" /> : <PinOff className="h-3 w-3 opacity-30" />}</button> Entrega</div>
                    </th>
                    <th className={`px-6 py-4 text-[10px] font-black text-monchito-purple uppercase tracking-widest text-center w-[100px] bg-slate-50 transition-all ${pinnedColumns.has('action') ? 'lg:sticky right-0 z-10 ring-l-2 ring-monchito-purple/5' : ''}`}>
                      <div className="flex items-center justify-center gap-2"><button onClick={() => togglePin('action')} className="hidden lg:block">{pinnedColumns.has('action') ? <Pin className="h-3 w-3 fill-monchito-purple" /> : <PinOff className="h-3 w-3 opacity-30" />}</button> Acción</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {formik.values.brandItems.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3 opacity-30">
                          <Plus className="h-8 w-8 text-slate-300" />
                          <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest text-center">Sincronice el cliente y agregue los ítems del cambio</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    formik.values.brandItems.map((item: any, idx: number) => (
                      <tr key={item.id || item.tempId || idx} className="hover:bg-monchito-purple/[0.02] transition-all duration-200 group h-14 whitespace-nowrap">
                        <td className="px-4 py-4 text-center text-[10px] font-black text-slate-300 bg-white lg:sticky left-0 z-20 shadow-[1px_0_0_0_rgba(107,33,168,0.05)]">{idx + 1}</td>
                        <td className={`px-4 py-4 text-[11px] font-black text-slate-900 bg-white transition-all ${pinnedColumns.has('empresaria') ? 'lg:sticky left-[50px] z-20 shadow-[1px_0_0_0_rgba(107,33,168,0.05)]' : ''}`}>
                          {clients.find(c => c.id === (item.clientId || formik.values.clientId))?.firstName || "---"}
                        </td>
                        <td className={`px-4 py-4 text-[11px] font-black text-slate-900 bg-white transition-all ${pinnedColumns.has('brandName') ? 'lg:sticky left-[200px] z-20 shadow-[1px_0_0_0_rgba(107,33,168,0.05)]' : ''}`}>
                          {item.brandName || "Sin Marca"}
                        </td>
                        <td className={`px-4 py-4 text-[11px] font-black text-monchito-purple uppercase tracking-tight bg-white transition-all ${pinnedColumns.has('sourceOrderNumber') ? 'lg:sticky left-[320px] z-20 shadow-[1px_0_0_0_rgba(107,33,168,0.05)]' : ''}`}>
                          {item.sourceOrderNumber || "---"}
                        </td>
                        <td className={`px-4 py-4 text-center text-[11px] font-medium text-slate-500 bg-white transition-all ${pinnedColumns.has('sourceQuantity') ? 'lg:sticky left-[440px] z-20 shadow-[1px_0_0_0_rgba(107,33,168,0.05)]' : ''}`}>
                          {item.sourceQuantity}
                        </td>
                        <td className={`px-6 py-4 text-slate-600 text-[11px] font-medium max-w-[400px] overflow-hidden text-ellipsis bg-white transition-all ${pinnedColumns.has('sourceDescription') ? 'lg:sticky left-[510px] z-20 shadow-[1px_0_0_0_rgba(107,33,168,0.05)]' : ''}`} title={item.sourceDescription || ""}>
                          {item.sourceDescription || "---"}
                        </td>
                        <td className={`px-4 py-4 text-center text-[11px] font-medium text-monchito-purple bg-white transition-all ${pinnedColumns.has('quantity') ? 'lg:sticky left-[810px] z-20 shadow-[1px_0_0_0_rgba(107,33,168,0.05)]' : ''}`}>
                          {item.quantity}
                        </td>
                        <td className={`px-6 py-4 text-slate-600 text-[11px] font-medium max-w-[400px] overflow-hidden text-ellipsis bg-white transition-all ${pinnedColumns.has('description') ? 'lg:sticky left-[880px] z-20 shadow-[1px_0_0_0_rgba(107,33,168,0.05)]' : ''}`} title={item.description || ""}>
                          {item.description || "---"}
                        </td>
                        <td className={`px-6 py-4 text-right bg-white transition-all ${pinnedColumns.has('total') ? 'lg:sticky right-[450px] z-20 shadow-[-1px_0_0_0_rgba(107,33,168,0.05)]' : ''}`}>
                          {!isEditing ? (

                            <div className="flex justify-end items-center gap-1">
                                <span className="text-emerald-400 text-[10px] font-bold">$</span>
                                <DecimalTextField
                                  className="w-20 h-7 text-right rounded-lg border border-monchito-purple/10 bg-transparent text-[11px] font-black text-emerald-600 outline-none focus-visible:ring-1 focus-visible:ring-monchito-purple/30 hide-spinner shadow-none"
                                  value={Number(item.total) || 0}
                                  onValueChange={(val) => {
                                    const newItems = [...formik.values.brandItems];
                                    newItems[idx] = { ...newItems[idx], total: val };
                                    formik.setFieldValue("brandItems", newItems);
                                  }}
                                />
                            </div>
                          ) : (
                            <span className="text-[11px] font-black text-emerald-600">{formatCurrency(item.total)}</span>
                          )}
                        </td>
                        <td className={`px-6 py-4 text-center bg-white transition-all ${pinnedColumns.has('deposit') ? 'lg:sticky right-[320px] z-20 shadow-[-1px_0_0_0_rgba(107,33,168,0.05)]' : ''}`}>
                          {!isEditing ? (

                            <div className="flex justify-center items-center gap-1">
                                <span className="text-emerald-600 text-[10px] font-bold">$</span>
                                <DecimalTextField
                                  className="w-20 h-7 text-center rounded-lg border border-monchito-purple/10 bg-monchito-purple/5 text-[11px] font-black text-emerald-700 outline-none focus-visible:ring-1 focus-visible:ring-monchito-purple/30 hide-spinner shadow-none"
                                  value={Number(item.deposit) || 0}
                                  onValueChange={(rawVal) => {
                                    const newItems = [...formik.values.brandItems];
                                    newItems[idx] = { ...newItems[idx], deposit: rawVal };
                                    formik.setFieldValue("brandItems", newItems);
                                  }}
                                />
                            </div>
                          ) : (
                            <span className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-[11px] font-black ${
                              Number(item.deposit) > 0 ? 'text-emerald-700 bg-emerald-50' : 'text-slate-400'
                            }`}>
                              {formatCurrency(Number(item.deposit || 0))}
                            </span>
                          )}
                        </td>
                        <td className={`px-6 py-4 text-right text-[11px] font-black text-slate-900 bg-white transition-all ${pinnedColumns.has('saldo') ? 'lg:sticky right-[210px] z-20 shadow-[-1px_0_0_0_rgba(107,33,168,0.05)]' : ''}`}>
                          {formatCurrency(Number(item.total) - Number(item.deposit || 0))}
                        </td>
                        <td className={`px-6 py-4 text-center text-slate-400 text-[11px] font-medium bg-white transition-all ${pinnedColumns.has('possibleDeliveryDate') ? 'lg:sticky right-[100px] z-20 shadow-[-1px_0_0_0_rgba(107,33,168,0.05)]' : ''}`}>
                          {item.possibleDeliveryDate}
                        </td>
                        <td className={`px-6 py-4 flex justify-center gap-1 opacity-100 lg:opacity-40 lg:group-hover:opacity-100 transition-opacity bg-white transition-all ${pinnedColumns.has('action') ? 'lg:sticky right-0 z-20 shadow-[-1px_0_0_0_rgba(107,33,168,0.05)]' : ''}`}>
                          <Button variant="ghost" size="icon" onClick={() => handleOpenRowEdit(item)} className="h-8 w-8 text-slate-400 hover:text-monchito-purple hover:bg-monchito-purple/5 transition-colors">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => removeItem(idx)} className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm border-slate-200 bg-slate-50/50">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full relative">
            <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <textarea {...formik.getFieldProps('notes')} className="w-full h-12 pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-monchito-purple/20 bg-white" placeholder="Notas adicionales de la guía..." />
            {isEditing && <button onClick={handleSaveNotes} className="absolute right-2 top-2 p-2 text-monchito-purple">{isSavingNotes ? <RefreshCw className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}</button>}
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            {!isEditing ? (
              <AsyncButton onClick={() => handleMainSave('POR_ENVIAR')} className="h-12 px-8 bg-monchito-purple font-black shadow-lg shadow-monchito-purple/20 rounded-xl" isLoading={isSubmitting}><PackageOpen className="mr-2 h-5 w-5" /> Guardar cambios</AsyncButton>
            ) : (
              <>
                <Button variant="outline" className="h-12 px-6 font-black rounded-xl border-slate-900" onClick={handlePrint}><Printer className="mr-2 h-5 w-5" /> Imprimir</Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen} title="Eliminar Ítem" confirmText="Eliminar" onConfirm={confirmDeleteOrder} variant="destructive">
        <p className="text-sm">¿Deseas eliminar este ítem del cambio?</p>
      </ConfirmDialog>

      {/* Payment modal for global creation flow */}
      <PaymentModal open={paymentModalOpen} onOpenChange={setPaymentModalOpen} onSubmit={handlePaymentSubmit} paymentContext={{ type: "PEDIDO", clientId: formik.values.clientId, clientName: clients.find(c => c.id === formik.values.clientId)?.firstName || "Cliente", referenceNumber: formik.values.receiptNumber, description: "Cambio" }} expectedAmount={totalAbonos} initialAmount={totalAbonos} lockAmount={false} forceExactAmount={true} />



      {itemToEdit && (
        <ExchangeEditModal 
          open={isRowEditModalOpen} 
          onOpenChange={setIsRowEditModalOpen} 
          order={itemToEdit} 
          onSuccess={handleSaveRowEdit} 
          bankAccounts={bankAccounts}
        />
      )}
      {pdfPreview.pdfDocument && (
        <PDFPreviewModal open={pdfPreview.isOpen} onOpenChange={open => { pdfPreview.closePreview(); if (!open && !isEditing) navigate('/exchanges') }} title={pdfTitle} pdfDocument={pdfPreview.pdfDocument as any} fileName={pdfFileName} onDownload={pdfPreview.downloadPDF} onPrint={pdfPreview.printPDF} />
      )}
    </div>
  )
}
