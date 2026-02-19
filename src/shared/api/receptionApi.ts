import { receptionService } from '@/application/order/reception.service';

/**
 * Reception API - Transport Layer
 * 
 * This file now delegates to application/order/reception.service.ts
 * which contains the transactional logic.
 * 
 * When backend is ready, replace service calls with HTTP calls.
 */
export const receptionApi = {
    saveBatchWithPayments: receptionService.saveBatchWithPayments,
    saveBatch: receptionService.saveBatch
};
