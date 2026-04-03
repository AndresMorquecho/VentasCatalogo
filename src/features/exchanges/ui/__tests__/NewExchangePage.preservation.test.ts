import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Preservation Tests - Exchange Duplicate Order Prevention
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 * 
 * OBJECTIVE: Capture the CORRECT behavior of the code WITHOUT FIX for valid orders.
 * These tests document how the system SHOULD continue working after the fix.
 * 
 * EXPECTED RESULT: All tests PASS on code WITHOUT FIX (confirms baseline behavior to preserve).
 */

// Type definitions matching the actual component structure
interface BrandItem {
  sourceOrderId: string;
  sourceOrderNumber: string;
  sourceBrandId: string;
  sourceBrandName: string;
  sourceQuantity: number;
  sourceDescription: string;
  brandId: string;
  brandName: string;
  quantity: number;
  total: number;
  orderNumber: string;
  description: string;
  clientId?: string;
  clientName?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  receiptNumber: string;
  brandId: string;
  brandName?: string;
  brand?: { name: string };
  clientId: string;
  clientName?: string;
  status: string;
  total: number;
  type: string;
  items?: Array<{ quantity: number }>;
  notes?: string;
}

/**
 * Simulates the CAM prefix logic from NewExchangePage.tsx lines 1420-1434
 */
function generateCAMOrderNumber(originalOrderNumber: string): string {
  let newOrderNumber = originalOrderNumber || "";
  
  if (newOrderNumber.startsWith("CAM")) {
    // Detect exact pattern CAMXXX-
    const camMatch = newOrderNumber.match(/^CAM(\d+)-(.+)$/);
    if (camMatch) {
      const nextLevel = parseInt(camMatch[1]) + 1;
      newOrderNumber = `CAM${String(nextLevel).padStart(3, '0')}-${camMatch[2]}`;
    } else {
      // If it only has "CAM-", jump to CAM002-
      const cleanNumber = newOrderNumber.replace(/^CAM-/, "");
      newOrderNumber = `CAM002-${cleanNumber}`;
    }
  } else {
    newOrderNumber = `CAM001-${newOrderNumber}`;
  }
  
  return newOrderNumber;
}

/**
 * Simulates the item creation logic from onSelect callback (lines 1419-1447)
 */
function createBrandItemFromOrder(order: Order, clients: Array<{ id: string; firstName: string }>): Partial<BrandItem> {
  const newOrderNumber = generateCAMOrderNumber(order.orderNumber);
  
  return {
    clientId: order.clientId,
    clientName: order.clientName || clients.find(c => c.id === order.clientId)?.firstName || "",
    sourceOrderId: order.id,
    sourceOrderNumber: order.orderNumber,
    sourceBrandId: order.brandId || "",
    sourceBrandName: order.brandName || order.brand?.name || "",
    sourceQuantity: order.items?.[0]?.quantity || 1,
    sourceDescription: order.notes || "",
    orderNumber: newOrderNumber
  };
}

/**
 * Simulates the filtering logic from SourceOrderModal
 */
function applyModalFiltering(
  allOrders: Order[],
  alreadySelectedIds: string[],
  alreadySelectedNumbers: string[]
): Order[] {
  let result = allOrders;
  
  if (alreadySelectedIds.length > 0) {
    result = result.filter((o: any) => !alreadySelectedIds.includes(o.id));
  }
  
  if (alreadySelectedNumbers.length > 0) {
    result = result.filter((o: any) => !alreadySelectedNumbers.includes(o.orderNumber));
  }
  
  return result;
}

/**
 * Simulates building the alreadySelectedIds array from brandItems
 */
function buildAlreadySelectedIds(brandItems: BrandItem[]): string[] {
  return brandItems.map(item => item.sourceOrderId).filter(Boolean);
}

/**
 * Simulates building the alreadySelectedNumbers array from brandItems
 */
function buildAlreadySelectedNumbers(brandItems: BrandItem[]): string[] {
  return brandItems.map(item => item.sourceOrderNumber).filter(Boolean);
}

describe('Exchange Duplicate Order Prevention - Preservation Tests', () => {
  
  describe('Property 2: Preservation - Valid Order Selection Without Changes', () => {
    
    it('Example 1: Valid order (not in brandItems) should be added correctly', () => {
      // ARRANGE: Empty brandItems (no orders added yet)
      
      // A new order that has NOT been added
      const newOrder: Order = {
        id: 'new-order-123',
        orderNumber: 'PED-100',
        receiptNumber: 'REC-100',
        brandId: 'brand-1',
        brandName: 'Marca A',
        clientId: 'client-1',
        clientName: 'Juan Pérez',
        status: 'ENTREGADO',
        total: 150,
        type: 'NORMAL',
        items: [{ quantity: 2 }],
        notes: 'Producto en buen estado'
      };
      
      const clients = [{ id: 'client-1', firstName: 'Juan Pérez' }];
      
      // ACT: Simulate selecting this order from the modal
      const createdItem = createBrandItemFromOrder(newOrder, clients);
      
      // ASSERT: All properties should be mapped correctly
      expect(createdItem.sourceOrderId).toBe('new-order-123');
      expect(createdItem.sourceOrderNumber).toBe('PED-100');
      expect(createdItem.sourceBrandId).toBe('brand-1');
      expect(createdItem.sourceBrandName).toBe('Marca A');
      expect(createdItem.sourceQuantity).toBe(2);
      expect(createdItem.sourceDescription).toBe('Producto en buen estado');
      expect(createdItem.clientId).toBe('client-1');
      expect(createdItem.clientName).toBe('Juan Pérez');
      
      // CAM prefix should be applied
      expect(createdItem.orderNumber).toBe('CAM001-PED-100');
    });
    
    it('Example 2: CAM prefix generation works correctly for sequential orders', () => {
      // Test the CAM prefix logic
      expect(generateCAMOrderNumber('PED-001')).toBe('CAM001-PED-001');
      expect(generateCAMOrderNumber('CAM001-PED-001')).toBe('CAM002-PED-001');
      expect(generateCAMOrderNumber('CAM002-PED-001')).toBe('CAM003-PED-001');
      expect(generateCAMOrderNumber('CAM099-PED-001')).toBe('CAM100-PED-001');
      
      // Edge case: CAM- without number
      expect(generateCAMOrderNumber('CAM-PED-001')).toBe('CAM002-PED-001');
    });
    
    it('Example 3: Valid orders should appear in modal when NOT in brandItems', () => {
      // ARRANGE: brandItems has 2 orders
      const brandItems: BrandItem[] = [
        {
          sourceOrderId: 'order-1',
          sourceOrderNumber: 'PED-001',
          sourceBrandId: 'brand-1',
          sourceBrandName: 'Marca A',
          sourceQuantity: 1,
          sourceDescription: '',
          brandId: 'brand-x',
          brandName: 'Marca X',
          quantity: 1,
          total: 100,
          orderNumber: 'CAM001-PED-001',
          description: ''
        },
        {
          sourceOrderId: 'order-2',
          sourceOrderNumber: 'PED-002',
          sourceBrandId: 'brand-2',
          sourceBrandName: 'Marca B',
          sourceQuantity: 1,
          sourceDescription: '',
          brandId: 'brand-y',
          brandName: 'Marca Y',
          quantity: 1,
          total: 150,
          orderNumber: 'CAM001-PED-002',
          description: ''
        }
      ];
      
      const alreadySelectedIds = buildAlreadySelectedIds(brandItems);
      const alreadySelectedNumbers = buildAlreadySelectedNumbers(brandItems);
      
      // Modal receives 4 orders: 2 already added + 2 new
      const allOrders: Order[] = [
        {
          id: 'order-1',
          orderNumber: 'PED-001',
          receiptNumber: 'REC-001',
          brandId: 'brand-1',
          brandName: 'Marca A',
          clientId: 'client-1',
          status: 'ENTREGADO',
          total: 100,
          type: 'NORMAL'
        },
        {
          id: 'order-2',
          orderNumber: 'PED-002',
          receiptNumber: 'REC-002',
          brandId: 'brand-2',
          brandName: 'Marca B',
          clientId: 'client-1',
          status: 'ENTREGADO',
          total: 150,
          type: 'NORMAL'
        },
        {
          id: 'order-3',
          orderNumber: 'PED-003',
          receiptNumber: 'REC-003',
          brandId: 'brand-3',
          brandName: 'Marca C',
          clientId: 'client-1',
          status: 'ENTREGADO',
          total: 200,
          type: 'NORMAL'
        },
        {
          id: 'order-4',
          orderNumber: 'PED-004',
          receiptNumber: 'REC-004',
          brandId: 'brand-4',
          brandName: 'Marca D',
          clientId: 'client-1',
          status: 'ENTREGADO',
          total: 250,
          type: 'NORMAL'
        }
      ];
      
      // ACT: Apply filtering
      const filteredOrders = applyModalFiltering(allOrders, alreadySelectedIds, alreadySelectedNumbers);
      
      // ASSERT: Only the 2 new orders should appear
      expect(filteredOrders).toHaveLength(2);
      expect(filteredOrders.some(o => o.id === 'order-3')).toBe(true);
      expect(filteredOrders.some(o => o.id === 'order-4')).toBe(true);
      
      // The 2 already added orders should NOT appear
      expect(filteredOrders.some(o => o.id === 'order-1')).toBe(false);
      expect(filteredOrders.some(o => o.id === 'order-2')).toBe(false);
    });
    
    it('Example 4: Empty brandItems should show all orders in modal', () => {
      // ARRANGE: No orders added yet
      const brandItems: BrandItem[] = [];
      
      const alreadySelectedIds = buildAlreadySelectedIds(brandItems);
      const alreadySelectedNumbers = buildAlreadySelectedNumbers(brandItems);
      
      const allOrders: Order[] = [
        {
          id: 'order-1',
          orderNumber: 'PED-001',
          receiptNumber: 'REC-001',
          brandId: 'brand-1',
          brandName: 'Marca A',
          clientId: 'client-1',
          status: 'ENTREGADO',
          total: 100,
          type: 'NORMAL'
        },
        {
          id: 'order-2',
          orderNumber: 'PED-002',
          receiptNumber: 'REC-002',
          brandId: 'brand-2',
          brandName: 'Marca B',
          clientId: 'client-1',
          status: 'ENTREGADO',
          total: 150,
          type: 'NORMAL'
        }
      ];
      
      // ACT
      const filteredOrders = applyModalFiltering(allOrders, alreadySelectedIds, alreadySelectedNumbers);
      
      // ASSERT: All orders should appear (nothing to filter)
      expect(filteredOrders).toHaveLength(2);
      expect(filteredOrders).toEqual(allOrders);
    });
    
    it('Example 5: Order with missing optional fields should still be added correctly', () => {
      // ARRANGE: Order with minimal data
      const order: Order = {
        id: 'minimal-order',
        orderNumber: 'PED-MIN',
        receiptNumber: 'REC-MIN',
        brandId: 'brand-min',
        clientId: 'client-1',
        status: 'ENTREGADO',
        total: 50,
        type: 'NORMAL'
        // Missing: brandName, clientName, items, notes
      };
      
      const clients = [{ id: 'client-1', firstName: 'Cliente Test' }];
      
      // ACT
      const createdItem = createBrandItemFromOrder(order, clients);
      
      // ASSERT: Should handle missing fields gracefully
      expect(createdItem.sourceOrderId).toBe('minimal-order');
      expect(createdItem.sourceOrderNumber).toBe('PED-MIN');
      expect(createdItem.sourceBrandId).toBe('brand-min');
      expect(createdItem.sourceBrandName).toBe(''); // Empty string for missing brandName
      expect(createdItem.sourceQuantity).toBe(1); // Default to 1
      expect(createdItem.sourceDescription).toBe(''); // Empty string for missing notes
      expect(createdItem.clientName).toBe('Cliente Test'); // Looked up from clients array
      expect(createdItem.orderNumber).toBe('CAM001-PED-MIN');
    });
  });
  
  describe('Property-Based Test: Valid Order Selection Preservation', () => {
    
    it('should correctly add any valid order that is NOT in brandItems', () => {
      // Property: For any order that is NOT already in brandItems,
      // the system should add it correctly with all properties mapped
      
      fc.assert(
        fc.property(
          // Generate 0-3 existing orders in brandItems
          fc.array(
            fc.record({
              id: fc.string({ minLength: 5, maxLength: 20 }),
              orderNumber: fc.string({ minLength: 5, maxLength: 15 }),
              brandId: fc.string({ minLength: 5, maxLength: 15 }),
              brandName: fc.string({ minLength: 3, maxLength: 20 })
            }),
            { minLength: 0, maxLength: 3 }
          ),
          // Generate a new order to add
          fc.record({
            id: fc.string({ minLength: 5, maxLength: 20 }),
            orderNumber: fc.string({ minLength: 5, maxLength: 15 }),
            brandId: fc.string({ minLength: 5, maxLength: 15 }),
            brandName: fc.string({ minLength: 3, maxLength: 20 }),
            clientId: fc.string({ minLength: 5, maxLength: 15 }),
            clientName: fc.string({ minLength: 3, maxLength: 20 }),
            quantity: fc.integer({ min: 1, max: 10 }),
            notes: fc.string({ minLength: 0, maxLength: 50 })
          }),
          (existingOrders, newOrderData) => {
            // Ensure the new order is NOT in existing orders
            const existingIds = new Set(existingOrders.map(o => o.id));
            const existingNumbers = new Set(existingOrders.map(o => o.orderNumber));
            
            if (existingIds.has(newOrderData.id) || existingNumbers.has(newOrderData.orderNumber)) {
              return true; // Skip this case - we want to test NON-duplicates
            }
            
            // Build brandItems from existing orders
            const brandItems: BrandItem[] = existingOrders.map(order => ({
              sourceOrderId: order.id,
              sourceOrderNumber: order.orderNumber,
              sourceBrandId: order.brandId,
              sourceBrandName: order.brandName,
              sourceQuantity: 1,
              sourceDescription: '',
              brandId: 'exchange-brand',
              brandName: 'Exchange Brand',
              quantity: 1,
              total: 100,
              orderNumber: `CAM001-${order.orderNumber}`,
              description: ''
            }));
            
            // Create the new order object
            const newOrder: Order = {
              id: newOrderData.id,
              orderNumber: newOrderData.orderNumber,
              receiptNumber: `REC-${newOrderData.orderNumber}`,
              brandId: newOrderData.brandId,
              brandName: newOrderData.brandName,
              clientId: newOrderData.clientId,
              clientName: newOrderData.clientName,
              status: 'ENTREGADO',
              total: 100,
              type: 'NORMAL',
              items: [{ quantity: newOrderData.quantity }],
              notes: newOrderData.notes
            };
            
            const clients = [{ id: newOrderData.clientId, firstName: newOrderData.clientName }];
            
            // ACT: Create brand item from the new order
            const createdItem = createBrandItemFromOrder(newOrder, clients);
            
            // PROPERTY 1: All source properties should be mapped correctly
            expect(createdItem.sourceOrderId).toBe(newOrder.id);
            expect(createdItem.sourceOrderNumber).toBe(newOrder.orderNumber);
            expect(createdItem.sourceBrandId).toBe(newOrder.brandId);
            expect(createdItem.sourceBrandName).toBe(newOrder.brandName);
            expect(createdItem.sourceQuantity).toBe(newOrderData.quantity);
            expect(createdItem.sourceDescription).toBe(newOrderData.notes);
            expect(createdItem.clientId).toBe(newOrder.clientId);
            expect(createdItem.clientName).toBe(newOrderData.clientName);
            
            // PROPERTY 2: CAM prefix should be applied
            expect(createdItem.orderNumber).toMatch(/^CAM\d{3}-/);
            
            // PROPERTY 3: The new order should appear in modal (not filtered out)
            const alreadySelectedIds = buildAlreadySelectedIds(brandItems);
            const alreadySelectedNumbers = buildAlreadySelectedNumbers(brandItems);
            
            const allOrders = [
              ...existingOrders.map(o => ({
                id: o.id,
                orderNumber: o.orderNumber,
                receiptNumber: `REC-${o.orderNumber}`,
                brandId: o.brandId,
                brandName: o.brandName,
                clientId: 'client-1',
                status: 'ENTREGADO',
                total: 100,
                type: 'NORMAL'
              })),
              newOrder
            ];
            
            const filteredOrders = applyModalFiltering(allOrders, alreadySelectedIds, alreadySelectedNumbers);
            
            // The new order should be present in filtered results
            const newOrderInFiltered = filteredOrders.some(o => o.id === newOrder.id);
            expect(newOrderInFiltered).toBe(true);
            
            // Existing orders should NOT be present in filtered results
            for (const existingOrder of existingOrders) {
              const existingInFiltered = filteredOrders.some(o => o.id === existingOrder.id);
              expect(existingInFiltered).toBe(false);
            }
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
    
    it('should correctly filter orders based on alreadySelectedIds and alreadySelectedNumbers', () => {
      // Property: For any set of brandItems, the modal filtering should:
      // 1. Exclude all orders whose ID is in alreadySelectedIds
      // 2. Exclude all orders whose orderNumber is in alreadySelectedNumbers
      // 3. Include all other orders
      
      fc.assert(
        fc.property(
          // Generate 1-5 orders to add to brandItems
          fc.array(
            fc.record({
              id: fc.string({ minLength: 5, maxLength: 20 }),
              orderNumber: fc.string({ minLength: 5, maxLength: 15 }),
              brandId: fc.string({ minLength: 5, maxLength: 15 }),
              brandName: fc.string({ minLength: 3, maxLength: 20 })
            }),
            { minLength: 1, maxLength: 5 }
          ),
          // Generate 1-3 new orders
          fc.array(
            fc.record({
              id: fc.string({ minLength: 5, maxLength: 20 }),
              orderNumber: fc.string({ minLength: 5, maxLength: 15 }),
              brandId: fc.string({ minLength: 5, maxLength: 15 }),
              brandName: fc.string({ minLength: 3, maxLength: 20 })
            }),
            { minLength: 1, maxLength: 3 }
          ),
          (addedOrders, newOrders) => {
            // Ensure no overlap
            const addedIds = new Set(addedOrders.map(o => o.id));
            const addedNumbers = new Set(addedOrders.map(o => o.orderNumber));
            const validNewOrders = newOrders.filter(
              o => !addedIds.has(o.id) && !addedNumbers.has(o.orderNumber)
            );
            
            if (validNewOrders.length === 0) return true; // Skip if no valid new orders
            
            // Build brandItems
            const brandItems: BrandItem[] = addedOrders.map(order => ({
              sourceOrderId: order.id,
              sourceOrderNumber: order.orderNumber,
              sourceBrandId: order.brandId,
              sourceBrandName: order.brandName,
              sourceQuantity: 1,
              sourceDescription: '',
              brandId: 'exchange-brand',
              brandName: 'Exchange Brand',
              quantity: 1,
              total: 100,
              orderNumber: `CAM001-${order.orderNumber}`,
              description: ''
            }));
            
            const alreadySelectedIds = buildAlreadySelectedIds(brandItems);
            const alreadySelectedNumbers = buildAlreadySelectedNumbers(brandItems);
            
            // Create all orders for modal
            const allOrders: Order[] = [
              ...addedOrders.map(o => ({
                id: o.id,
                orderNumber: o.orderNumber,
                receiptNumber: `REC-${o.orderNumber}`,
                brandId: o.brandId,
                brandName: o.brandName,
                clientId: 'client-1',
                status: 'ENTREGADO',
                total: 100,
                type: 'NORMAL'
              })),
              ...validNewOrders.map(o => ({
                id: o.id,
                orderNumber: o.orderNumber,
                receiptNumber: `REC-${o.orderNumber}`,
                brandId: o.brandId,
                brandName: o.brandName,
                clientId: 'client-1',
                status: 'ENTREGADO',
                total: 100,
                type: 'NORMAL'
              }))
            ];
            
            // ACT: Apply filtering
            const filteredOrders = applyModalFiltering(allOrders, alreadySelectedIds, alreadySelectedNumbers);
            
            // PROPERTY 1: All added orders should be filtered out
            for (const addedOrder of addedOrders) {
              const stillPresent = filteredOrders.some(o => 
                o.id === addedOrder.id || o.orderNumber === addedOrder.orderNumber
              );
              expect(stillPresent).toBe(false);
            }
            
            // PROPERTY 2: All new orders should still be present
            for (const newOrder of validNewOrders) {
              const isPresent = filteredOrders.some(o => 
                o.id === newOrder.id && o.orderNumber === newOrder.orderNumber
              );
              expect(isPresent).toBe(true);
            }
            
            // PROPERTY 3: Filtered orders count should equal new orders count
            expect(filteredOrders.length).toBe(validNewOrders.length);
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
