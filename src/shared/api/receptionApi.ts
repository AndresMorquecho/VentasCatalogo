import { bankAccountApi } from '@/shared/api/bankAccountApi';
import { orderApi } from '@/entities/order/model/api';
import { receiveOrder, addPayment } from '@/entities/order/model/model';
import type { Order } from '@/entities/order/model/types';
import { transactionApi, clientCreditApi } from '@/shared/api/transactionApi';
import { inventoryApi } from '@/shared/api/inventoryApi';

export const receptionApi = {
    /**
     * Batch reception with payments.
     * Items contain both the order and the payment amount for reception.
     */
    saveBatchWithPayments: async (items: { order: Order; abonoRecepcion: number; finalTotal: number; finalInvoiceNumber: string }[]) => {
        const results = [];
        console.log(`[MockAPI] Processing batch reception with payments for ${items.length} orders...`);
        
        const allAccounts = await bankAccountApi.getAll();
        const cashAccount = allAccounts.find(b => b.type === 'CASH') || allAccounts[0];

        if (!cashAccount) {
            throw new Error("No se encontró cuenta de caja para procesar los abonos.");
        }

        for (const item of items) {
            try {
                const { order, abonoRecepcion, finalTotal, finalInvoiceNumber } = item;
                const batchRef = finalInvoiceNumber || `BATCH-${new Date().toISOString().split('T')[0]}-${Math.floor(Math.random() * 1000)}`;
                
                // 1. Receive Order with REAL values
                let updatedOrder = receiveOrder(
                    order, 
                    finalTotal, 
                    batchRef
                );

                // Update Invoice Number explicitly if provided
                if (finalInvoiceNumber) {
                    updatedOrder.invoiceNumber = finalInvoiceNumber;
                }

                // 2. Check for Automatic Credit based on Adjustment (Total decreased below Paid)
                const paid = (updatedOrder.payments || []).reduce((acc, p) => acc + p.amount, 0);
                const pending = finalTotal - paid; // Can be negative

                if (pending < -0.01) {
                    // Credit due to Adjustment
                    const creditAmount = Math.abs(pending);
                    console.log(`[MockAPI] Generating credit of ${creditAmount} for client due to invoice adjustment.`);
                    
                    // Create Transaction Record for Audit
                    const tx = await transactionApi.createTransaction({
                        amount: creditAmount,
                        type: 'AJUSTE',
                        referenceNumber: `AJUSTE-${updatedOrder.receiptNumber}-${Date.now()}`,
                        date: new Date().toISOString(),
                        clientId: updatedOrder.clientId,
                        createdBy: 'Sistema',
                        notes: `Saldo a favor generado recibo #${updatedOrder.receiptNumber}. Fac. Real: ${finalTotal} vs Pagado: ${paid}`
                    });

                    // Create Credit
                    await clientCreditApi.createCredit({
                        clientId: updatedOrder.clientId,
                        amount: creditAmount,
                        originTransactionId: tx.id
                    });

                    // Abono irrelevant here as they are already overpaid
                } else if (abonoRecepcion > 0) {
                    // 3. Process Payment
                    // Check logic for overpayment via Abono
                    let paymentAmount = abonoRecepcion;
                    let excess = 0;

                    if (abonoRecepcion > pending) {
                        excess = abonoRecepcion - pending;
                        paymentAmount = pending; // Cap payment to debt
                    }

                    if (paymentAmount > 0) {
                        const paymentResult = addPayment(updatedOrder, { amount: paymentAmount }, cashAccount);
                        updatedOrder = paymentResult.updatedOrder;
                        
                        // Register Financial Transaction for the INCOMING money
                        await transactionApi.createTransaction({
                            amount: paymentAmount,
                            type: 'EFECTIVO', // Assumed Cash for batch
                            referenceNumber: `PAGO-ABONO-${updatedOrder.receiptNumber}-${Date.now()}`,
                            date: new Date().toISOString(),
                            clientId: updatedOrder.clientId,
                            createdBy: 'Operador',
                            notes: `Abono en recepción pedido #${updatedOrder.receiptNumber}`
                        });
                        
                        // Update Bank Account Mock ref
                        await bankAccountApi.update(cashAccount.id, { currentBalance: paymentResult.updatedBankAccount.currentBalance });
                    }

                    if (excess > 0) {
                         // Excess became Credit
                         const tx = await transactionApi.createTransaction({
                            amount: excess,
                            type: 'AJUSTE',
                            referenceNumber: `EXCEDENTE-${updatedOrder.receiptNumber}-${Date.now()}`,
                            date: new Date().toISOString(),
                            clientId: updatedOrder.clientId,
                            createdBy: 'Operador',
                            notes: `Excedente abono recepción #${updatedOrder.receiptNumber}`
                        });

                        await clientCreditApi.createCredit({
                            clientId: updatedOrder.clientId,
                            amount: excess,
                            originTransactionId: tx.id
                        });
                    }
                }

                // 4. Persist Order
                await orderApi.update(updatedOrder.id, updatedOrder);
                results.push(updatedOrder);

                // 5. Inventory Traceability Integration
                // Automatically create physical entry movement
                await inventoryApi.create({
                    orderId: updatedOrder.id,
                    clientId: updatedOrder.clientId,
                    brandId: updatedOrder.brandId,
                    type: 'ENTRY',
                    createdBy: 'Operador', // Should be dynamic user
                    notes: `Ingreso automático por recepción batch. Factura: ${updatedOrder.invoiceNumber}`
                });

            } catch (error) {
                console.error(`[MockAPI] Failed to receive order ${item.order.id}:`, error);
                throw error;
            }
        }
        return results;
    },

    /**
     * Legacy simple batch (keep for compatibility if needed)
     */
    saveBatch: async (orders: Order[]) => {
        const results = [];
        console.log(`[MockAPI] Processing batch reception for ${orders.length} orders...`);
        
        for (const order of orders) {
            try {
                // Domain Logic Application:
                // For batch reception without explicit modification UI, 
                // we assume the received value matches the expected total.
                // We generate a batch reference for invoice number.
                const batchRef = `BATCH-${new Date().toISOString().split('T')[0]}-${Math.floor(Math.random() * 1000)}`;
                
                // If the order already has a realInvoiceTotal set (e.g. pre-filled), use it.
                // Otherwise default to current total.
                const finalTotal = order.realInvoiceTotal || order.total;

                const updatedOrder = receiveOrder(
                    order, 
                    finalTotal, 
                    batchRef
                );

                // Persistence
                await orderApi.update(updatedOrder.id, updatedOrder);
                results.push(updatedOrder);
            } catch (error) {
                console.error(`[MockAPI] Failed to receive order ${order.id}:`, error);
                // In real batch, we might partial fail or rollback everything.
                // Here we continue best-effort or throw.
                throw error; // Fail fast for safety
            }
        }
        return results;
    }
};
