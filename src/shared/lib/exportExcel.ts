import * as XLSX from 'xlsx';
import type { Order } from '@/entities/order/model/types';
import { getPaidAmount, getPendingAmount, getEffectiveTotal } from '@/entities/order/model/model';

/**
 * Exports a list of orders to an Excel file.
 * Includes items within each order in a flat structure.
 */
export function exportOrdersToExcel(orders: Order[], filename: string = 'Pedidos.xlsx') {
  const data: any[] = [];

  orders.forEach(order => {
    // Collect all orders in the receipt (parent + children)
    const allOrders = [order, ...(order.childOrders || [])];
    
    // Receipt metrics (summarized across all orders in the receipt)
    const receiptTotal = allOrders.reduce((sum, o) => sum + getEffectiveTotal(o), 0);
    const receiptPaid = allOrders.reduce((sum, o) => sum + getPaidAmount(o), 0);
    const receiptPending = allOrders.reduce((sum, o) => sum + getPendingAmount(o), 0);
    
    allOrders.forEach(o => {
      // If the order has items, we create a row per item
      if (o.items && o.items.length > 0) {
        o.items.forEach(item => {
          data.push({
            'ID Registro': o.id.split('-')[0],
            'Fecha Registro': o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '---',
            'Origen': o.salesChannel,
            'Nro Recibo': o.receiptNumber,
            'Nro Pedido': o.orderNumber || '---',
            'Cliente': o.clientName,
            'Marca/Catálogo': o.brandName || '---',
            'Artículo': item.productName,
            'Cantidad': item.quantity,
            'Precio Unit.': item.unitPrice,
            'Subtotal Item': item.quantity * item.unitPrice,
            'Total Recibo': receiptTotal,
            'Abono Recibo': receiptPaid,
            'Saldo Recibo': receiptPending,
            'Vendedor': o.createdByName || '---',
            'Fecha Entrega': o.possibleDeliveryDate ? new Date(o.possibleDeliveryDate).toLocaleDateString() : '---',
            'Estado': o.status
          });
        });
      } else {
        // If no items, create one row for the order itself
        data.push({
          'ID Registro': o.id.split('-')[0],
          'Fecha Registro': o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '---',
          'Origen': o.salesChannel,
          'Nro Recibo': o.receiptNumber,
          'Nro Pedido': o.orderNumber || '---',
          'Cliente': o.clientName,
          'Marca/Catálogo': o.brandName || '---',
          'Artículo': '---',
          'Cantidad': 0,
          'Precio Unit.': 0,
          'Subtotal Item': 0,
          'Total Recibo': receiptTotal,
          'Abono Recibo': receiptPaid,
          'Saldo Recibo': receiptPending,
          'Vendedor': o.createdByName || '---',
          'Fecha Entrega': o.possibleDeliveryDate ? new Date(o.possibleDeliveryDate).toLocaleDateString() : '---',
          'Estado': o.status
        });
      }
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Set column widths
  const wscols = [
    { wch: 10 }, // ID
    { wch: 15 }, // Fecha Reg
    { wch: 12 }, // Origen
    { wch: 15 }, // Nro Recibo
    { wch: 15 }, // Nro Pedido
    { wch: 30 }, // Cliente
    { wch: 20 }, // Marca
    { wch: 35 }, // Artículo
    { wch: 10 }, // Cantidad
    { wch: 12 }, // Precio Unit
    { wch: 12 }, // Subtotal
    { wch: 12 }, // Total Recibo
    { wch: 12 }, // Abono
    { wch: 12 }, // Saldo
    { wch: 15 }, // Fecha Entrega
    { wch: 20 }, // Estado
  ];
  worksheet['!cols'] = wscols;

  // Add filters (SheetJS free version uses !autofilter)
  if (data.length > 0) {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    worksheet['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pedidos');

  XLSX.writeFile(workbook, filename);
}

/**
 * Exports transactions to Excel.
 */
export function exportTransactionsToExcel(cards: any[], filename: string = 'Transacciones.xlsx') {
  const data = cards.map(card => {
    // Flatten movements for easier reading
    const movementsStr = (card.movements || []).map((m: any) => 
      `${m.direction === 'IN' ? '+' : '-'}$${Number(m.amount).toFixed(2)} (${m.accountName})`
    ).join(' | ');

    return {
      'Fecha': new Date(card.date).toLocaleString(),
      'Operación': card.operationType,
      'Título': card.titleLabel || '---',
      'Referencia': card.reference || '---',
      'Cliente': card.clientName || '---',
      'Cédula/ID': card.clientDocument || '---',
      'Monto Total': Number(card.totalAmount),
      'Usuario': card.createdBy,
      'Movimientos': movementsStr,
      'Notas': card.notes || '---',
      'Extra/Validación': card.extra || '---',
      'Marcas': (card.brands || []).join(', ') || '---',
      'Órdenes/Recibos': (card.orders || []).map((o: any) => o.receiptNumber).join(', ') || '---'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transacciones');

  // Set column widths
  const wscols = [
    { wch: 20 }, // Fecha
    { wch: 15 }, // Operacion
    { wch: 20 }, // Titulo
    { wch: 15 }, // Referencia
    { wch: 25 }, // Cliente
    { wch: 15 }, // ID
    { wch: 12 }, // Monto
    { wch: 15 }, // Usuario
    { wch: 40 }, // Movimientos
    { wch: 30 }, // Notas
    { wch: 20 }, // Extra
    { wch: 20 }, // Marcas
    { wch: 20 }, // Ordenes
  ];
  worksheet['!cols'] = wscols;

  if (data.length > 0) {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    worksheet['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
  }

  XLSX.writeFile(workbook, filename);
}
