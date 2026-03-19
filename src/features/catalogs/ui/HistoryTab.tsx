import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { useCatalogDeliveries } from '../api/hooks';
import { Loader2 } from 'lucide-react';

export function HistoryTab() {
  const { data: deliveriesData, isLoading } = useCatalogDeliveries();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold">Historial de Entregas</CardTitle>
      </CardHeader>
      <CardContent className="p-0 pt-0">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-monchito-purple" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Marca
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Campaña
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Fecha Entrega
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    ¿Hizo Pedido?
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Último Pedido
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveriesData?.data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                      No hay entregas registradas
                    </td>
                  </tr>
                ) : (
                  deliveriesData?.data.map((delivery) => (
                    <tr key={delivery.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                        {delivery.clientName || delivery.clientId}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {delivery.brandName || delivery.brandId}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {delivery.campaign}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(delivery.deliveredAt).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          delivery.type === 'GRATIS' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-monchito-purple/10 text-monchito-purple'
                        }`}>
                          {delivery.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {delivery.madeOrder ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            SÍ
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                            NO
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {delivery.lastOrderDate
                          ? new Date(delivery.lastOrderDate).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })
                          : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
