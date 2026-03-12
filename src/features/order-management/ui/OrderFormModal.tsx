// Imports
import { useState, useRef, useEffect } from "react"
import { useFormik } from "formik"
import * as Yup from "yup"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { AsyncButton } from "@/shared/ui/async-button"
import { Label } from "@/shared/ui/label"
import { Separator } from "@/shared/ui/separator"
import { X } from "lucide-react"

import { useBankAccountList } from "@/features/bank-accounts/api/hooks"
import { useUpdateOrder, useBatchCreateOrder } from "@/entities/order/model/hooks"
import type { Order, SalesChannel, OrderType, PaymentMethod } from "@/entities/order/model/types"
import { orderApi } from "@/entities/order/model/api"
import { useClientList } from "@/features/clients/api/hooks"
import { useBrandList } from "@/features/brands/api/hooks"
import { getActiveBrands } from "@/entities/brand/model/model"
import { useNotifications } from "@/shared/lib/notifications"
import { pdf } from "@react-pdf/renderer"
import { OrderReceiptDocument } from "@/features/order-receipt/ui/OrderReceiptDocument"
import { useClientCredits } from "@/features/transactions/model/hooks"
import { useAuth } from "@/shared/auth"

interface OrderFormModalProps {
    order?: Order | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

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
    placeholder
}: {
    options: Option[],
    value: string,
    onChange: (val: string) => void,
    placeholder: string
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
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm cursor-pointer items-center justify-between"
                onClick={() => {
                    setIsOpen(!isOpen)
                    if (!isOpen) setSearchTerm("") // Reset search on open
                }}
            >
                <span className={selectedOption ? "text-foreground" : "text-muted-foreground"}>
                    {selectedOption ? `${selectedOption.label} ${selectedOption.subLabel ? `(${selectedOption.subLabel})` : ''}` : placeholder}
                </span>
                <span className="opacity-50">▼</span>
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md bg-white dark:bg-slate-950">
                    <div className="p-2 border-b">
                        <Input
                            autoFocus
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-8"
                        />
                    </div>
                    <div className="max-h-[200px] overflow-auto py-1">
                        {filteredOptions.length === 0 ? (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">No se encontraron resultados</div>
                        ) : (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.id}
                                    className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${option.id === value ? "bg-accent" : ""}`}
                                    onClick={() => {
                                        onChange(option.id)
                                        setIsOpen(false)
                                    }}
                                >
                                    <div className="flex flex-col">
                                        <span>{option.label}</span>
                                        {option.subLabel && <span className="text-xs text-muted-foreground">{option.subLabel}</span>}
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


export function OrderFormModal({ order, open, onOpenChange }: OrderFormModalProps) {
    const { data: clientsResponse } = useClientList({ limit: 500 })
    const { data: bankAccountsResponse } = useBankAccountList({ limit: 500 })
    const { data: brandsResponse } = useBrandList({ limit: 500 })

    const clients = clientsResponse?.data || []
    const bankAccounts = bankAccountsResponse?.data || []
    const brands = brandsResponse?.data || []
    const batchCreate = useBatchCreateOrder()
    const updateOrder = useUpdateOrder()
    const { notifySuccess, notifyError } = useNotifications()
    const { user } = useAuth()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoadingReceiptNumber, setIsLoadingReceiptNumber] = useState(false)

    const isEditing = !!order

    // Generate receipt number when opening form for new order
    useEffect(() => {
        if (open && !isEditing) {
            generateNextReceiptNumber();
        }
    }, [open, isEditing]);

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
            return true; // Allow submission if validation fails
        }
    };

    const formik = useFormik({
        initialValues: {
            clientId: order?.clientId || "",
            receiptNumber: order?.receiptNumber || "",
            salesChannel: order?.salesChannel || "OFICINA" as SalesChannel,
            brandItems: order ? [
                {
                    brandId: order.brandId,
                    brandName: order.brandName,
                    quantity: order.items?.[0]?.quantity || 1,
                    total: order.total || 0,
                    type: order.type || "NORMAL",
                    possibleDeliveryDate: order.possibleDeliveryDate ? new Date(order.possibleDeliveryDate).toISOString().split('T')[0] : "",
                }
            ] : [
                {
                    brandId: "",
                    brandName: "",
                    quantity: 1,
                    total: 0,
                    type: "NORMAL" as OrderType,
                    possibleDeliveryDate: "",
                }
            ],
            deposit: order?.payments?.find(p => p.method !== 'CREDITO_CLIENTE')?.amount || 0,
            creditToUse: 0,
            paymentMethod: (order?.paymentMethod === 'CREDITO_CLIENTE' ? 'EFECTIVO' : order?.paymentMethod) || "EFECTIVO" as PaymentMethod,
            bankAccountId: order?.bankAccountId || "",
            transactionDate: order?.transactionDate || new Date().toISOString().split('T')[0],
            transactionReference: "",
            createdAt: order?.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        },

        validationSchema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            setIsSubmitting(true);
            try {
                // Validate receipt number uniqueness
                if (!isEditing) {
                    const isValidReceipt = await validateReceiptNumber(values.receiptNumber);
                    if (!isValidReceipt) {
                        setIsSubmitting(false);
                        return;
                    }
                }

                const client = clients.find(c => c.id === values.clientId);
                const clientName = client ? client.firstName : "Desconocido";
                const depositAmount = Number(values.deposit) || 0;
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
                } else {
                    // Optimized: Create all orders in a single request
                    const payload = {
                        receipt_number: values.receiptNumber,
                        client_id: values.clientId,
                        sales_channel: values.salesChannel,
                        payment_method: values.paymentMethod,
                        bank_account_id: values.bankAccountId,
                        transaction_date: values.transactionDate,
                        deposit: depositAmount,
                        credit_to_use: creditAmount,
                        created_at: values.createdAt,
                        orders: values.brandItems.map(item => ({
                            brand_id: item.brandId,
                            brand_name: item.brandName,
                            total: item.total,
                            type: item.type,
                            possible_delivery_date: item.possibleDeliveryDate,
                            items: [{
                                product_name: item.brandName,
                                quantity: item.quantity,
                                unit_price: item.quantity > 0 ? item.total / item.quantity : 0
                            }]
                        }))
                    };

                    const createdOrders = await batchCreate.mutateAsync(payload);

                    // 3. Generate PDF with the FINAL order state (including payments)
                    try {
                        const blob = await pdf(
                            <OrderReceiptDocument
                                order={createdOrders[0]}
                                childOrders={createdOrders.slice(1)}
                                client={client as any}
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
                        notifyError(pdfError, "Error al generar PDF.");
                    }
                }
                onOpenChange(false)
                formik.resetForm()
            } catch (error: any) {
                console.error("Error saving order", error)
                notifyError(error, "Error al guardar el pedido.");
            } finally {
                setIsSubmitting(false);
            }
        }
    })

    const { data: credits = [] } = useClientCredits(formik.values.clientId)
    const totalCredit = credits.reduce((sum, c) => sum + Number(c.remainingAmount || 0), 0)
    const totalOrderValue = formik.values.brandItems.reduce((sum, item) => sum + Number(item.total), 0);

    const inputClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] max-w-[95vw] sm:w-full">
                <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">{isEditing ? "" : "Nuevo Pedido"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={formik.handleSubmit} className="space-y-4 sm:space-y-6 py-2 sm:py-4">
                    {/* Fila 1: Cliente y Recibo */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                        <div className="space-y-2 md:col-span-1">
                            <Label htmlFor="clientId">Cliente (Nombre / Cédula)</Label>
                            <SearchableSelect
                                options={clientOptions}
                                value={formik.values.clientId}
                                onChange={(val) => formik.setFieldValue('clientId', val)}
                                placeholder="Buscar cliente..."
                            />
                            {totalCredit > 0 && (
                                <div className="text-xs font-semibold text-green-600 mt-1 flex items-center gap-1">
                                    <span>Saldo a favor disponible:</span>
                                    <span className="text-sm">${totalCredit.toFixed(2)}</span>
                                </div>
                            )}
                            {formik.touched.clientId && formik.errors.clientId && (
                                <p className="text-red-500 text-xs">{formik.errors.clientId}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="receiptNumber">N° Recibo</Label>
                                {!isEditing && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={generateNextReceiptNumber}
                                        disabled={isLoadingReceiptNumber}
                                        className="h-6 text-xs"
                                    >
                                        {isLoadingReceiptNumber ? 'Generando...' : 'Regenerar'}
                                    </Button>
                                )}
                            </div>
                            <Input
                                id="receiptNumber"
                                {...formik.getFieldProps('receiptNumber')}
                                disabled={isLoadingReceiptNumber}
                                placeholder="ORD-20260223-001"
                            />
                            {formik.touched.receiptNumber && formik.errors.receiptNumber && (
                                <p className="text-red-500 text-xs">{formik.errors.receiptNumber}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="createdAt">Fecha Registro</Label>
                            <Input
                                type="date"
                                id="createdAt"
                                {...formik.getFieldProps('createdAt')}
                            />
                            {formik.touched.createdAt && formik.errors.createdAt && (
                                <p className="text-red-500 text-xs">{formik.errors.createdAt}</p>
                            )}
                        </div>
                    </div>


                    <Separator />

                    {/* Listado de Marcas (Items) */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs sm:text-sm font-medium text-muted-foreground">Catalogos en este Recibo</h4>
                            {!isEditing && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const items = [...formik.values.brandItems];
                                        items.push({
                                            brandId: "",
                                            brandName: "",
                                            quantity: 1,
                                            total: 0,
                                            type: "NORMAL",
                                            possibleDeliveryDate: "",
                                        });
                                        formik.setFieldValue("brandItems", items);
                                    }}
                                >
                                    + Agregar Catalogo
                                </Button>
                            )}
                        </div>

                        {formik.values.brandItems.map((item, index) => (
                            <div key={index} className="bg-muted/10 p-3 sm:p-4 rounded-lg border relative">
                                {!isEditing && formik.values.brandItems.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 h-6 w-6 text-destructive"
                                        onClick={() => {
                                            const items = formik.values.brandItems.filter((_, i) => i !== index);
                                            formik.setFieldValue("brandItems", items);
                                        }}
                                    >
                                        <span className="sr-only">Cerrar</span>
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                                    <div className="lg:col-span-2 space-y-2">
                                        <Label>Catalogo</Label>
                                        <SearchableSelect
                                            options={brandOptions}
                                            value={item.brandId}
                                            onChange={(val) => {
                                                const b = brands.find(x => x.id === val);
                                                formik.setFieldValue(`brandItems.${index}.brandId`, val);
                                                formik.setFieldValue(`brandItems.${index}.brandName`, b ? b.name : "");
                                            }}
                                            placeholder="Seleccione catalogo..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Cantidad</Label>
                                        <Input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => formik.setFieldValue(`brandItems.${index}.quantity`, Number(e.target.value))}
                                            min="1"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Valor Pedido</Label>
                                        <div className="relative">
                                            <span className="absolute left-2 top-2.5 text-muted-foreground">$</span>
                                            <Input
                                                type="number"
                                                value={item.total}
                                                onChange={(e) => formik.setFieldValue(`brandItems.${index}.total`, Number(e.target.value))}
                                                className="pl-6"
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Tipo</Label>
                                        <select
                                            value={item.type}
                                            onChange={(e) => formik.setFieldValue(`brandItems.${index}.type`, e.target.value)}
                                            className={inputClass}
                                        >
                                            <option value="NORMAL">Normal</option>
                                            <option value="PREVENTA">Preventa</option>
                                            <option value="REPROGRAMACION">Reprogramación</option>
                                        </select>
                                    </div>
                                    <div className="lg:col-span-2 space-y-2">
                                        <Label>Fecha Posible Entrega</Label>
                                        <Input
                                            type="date"
                                            value={item.possibleDeliveryDate}
                                            onChange={(e) => formik.setFieldValue(`brandItems.${index}.possibleDeliveryDate`, e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Fila 4: Pagos */}
                    <div className="bg-muted/10 p-3 sm:p-4 rounded-lg border">
                        <h4 className="text-xs sm:text-sm font-medium mb-3 sm:mb-4 text-muted-foreground">Pago y Saldos</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="deposit">Abono</Label>
                                    <span className="text-xs text-muted-foreground">
                                        Mínimo: ${(totalOrderValue * 0.5).toFixed(2)} (50%)
                                    </span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-2 top-2.5 text-muted-foreground">$</span>
                                    <Input type="number" id="deposit" {...formik.getFieldProps('deposit')} className="pl-6" min="0" step="0.01" />
                                </div>
                                {formik.touched.deposit && formik.errors.deposit && (
                                    <p className="text-red-500 text-xs">{formik.errors.deposit}</p>
                                )}
                            </div>

                            {totalCredit > 0 && (
                                <div className="space-y-2 p-3 bg-emerald-50 border border-emerald-100 rounded-md">
                                    <Label className="text-emerald-800 text-xs font-bold">Saldo a Favor Disponible: ${totalCredit.toFixed(2)}</Label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <span className="absolute left-2 top-1.5 text-xs text-emerald-600">$</span>
                                            <Input
                                                type="number"
                                                className="pl-5 h-8 bg-white border-emerald-200 focus:ring-emerald-500"
                                                placeholder="Monto a usar"
                                                {...formik.getFieldProps('creditToUse')}
                                                onChange={(e) => {
                                                    const val = Math.min(Number(e.target.value), totalCredit, totalOrderValue - Number(formik.values.deposit));
                                                    formik.setFieldValue('creditToUse', val > 0 ? val : 0);
                                                }}
                                            />
                                        </div>
                                        {Number(formik.values.creditToUse) > 0 ? (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => formik.setFieldValue('creditToUse', 0)}
                                            >
                                                Quitar
                                            </Button>
                                        ) : (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                                                onClick={() => {
                                                    const maxPossible = Math.min(totalCredit, totalOrderValue - Number(formik.values.deposit));
                                                    formik.setFieldValue('creditToUse', maxPossible);
                                                }}
                                            >
                                                Usar Máximo
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-emerald-600">Este monto se descontará del saldo a favor del cliente.</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Saldo Pendiente</Label>
                                <div className="flex h-9 w-full items-center rounded-md border border-input bg-red-50 px-3 text-sm font-bold text-red-600">
                                    ${(totalOrderValue - Number(formik.values.deposit) - Number(formik.values.creditToUse)).toFixed(2)}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="paymentMethod">Forma de Pago (Abono Inicial)</Label>
                                <select id="paymentMethod" {...formik.getFieldProps('paymentMethod')} className={inputClass} disabled={Number(formik.values.deposit) === 0}>
                                    <option value="EFECTIVO">Efectivo</option>
                                    <option value="TRANSFERENCIA">Transferencia</option>
                                    <option value="DEPOSITO">Depósito</option>
                                    <option value="CHEQUE">Cheque</option>
                                </select>
                            </div>

                            {Number(formik.values.deposit) > 0 && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="bankAccountId">Cuenta de Destino</Label>
                                        <SearchableSelect
                                            options={bankOptions}
                                            value={formik.values.bankAccountId || ""}
                                            onChange={(val) => formik.setFieldValue('bankAccountId', val)}
                                            placeholder="Cuenta..."
                                        />
                                        {formik.touched.bankAccountId && formik.errors.bankAccountId && (
                                            <p className="text-red-500 text-xs">{formik.errors.bankAccountId}</p>
                                        )}
                                    </div>
                                    {formik.values.paymentMethod !== 'EFECTIVO' && (
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="transactionDate">Fecha Transacción</Label>
                                                <Input type="date" id="transactionDate" {...formik.getFieldProps('transactionDate')} />
                                                {formik.touched.transactionDate && formik.errors.transactionDate && (
                                                    <p className="text-red-500 text-xs">{formik.errors.transactionDate}</p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="transactionReference">
                                                    {formik.values.paymentMethod === 'CHEQUE' ? 'N° Cheque' : 'Referencia / Comprobante'}
                                                </Label>
                                                <Input
                                                    id="transactionReference"
                                                    {...formik.getFieldProps('transactionReference')}
                                                    placeholder="Ingresa los dígitos de referencia..."
                                                />
                                                {formik.touched.transactionReference && formik.errors.transactionReference && (
                                                    <p className="text-red-500 text-xs">{formik.errors.transactionReference}</p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                        <AsyncButton type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                            Cancelar
                        </AsyncButton>
                        <AsyncButton type="submit" isLoading={isSubmitting} loadingText="Procesando..." className="w-full sm:w-auto">
                            {isEditing ? "Guardar Cambios" : "Crear Pedido"}
                        </AsyncButton>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
