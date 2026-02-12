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
import { Label } from "@/shared/ui/label"
import { Separator } from "@/shared/ui/separator"

import { useBankAccountList } from "@/entities/bank-account/model/hooks"
import { useCreateOrder, useUpdateOrder } from "@/entities/order/model/hooks"
import type { Order, SalesChannel, OrderType, PaymentMethod, OrderStatus } from "@/entities/order/model/types"
import { useClientList } from "@/entities/client/model/hooks"
import { useBrandList } from "@/entities/brand/model/hooks"
import { getActiveBrands } from "@/entities/brand/model/model"

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
    deposit: Yup.number().min(0, "No negativo").required("Requerido"),
    paymentMethod: Yup.string().required("La forma de pago es requerida"),
    bankAccountId: Yup.string().when("paymentMethod", {
        is: (val: string) => val === 'TRANSFERENCIA',
        then: (schema) => schema.required("Cuenta bancaria requerida"),
        otherwise: (schema) => schema.notRequired()
    }),
    transactionDate: Yup.string().when("paymentMethod", {
        is: (val: string) => val === 'TRANSFERENCIA',
        then: (schema) => schema.required("Fecha requerida"),
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

    const isEditing = !!order

    const formik = useFormik({
        initialValues: {
            clientId: order?.clientId || "",
            receiptNumber: order?.receiptNumber || "",
            salesChannel: order?.salesChannel || "OFICINA" as SalesChannel,
            type: order?.type || "NORMAL" as OrderType,
            brandId: order?.brandId || (order?.brandName ? brands.find(b => b.name === order.brandName)?.id : "") || "",
            brandName: order?.brandName || "",
            quantity: order?.items?.[0]?.quantity || 1,
            total: order?.total || 0, // Using total directly as requested
            deposit: order?.deposit || 0,
            paymentMethod: order?.paymentMethod || "EFECTIVO" as PaymentMethod,
            bankAccountId: order?.bankAccountId || "",
            transactionDate: order?.transactionDate || new Date().toISOString().split('T')[0],
            possibleDeliveryDate: order?.possibleDeliveryDate ? new Date(order.possibleDeliveryDate).toISOString().split('T')[0] : "",
            status: order?.status || "POR_RECIBIR" as OrderStatus,
        },
        validationSchema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            // const balance = Math.max(0, values.total - values.deposit)

            const client = clients.find(c => c.id === values.clientId)
            const clientName = client ? client.name : "Desconocido"

            // Infer unit price from total / quantity
            const unitPrice = values.quantity > 0 ? values.total / values.quantity : 0

            const payload = {
                ...values,
                clientName,
                // balance removed from payload as per FSD financial refactor
                unitPrice: unitPrice, // Not used in top level order but maybe useful
                items: [{
                    id: order?.items?.[0]?.id || String(Date.now()),
                    productName: values.brandName, // Using brand as product name since product desc is removed
                    quantity: values.quantity,
                    unitPrice: unitPrice,
                    brandName: values.brandName
                }]
            }

            try {
                if (isEditing && order) {
                    await updateOrder.mutateAsync({ id: order.id, data: payload })
                } else {
                    await createOrder.mutateAsync(payload)
                }
                onOpenChange(false)
                formik.resetForm()
            } catch (error) {
                console.error("Error saving order", error)
            }
        }
    })

    const balance = Math.max(0, formik.values.total - formik.values.deposit)
    const inputClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

    // Prepared options for selectors
    const clientOptions = clients.map(c => ({ id: c.id, label: c.name, subLabel: c.idCard }))
    const bankOptions = bankAccounts.map(b => ({ id: b.id, label: b.holderName || b.name, subLabel: `${b.bankName || ""} - ${b.accountNumber || ""}` }))
    const brandOptions = getActiveBrands(brands).map(b => ({ id: b.id, label: b.name, subLabel: "" }))

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Pedido" : "Nuevo Pedido"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={formik.handleSubmit} className="space-y-6 py-4">
                    {/* Fila 1: Cliente y Recibo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="clientId">Cliente (Nombre / Cédula)</Label>
                            <SearchableSelect
                                options={clientOptions}
                                value={formik.values.clientId}
                                onChange={(val) => formik.setFieldValue('clientId', val)}
                                placeholder="Buscar cliente..."
                            />
                            {formik.touched.clientId && formik.errors.clientId && (
                                <p className="text-red-500 text-xs">{formik.errors.clientId}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="receiptNumber">N° Recibo (Manual)</Label>
                            <Input id="receiptNumber" {...formik.getFieldProps('receiptNumber')} />
                            {formik.touched.receiptNumber && formik.errors.receiptNumber && (
                                <p className="text-red-500 text-xs">{formik.errors.receiptNumber}</p>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Fila 2: Detalles del Pedido */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <div className="bg-muted/10 p-4 rounded-lg border">
                        <h4 className="text-sm font-medium mb-4 text-muted-foreground">Detalle Financiero</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="space-y-2 md:col-span-2">
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
                    <div className="bg-muted/10 p-4 rounded-lg border">
                        <h4 className="text-sm font-medium mb-4 text-muted-foreground">Pago y Saldos</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="deposit">Abono</Label>
                                <div className="relative">
                                    <span className="absolute left-2 top-2.5 text-muted-foreground">$</span>
                                    <Input type="number" id="deposit" {...formik.getFieldProps('deposit')} className="pl-6" min="0" step="0.01" />
                                </div>
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
                                </select>
                            </div>

                            {formik.values.paymentMethod === 'TRANSFERENCIA' && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="bankAccountId">Cuenta (Titular)</Label>
                                        <SearchableSelect
                                            options={bankOptions}
                                            value={formik.values.bankAccountId || ""}
                                            onChange={(val) => formik.setFieldValue('bankAccountId', val)}
                                            placeholder="Buscar cuenta..."
                                        />
                                        {formik.touched.bankAccountId && formik.errors.bankAccountId && (
                                            <p className="text-red-500 text-xs">{formik.errors.bankAccountId}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="transactionDate">Fecha Transacción</Label>
                                        <Input type="date" id="transactionDate" {...formik.getFieldProps('transactionDate')} />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            {isEditing ? "Guardar Cambios" : "Crear Pedido"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
