import { useState, useRef, useEffect } from "react"
import { useFormik } from "formik"
import { useNavigate, useParams } from "react-router-dom"
import * as Yup from "yup"
import { ArrowLeft, Plus, X, RotateCw, RefreshCw } from "lucide-react"

import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { AsyncButton } from "@/shared/ui/async-button"
import { Label } from "@/shared/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Separator } from "@/shared/ui/separator"

import { useBankAccountList } from "@/features/bank-accounts/api/hooks"
import { useCreateOrder, useUpdateOrder, useOrder } from "@/entities/order/model/hooks"
import type { SalesChannel, OrderType, PaymentMethod } from "@/entities/order/model/types"
import { orderApi } from "@/entities/order/model/api"
import { useClientList } from "@/features/clients/api/hooks"
import { useBrandList } from "@/features/brands/api/hooks"
import { getActiveBrands } from "@/entities/brand/model/model"
import { useNotifications } from "@/shared/lib/notifications"
import { pdf } from "@react-pdf/renderer"
import { OrderReceiptDocument } from "@/features/order-receipt/ui/OrderReceiptDocument"
import { useClientCredits } from "@/features/transactions/model/hooks"
import { useAuth } from "@/shared/auth"

/* --- Validation Schema --- */
const validationSchema = Yup.object({
    clientId: Yup.string().required("El cliente es requerido"),
    receiptNumber: Yup.string().required("El N° de recibo es requerido"),
    salesChannel: Yup.string().required("El canal es requerido"),
    brandItems: Yup.array().of(
        Yup.object({
            brandId: Yup.string().required("Requerido"),
            brandName: Yup.string().required("Requerido"),
            quantity: Yup.number().min(1, "Mínimo 1").required("Requerido"),
            total: Yup.number().min(0, "No negativo").required("Requerido"),
            type: Yup.string().required("Requerido"),
            possibleDeliveryDate: Yup.string().required("Requerido"),
        })
    ).min(1, "Al menos una marca es requerida"),
    deposit: Yup.number()
        .min(0, "No negativo")
        .required("Requerido"),
    paymentMethod: Yup.string().required("La forma de pago es requerida"),
    bankAccountId: Yup.string().test(
        'is-bank-required',
        "Cuenta bancaria requerida para este método",
        function (value) {
            const { deposit, paymentMethod } = this.parent;
            if (deposit > 0 && paymentMethod !== 'EFECTIVO' && !value) {
                return false;
            }
            return true;
        }
    ),
    transactionDate: Yup.string().when("paymentMethod", {
        is: (val: string) => ['TRANSFERENCIA', 'DEPOSITO', 'CHEQUE'].includes(val),
        then: (schema) => schema.required("Fecha requerida"),
        otherwise: (schema) => schema.notRequired()
    }),
    transactionReference: Yup.string().when("paymentMethod", {
        is: (val: string) => ['TRANSFERENCIA', 'DEPOSITO', 'CHEQUE'].includes(val),
        then: (schema) => schema.required("Referencia / N° cheque requerido"),
        otherwise: (schema) => schema.notRequired()
    }),
    createdAt: Yup.string().required("Fecha de registro requerida"),
})

/* --- Simple Searchable Select Component --- */
interface Option {
    id: string
    label: string
    subLabel?: string
}

function SearchableSelect({
    options,
    value,
    onChange,
    placeholder,
    disabled = false
}: {
    options: Option[],
    value: string,
    onChange: (val: string) => void,
    placeholder: string,
    disabled?: boolean
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

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (option.subLabel && option.subLabel.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    return (
        <div className="relative" ref={wrapperRef}>
            <div
                className={`flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm items-center justify-between overflow-hidden ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={() => {
                    if (disabled) return;
                    setIsOpen(!isOpen)
                    if (!isOpen) setSearchTerm("") // Reset search on open
                }}
            >
                <span className={selectedOption ? "text-foreground" : "text-muted-foreground"}>
                    {selectedOption ? `${selectedOption.label} ${selectedOption.subLabel ? `(${selectedOption.subLabel})` : ''}` : placeholder}
                </span>
                <span className="opacity-50 text-xs text-muted-foreground">▼</span>
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-lg bg-white dark:bg-slate-950 ring-1 ring-black ring-opacity-5">
                    <div className="p-2 border-b">
                        <Input
                            autoFocus
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-8"
                        />
                    </div>
                    <div className="max-h-[250px] overflow-auto py-1">
                        {filteredOptions.length === 0 ? (
                            <div className="px-2 py-3 text-sm text-muted-foreground text-center">No se encontraron resultados</div>
                        ) : (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.id}
                                    className={`relative flex cursor-default select-none items-center rounded-sm px-3 py-2 text-sm outline-none hover:bg-indigo-50 hover:text-indigo-900 transition-colors ${option.id === value ? "bg-indigo-100 text-indigo-900 font-medium" : ""}`}
                                    onClick={() => {
                                        onChange(option.id)
                                        setIsOpen(false)
                                    }}
                                >
                                    <div className="flex flex-col">
                                        <span>{option.label}</span>
                                        {option.subLabel && <span className="text-[10px] opacity-70">{option.subLabel}</span>}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export function OrderFormPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const isEditing = !!id

    const { data: order, isLoading: isLoadingOrder } = useOrder(id || "")
    const { data: clientsResponse } = useClientList({ limit: 1000 })
    const { data: bankAccountsResponse } = useBankAccountList({ limit: 500 })
    const { data: brandsResponse } = useBrandList({ limit: 500 })

    const clients = clientsResponse?.data || []
    const bankAccounts = bankAccountsResponse?.data || []
    const brands = brandsResponse?.data || []
    const createOrder = useCreateOrder()
    const updateOrder = useUpdateOrder()
    const { notifySuccess, notifyError } = useNotifications()
    const { user } = useAuth()

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoadingReceiptNumber, setIsLoadingReceiptNumber] = useState(false)

    // State for the item being added
    const [currentItem, setCurrentItem] = useState({
        brandId: "",
        brandName: "",
        quantity: 1,
        total: 0,
        type: "NORMAL" as OrderType,
        possibleDeliveryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        salesChannel: "OFICINA" as SalesChannel,
        orderNumber: "",
    })


    const formik = useFormik({
        initialValues: {
            clientId: "",
            receiptNumber: "",
            salesChannel: "OFICINA" as SalesChannel,
            brandItems: [] as any[],
            deposit: 0,
            creditToUse: 0,
            paymentMethod: "EFECTIVO" as PaymentMethod,
            bankAccountId: "",
            transactionDate: new Date().toISOString().split('T')[0],
            transactionReference: "",
            createdAt: new Date().toISOString().split('T')[0],
            notes: "",
        },
        validationSchema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            if (values.brandItems.length === 0) {
                notifyError(null, "Debe agregar al menos una marca al pedido.");
                return;
            }
            setIsSubmitting(true);
            try {
                if (!isEditing) {
                    const isValidReceipt = await validateReceiptNumber(values.receiptNumber);
                    if (!isValidReceipt) {
                        setIsSubmitting(false);
                        return;
                    }
                }

                const client = clients.find(c => c.id === values.clientId);
                const clientName = client ? client.firstName : "Desconocido";
                const creditAmount = Number(values.creditToUse) || 0;

                if (isEditing && order) {
                    const item = values.brandItems[0];
                    const unitPrice = item.quantity > 0 ? item.total / item.quantity : 0;
                    const payload = {
                        ...values,
                        type: item.type as OrderType,
                        brandId: item.brandId,
                        brandName: item.brandName,
                        total: item.total,
                        possibleDeliveryDate: item.possibleDeliveryDate,
                        clientName,
                        notes: values.notes,
                        items: [{
                            id: order.items?.[0]?.id || String(Date.now()),
                            productName: item.brandName,
                            quantity: item.quantity,
                            unitPrice: unitPrice,
                            brandId: item.brandId,
                            brandName: item.brandName
                        }]
                    };
                    await updateOrder.mutateAsync({ id: order.id, data: payload as any });
                    notifySuccess(`Pedido de ${clientName} actualizado.`);
                    navigate('/orders');
                } else {
                    let parentId: string | null = null;
                    let createdOrders: any[] = [];

                    for (let i = 0; i < values.brandItems.length; i++) {
                        const item = values.brandItems[i];
                        const unitPrice = item.quantity > 0 ? item.total / item.quantity : 0;

                        const orderPayload = {
                            clientId: values.clientId,
                            clientName,
                            receiptNumber: values.receiptNumber,
                            salesChannel: item.salesChannel || values.salesChannel,
                            type: item.type,
                            brandId: item.brandId,
                            brandName: item.brandName,
                            total: item.total,
                            createdAt: values.createdAt,
                            possibleDeliveryDate: item.possibleDeliveryDate,
                            notes: values.notes,
                            items: [{
                                productName: item.brandName,
                                quantity: item.quantity,
                                unitPrice: unitPrice,
                                brandId: item.brandId,
                                brandName: item.brandName
                            }],
                            deposit: Number(item.deposit) || 0,
                            creditToUse: i === 0 ? creditAmount : 0,
                            paymentMethod: values.paymentMethod,
                            bankAccountId: values.bankAccountId,
                            transactionDate: values.transactionDate,
                            transactionReference: values.transactionReference,
                            parentOrderId: parentId || undefined,
                            orderNumber: item.orderNumber || undefined
                        };

                        const newOrderResult = await createOrder.mutateAsync(orderPayload as any);
                        createdOrders.push(newOrderResult);
                        if (i === 0) {
                            parentId = newOrderResult.id;
                        }
                    }

                    try {
                        const blob = await pdf(
                            <OrderReceiptDocument
                                order={createdOrders[0]}
                                childOrders={createdOrders.slice(1)}
                                client={client}
                                user={{
                                    id: user?.id || '1',
                                    name: user?.username || 'Vendedor',
                                    role: 'OPERATOR',
                                    email: '',
                                    status: 'ACTIVE',
                                    createdAt: new Date().toISOString()
                                } as any}
                            />
                        ).toBlob()

                        const url = URL.createObjectURL(blob)
                        const link = document.createElement('a')
                        link.href = url
                        link.download = `Recibo_${createdOrders[0].receiptNumber}.pdf`
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                        URL.revokeObjectURL(url)
                    } catch (pdfError) {
                        console.error("Error generating PDF", pdfError)
                    }
                    notifySuccess(`Se han creado ${createdOrders.length} pedidos exitosamente.`);
                    navigate('/orders');
                }
            } catch (error: any) {
                console.error("Error saving order", error)
                notifyError(error, "Error al guardar el pedido.");
            } finally {
                setIsSubmitting(false);
            }
        }
    })

    const generateNextReceiptNumber = async () => {
        try {
            setIsLoadingReceiptNumber(true);
            const { receiptNumber } = await orderApi.generateReceiptNumber();
            formik.setFieldValue('receiptNumber', receiptNumber);
        } catch (error) {
            console.error('Error generating receipt number:', error);
            notifyError(error, 'Error al generar número de recibo');
        } finally {
            setIsLoadingReceiptNumber(false);
        }
    };

    const validateReceiptNumber = async (receiptNumber: string): Promise<boolean> => {
        if (!receiptNumber || isEditing) return true;

        try {
            const { exists } = await orderApi.checkReceiptExists(receiptNumber);
            if (exists) {
                formik.setFieldError('receiptNumber', 'Este número de recibo ya existe');
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error validating receipt number:', error);
            return true;
        }
    };

    useEffect(() => {
        if (currentItem.type === 'REPROGRAMACION') {
            // Check the locally added items in the current form (prioritize "same receipt" logic)
            const localItems = [...formik.values.brandItems].reverse();
            const lastLocalValid = localItems.find(item => item.type === 'NORMAL' || item.type === 'PREVENTA');

            if (lastLocalValid) {
                setCurrentItem(prev => ({
                    ...prev,
                    brandId: lastLocalValid.brandId,
                    brandName: lastLocalValid.brandName,
                    orderNumber: lastLocalValid.orderNumber || ""
                }));
            }
        }
    }, [currentItem.type, formik.values.brandItems.length]);

    // Update formik when order data is loaded for editing
    useEffect(() => {
        if (order && isEditing) {
            formik.setValues({
                clientId: order.clientId || "",
                receiptNumber: order.receiptNumber || "",
                salesChannel: (order.salesChannel as SalesChannel) || "OFICINA",
                brandItems: [
                    {
                        brandId: order.brandId,
                        brandName: order.brandName,
                        quantity: order.items?.[0]?.quantity || 1,
                        total: order.total || 0,
                        type: order.type || "NORMAL",
                        possibleDeliveryDate: order.possibleDeliveryDate ? new Date(order.possibleDeliveryDate).toISOString().split('T')[0] : "",
                        salesChannel: order.salesChannel || "OFICINA",
                        orderNumber: order.orderNumber || "",
                        deposit: order.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
                    }
                ],
                deposit: order.payments?.find(p => p.method !== 'CREDITO_CLIENTE')?.amount || 0,
                creditToUse: 0,
                paymentMethod: (order.paymentMethod === 'CREDITO_CLIENTE' ? 'EFECTIVO' : order.paymentMethod) as PaymentMethod || "EFECTIVO",
                bankAccountId: order.bankAccountId || "",
                transactionDate: order.transactionDate || new Date().toISOString().split('T')[0],
                transactionReference: "",
                createdAt: order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                notes: order.notes || "",
            });
        } else if (!isEditing) {
            generateNextReceiptNumber();
        }
    }, [order, isEditing]);

    const { data: creditsResponse } = useClientCredits(formik.values.clientId)
    const credits = Array.isArray(creditsResponse) ? creditsResponse : (creditsResponse as any)?.data || []
    const totalCredit = credits.reduce((sum: number, c: any) => sum + Number(c.remainingAmount || 0), 0)

    // Total order value remains the same
    const totalOrderValue = formik.values.brandItems.reduce((sum, item) => sum + Number(item.total), 0);

    // Total deposit is now the sum of manual row deposits
    const totalRowDeposit = formik.values.brandItems.reduce((sum, item) => sum + Number(item.deposit || 0), 0);

    // Balance calculation
    const balance = totalOrderValue - totalRowDeposit - Number(formik.values.creditToUse);


    const clientOptions = clients.map(c => ({ id: c.id, label: c.firstName, subLabel: c.identificationNumber }))
    const filteredBankAccounts = bankAccounts.filter(acc => {
        const method = formik.values.paymentMethod;
        if (method === 'EFECTIVO') return acc.type === 'CASH';
        if (['TRANSFERENCIA', 'DEPOSITO'].includes(method)) return acc.type === 'BANK';
        if (method === 'CHEQUE') return true;
        return true;
    });

    const bankOptions = filteredBankAccounts.map(b => ({
        id: b.id,
        label: b.name,
        subLabel: b.type === 'CASH' ? '(Efectivo)' : `${b.bankName || ""} ${b.accountNumber || ""}`
    }));
    const brandOptions = getActiveBrands(brands).map(b => ({ id: b.id, label: b.name, subLabel: "" }))

    const handleAddItem = () => {
        if (!currentItem.brandId) {
            notifyError(null, "Seleccione una marca");
            return;
        }
        if (currentItem.total < 0) {
            notifyError(null, "El valor no puede ser negativo");
            return;
        }

        if (currentItem.type === 'REPROGRAMACION' && currentItem.quantity > 1) {
            const newItems = Array.from({ length: currentItem.quantity }).map(() => ({
                ...currentItem,
                quantity: 1,
                total: Number((currentItem.total / currentItem.quantity).toFixed(2)),
                deposit: 0
            }));
            formik.setFieldValue("brandItems", [...formik.values.brandItems, ...newItems]);
        } else {
            formik.setFieldValue("brandItems", [...formik.values.brandItems, { ...currentItem, deposit: 0 }]);
        }

        // Reset item except channel and date for speed
        setCurrentItem(prev => ({
            ...prev,
            brandId: "",
            brandName: "",
            total: 0,
            quantity: 1,
            orderNumber: ""
        }));
    }

    const removeItem = (index: number) => {
        const items = formik.values.brandItems.filter((_, i) => i !== index);
        formik.setFieldValue("brandItems", items);
    }

    if (isEditing && isLoadingOrder) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto space-y-3 pb-8 px-4">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border shadow-sm">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/orders')} className="h-8 w-8">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-lg font-bold text-slate-800">
                        {isEditing ? "Editar Pedido" : "Registro de Pedidos"}
                    </h1>
                </div>
            </div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Column 1: Client & General Info */}
                <Card className="lg:col-span-3 shadow-sm border-slate-200">
                    <CardHeader className="py-2 px-4 bg-slate-50/50 border-b">
                        <CardTitle className="text-sm font-bold uppercase text-slate-500">Encabezado Recibo</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-600">No de recibo:</Label>
                                <div className="flex gap-1">
                                    <Input
                                        {...formik.getFieldProps('receiptNumber')}
                                        disabled={isLoadingReceiptNumber || isEditing}
                                        className="h-8 text-sm font-mono font-bold text-indigo-700 bg-indigo-50/30"
                                    />
                                    {!isEditing && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={generateNextReceiptNumber}
                                            disabled={isLoadingReceiptNumber}
                                            className="h-8 w-8"
                                        >
                                            <RotateCw className={`h-3 w-3 ${isLoadingReceiptNumber ? 'animate-spin' : ''}`} />
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-600">Fecha de Registro:</Label>
                                <Input
                                    type="date"
                                    {...formik.getFieldProps('createdAt')}
                                    disabled={isEditing}
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-600">Empresaria / Cliente:</Label>
                                <SearchableSelect
                                    options={clientOptions}
                                    value={formik.values.clientId}
                                    onChange={(val) => formik.setFieldValue('clientId', val)}
                                    placeholder="Ingrese nombre o cédula..."
                                    disabled={isEditing}
                                />
                                {totalCredit > 0 && (
                                    <p className="text-xs text-green-600 font-bold mt-1">Saldo a favor: ${totalCredit.toFixed(2)}</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Column 2: Quick Summary Totals */}
                <Card className="shadow-sm border-slate-200 bg-slate-50">
                    <CardHeader className="py-2 px-4 border-b">
                        <CardTitle className="text-sm font-bold uppercase text-slate-500">Valores</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-slate-500">Total pedidos:</span>
                            <span className="font-bold text-slate-900">${totalOrderValue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-green-700">
                            <span className="font-bold">Total abono:</span>
                            <span className="font-bold">${(totalRowDeposit + Number(formik.values.creditToUse)).toFixed(2)}</span>
                        </div>
                        <Separator className="my-1" />
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold uppercase text-slate-400">Saldo:</span>
                            <span className={`text-xl font-black ${balance > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                                ${balance.toFixed(2)}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Item Entry Bar & Table */}
            <Card className="shadow-sm border-slate-200">
                <div className="p-3 bg-slate-50 border-b flex flex-wrap lg:flex-nowrap gap-3 items-end">
                    <div className="w-full sm:w-[110px] space-y-1 shrink-0">
                        <Label className="text-xs font-bold uppercase text-slate-500">Pedido por:</Label>
                        <select
                            value={currentItem.salesChannel}
                            onChange={(e) => setCurrentItem({ ...currentItem, salesChannel: e.target.value as SalesChannel })}
                            className="h-8 w-full rounded-md border border-input text-xs px-2 py-1"
                        >
                            <option value="OFICINA">OFICINA</option>
                            <option value="WHATSAPP">WHATSAPP</option>
                            <option value="DE CAMPO">DE CAMPO</option>
                        </select>
                    </div>
                    <div className="w-full sm:w-[130px] space-y-1 shrink-0">
                        <Label className="text-xs font-bold uppercase text-slate-500">Tipo:</Label>
                        <select
                            value={currentItem.type}
                            onChange={(e) => setCurrentItem({ ...currentItem, type: e.target.value as OrderType })}
                            className="h-8 w-full rounded-md border border-input text-xs px-2 py-1"
                        >
                            <option value="NORMAL">NORMAL</option>
                            <option value="PREVENTA">PREVENTA</option>
                            <option value="REPROGRAMACION">REPROGRAMACION</option>
                        </select>
                    </div>
                    <div className="w-full sm:w-[110px] space-y-1 shrink-0">
                        <Label className="text-xs font-bold uppercase text-slate-500">No Pedido:</Label>
                        <Input
                            className="h-8 w-full text-xs font-mono px-2"
                            value={currentItem.orderNumber}
                            onChange={(e) => setCurrentItem({ ...currentItem, orderNumber: e.target.value })}
                            placeholder="Ej: 12345"
                        />
                    </div>
                    <div className="w-full sm:w-[60px] space-y-1 shrink-0">
                        <Label className="text-xs font-bold uppercase text-slate-500">Cant:</Label>
                        <Input
                            type="number"
                            className="h-8 w-full text-xs px-2"
                            value={currentItem.quantity}
                            onChange={(e) => setCurrentItem({ ...currentItem, quantity: Number(e.target.value) })}
                        />
                    </div>
                    <div className="w-full sm:flex-1 min-w-[180px] space-y-1">
                        <Label className="text-xs font-bold uppercase text-slate-500">Catálogo / Marca:</Label>
                        <SearchableSelect
                            options={brandOptions}
                            value={currentItem.brandId}
                            onChange={(val) => {
                                const b = brands.find(x => x.id === val);
                                setCurrentItem({ ...currentItem, brandId: val, brandName: b ? b.name : "" });
                            }}
                            placeholder="Marca..."
                        />
                    </div>
                    <div className="w-full sm:w-[80px] space-y-1 shrink-0">
                        <Label className="text-xs font-bold uppercase text-slate-500">Valor:</Label>
                        <Input
                            type="number"
                            className="h-8 w-full font-bold text-xs px-2"
                            value={currentItem.total}
                            onChange={(e) => setCurrentItem({ ...currentItem, total: Number(e.target.value) })}
                            step="0.01"
                        />
                    </div>
                    <div className="w-full sm:w-[135px] space-y-1 shrink-0">
                        <Label className="text-xs font-bold uppercase text-slate-500">Entrega:</Label>
                        <Input
                            type="date"
                            className="h-8 w-full text-xs px-2"
                            value={currentItem.possibleDeliveryDate}
                            onChange={(e) => setCurrentItem({ ...currentItem, possibleDeliveryDate: e.target.value })}
                        />
                    </div>
                    <div className="w-full sm:w-[80px] shrink-0">
                        <Button
                            type="button"
                            onClick={handleAddItem}
                            disabled={isEditing}
                            className="h-8 w-full bg-slate-800 hover:bg-slate-900 px-2 text-xs"
                        >
                            Agregar
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-slate-100 text-slate-600 border-b uppercase font-bold text-xs">
                            <tr>
                                <th className="px-3 py-2 border-r text-center w-8">N°</th>
                                <th className="px-3 py-2 border-r">N° Pedido</th>
                                <th className="px-3 py-2 border-r">Tipo</th>
                                <th className="px-3 py-2 border-r">Catálogo</th>
                                <th className="px-3 py-2 border-r text-right">Valor Pedido</th>
                                <th className="px-3 py-2 border-r text-right">Abono</th>
                                <th className="px-3 py-2 border-r text-right">Saldo</th>
                                <th className="px-3 py-2 border-r">Posible Entrega</th>
                                <th className="px-3 py-2 text-center text-xs">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {formik.values.brandItems.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-8 text-center text-slate-400 italic">No hay marcas agregadas en este recibo</td>
                                </tr>
                            ) : (
                                formik.values.brandItems.map((item, idx) => {
                                    // Visual distribution balance
                                    const distributedAbono = Number(item.deposit || 0);
                                    const rowSaldo = Number(item.total) - distributedAbono;

                                    return (
                                        <tr key={idx} className="hover:bg-indigo-50/20 transition-colors">
                                            <td className="px-3 py-2 border-r text-center font-bold text-slate-400">{idx + 1}</td>
                                            <td className="px-3 py-2 border-r font-mono text-[10px] text-slate-600">
                                                {item.orderNumber || '---'}
                                            </td>
                                            <td className="px-3 py-2 border-r">
                                                <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${item.type === 'NORMAL' ? 'bg-blue-50 text-blue-700' :
                                                    item.type === 'PREVENTA' ? 'bg-amber-50 text-amber-700' : 'bg-purple-50 text-purple-700'
                                                    }`}>
                                                    {item.type}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 border-r font-medium">{item.brandName} <span className="text-slate-400 text-xs">({item.quantity})</span></td>
                                            <td className="px-3 py-2 border-r text-right">
                                                <div className="flex justify-end items-center gap-1">
                                                    <span className="text-slate-400 text-xs">$</span>
                                                    <input
                                                        type="number"
                                                        className="h-7 w-20 text-right font-bold bg-transparent border-none focus:ring-0 outline-none text-xs"
                                                        value={item.total}
                                                        onChange={(e) => {
                                                            const items = [...formik.values.brandItems];
                                                            items[idx].total = Number(e.target.value);
                                                            formik.setFieldValue("brandItems", items);
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 border-r text-right font-medium">
                                                <div className="flex justify-end items-center gap-1">
                                                    <span className="text-green-600 text-xs">$</span>
                                                    <input
                                                        type="number"
                                                        className="h-7 w-20 text-right text-green-600 font-bold bg-green-50/30 rounded border-green-100 focus:ring-1 focus:ring-green-500 outline-none text-xs"
                                                        value={item.deposit || ''}
                                                        onChange={(e) => {
                                                            const items = [...formik.values.brandItems];
                                                            items[idx].deposit = Number(e.target.value);
                                                            formik.setFieldValue("brandItems", items);
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 border-r text-right font-bold text-slate-600">${rowSaldo.toFixed(2)}</td>
                                            <td className="px-3 py-2 border-r">{item.possibleDeliveryDate}</td>
                                            <td className="px-3 py-2 text-center">
                                                {!isEditing && (
                                                    <Button variant="ghost" size="icon" onClick={() => removeItem(idx)} className="h-6 w-6 text-red-500 hover:text-red-700">
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Bottom Section: Payment & Observations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2 shadow-sm border-slate-200">
                    <CardHeader className="py-2 px-4 bg-slate-50 border-b">
                        <CardTitle className="text-sm font-bold uppercase text-slate-500">Información del Pago</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold">Forma de Pago:</Label>
                                <select
                                    {...formik.getFieldProps('paymentMethod')}
                                    className="h-8 w-full rounded-md border border-input text-xs"
                                >
                                    <option value="EFECTIVO">EFECTIVO</option>
                                    <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                                    <option value="DEPOSITO">DEPÓSITO</option>
                                    <option value="CHEQUE">CHEQUE</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold">Cuenta Bancaria:</Label>
                                <SearchableSelect
                                    options={bankOptions}
                                    value={formik.values.bankAccountId}
                                    onChange={(val) => formik.setFieldValue('bankAccountId', val)}
                                    placeholder="Seleccione cuenta..."
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold">Fecha Trans.:</Label>
                                <Input type="date" {...formik.getFieldProps('transactionDate')} className="h-8 text-xs" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold">No Documento / Ref:</Label>
                                <Input {...formik.getFieldProps('transactionReference')} className="h-8 text-xs" placeholder="Referencia..." />
                            </div>
                        </div>

                        {totalCredit > 0 && (
                            <div className="mt-3 pt-3 border-t">
                                <div className="bg-green-50 border border-green-100 rounded-md py-1 px-3 flex items-center justify-between">
                                    <span className="text-xs font-bold text-green-700">Usar Saldo Favor:</span>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            className="h-7 w-24 bg-white text-xs"
                                            value={formik.values.creditToUse}
                                            onChange={(e) => {
                                                const val = Math.min(Number(e.target.value), totalCredit, totalOrderValue - Number(totalRowDeposit));
                                                formik.setFieldValue('creditToUse', val > 0 ? val : 0);
                                            }}
                                        />
                                        <p className="text-xs text-slate-500">Disponible: ${totalCredit.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="py-2 px-4 bg-slate-50 border-b">
                        <CardTitle className="text-sm font-bold uppercase text-slate-500">Observación / Notas</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                        <textarea
                            {...formik.getFieldProps('notes')}
                            className="w-full h-24 p-2 text-sm rounded-md border border-input focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                            placeholder="Ingrese notas adicionales sobre el pedido..."
                        />
                    </CardContent>
                    <div className="p-2 border-t bg-slate-50 flex gap-2">
                        <AsyncButton
                            className="w-full bg-slate-800"
                            onClick={() => formik.handleSubmit()}
                            isLoading={isSubmitting}
                        >
                            <Plus className="h-4 w-4 mr-2" /> Guardar Recibo
                        </AsyncButton>
                    </div>
                </Card>
            </div>
        </div>
    )
}
