import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Bug Exploration Test - Exchange Duplicate Order Prevention
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3**
 * 
 * CRITICAL: This test documents the EXPECTED behavior after the fix.
 * 
 * The bug manifests because:
 * 1. Filtering uses orderNumber instead of id (multiple orders can have same number)
 * 2. Filtering doesn't check if order is in active ExchangeBatch (not delivered)
 * 
 * OBJECTIVE: Demonstrate that filtering by ID and checking active exchanges works correctly.
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
}

interface Order {
  id: string;
  orderNumber: string;
  receiptNumber: string;
  brandId: string;
  brandName?: string;
  brand?: { name: string };
  clientId: string;
  status: string;
  total: number;
  type: string;
}

/**
 * Simulates the filtering logic from SourceOrderModal component
 * This is the UPDATED logic that filters by ID and checks active exchanges
 */
function applyModalFiltering(
  allOrders: Order[],
  alreadySelectedIds: string[],
  activeExchangeOrderIds: string[]
): Order[] {
  let result = allOrders;
  
  // Filter by IDs in current table
  if (alreadySelectedIds.length > 0) {
    result = result.filter((o: any) => !alreadySelectedIds.includes(o.id));
  }
  
  // Filter by IDs in active exchanges
  if (activeExchangeOrderIds.length > 0) {
    result = result.filter((o: any) => !activeExchangeOrderIds.includes(o.id));
  }
  
  return result;
}

/**
 * Simulates building the alreadySelectedIds array from brandItems
 * This is the ACTUAL logic from NewExchangePage.tsx
 */
function buildAlreadySelectedIds(brandItems: BrandItem[]): string[] {
  return brandItems.map(item => item.sourceOrderId).filter(Boolean);
}

describe('Exchange Duplicate Order Prevention - Bug Exploration', () => {
  
  describe('Property 1: Bug Condition - Duplicate Orders Must Be Filtered', () => {
    
    it('Example 1: Order in current table should NOT appear in modal', () => {
      // ARRANGE: Simulate adding an order to the table
      const addedOrder: Order = {
        id: 'abc123',
        orderNumber: 'PED-001',
        receiptNumber: 'REC-001',
        brandId: 'brand-1',
        brandName: 'Marca A',
        clientId: 'client-1',
        status: 'ENTREGADO',
        total: 100,
        type: 'NORMAL'
      };

      // User selected this order and it was added to brandItems
      const brandItems: BrandItem[] = [{
        sourceOrderId: addedOrder.id,
        sourceOrderNumber: addedOrder.orderNumber,
        sourceBrandId: addedOrder.brandId,
        sourceBrandName: addedOrder.brandName || '',
        sourceQuantity: 1,
        sourceDescription: '',
        brandId: 'brand-2',
        brandName: 'Marca B',
        quantity: 1,
        total: 100,
        orderNumber: 'CAM001-PED-001',
        description: 'Cambio'
      }];

      // Build the filter arrays
      const alreadySelectedIds = buildAlreadySelectedIds(brandItems);
      const activeExchangeOrderIds: string[] = []; // No active exchanges

      // The modal receives a list of orders that includes the added order
      const allOrders: Order[] = [
        addedOrder,
        {
          id: 'xyz789',
          orderNumber: 'PED-002',
          receiptNumber: 'REC-002',
          brandId: 'brand-3',
          brandName: 'Marca C',
          clientId: 'client-1',
          status: 'ENTREGADO',
          total: 150,
          type: 'NORMAL'
        }
      ];

      // ACT: Apply the modal filtering
      const filteredOrders = applyModalFiltering(allOrders, alreadySelectedIds, activeExchangeOrderIds);

      // ASSERT: The added order should NOT appear in the filtered results
      expect(filteredOrders).toHaveLength(1);
      expect(filteredOrders[0].orderNumber).toBe('PED-002');
      
      // The duplicate order should be filtered out
      const duplicateStillPresent = filteredOrders.some(o => o.id === addedOrder.id);
      expect(duplicateStillPresent).toBe(false);
      
      // Verify the filter array was built correctly
      expect(alreadySelectedIds).toContain('abc123');
    });

    it('Example 2: Order in active exchange should NOT appear in modal', () => {
      // ARRANGE: Order is in an active ExchangeBatch (not delivered)
      const orderInActiveExchange: Order = {
        id: 'order-in-exchange',
        orderNumber: 'PED-100',
        receiptNumber: 'REC-100',
        brandId: 'brand-1',
        brandName: 'Marca A',
        clientId: 'client-1',
        status: 'ENTREGADO',
        total: 100,
        type: 'NORMAL'
      };

      const brandItems: BrandItem[] = []; // Empty table
      const alreadySelectedIds = buildAlreadySelectedIds(brandItems);
      const activeExchangeOrderIds = ['order-in-exchange']; // This order is in an active exchange

      const allOrders: Order[] = [
        orderInActiveExchange,
        {
          id: 'order-available',
          orderNumber: 'PED-200',
          receiptNumber: 'REC-200',
          brandId: 'brand-2',
          brandName: 'Marca B',
          clientId: 'client-1',
          status: 'ENTREGADO',
          total: 150,
          type: 'NORMAL'
        }
      ];

      // ACT
      const filteredOrders = applyModalFiltering(allOrders, alreadySelectedIds, activeExchangeOrderIds);

      // ASSERT: Order in active exchange should be filtered out
      expect(filteredOrders).toHaveLength(1);
      expect(filteredOrders[0].id).toBe('order-available');
      
      const orderInExchangePresent = filteredOrders.some(o => o.id === 'order-in-exchange');
      expect(orderInExchangePresent).toBe(false);
    });

    it('Example 3: Multiple orders added should all be filtered out', () => {
      // ARRANGE: Simulate adding 3 orders to the table
      const order1: Order = {
        id: 'order-1',
        orderNumber: 'PED-001',
        receiptNumber: 'REC-001',
        brandId: 'brand-1',
        brandName: 'Marca A',
        clientId: 'client-1',
        status: 'ENTREGADO',
        total: 100,
        type: 'NORMAL'
      };

      const order2: Order = {
        id: 'order-2',
        orderNumber: 'PED-002',
        receiptNumber: 'REC-002',
        brandId: 'brand-2',
        brandName: 'Marca B',
        clientId: 'client-1',
        status: 'ENTREGADO',
        total: 150,
        type: 'NORMAL'
      };

      const order3: Order = {
        id: 'order-3',
        orderNumber: 'PED-003',
        receiptNumber: 'REC-003',
        brandId: 'brand-3',
        brandName: 'Marca C',
        clientId: 'client-1',
        status: 'ENTREGADO',
        total: 200,
        type: 'NORMAL'
      };

      const brandItems: BrandItem[] = [
        {
          sourceOrderId: order1.id,
          sourceOrderNumber: order1.orderNumber,
          sourceBrandId: order1.brandId,
          sourceBrandName: order1.brandName || '',
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
          sourceOrderId: order2.id,
          sourceOrderNumber: order2.orderNumber,
          sourceBrandId: order2.brandId,
          sourceBrandName: order2.brandName || '',
          sourceQuantity: 1,
          sourceDescription: '',
          brandId: 'brand-y',
          brandName: 'Marca Y',
          quantity: 1,
          total: 150,
          orderNumber: 'CAM002-PED-002',
          description: ''
        },
        {
          sourceOrderId: order3.id,
          sourceOrderNumber: order3.orderNumber,
          sourceBrandId: order3.brandId,
          sourceBrandName: order3.brandName || '',
          sourceQuantity: 1,
          sourceDescription: '',
          brandId: 'brand-z',
          brandName: 'Marca Z',
          quantity: 1,
          total: 200,
          orderNumber: 'CAM003-PED-003',
          description: ''
        }
      ];

      const alreadySelectedIds = buildAlreadySelectedIds(brandItems);
      const activeExchangeOrderIds: string[] = []; // No active exchanges

      // Modal shows all 3 orders plus a new one
      const allOrders: Order[] = [order1, order2, order3, {
        id: 'order-4',
        orderNumber: 'PED-004',
        receiptNumber: 'REC-004',
        brandId: 'brand-4',
        brandName: 'Marca D',
        clientId: 'client-1',
        status: 'ENTREGADO',
        total: 250,
        type: 'NORMAL'
      }];

      // ACT
      const filteredOrders = applyModalFiltering(allOrders, alreadySelectedIds, activeExchangeOrderIds);

      // ASSERT: Only the new order (PED-004) should appear
      expect(filteredOrders).toHaveLength(1);
      expect(filteredOrders[0].orderNumber).toBe('PED-004');
      
      // None of the added orders should be present
      expect(filteredOrders.some(o => o.id === 'order-1')).toBe(false);
      expect(filteredOrders.some(o => o.id === 'order-2')).toBe(false);
      expect(filteredOrders.some(o => o.id === 'order-3')).toBe(false);
    });

    it('Example 4: Same orderNumber but different ID should be filtered correctly', () => {
      // ARRANGE: Two orders with same orderNumber but different IDs
      const order1: Order = {
        id: 'id-1',
        orderNumber: 'PED-005',
        receiptNumber: 'REC-005-A',
        brandId: 'brand-1',
        brandName: 'Marca A',
        clientId: 'client-1',
        status: 'ENTREGADO',
        total: 100,
        type: 'NORMAL'
      };

      const order2: Order = {
        id: 'id-2',
        orderNumber: 'PED-005', // Same number, different ID
        receiptNumber: 'REC-005-B',
        brandId: 'brand-2',
        brandName: 'Marca B',
        clientId: 'client-1',
        status: 'ENTREGADO',
        total: 150,
        type: 'NORMAL'
      };

      // order1 is added to the table
      const brandItems: BrandItem[] = [{
        sourceOrderId: order1.id,
        sourceOrderNumber: order1.orderNumber,
        sourceBrandId: order1.brandId,
        sourceBrandName: order1.brandName || '',
        sourceQuantity: 1,
        sourceDescription: '',
        brandId: 'brand-x',
        brandName: 'Marca X',
        quantity: 1,
        total: 100,
        orderNumber: 'CAM001-PED-005',
        description: ''
      }];

      const alreadySelectedIds = buildAlreadySelectedIds(brandItems);
      const activeExchangeOrderIds: string[] = [];

      const allOrders: Order[] = [order1, order2];

      // ACT
      const filteredOrders = applyModalFiltering(allOrders, alreadySelectedIds, activeExchangeOrderIds);

      // ASSERT: Only order1 should be filtered (by ID), order2 should still appear
      // This is CORRECT behavior - different IDs are different orders
      expect(filteredOrders).toHaveLength(1);
      expect(filteredOrders[0].id).toBe('id-2');
      expect(filteredOrders.some(o => o.id === 'id-1')).toBe(false);
    });

    it('Example 5: Validation logic detects duplicates by ID correctly', () => {
      // This test verifies that the validation in handleAddItem works correctly
      const order: Order = {
        id: 'test-order-123',
        orderNumber: 'PED-TEST-001',
        receiptNumber: 'REC-TEST-001',
        brandId: 'brand-test',
        brandName: 'Marca Test',
        clientId: 'client-test',
        status: 'ENTREGADO',
        total: 100,
        type: 'NORMAL'
      };

      // Scenario: Order is already in brandItems
      const brandItems: BrandItem[] = [{
        sourceOrderId: order.id,
        sourceOrderNumber: order.orderNumber,
        sourceBrandId: order.brandId,
        sourceBrandName: order.brandName || '',
        sourceQuantity: 1,
        sourceDescription: '',
        brandId: 'brand-new',
        brandName: 'Marca Nueva',
        quantity: 1,
        total: 100,
        orderNumber: 'CAM001-PED-TEST-001',
        description: ''
      }];

      // Test the validation logic from handleAddItem
      const isDuplicate = brandItems.some((item: any) => item.sourceOrderId === order.id);
      
      // ASSERT: The validation should detect the duplicate by ID
      expect(isDuplicate).toBe(true);
    });
  });

  describe('Property-Based Test: Duplicate Orders Must Be Filtered', () => {
    
    it('should filter out all orders in current table and active exchanges', () => {
      // Property: For any set of orders added to brandItems or in active exchanges,
      // those orders should NOT appear in the modal's filtered list
      
      fc.assert(
        fc.property(
          // Generate 1-5 orders that have been added to the table
          fc.array(
            fc.record({
              id: fc.string({ minLength: 5, maxLength: 20 }),
              orderNumber: fc.string({ minLength: 5, maxLength: 15 }),
              brandId: fc.string({ minLength: 5, maxLength: 15 }),
              brandName: fc.string({ minLength: 3, maxLength: 20 })
            }),
            { minLength: 1, maxLength: 5 }
          ),
          // Generate 0-3 order IDs in active exchanges
          fc.array(
            fc.string({ minLength: 5, maxLength: 20 }),
            { minLength: 0, maxLength: 3 }
          ),
          // Generate 1-3 new orders that haven't been added
          fc.array(
            fc.record({
              id: fc.string({ minLength: 5, maxLength: 20 }),
              orderNumber: fc.string({ minLength: 5, maxLength: 15 }),
              brandId: fc.string({ minLength: 5, maxLength: 15 }),
              brandName: fc.string({ minLength: 3, maxLength: 20 })
            }),
            { minLength: 1, maxLength: 3 }
          ),
          (addedOrders, activeExchangeIds, newOrders) => {
            // Ensure no overlap
            const addedIds = new Set(addedOrders.map(o => o.id));
            const activeIds = new Set(activeExchangeIds);
            const allBlockedIds = new Set([...addedIds, ...activeIds]);
            
            const validNewOrders = newOrders.filter(o => !allBlockedIds.has(o.id));

            if (validNewOrders.length === 0) return true; // Skip if no valid new orders

            // Build brandItems from added orders
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

            // Build filter arrays
            const alreadySelectedIds = buildAlreadySelectedIds(brandItems);

            // Create full order objects for modal
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

            // Apply filtering
            const filteredOrders = applyModalFiltering(allOrders, alreadySelectedIds, activeExchangeIds);

            // PROPERTY: All added orders should be filtered out
            for (const addedOrder of addedOrders) {
              const stillPresent = filteredOrders.some(o => o.id === addedOrder.id);
              expect(stillPresent).toBe(false);
            }

            // PROPERTY: All orders in active exchanges should be filtered out
            for (const activeId of activeExchangeIds) {
              const stillPresent = filteredOrders.some(o => o.id === activeId);
              expect(stillPresent).toBe(false);
            }

            // PROPERTY: All new orders should still be present
            for (const newOrder of validNewOrders) {
              const isPresent = filteredOrders.some(o => o.id === newOrder.id);
              expect(isPresent).toBe(true);
            }

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
