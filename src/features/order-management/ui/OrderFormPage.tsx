import { useState, useRef, useEffect } from "react"
import { useFormik } from "formik"
import { useNavigate, useParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import * as Yup from "yup"
import { ArrowLeft, Plus, X, RotateCw, RefreshCw, Edit2, Trash2, Printer } from "lucide-react"

import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { AsyncButton } from "@/shared/ui/async-button"
import { Label } from "@/shared/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Separator } from "@/shared/ui/separator"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog"

import { useBankAccountList } from "@/features/bank-accounts/api/hooks"
import { useCreateOrder, useUpdateOrder, useOrder, useReceiptOrders } from "@/entities/order/model/hooks"
import type { SalesChannel, OrderType, PaymentMethod } from "@/entities/order/model/types"
import { getPaidAmount } from "@/entities/order/model/model"
import { orderApi } from "@/entities/order/model/api"
import { useClientList } from "@/features/clients/api/hooks"
import { useBrandList } from "@/features/brands/api/hooks"
import { getActiveBrands } from "@/entities/brand/model/model"
import { useNotifications } from "@/shared/lib/notifications"
import { pdf } from "@react-pdf/renderer"
import { OrderReceiptDocument } from "@/features/order-receipt/ui/OrderReceiptDocument"
import { useClientCredits } from "@/features/transactions/model/hooks"
import { useAuth } from "@/shared/auth"
import { useCashClosurePreview } from "@/features/cash-closure/api/hooks"

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
    const { id, receiptNumber } = useParams()
    const navigate = useNavigate()
    const isEditing = !!(id || receiptNumber)
    const queryClient = useQueryClient()

    // Caso 1: Edición por receiptNumber (carga múltiples pedidos)
    const { data: receiptOrders, isLoading: isLoadingReceiptOrders } = useReceiptOrders(receiptNumber || "")
    
    // Caso 2: Edición por ID individual (carga un solo pedido)
    const { data: order, isLoading: isLoadingOrder } = useOrder(id || "")
    
    const { data: clientsResponse } = useClientList({ limit: 1000 })
    const { data: bankAccountsResponse } = useBankAccountList({ limit: 500 })
    const { data: brandsResponse } = useBrandList({ limit: 500 })

    const clients = clientsResponse?.data || []
    const bankAccounts = bankAccountsResponse?.data || []
    const brands = brandsResponse?.data || []
    const createOrder = useCreateOrder()
    const { notifySuccess, notifyError } = useNotifications()
    const { user } = useAuth()

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoadingReceiptNumber, setIsLoadingReceiptNumber] = useState(false)
    const [isLoadingRelated, setIsLoadingRelated] = useState(false)
    
    // Estados para modal de edición individual
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [orderToEdit, setOrderToEdit] = useState<any>(null)
    
    // Estados para confirmación de eliminación
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [orderToDelete, setOrderToDelete] = useState<any>(null)
    const [lastClosureDate, setLastClosureDate] = useState<Date | null>(null)

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
                const creditAmount = Number(values.creditToUse) || 0;

                // Usar Batch Create para crear todos los pedidos en 1 sola llamada
                const batchPayload = {
                    receipt_number: values.receiptNumber,
                    client_id: values.clientId,
                    sales_channel: values.salesChannel,
                    created_at: values.createdAt,
                    payment_method: values.paymentMethod,
                    bank_account_id: values.bankAccountId,
                    transaction_date: values.transactionDate,
                    transaction_reference: values.transactionReference,
                    deposit: values.brandItems.reduce((sum, item) => sum + (Number(item.deposit) || 0), 0),
                    credit_to_use: creditAmount,
                    orders: values.brandItems.map((item) => {
                        const unitPrice = item.quantity > 0 ? item.total / item.quantity : 0;
                        return {
                            brand_id: item.brandId,
                            brand_name: item.brandName,
                            total: item.total,
                            deposit: Number(item.deposit) || 0,
                            type: item.type,
                            possible_delivery_date: item.possibleDeliveryDate,
                            order_number: item.orderNumber || "",
                            items: [{
                                product_name: item.brandName,
                                quantity: item.quantity,
                                unit_price: unitPrice
                            }]
                        };
                    })
                };

                const createdOrders = await orderApi.batchCreate(batchPayload);

                // Map orderNumbers from original form values back to the created orders
                const ordersWithNumbers = createdOrders.map((createdOrder: any, index: number) => {
                    const originalItem = values.brandItems[index];
                    return {
                        ...createdOrder,
                        orderNumber: originalItem.orderNumber // Restaurar el orderNumber
                    };
                });

                try {
                    const blob = await pdf(
                        <OrderReceiptDocument
                            order={ordersWithNumbers[0]}
                            childOrders={ordersWithNumbers.slice(1)}
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
            } catch (error: any) {
                console.error("Error saving order", error)
                notifyError(error, "Error al guardar el pedido.");
            } finally {
                setIsSubmitting(false);
            }
        }
    })

    useEffect(() => {
        if (formik.submitCount > 0 && !formik.isValid) {
            console.log('Formik Errors:', formik.errors)
            notifyError(null, "Hay campos inválidos en el formulario. Por favor revisa los datos marcados.")
        }
    }, [formik.submitCount, formik.isValid])

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

    // Función para validar si un pedido puede ser editado
    const canEditOrder = (order: any): { canEdit: boolean; reason?: string } => {
        // 1. Verificar cierre de caja
        if (lastClosureDate && order.transactionDate) {
            const transactionDate = new Date(order.transactionDate)
            if (transactionDate <= lastClosureDate) {
                return {
                    canEdit: false,
                    reason: 'No se puede editar: El periodo de caja ya está cerrado.'
                }
            }
        }

        // 2. Verificar estado del pedido
        if (order.status === 'RECIBIDO_EN_BODEGA') {
            return {
                canEdit: false,
                reason: 'No se puede editar: El pedido ya ha sido receptado en bodega.'
            }
        }
        
        if (order.status === 'ENTREGADO') {
            return {
                canEdit: false,
                reason: 'No se puede editar: El pedido ya ha sido entregado.'
            }
        }

        if (order.status && order.status !== 'POR_RECIBIR') {
            return {
                canEdit: false,
                reason: `No se puede editar: El pedido ya está en estado ${order.status}.`
            }
        }

        // 3. Verificar pagos múltiples
        if (order.payments && order.payments.length > 1) {
            return {
                canEdit: false,
                reason: 'No se puede editar: El pedido ya tiene abonos adicionales.'
            }
        }

        return { canEdit: true }
    }

    // Función para validar si un pedido puede ser eliminado
    const canDeleteOrder = (order: any): { canDelete: boolean; reason?: string } => {
        const editValidation = canEditOrder(order)
        return {
            canDelete: editValidation.canEdit,
            reason: editValidation.reason
        }
    }

    // Función para validar si se puede agregar un nuevo item
    const canAddNewItem = (): { canEdit: boolean; reason?: string } => {
        // En modo edición, validar contra la fecha de creación del recibo (createdAt)
        // En modo creación, validar contra la fecha de transacción
        const dateToCheck = isEditing && formik.values.createdAt 
            ? new Date(formik.values.createdAt)
            : formik.values.transactionDate 
                ? new Date(formik.values.transactionDate)
                : null

        if (lastClosureDate && dateToCheck) {
            if (dateToCheck <= lastClosureDate) {
                return {
                    canEdit: false,
                    reason: 'No se puede agregar: El periodo de caja ya está cerrado para la fecha de este recibo.'
                }
            }
        }
        return { canEdit: true }
    }

    // Handler para abrir modal de edición
    const handleEditOrder = (order: any) => {
        const validation = canEditOrder(order)

        if (!validation.canEdit) {
            notifyError(null, validation.reason || 'No se puede editar este pedido')
            return
        }

        setOrderToEdit(order)
        setEditModalOpen(true)
    }

    // Handler para solicitar eliminación de un pedido
    const handleDeleteOrder = (order: any) => {
        const validation = canDeleteOrder(order)

        if (!validation.canDelete) {
            notifyError(null, validation.reason || 'No se puede eliminar este pedido')
            return
        }

        setOrderToDelete(order)
        setDeleteConfirmOpen(true)
    }

    // Confirmar y ejecutar la eliminación del pedido
    const confirmDeleteOrder = async () => {
        if (!orderToDelete) return

        try {
            await orderApi.delete(orderToDelete.id)
            
            // Invalidar las queries relacionadas en lugar de recargar la página
            queryClient.invalidateQueries({ queryKey: ['orders'] })
            queryClient.invalidateQueries({ queryKey: ['order', orderToDelete.id] })
            queryClient.invalidateQueries({ queryKey: ['receiptOrders', orderToDelete.receiptNumber] })
            
            notifySuccess('Pedido eliminado correctamente.')
        } catch (error: any) {
            console.error('Error deleting order:', error)
            notifyError(error, 'Error al eliminar el pedido.')
        } finally {
            setDeleteConfirmOpen(false)
            setOrderToDelete(null)
        }
    }

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

    // Update formik when order data is loaded for editing - Load all associated items
    useEffect(() => {
        const loadAllItems = async () => {
            // Caso 1: Carga por receiptNumber (múltiples pedidos)
            if (receiptNumber && !isLoadingReceiptOrders) {
                if (receiptOrders && receiptOrders.length > 0) {
                    setIsLoadingRelated(true);
                    try {
                        const allItems = receiptOrders;
                        const firstOrder = allItems[0];

                        const parentOrderNumber = allItems.find(item => 
                            item.type === 'NORMAL' || item.type === 'PREVENTA'
                        )?.orderNumber || "";

                        formik.setValues({
                            clientId: firstOrder.clientId || "",
                            receiptNumber: firstOrder.receiptNumber || "",
                            salesChannel: (firstOrder.salesChannel as SalesChannel) || "OFICINA",
                            brandItems: allItems.map((o: any) => ({
                                id: o.id,
                                brandId: o.brandId,
                                brandName: o.brand?.name || o.brandName || "Sin marca",
                                quantity: o.items?.[0]?.quantity || 1,
                                total: Number(o.total) || 0,
                                type: o.type || "NORMAL",
                                possibleDeliveryDate: o.possibleDeliveryDate ? new Date(o.possibleDeliveryDate).toISOString().split('T')[0] : "",
                                salesChannel: o.salesChannel || "OFICINA",
                                orderNumber: o.orderNumber || (o.type === 'REPROGRAMACION' ? parentOrderNumber : ""),
                            deposit: getPaidAmount(o) || 0,
                            status: o.status,
                            payments: o.payments
                            })),
                            deposit: 0,
                            creditToUse: 0,
                            paymentMethod: (firstOrder.paymentMethod === 'CREDITO_CLIENTE' ? 'EFECTIVO' : firstOrder.paymentMethod) as PaymentMethod || "EFECTIVO",
                            bankAccountId: firstOrder.bankAccountId || "",
                            transactionDate: firstOrder.transactionDate ? new Date(firstOrder.transactionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                            transactionReference: "",
                            createdAt: firstOrder.createdAt ? new Date(firstOrder.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                            notes: firstOrder.notes || "",
                        });
                    } catch (err) {
                        console.error("Error loading receipt orders", err);
                        notifyError(null, "No se pudieron cargar todos los pedidos del recibo.");
                    } finally {
                        setIsLoadingRelated(false);
                    }
                } else if (receiptOrders !== undefined) {
                    // receiptOrders está definido pero vacío - no hay pedidos para este recibo
                    console.warn(`No se encontraron pedidos para el recibo: ${receiptNumber}`);
                    // No mostrar error aquí, dejar que el usuario vea la página vacía
                }
            }
            // Caso 2: Carga por ID individual (un solo pedido, luego busca relacionados)
            else if (order && id) {
                setIsLoadingRelated(true);
                try {
                    // Fetch all orders sharing the same receipt number
                    const related = await orderApi.getAll({ search: order.receiptNumber, limit: 100 });
                    const allItems = related.data || [order];

                    // Encontrar el orderNumber de un pedido NORMAL o PREVENTA para las reprogramaciones
                    const parentOrderNumber = allItems.find(item => 
                        item.type === 'NORMAL' || item.type === 'PREVENTA'
                    )?.orderNumber || "";

                    formik.setValues({
                        clientId: order.clientId || "",
                        receiptNumber: order.receiptNumber || "",
                        salesChannel: (order.salesChannel as SalesChannel) || "OFICINA",
                        brandItems: allItems.map((o: any) => ({
                            id: o.id,
                            brandId: o.brandId,
                            brandName: o.brand?.name || o.brandName || "Sin marca",
                            quantity: o.items?.[0]?.quantity || 1,
                            total: Number(o.total) || 0,
                            type: o.type || "NORMAL",
                            possibleDeliveryDate: o.possibleDeliveryDate ? new Date(o.possibleDeliveryDate).toISOString().split('T')[0] : "",
                            salesChannel: o.salesChannel || "OFICINA",
                            orderNumber: o.orderNumber || (o.type === 'REPROGRAMACION' ? parentOrderNumber : ""),
                            deposit: getPaidAmount(o) || 0,
                            status: o.status,
                            payments: o.payments
                        })),
                        deposit: 0,
                        creditToUse: 0,
                        paymentMethod: (order.paymentMethod === 'CREDITO_CLIENTE' ? 'EFECTIVO' : order.paymentMethod) as PaymentMethod || "EFECTIVO",
                        bankAccountId: order.bankAccountId || "",
                        transactionDate: order.transactionDate ? new Date(order.transactionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                        transactionReference: "",
                        createdAt: order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                        notes: order.notes || "",
                    });
                } catch (err) {
                    console.error("Error loading related orders", err);
                    notifyError(null, "No se pudieron cargar todos los pedidos del recibo.");
                } finally {
                    setIsLoadingRelated(false);
                }
            }
            // Caso 3: Modo creación
            else if (!isEditing) {
                generateNextReceiptNumber();
            }
        };

        loadAllItems();
    }, [order, receiptOrders, isEditing, id, receiptNumber, isLoadingReceiptOrders, isLoadingOrder]);

    const { data: creditsResponse } = useClientCredits(formik.values.clientId)
    const credits = Array.isArray(creditsResponse) ? creditsResponse : (creditsResponse as any)?.data || []
    const totalCredit = credits.reduce((sum: number, c: any) => sum + Number(c.remainingAmount || 0), 0)

    // Obtener fecha del último cierre de caja
    const { data: closurePreview } = useCashClosurePreview()
    
    useEffect(() => {
        if (closurePreview?.lastClosureDate) {
            setLastClosureDate(new Date(closurePreview.lastClosureDate))
        }
    }, [closurePreview])

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

    const handleAddItem = async () => {
        if (!currentItem.brandId) {
            notifyError(null, "Seleccione una marca");
            return;
        }
        if (currentItem.total < 0) {
            notifyError(null, "El valor no puede ser negativo");
            return;
        }

        // Validar cierre de caja
        const validation = canAddNewItem()
        if (!validation.canEdit) {
            notifyError(null, validation.reason || 'No se puede agregar')
            return
        }

        // Si estamos en modo edición, hacer POST directo del nuevo pedido
        if (isEditing) {
            try {
                setIsSubmitting(true)

                // Preparar los items a crear (puede ser múltiples si es REPROGRAMACION)
                const itemsToCreate = currentItem.type === 'REPROGRAMACION' && currentItem.quantity > 1
                    ? Array.from({ length: currentItem.quantity }).map(() => ({
                        ...currentItem,
                        quantity: 1,
                        total: Number((currentItem.total / currentItem.quantity).toFixed(2)),
                    }))
                    : [currentItem]

                // Obtener el parentOrderId del primer pedido existente
                const firstExistingOrder = formik.values.brandItems.find((item: any) => item.id)
                const parentOrderId = firstExistingOrder?.id || null

                // Obtener el nombre del cliente
                const client = clients.find(c => c.id === formik.values.clientId);
                const clientName = client ? client.firstName : "Desconocido";

                // Crear cada nuevo pedido
                for (const itemToCreate of itemsToCreate) {
                    const unitPrice = itemToCreate.quantity > 0 ? itemToCreate.total / itemToCreate.quantity : 0

                    const payload = {
                        clientId: formik.values.clientId,
                        clientName,
                        receiptNumber: formik.values.receiptNumber,
                        salesChannel: itemToCreate.salesChannel || formik.values.salesChannel,
                        type: itemToCreate.type,
                        brandId: itemToCreate.brandId,
                        brandName: itemToCreate.brandName,
                        total: itemToCreate.total,
                        possibleDeliveryDate: itemToCreate.possibleDeliveryDate,
                        notes: formik.values.notes,
                        createdAt: formik.values.createdAt,
                        items: [{
                            productName: itemToCreate.brandName,
                            quantity: itemToCreate.quantity,
                            unitPrice: unitPrice,
                            brandId: itemToCreate.brandId,
                            brandName: itemToCreate.brandName
                        }],
                        deposit: 0, // Nuevo pedido sin abono inicial
                        creditToUse: 0,
                        paymentMethod: formik.values.paymentMethod,
                        bankAccountId: formik.values.bankAccountId,
                        transactionDate: formik.values.transactionDate,
                        transactionReference: formik.values.transactionReference,
                        parentOrderId: parentOrderId || undefined,
                        orderNumber: itemToCreate.orderNumber?.trim() || undefined
                    }

                    await createOrder.mutateAsync(payload as any)
                }

                // Invalidar queries para recargar los datos
                queryClient.invalidateQueries({ queryKey: ['orders'] })
                queryClient.invalidateQueries({ queryKey: ['receiptOrders', formik.values.receiptNumber] })

                notifySuccess(`${itemsToCreate.length} pedido(s) agregado(s) correctamente.`)

                // Reset item
                setCurrentItem(prev => ({
                    ...prev,
                    brandId: "",
                    brandName: "",
                    total: 0,
                    quantity: 1,
                    orderNumber: ""
                }))
            } catch (error: any) {
                console.error('Error adding new order:', error)
                notifyError(error, 'Error al agregar el pedido.')
            } finally {
                setIsSubmitting(false)
            }
        } else {
            // Modo creación: agregar a la tabla local
            const baseId = crypto.randomUUID();
            if (currentItem.type === 'REPROGRAMACION' && currentItem.quantity > 1) {
                const newItems = Array.from({ length: currentItem.quantity }).map(() => ({
                    ...currentItem,
                    tempId: crypto.randomUUID(),
                    quantity: 1,
                    total: Number((currentItem.total / currentItem.quantity).toFixed(2)),
                    deposit: 0
                }));
                formik.setFieldValue("brandItems", [...formik.values.brandItems, ...newItems]);
            } else {
                formik.setFieldValue("brandItems", [...formik.values.brandItems, { 
                    ...currentItem, 
                    tempId: baseId,
                    deposit: 0 
                }]);
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
    }

    const removeItem = (index: number) => {
        const itemToRemove = formik.values.brandItems[index];
        
        // If it's an existing order with ID, we should probably warn or handle it differently
        // but the table already has a Delete button that calls handleDeleteOrder for those.
        // This removeItem is for local rows only.
        if (isEditing && itemToRemove.id) {
            handleDeleteOrder(itemToRemove);
            return;
        }

        const items = formik.values.brandItems.filter((_, i) => i !== index);
        formik.setFieldValue("brandItems", items);
    }

    // Función para imprimir el recibo en modo edición
    const handlePrintReceipt = async () => {
        try {
            setIsSubmitting(true)

            // Obtener todos los pedidos del recibo actual
            const allOrders = formik.values.brandItems.filter((item: any) => item.id)

            if (allOrders.length === 0) {
                notifyError(null, 'No hay pedidos para imprimir.')
                return
            }

            // Obtener el cliente
            const client = clients.find((c: any) => c.id === formik.values.clientId)

            if (!client) {
                notifyError(null, 'No se encontró información del cliente.')
                return
            }

            // Generar el PDF
            const blob = await pdf(
                <OrderReceiptDocument
                    order={allOrders[0]}
                    childOrders={allOrders.slice(1)}
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
            link.download = `Recibo_${formik.values.receiptNumber}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            notifySuccess('Recibo descargado correctamente.')
        } catch (error: any) {
            console.error('Error generating PDF:', error)
            notifyError(error, 'Error al generar el recibo.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if ((isEditing && (isLoadingOrder || isLoadingReceiptOrders)) || isLoadingRelated) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <RefreshCw className="h-10 w-10 animate-spin text-slate-800" />
                <p className="text-slate-500 font-medium animate-pulse">Cargando todos los pedidos del recibo...</p>
            </div>
        )
    }

    return (
        <form onSubmit={(e) => {
            e.preventDefault()
            console.log('Form submitted')
            console.log('Formik errors:', formik.errors)
            console.log('Formik values:', formik.values)
            console.log('Formik isValid:', formik.isValid)
            
            // Mostrar errores de validación si existen
            if (Object.keys(formik.errors).length > 0) {
                console.error('Errores de validación:', formik.errors)
                
                // Mostrar el primer error encontrado
                const firstError = Object.values(formik.errors)[0]
                if (typeof firstError === 'string') {
                    notifyError(null, firstError)
                } else if (Array.isArray(firstError)) {
                    // Errores en brandItems
                    const itemErrors = firstError.filter(e => e !== undefined)
                    if (itemErrors.length > 0) {
                        const firstItemError = itemErrors[0]
                        if (typeof firstItemError === 'object') {
                            const errorMsg = Object.values(firstItemError)[0]
                            notifyError(null, `Error en fila: ${errorMsg}`)
                        }
                    }
                }
                return
            }
            
            formik.handleSubmit(e)
        }} className="max-w-7xl mx-auto space-y-4 pb-12 px-4">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border shadow-sm">
                <div className="flex items-center gap-3">
                    <Button type="button" variant="ghost" size="icon" onClick={() => navigate('/orders')} className="h-8 w-8">
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
                            className="h-8 w-full bg-slate-900 hover:bg-black px-2 text-xs font-bold transition-all"
                        >
                            <Plus className="h-3 w-3 mr-1" /> Agregar
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
                                <th className="px-3 py-2 text-center text-xs w-20">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {formik.values.brandItems.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-8 text-center text-slate-400 italic">No hay marcas agregadas en este recibo</td>
                                </tr>
                            ) : (
                                formik.values.brandItems.map((item, idx) => {
                                    const distributedAbono = Number(item.deposit || 0);
                                    const rowSaldo = Number(item.total) - distributedAbono;

                                    return (
                                        <tr 
                                            key={item.id || item.tempId || idx} 
                                            className="hover:bg-indigo-50/20 transition-colors"
                                        >
                                            <td className="px-3 py-2 border-r text-center font-bold text-slate-400">{idx + 1}</td>
                                            <td className="px-3 py-2 border-r font-mono text-[10px] text-slate-600">
                                                {!isEditing ? (
                                                    <Input
                                                        value={item.orderNumber || ''}
                                                        onChange={(e) => {
                                                            const newItems = [...formik.values.brandItems]
                                                            newItems[idx] = { ...newItems[idx], orderNumber: e.target.value }
                                                            formik.setFieldValue('brandItems', newItems)
                                                        }}
                                                        placeholder="---"
                                                        className="h-7 text-xs font-mono px-1"
                                                    />
                                                ) : (
                                                    item.orderNumber || '---'
                                                )}
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
                                                {!isEditing ? (
                                                    <div className="flex justify-end items-center gap-1">
                                                        <span className="text-slate-400 text-xs">$</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            className="h-7 w-20 text-right font-bold border rounded px-1 focus:ring-1 focus:ring-indigo-500 outline-none text-xs"
                                                            value={item.total}
                                                            onChange={(e) => {
                                                                const newItems = [...formik.values.brandItems]
                                                                newItems[idx] = { ...newItems[idx], total: Number(e.target.value) }
                                                                formik.setFieldValue('brandItems', newItems)
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-600 font-bold">${Number(item.total).toFixed(2)}</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 border-r text-right font-medium">
                                                {!isEditing ? (
                                                    <div className="flex justify-end items-center gap-1">
                                                        <span className="text-green-600 text-xs">$</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            className="h-7 w-20 text-right text-green-600 font-bold rounded border-green-100 border focus:ring-1 focus:ring-green-500 outline-none text-xs bg-green-50/30 px-1"
                                                            value={distributedAbono}
                                                            onChange={(e) => {
                                                                const newItems = [...formik.values.brandItems]
                                                                newItems[idx] = { ...newItems[idx], deposit: Number(e.target.value) }
                                                                formik.setFieldValue('brandItems', newItems)
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className="text-green-600 font-bold">${distributedAbono.toFixed(2)}</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 border-r text-right font-bold text-slate-600">${rowSaldo.toFixed(2)}</td>
                                            <td className="px-3 py-2 border-r">
                                                {!isEditing ? (
                                                    <Input
                                                        type="date"
                                                        value={item.possibleDeliveryDate}
                                                        onChange={(e) => {
                                                            const newItems = [...formik.values.brandItems]
                                                            newItems[idx] = { ...newItems[idx], possibleDeliveryDate: e.target.value }
                                                            formik.setFieldValue('brandItems', newItems)
                                                        }}
                                                        className="h-7 text-xs px-1"
                                                    />
                                                ) : (
                                                    item.possibleDeliveryDate
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                {isEditing && item.id ? (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button 
                                                            type="button"
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => handleEditOrder(item)} 
                                                            className="h-6 w-6 text-blue-600 hover:text-blue-700"
                                                            aria-label="Editar pedido"
                                                            data-testid={`edit-order-${idx}`}
                                                        >
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button 
                                                            type="button"
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => handleDeleteOrder(item)} 
                                                            className="h-6 w-6 text-red-500 hover:text-red-700"
                                                            aria-label={`Eliminar pedido de ${item.brandName}`}
                                                            data-testid={`delete-order-${idx}`}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                ) : !isEditing ? (
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(idx)} className="h-6 w-6 text-red-500 hover:text-red-700">
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                ) : null}
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
                    {!isEditing ? (
                        <div className="p-2 border-t bg-slate-50 flex gap-2">
                            <AsyncButton
                                type="submit"
                                className="w-full bg-slate-800"
                                isLoading={isSubmitting}
                            >
                                <Plus className="h-4 w-4 mr-2" /> Guardar Recibo
                            </AsyncButton>
                        </div>
                    ) : (
                        <div className="p-2 border-t bg-slate-50 flex gap-2">
                            <AsyncButton
                                type="button"
                                onClick={handlePrintReceipt}
                                className="w-full bg-indigo-600 hover:bg-indigo-700"
                                isLoading={isSubmitting}
                            >
                                <Printer className="h-4 w-4 mr-2" /> Imprimir Recibo
                            </AsyncButton>
                        </div>
                    )}
                </Card>
            </div>

            {/* Diálogo de confirmación de eliminación */}
            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title="¿Estás seguro de eliminar este pedido?"
                confirmText="Eliminar"
                cancelText="Cancelar"
                onConfirm={confirmDeleteOrder}
                variant="destructive"
            >
                {orderToDelete && (
                    <div className="space-y-2">
                        <p>
                            Estás a punto de eliminar el pedido de <strong>{orderToDelete.brand?.name || orderToDelete.brandName}</strong>.
                        </p>
                        <p className="text-amber-600 font-medium">
                            ⚠️ Esta acción revertirá cualquier abono asociado a este pedido.
                        </p>
                        <p className="text-red-600 font-bold">
                            Esta acción no se puede deshacer.
                        </p>
                    </div>
                )}
            </ConfirmDialog>

            {/* Modal de edición de pedido individual */}
            {editModalOpen && orderToEdit && (
                <OrderEditModal
                    order={orderToEdit}
                    open={editModalOpen}
                    onOpenChange={setEditModalOpen}
                    onSuccess={() => {
                        setEditModalOpen(false)
                        setOrderToEdit(null)
                        // No recargar la página, las queries se invalidan automáticamente
                    }}
                    lastClosureDate={lastClosureDate}
                />
            )}
        </form>
    )
}

// Componente Modal de Edición Individual
interface OrderEditModalProps {
    order: any
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    lastClosureDate: Date | null
}

function OrderEditModal({ order, open, onOpenChange, onSuccess, lastClosureDate }: OrderEditModalProps) {
    const { notifySuccess, notifyError } = useNotifications()
    const updateOrder = useUpdateOrder()
    const queryClient = useQueryClient()
    const [formData, setFormData] = useState({
        total: Number(order.total) || 0,
        deposit: getPaidAmount(order) || 0,
        possibleDeliveryDate: order.possibleDeliveryDate ? new Date(order.possibleDeliveryDate).toISOString().split('T')[0] : '',
        orderNumber: order.orderNumber || ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // 1. Verificar cierre de caja antes de enviar
        if (lastClosureDate && order.transactionDate) {
            const transactionDate = new Date(order.transactionDate)
            if (transactionDate <= lastClosureDate) {
                notifyError(null, 'No se puede guardar: El periodo de caja para esta fecha ya está cerrado.')
                return
            }
        }
        
        // 2. Verificar estado del pedido
        if (order.status === 'RECIBIDO_EN_BODEGA' || order.status === 'ENTREGADO') {
            notifyError(null, `No se puede editar: El pedido ya está en estado ${order.status}.`)
            return
        }

        try {
            const quantity = order.items?.[0]?.quantity || 1
            const unitPrice = quantity > 0 ? formData.total / quantity : 0

            const payload = {
                total: formData.total,
                possibleDeliveryDate: formData.possibleDeliveryDate,
                orderNumber: formData.orderNumber,
                items: [{
                    id: order.items?.[0]?.id || crypto.randomUUID(),
                    productName: order.brand?.name || order.brandName,
                    quantity: quantity,
                    unitPrice: unitPrice,
                    brandId: order.brandId,
                    brandName: order.brand?.name || order.brandName
                }],
                deposit: formData.deposit
            }

            console.log('[OrderEditModal] Updating order:', order.id, 'with payload:', payload)
            
            await updateOrder.mutateAsync({ id: order.id, data: payload })
            
            console.log('[OrderEditModal] Update successful')
            
            // Solo invalidar la query específica del recibo, no todas
            queryClient.invalidateQueries({ queryKey: ['receiptOrders', order.receiptNumber] })
            
            notifySuccess('Pedido actualizado correctamente.')
            onSuccess()
        } catch (error: any) {
            console.error('Error updating order:', error)
            notifyError(error, 'Error al actualizar el pedido.')
        }
    }

    const saldo = formData.total - formData.deposit

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-slate-800">Editar Pedido</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                            <thead className="bg-slate-100 text-slate-600 border-b uppercase font-bold text-xs">
                                <tr>
                                    <th className="px-3 py-2 border-r text-left">Catálogo</th>
                                    <th className="px-3 py-2 border-r text-left">N° Pedido</th>
                                    <th className="px-3 py-2 border-r text-right">Valor Pedido</th>
                                    <th className="px-3 py-2 border-r text-right">Abono</th>
                                    <th className="px-3 py-2 border-r text-right">Saldo</th>
                                    <th className="px-3 py-2 text-left">Posible Entrega</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="hover:bg-indigo-50/20 transition-colors">
                                    <td className="px-3 py-2 border-r">
                                        <Input
                                            value={order.brand?.name || order.brandName}
                                            disabled
                                            className="h-8 text-xs bg-slate-50 border-none"
                                        />
                                    </td>
                                    <td className="px-3 py-2 border-r">
                                        <Input
                                            value={formData.orderNumber}
                                            onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                                            placeholder="Ej: 12345"
                                            className="h-8 text-xs font-mono"
                                        />
                                    </td>
                                    <td className="px-3 py-2 border-r text-right">
                                        <div className="flex justify-end items-center gap-1">
                                            <span className="text-slate-400 text-xs">$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="h-7 w-20 text-right font-bold border-none focus:ring-0 outline-none text-xs bg-transparent"
                                                value={formData.total}
                                                onChange={(e) => setFormData({ ...formData, total: Number(e.target.value) })}
                                                required
                                            />
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 border-r text-right">
                                        <div className="flex justify-end items-center gap-1">
                                            <span className="text-green-600 text-xs">$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="h-7 w-20 text-right text-green-600 font-bold rounded border-green-100 focus:ring-1 focus:ring-green-500 outline-none text-xs bg-green-50/30"
                                                value={formData.deposit}
                                                onChange={(e) => setFormData({ ...formData, deposit: Number(e.target.value) })}
                                                required
                                            />
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 border-r text-right">
                                        <span className={`font-bold text-xs ${saldo > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                                            ${saldo.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2">
                                        <Input
                                            type="date"
                                            value={formData.possibleDeliveryDate}
                                            onChange={(e) => setFormData({ ...formData, possibleDeliveryDate: e.target.value })}
                                            required
                                            className="h-8 text-xs"
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex gap-2 justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={updateOrder.isPending}
                            className="h-8 text-xs"
                        >
                            Cancelar
                        </Button>
                        <AsyncButton
                            type="submit"
                            isLoading={updateOrder.isPending}
                            className="bg-slate-800 h-8 text-xs"
                        >
                            Guardar Cambios
                        </AsyncButton>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
