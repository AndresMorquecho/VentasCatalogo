/**
 * Portfolio Recovery Analysis - RecoveryMetricsCard Component
 * 
 * Expandable card showing brand recovery metrics.
 * Displays all key metrics and can expand to show order details.
 * 
 * Requirements: 1.1, 1.2, 1.4
 */

import { useState } from 'react';
import { Card, CardContent } from '@/shared/ui/card';
import { ChevronDown, ChevronUp, Package, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { RecoveryStatusBadge } from './RecoveryStatusBadge';
import type { BrandRecoveryMetrics } from '@/features/portfolio-recovery/types';
import { formatCurrency, formatNumber } from '@/features/portfolio-recovery/types';

interface RecoveryMetricsCardProps {
  brand: BrandRecoveryMetrics;
  isExpanded: boolean;
  onToggle: () => void;
}

/**
 * Card component displaying brand recovery metrics
 */
export function RecoveryMetricsCard({ brand, isExpanded, onToggle }: RecoveryMetricsCardProps) {
  return (
    <Card className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all">
      <CardContent className="p-4">
        {/* Main metrics row */}
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={onToggle}
        >
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-bold text-slate-900">{brand.brandName}</h3>
              <RecoveryStatusBadge 
                status={brand.recoveryStatus} 
                recoveryRate={brand.recoveryRate}
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-1">En Bodega</p>
                <p className="text-base font-bold text-slate-900">{formatCurrency(brand.totalInWarehouse)}</p>
              </div>
              
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-1">Recuperado</p>
                <p className="text-base font-bold text-green-600">{formatCurrency(brand.totalRecovered)}</p>
              </div>
              
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-1">Pendiente</p>
                <p className="text-base font-bold text-red-600">{formatCurrency(brand.totalOutstanding)}</p>
              </div>
              
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-1">Pedidos</p>
                <p className="text-base font-bold text-slate-900 flex items-center gap-1">
                  <Package className="h-4 w-4 text-slate-400" />
                  {formatNumber(brand.orderCount)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="ml-4 flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs text-slate-500 font-semibold mb-1">Días Promedio</p>
              <p className="text-base font-bold text-slate-900 flex items-center gap-1">
                <Clock className="h-4 w-4 text-slate-400" />
                {brand.avgDaysInWarehouse.toFixed(1)}
              </p>
            </div>
            
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* Expanded details */}
        {isExpanded && brand.orders && brand.orders.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <h4 className="text-sm font-bold text-slate-700 mb-3">Detalle de Pedidos</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {brand.orders.map((order) => (
                <div 
                  key={order.orderId}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{order.receiptNumber}</p>
                    <p className="text-xs text-slate-500">{order.clientName}</p>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right">
                      <p className="text-slate-500">Total</p>
                      <p className="font-bold text-slate-900">{formatCurrency(order.total)}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-slate-500">Pagado</p>
                      <p className="font-bold text-green-600">{formatCurrency(order.totalPaid)}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-slate-500">Pendiente</p>
                      <p className="font-bold text-red-600">{formatCurrency(order.outstanding)}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-slate-500">Días</p>
                      <p className="font-bold text-slate-900">{order.daysInWarehouse}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
