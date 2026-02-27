// Application Layer - Financial Record Service
// Simplified to use unified FinancialRecord entity

import { financialRecordApi } from '@/entities/financial-record/model/api';
import {
  createPaymentRecord,
  createAdjustmentRecord as createAdjustmentModel,
  createManualRecord
} from '@/entities/financial-record/model/model';
import type { FinancialRecord } from '@/entities/financial-record/model/types';

/**
 * Financial Record Service
 * 
 * Handles creation of financial records for various operations.
 * Uses unified FinancialRecord entity (replaces FinancialTransaction + FinancialMovement)
 * 
 * TODO: When backend is ready, this will call backend endpoints directly
 */
export const financialRecordService = {
  /**
   * Create record for order payment
   */
  async createOrderPaymentRecord(
    orderId: string,
    orderReceiptNumber: string,
    amount: number,
    clientId: string,
    clientName: string,
    paymentMethod: 'EFECTIVO' | 'TRANSFERENCIA' | 'DEPOSITO' | 'CHEQUE' | 'CREDITO_CLIENTE',
    bankAccountId: string,
    createdBy: string,
    notes?: string,
    referenceNumber?: string
  ): Promise<FinancialRecord> {
    const record = createPaymentRecord(
      orderId,
      orderReceiptNumber,
      amount,
      clientId,
      clientName,
      paymentMethod,
      bankAccountId,
      createdBy,
      notes,
      referenceNumber
    );

    return financialRecordApi.create(record);
  },

  /**
   * Create record for adjustment (credit generation)
   */
  async createAdjustmentRecord(
    orderId: string,
    orderReceiptNumber: string,
    amount: number,
    clientId: string,
    clientName: string,
    bankAccountId: string,
    reason: string,
    createdBy: string
  ): Promise<FinancialRecord> {
    const record = createAdjustmentModel(
      orderId,
      orderReceiptNumber,
      amount,
      clientId,
      clientName,
      bankAccountId,
      reason,
      createdBy
    );

    return financialRecordApi.create(record);
  },

  /**
   * Create manual financial record
   */
  async createManualRecord(
    amount: number,
    clientId: string,
    clientName: string,
    bankAccountId: string,
    paymentMethod: 'EFECTIVO' | 'TRANSFERENCIA' | 'DEPOSITO' | 'CHEQUE' | 'CREDITO_CLIENTE',
    createdBy: string,
    notes: string,
    isExpense: boolean = false
  ): Promise<FinancialRecord> {
    const record = createManualRecord(
      amount,
      clientId,
      clientName,
      bankAccountId,
      paymentMethod,
      createdBy,
      notes,
      isExpense ? 'EXPENSE' : 'INCOME'
    );

    return financialRecordApi.create(record);
  }
};
