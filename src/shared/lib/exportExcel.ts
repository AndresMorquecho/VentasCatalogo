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
            'N° Packing': (o as any).packingNumber || '---',
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
          'N° Packing': (o as any).packingNumber || '---',
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
    { wch: 15 }, // N° Packing
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

/**
 * Exports reception batches (packing history) to Excel.
 */
export function exportReceptionBatchesToExcel(batches: any[], filename: string = 'Historial_Recepciones.xlsx') {
  const data: any[] = [];

  batches.forEach(batch => {
    const batchDate = new Date(batch.receptionDate).toLocaleDateString('es-EC');
    const batchTime = new Date(batch.receptionDate).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
    
    (batch.orders || []).forEach((order: any) => {
      data.push({
        'Fecha Recepción': batchDate,
        'Hora': batchTime,
        'N° Packing': batch.packingNumber,
        'Registrado Por': batch.receivedByName || 'Sistema',
        'N° Recibo': order.receiptNumber,
        'Cliente': order.clientName,
        'Marca/Catálogo': order.brandName,
        'N° Factura': order.invoiceNumber || '---',
        'Valor Estimado': Number(order.total),
        'Valor Real': Number(order.realInvoiceTotal || order.total),
        'Estado': order.status === 'RECIBIDO_EN_BODEGA' ? 'En Bodega' : order.status === 'ENTREGADO' ? 'Entregado' : order.status,
        'Notas Packing': batch.notes || '---'
      });
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Set column widths
  const wscols = [
    { wch: 15 }, // Fecha
    { wch: 10 }, // Hora
    { wch: 15 }, // N° Packing
    { wch: 20 }, // Registrado Por
    { wch: 15 }, // N° Recibo
    { wch: 30 }, // Cliente
    { wch: 20 }, // Marca
    { wch: 15 }, // N° Factura
    { wch: 15 }, // Valor Estimado
    { wch: 15 }, // Valor Real
    { wch: 20 }, // Estado
    { wch: 30 }, // Notas Packing
  ];
  worksheet['!cols'] = wscols;

  if (data.length > 0) {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    worksheet['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Recepciones');

  XLSX.writeFile(workbook, filename);
}

/**
 * Specialized parser for exchange notes to extract original and replacement details.
 */
const parseExchangeNotesDetailed = (notes: string) => {
    const regex = /CAMBIO DE \[([^\s]+)\s+(.*?)\s*x(\d+):\s*([\s\S]*?)\]\s*POR\s*\[(.*?)\s*x(\d+):\s*([\s\S]*?)\]/i;
    const match = notes?.match(regex);
    if (match) {
        return {
            originalOrder: match[1],
            originalBrand: match[2],
            originalQty: match[3],
            originalDesc: match[4],
            newBrand: match[5],
            newQty: match[6],
            newDesc: match[7]
        };
    }
    return {
        originalOrder: 'N/A',
        originalBrand: 'N/A',
        originalQty: '-',
        originalDesc: notes || 'Sin detalles',
        newBrand: 'N/A',
        newQty: '-',
        newDesc: 'Sin detalles'
    };
};

/**
 * Exports exchanges to Excel with specialized columns.
 */
export function exportExchangesToExcel(exchanges: Order[], filename: string = 'Historial_Cambios.xlsx') {
  const data: any[] = [];

  exchanges.forEach(order => {
    const parsed = parseExchangeNotesDetailed(order.notes || '');
    
    data.push({
      'Fecha Registro': order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-EC') : '---',
      'N° Guía / Recibo': order.receiptNumber,
      'Cliente': order.clientName,
      'Estado': order.status === 'POR_RECIBIR' ? 'Enviado' : order.status === 'RECIBIDO_EN_BODEGA' ? 'En Bodega' : order.status === 'ENTREGADO' ? 'Entregado' : order.status,
      
      // Original Info
      'Original - N° Pedido': parsed.originalOrder,
      'Original - Cant': parsed.originalQty,
      'Original - Catálogo': parsed.originalBrand,
      'Original - Descripción': parsed.originalDesc,
      
      // Replacement Info
      'Cambio - Cant': parsed.newQty,
      'Cambio - Catálogo': parsed.newBrand,
      'Cambio - Descripción': parsed.newDesc,
      'Cambio - Pedido por': order.salesChannel || 'N/A',
      
      'Valor Cambio': Number(order.total || 0),
      'Fecha Recepción': order.receptionDate ? new Date(order.receptionDate).toLocaleDateString('es-EC') : '---',
      'Fecha Entrega': order.possibleDeliveryDate ? new Date(order.possibleDeliveryDate).toLocaleDateString('es-EC') : '---',
      'Usuario': order.createdByName || '---'
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Set column widths
  const wscols = [
    { wch: 15 }, // Fecha Reg
    { wch: 15 }, // Guia
    { wch: 30 }, // Cliente
    { wch: 15 }, // Estado
    { wch: 15 }, // Original Pedido
    { wch: 8 },  // Original Cant
    { wch: 15 }, // Original Cat
    { wch: 30 }, // Original Desc
    { wch: 8 },  // Cambio Cant
    { wch: 15 }, // Cambio Cat
    { wch: 30 }, // Cambio Desc
    { wch: 15 }, // Pedido por
    { wch: 12 }, // Valor
    { wch: 15 }, // F. Rec
    { wch: 15 }, // F. Ent
    { wch: 15 }, // Usuario
  ];
  worksheet['!cols'] = wscols;

  if (data.length > 0) {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    worksheet['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Cambios');

  XLSX.writeFile(workbook, filename);
}

/**
 * Exports inventory movements (grouped by order) to Excel.
 */
export function exportInventoryToExcel(movements: any[], filename: string = 'Inventario_Pedidos.xlsx') {
    const data = movements.map((m, index) => ({
        'N°': index + 1,
        'No. de Recibo': m.receiptNumber,
        'Emisión': m.emissionDate ? new Date(m.emissionDate).toLocaleDateString('es-EC') : '---',
        'Ingresado Por': m.createdByName || '---',
        'N° de Pedido': m.orderNumber || '---',
        'Tipo': m.orderType || '---',
        'Catálogo': m.brandName || '---',
        'Empresaria': m.clientName || '---',
        'Valor Pedido': Number(m.orderTotal || 0),
        'Posible Entrega': m.possibleDeliveryDate ? new Date(m.possibleDeliveryDate).toLocaleDateString('es-EC') : '---',
        'No. Factura': m.invoiceNumber || '---',
        'Valor de Factura': Number(m.invoiceTotal || 0),
        'Abono': Number(m.abono || 0),
        'Saldo': Number(m.saldo || 0),
        'Fecha de Ingreso': m.entryDate ? new Date(m.entryDate).toLocaleDateString('es-EC') : '---',
        'Recibido': (m.status === 'ENTRY' || m.status === 'DELIVERED') ? 'SI' : 'NO',
        'Fecha de Entrega': m.deliveryDate ? new Date(m.deliveryDate).toLocaleDateString('es-EC') : '---',
        'Entregado': m.status === 'DELIVERED' ? 'SI' : 'NO',
        'Recibo de Entrega': m.deliveryReceipt || '---'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');

    // Set column widths
    const wscols = [
        { wch: 6 },  // N°
        { wch: 15 }, // Recibo
        { wch: 12 }, // Emision
        { wch: 20 }, // Ingresado Por
        { wch: 15 }, // Pedido
        { wch: 15 }, // Tipo
        { wch: 18 }, // Catalogo
        { wch: 35 }, // Empresaria
        { wch: 15 }, // Valor P
        { wch: 15 }, // Posible E
        { wch: 15 }, // No. Fact
        { wch: 15 }, // Valor F
        { wch: 12 }, // Abono
        { wch: 12 }, // Saldo
        { wch: 15 }, // F. Ingreso
        { wch: 10 }, // Recibido
        { wch: 15 }, // F. Entrega
        { wch: 10 }, // Entregado
        { wch: 20 }, // Recibo E
    ];
    worksheet['!cols'] = wscols;

    if (data.length > 0) {
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        worksheet['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
    }

    XLSX.writeFile(workbook, filename);
}

