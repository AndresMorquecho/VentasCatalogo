import * as XLSX from 'xlsx';
import type { Order } from '@/entities/order/model/types';
import { getPaidAmount, getPendingAmount, getEffectiveTotal } from '@/entities/order/model/model';

/**
 * Exports a list of orders to an Excel file.
 * Includes items within each order in a flat structure.
 */
export function exportOrdersToExcel(orders: Order[], filename: string = 'Pedidos.xlsx', filters?: { brandId?: string, clientId?: string, orderNumber?: string, type?: string }, includeChildren: boolean = true) {
  const data: any[] = [];

  orders.forEach(order => {
    // ALWAYS collect all orders in the receipt (parent + children) for metrics calculation
    const allOrdersInReceipt = [order, ...(order.childOrders || [])];
    
    // Receipt metrics (always summarized across all orders in the receipt to keep totals accurate)
    const receiptTotal = allOrdersInReceipt.reduce((sum, o) => sum + getEffectiveTotal(o), 0);
    const receiptPaid = allOrdersInReceipt.reduce((sum, o) => sum + getPaidAmount(o), 0);
    const receiptPending = allOrdersInReceipt.reduce((sum, o) => sum + getPendingAmount(o), 0);
    
    // Determine which orders to actually create rows for
    // If includeChildren is false, we ONLY generate rows for the current 'order' in the loop
    const ordersToProcess = includeChildren ? allOrdersInReceipt : [order];

    // Filter rows for the Excel based on active filters if requested
    const filteredOrders = ordersToProcess.filter(o => {
        let matches = true;
        if (filters?.brandId) {
            matches = matches && o.brandId === filters.brandId;
        }
        if (filters?.clientId) {
            matches = matches && o.clientId === filters.clientId;
        }
        if (filters?.orderNumber) {
            matches = matches && (o.orderNumber?.toLowerCase().includes(filters.orderNumber.toLowerCase()) || false);
        }
        if (filters?.type) {
            matches = matches && o.type === filters.type;
        }
        return matches;
    });

    filteredOrders.forEach(o => {
      // If the order has items, we create a row per item
      if (o.items && o.items.length > 0) {
        o.items.forEach(item => {
          data.push({
            'ID Registro': o.id.split('-')[0],
            'Fecha Registro': o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '---',
            'Origen': o.salesChannel,
            'Tipo': o.type,
            'Nro Recibo': o.receiptNumber,
            'Nro Pedido': o.orderNumber || '---',
            'Cliente': o.clientName,
            'Marca/Catálogo': o.brandName || '---',
            'Artículo': item.productName || (o.type === 'CAMBIO' ? (o.sourceDescription || o.notes || 'CAMBIO') : '---'),
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
          'Tipo': o.type,
          'Nro Recibo': o.receiptNumber,
          'Nro Pedido': o.orderNumber || '---',
          'Cliente': o.clientName,
          'Marca/Catálogo': o.brandName || '---',
          'Artículo': o.type === 'CAMBIO' ? (o.sourceDescription || o.notes || 'CAMBIO') : (o.notes || '---'),
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
    { wch: 12 }, // Tipo (New)
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

    // Apply specific number formats for money and quantities
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        // Quantities (Col 9)
        const cell_qty = worksheet[XLSX.utils.encode_cell({ r: R, c: 9 })];
        if (cell_qty) cell_qty.z = '0.00';

        // Money Columns (Cols 10 to 14)
        [10, 11, 12, 13, 14].forEach(colIdx => {
            const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: colIdx })];
            if (cell) cell.z = '"$"#,##0.00';
        });
    }
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

    // Apply Money Format (Col 6 - Monto Total)
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: 6 })];
        if (cell) cell.z = '"$"#,##0.00';
    }
  }

  XLSX.writeFile(workbook, filename);
}

/**
 * Exports reception batches (packing history) to Excel.
 */
export function exportReceptionBatchesToExcel(batches: any[], filename: string = 'Historial_Recepciones.xlsx', filters?: any) {
  const data: any[] = [];

  batches.forEach(batch => {
    const batchDate = new Date(batch.receptionDate).toLocaleDateString('es-EC');
    const batchTime = new Date(batch.receptionDate).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
    
    // Use child-level filtering if filters are provided
    let ordersToExport = (batch.orders || []);
    
    if (filters) {
        const search = filters.search?.toLowerCase();
        const brandId = filters.brandId;
        const packingNumber = filters.packingNumber?.toLowerCase();

        ordersToExport = ordersToExport.filter((order: any) => {
            let matches = true;
            
            if (search) {
                matches = matches && (
                    order.clientName?.toLowerCase().includes(search) || 
                    order.receiptNumber?.toLowerCase().includes(search) ||
                    order.invoiceNumber?.toLowerCase().includes(search)
                );
            }
            
            if (brandId && brandId !== 'ALL') {
                matches = matches && order.brandId === brandId;
            }
            
            if (packingNumber) {
                matches = matches && batch.packingNumber?.toLowerCase().includes(packingNumber);
            }
            
            if (filters.type) {
                matches = matches && order.type === filters.type;
            }
            
            return matches;
        });
    }

    ordersToExport.forEach((order: any) => {
      data.push({
        'Fecha Recepción': batchDate,
        'Hora': batchTime,
        'N° Packing': batch.packingNumber,
        'Registrado Por': batch.receivedByName || 'Sistema',
        'N° Recibo': order.receiptNumber,
        'Cliente': order.clientName,
        'Marca/Catálogo': order.brandName,
        'N° Factura': order.invoiceNumber || '---',
        'Cantidad': (order.items || []).reduce((sum: number, item: any) => sum + (item.quantity || 0), 0),
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
    { wch: 10 }, // Cantidad (New)
    { wch: 15 }, // Valor Estimado
    { wch: 15 }, // Valor Real
    { wch: 20 }, // Estado
    { wch: 30 }, // Notas Packing
  ];
  worksheet['!cols'] = wscols;

  if (data.length > 0) {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    worksheet['!autofilter'] = { ref: XLSX.utils.encode_range(range) };

    // Apply specific number formats for money and quantities
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        // Cantidad (Col 8)
        const cell_qty = worksheet[XLSX.utils.encode_cell({ r: R, c: 8 })];
        if (cell_qty) cell_qty.z = '0.00';

        // Money Columns (Cols 9 and 10 - Estimado/Real)
        [9, 10].forEach(colIdx => {
            const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: colIdx })];
            if (cell) cell.z = '"$"#,##0.00';
        });
    }
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

    // Apply Formats
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        // Original & New Cant (Cols 5 and 8)
        [5, 8].forEach(colIdx => {
            const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: colIdx })];
            if (cell) cell.z = '0.00';
        });
        // Valor Cambio (Col 12)
        const cell_val = worksheet[XLSX.utils.encode_cell({ r: R, c: 12 })];
        if (cell_val) cell_val.z = '"$"#,##0.00';
    }
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
        'Cantidad': Number(m.totalQuantity || 0),
        'Empresaria': m.clientName || '---',
        'Celular 1': m.clientPhone1 || '---',
        'Celular 2': m.clientPhone2 || '---',
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
        { wch: 10 }, // Cantidad
        { wch: 35 }, // Empresaria
        { wch: 15 }, // Celular 1
        { wch: 15 }, // Celular 2
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

        // Apply Formats (Col 7 - Cantidad, Cols 11, 14, 15, 16 - Money)
        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            // Cantidad (Col 7)
            const cell_qty = worksheet[XLSX.utils.encode_cell({ r: R, c: 7 })];
            if (cell_qty) cell_qty.z = '0.00';

            // Money Columns
            [11, 14, 15, 16].forEach(colIdx => {
                const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: colIdx })];
                if (cell) cell.z = '"$"#,##0.00';
            });
        }
    }

    XLSX.writeFile(workbook, filename);
}

/**
 * Exports delivery batches (delivery history) to Excel.
 */
export function exportDeliveryBatchesToExcel(batches: any[], filename: string = 'Historial_Entregas.xlsx', filters?: { clientId?: string, orderQuantity?: string, type?: string }) {
    const data: any[] = [];

    batches.forEach(batch => {
        const deliveryDate = batch.deliveryDate ? new Date(batch.deliveryDate).toLocaleDateString('es-EC') : '---';
        const deliveryTime = batch.deliveryDate ? new Date(batch.deliveryDate).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }) : '---';
        
        // Flatten orders within the batch with internal filtering if needed
        let ordersToExport = (batch.orders || []);
        
        if (filters?.clientId) {
            ordersToExport = ordersToExport.filter((o: any) => o.clientId === filters.clientId);
        }
        
        if (filters?.type) {
            ordersToExport = ordersToExport.filter((o: any) => o.type === filters.type);
        }

        ordersToExport.forEach((order: any) => {
            const paid = (order.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
            const total = Number(order.realInvoiceTotal || order.total || 0);
            const balance = total - paid;

            data.push({
                'Fecha Entrega': deliveryDate,
                'Hora': deliveryTime,
                'N° Entrega': batch.deliveryNumber || '---',
                'Entregado Por': batch.deliveredByName || 'Sistema',
                'N° Recibo': order.receiptNumber,
                'N° Pedido': order.orderNumber || '---',
                'Cliente': order.clientName,
                'Identificación': order.clientIdentification || '---',
                'Marca/Catálogo': order.brandName || '---',
                'Cantidad': (order.items || []).reduce((sum: number, item: any) => sum + (item.quantity || 0), 0),
                'Valor Total': total,
                'Abonado': paid,
                'Saldo Pendiente': balance,
                'Estado': order.status === 'ENTREGADO' ? 'En Entregado' : order.status,
                'Notas': batch.notes || '---'
            });
        });
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Entregas');

    // Set column widths
    const wscols = [
        { wch: 15 }, // Fecha
        { wch: 10 }, // Hora
        { wch: 15 }, // N° Entrega
        { wch: 20 }, // Entregado Por
        { wch: 15 }, // Recibo
        { wch: 15 }, // Pedido
        { wch: 30 }, // Cliente
        { wch: 15 }, // Identificacion
        { wch: 18 }, // Marca
        { wch: 10 }, // Cantidad
        { wch: 12 }, // Total
        { wch: 12 }, // Abonado
        { wch: 12 }, // Saldo
        { wch: 15 }, // Estado
        { wch: 20 }, // Notas
    ];
    worksheet['!cols'] = wscols;

    if (data.length > 0) {
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        worksheet['!autofilter'] = { ref: XLSX.utils.encode_range(range) };

        // Apply Formats (Col 9 - Cantidad, Cols 10, 11, 12 - Values)
        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            // Cantidad (Col 9)
            const cell_qty = worksheet[XLSX.utils.encode_cell({ r: R, c: 9 })];
            if (cell_qty) cell_qty.z = '0.00';

            // Money Columns
            [10, 11, 12].forEach(colIdx => {
                const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: colIdx })];
                if (cell) cell.z = '"$"#,##0.00';
            });
        }
    }

    XLSX.writeFile(workbook, filename);
}


