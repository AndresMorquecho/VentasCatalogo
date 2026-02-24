// Imports
import { useState, useRef, useEffect } from "react"
import { useFormik } from "formik"
import * as Yup from "yup"
import { Gift } from "lucide-react"
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

import { useBankAccountList } from "@/features/bank-accounts/api/hooks"
import { useCreateOrder, useUpdateOrder } from "@/entities/order/model/hooks"
import type { Order, SalesChannel, OrderType, PaymentMethod, OrderStatus } from "@/entities/order/model/types"
import { orderApi } from "@/entities/order/model/api"
import { useClientList } from "@/features/clients/api/hooks"
import { useBrandList } from "@/features/brands/api/hooks"
import { getActiveBrands } from "@/entities/brand/model/model"
import { useToast } from "@/shared/ui/use-toast"
import { pdf } from "@react-pdf/renderer"
import { OrderReceiptDocument } from "@/features/order-receipt/ui/OrderReceiptDocument"
import { useAddOrderPayment } from "@/features/order-payments/model"

// Transaction Imports
import { processPaymentRegistration } from "@/features/transactions/lib/processPayment"
import { validateTransaction } from "@/features/transactions/lib/validateTransaction"
import type { FinancialRecordType } from "@/entities/financial-record/model/types"
import { useClientCredits } from "@/features/transactions/model/hooks"

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
    type: Yup.string().required("El tipo es requerido"),
    brandId: Yup.string().required("La marca es requerida"),
    brandName: Yup.string().required("La marca es requerida"),
    quantity: Yup.number().min(1, "Mínimo 1").required("Requerido"),
    total: Yup.number().min(0, "No negativo").required("Requerido"),
    deposit: Yup.number()
        .min(0, "No negativo")
        .required("Requerido")
        .test('min-deposit', 'El abono debe ser al menos el 50% del total', function (value) {
            const { total } = this.parent;
            if (!value || !total) return true;
            return value >= (total * 0.5);
        }),
    paymentMethod: Yup.string().required("La forma de pago es requerida"),
    bankAccountId: Yup.string().when("paymentMethod", {
        is: (val: string) => ['TRANSFERENCIA', 'DEPOSITO', 'CHEQUE'].includes(val),
        then: (schema) => schema.required("Cuenta bancaria requerida"),
        otherwise: (schema) => schema.notRequired()
    }),
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
    possibleDeliveryDate: Yup.string().required("Fecha de entrega requerida"),
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
    const { data: clients = [] } = useClientList()
    const { data: bankAccounts = [] } = useBankAccountList()
    const { data: brands = [] } = useBrandList()
    const createOrder = useCreateOrder()
    const updateOrder = useUpdateOrder()
    const addOrderPayment = useAddOrderPayment()
    const { showToast } = useToast()
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
            showToast('Error al generar número de recibo', 'error');
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
            type: order?.type || "NORMAL" as OrderType,
            brandId: order?.brandId || (order?.brandName ? brands.find(b => b.name === order.brandName)?.id : "") || "",
            brandName: order?.brandName || "",
            quantity: order?.items?.[0]?.quantity || 1,
            total: order?.total || 0,
            deposit: order?.payments?.[0]?.amount || 0, // Get first payment as deposit
            paymentMethod: order?.paymentMethod || "EFECTIVO" as PaymentMethod,
            bankAccountId: order?.bankAccountId || "",
            transactionDate: order?.transactionDate || new Date().toISOString().split('T')[0],
            transactionReference: "", // New field
            possibleDeliveryDate: order?.possibleDeliveryDate ? new Date(order.possibleDeliveryDate).toISOString().split('T')[0] : "",
            status: order?.status || "POR_RECIBIR" as OrderStatus,
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

                const client = clients.find(c => c.id === values.clientId)
                const clientName = client ? client.firstName : "Desconocido"
                const unitPrice = values.quantity > 0 ? values.total / values.quantity : 0
                const depositAmount = Number(values.deposit) || 0
                const isFinancial = ['TRANSFERENCIA', 'DEPOSITO', 'CHEQUE'].includes(values.paymentMethod);

                // Pre-validation for financial transactions
                if (!isEditing && isFinancial && depositAmount > 0) {
                    try {
                        await validateTransaction({
                            type: 'PAYMENT', // Always PAYMENT for order deposits
                            source: 'ORDER_PAYMENT',
                            movementType: 'INCOME',
                            referenceNumber: values.transactionReference,
                            amount: depositAmount,
                            date: values.transactionDate,
                            clientId: values.clientId,
                            clientName,
                            createdBy: 'Vendedor', // Mock
                            bankAccountId: values.bankAccountId || 'default',
                            paymentMethod: values.paymentMethod as 'EFECTIVO' | 'TRANSFERENCIA' | 'DEPOSITO' | 'CHEQUE'
                        });
                    } catch (e: any) {
                        showToast(e.message, "error");
                        setIsSubmitting(false);
                        return; // Stop submission
                    }
                }

                const payload = {
                    ...values,
                    clientName,
                    unitPrice,
                    // The order is created with 0 paidAmount initially. 
                    // The deposit is processed as a separate transaction immediately after.
                    items: [{
                        id: order?.items?.[0]?.id || String(Date.now()),
                        productName: values.brandName,
                        quantity: values.quantity,
                        unitPrice: unitPrice,
                        brandId: values.brandId, // CRITICAL: Include brandId in items
                        brandName: values.brandName
                    }]
                };

                if (isEditing && order) {
                    await updateOrder.mutateAsync({ id: order.id, data: payload })
                    showToast(`Pedido de ${clientName} actualizado correctamente.`, "success")
                } else {
                    // 1. Create the base order
                    let newOrder = await createOrder.mutateAsync(payload)

                    // Initial deposit logic is now handled ATOMICALLY by the backend's CreateOrderUseCase
                    if (depositAmount > 0) {
                        // Just an informative log
                        console.log(`Initial deposit of $${depositAmount} was processed natively by the backend.`);
                    }

                    showToast(`Pedido de ${clientName} creado correctamente.`, "success")

                    // 3. Generate PDF with the FINAL order state (including payments)
                    try {
                        const blob = await pdf(
                            <OrderReceiptDocument
                                order={newOrder}
                                client={client}
                                user={{ id: '1', name: 'Vendedor', role: 'OPERATOR', email: 'vendedor@temu.com', status: 'ACTIVE', createdAt: new Date().toISOString() }}
                            />
                        ).toBlob()

                        const url = URL.createObjectURL(blob)
                        const link = document.createElement('a')
                        link.href = url
                        link.download = `Recibo_${newOrder.receiptNumber}.pdf`
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                        URL.revokeObjectURL(url)
                    } catch (pdfError) {
                        console.error("Error generating PDF", pdfError)
                        showToast(`Error al generar PDF.`, "error")
                    }
                }
                onOpenChange(false)
                formik.resetForm()
            } catch (error: any) {
                console.error("Error saving order", error)
                showToast(error.message || "Error al guardar el pedido.", "error")
            } finally {
                setIsSubmitting(false);
            }
        }
    })

    const { data: credits = [] } = useClientCredits(formik.values.clientId)
    const totalCredit = credits.reduce((sum, c) => sum + c.amount, 0)

    const balance = Math.max(0, formik.values.total - formik.values.deposit)
    const inputClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

    const clientOptions = clients.map(c => ({ id: c.id, label: c.firstName, subLabel: c.identificationNumber }))
    const bankOptions = bankAccounts.map(b => ({ id: b.id, label: b.holderName || b.name, subLabel: `${b.bankName || ""} - ${b.accountNumber || ""}` }))
    const brandOptions = getActiveBrands(brands).map(b => ({ id: b.id, label: b.name, subLabel: "" }))

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] max-w-[95vw] sm:w-full">
                <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">{isEditing ? "Editar Pedido" : "Nuevo Pedido"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={formik.handleSubmit} className="space-y-4 sm:space-y-6 py-2 sm:py-4">
                    {/* Fila 1: Cliente y Recibo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="clientId">Cliente (Nombre / Cédula)</Label>
                            <SearchableSelect
                                options={clientOptions}
                                value={formik.values.clientId}
                                onChange={(val) => formik.setFieldValue('clientId', val)}
                                placeholder="Buscar cliente..."
                            />
                            {totalCredit > 0 && (
                                <div className="text-xs font-semibold text-green-600 mt-1 flex items-center gap-1">
                                    <span>💰 Saldo a favor disponible:</span>
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
                                        {isLoadingReceiptNumber ? 'Generando...' : '🔄 Regenerar'}
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
                            {!isEditing && (
                                <p className="text-xs text-muted-foreground">
                                    Editable - El sistema valida que no exista
                                </p>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Fila 2: Detalles del Pedido */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="salesChannel">Pedido Por</Label>
                            <select id="salesChannel" {...formik.getFieldProps('salesChannel')} className={inputClass}>
                                <option value="OFICINA">Oficina</option>
                                <option value="WHATSAPP">WhatsApp</option>
                                <option value="DOMICILIO">Domicilio</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type">Tipo</Label>
                            <select id="type" {...formik.getFieldProps('type')} className={inputClass}>
                                <option value="NORMAL">Normal</option>
                                <option value="PREVENTA">Preventa</option>
                                <option value="REPROGRAMACION">Reprogramación</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="possibleDeliveryDate">Posible Entrega</Label>
                            <Input type="date" id="possibleDeliveryDate" {...formik.getFieldProps('possibleDeliveryDate')} />
                            {formik.touched.possibleDeliveryDate && formik.errors.possibleDeliveryDate && (
                                <p className="text-red-500 text-xs">{formik.errors.possibleDeliveryDate}</p>
                            )}
                        </div>
                    </div>

                    {/* Fila 3: Marca y Valores */}
                    <div className="bg-muted/10 p-3 sm:p-4 rounded-lg border">
                        <h4 className="text-xs sm:text-sm font-medium mb-3 sm:mb-4 text-muted-foreground">Detalle Financiero</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 items-end">
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="brandId">Marca</Label>
                                <SearchableSelect
                                    options={brandOptions}
                                    value={formik.values.brandId || ""}
                                    onChange={(val) => {
                                        const selectedBrand = brands.find(b => b.id === val)
                                        formik.setFieldValue('brandId', val)
                                        formik.setFieldValue('brandName', selectedBrand ? selectedBrand.name : "")
                                    }}
                                    placeholder="Buscar marca..."
                                />
                                {formik.touched.brandName && formik.errors.brandName && (
                                    <p className="text-red-500 text-xs">{formik.errors.brandName}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="quantity">Cantidad</Label>
                                <Input type="number" id="quantity" {...formik.getFieldProps('quantity')} min="1" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="total">Valor Pedido Total</Label>
                                <div className="relative">
                                    <span className="absolute left-2 top-2.5 text-muted-foreground">$</span>
                                    <Input type="number" id="total" {...formik.getFieldProps('total')} className="pl-6" min="0" step="0.01" />
                                </div>
                                {formik.touched.total && formik.errors.total && (
                                    <p className="text-red-500 text-xs">{formik.errors.total}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Fila 4: Pagos */}
                    <div className="bg-muted/10 p-3 sm:p-4 rounded-lg border">
                        <h4 className="text-xs sm:text-sm font-medium mb-3 sm:mb-4 text-muted-foreground">Pago y Saldos</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="deposit">Abono</Label>
                                    <span className="text-xs text-muted-foreground">
                                        Mínimo: ${(formik.values.total * 0.5).toFixed(2)} (50%)
                                    </span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-2 top-2.5 text-muted-foreground">$</span>
                                    <Input type="number" id="deposit" {...formik.getFieldProps('deposit')} className="pl-6" min="0" step="0.01" />
                                </div>
                                {formik.touched.deposit && formik.errors.deposit && (
                                    <p className="text-red-500 text-xs">{formik.errors.deposit}</p>
                                )}
                                {totalCredit > 0 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-full text-emerald-600 border-emerald-300 hover:bg-emerald-50 mt-2"
                                        onClick={() => {
                                            const currentDeposit = Number(formik.values.deposit) || 0;
                                            const maxCredit = Math.min(totalCredit, formik.values.total - currentDeposit);
                                            if (maxCredit > 0) {
                                                formik.setFieldValue('deposit', currentDeposit + maxCredit);
                                                showToast(`Se aplicó $${maxCredit.toFixed(2)} del saldo a favor`, "success");
                                            }
                                        }}
                                    >
                                        <Gift className="h-4 w-4 mr-2" />
                                        Usar Saldo a Favor (${totalCredit.toFixed(2)})
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Saldo Pendiente</Label>
                                <div className="flex h-9 w-full items-center rounded-md border border-input bg-red-50 px-3 text-sm font-bold text-red-600">
                                    ${balance.toFixed(2)}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="paymentMethod">Forma de Pago</Label>
                                <select id="paymentMethod" {...formik.getFieldProps('paymentMethod')} className={inputClass}>
                                    <option value="EFECTIVO">Efectivo</option>
                                    <option value="TRANSFERENCIA">Transferencia</option>
                                    <option value="DEPOSITO">Depósito</option>
                                    <option value="CHEQUE">Cheque</option>
                                </select>
                            </div>

                            {formik.values.paymentMethod !== 'EFECTIVO' && (
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
