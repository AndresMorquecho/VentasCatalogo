import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { useCatalogDeliveries } from '../api/hooks';
import { useBrandList } from '@/features/brands/api/hooks';
import { useClientList } from '@/features/clients/api/hooks';
import { Loader2 } from 'lucide-react';
import { Pagination } from '@/shared/ui/pagination';
import { Label } from '@/shared/ui/label';
import { BrandFilter, ClientFilter, FilterContainer } from '@/shared/ui/filters';

export function HistoryTab() {
  const [page, setPage] = useState(1);
  const limit = 20;
  
  // Filtros
  const [selectedBrandId, setSelectedBrandId] = useState<string | undefined>();
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>();
  const [madeOrderFilter, setMadeOrderFilter] = useState<string>(''); // '', 'SI', 'NO'

  const { data: brandsData } = useBrandList();
  const brands = brandsData?.data || [];

  const { data: clientsData } = useClientList();
  const clients = clientsData?.data || [];

  const { data: deliveriesData, isLoading } = useCatalogDeliveries({
    page,
    limit,
    brandId: selectedBrandId,
    clientId: selectedClientId
  });

  const pagination = deliveriesData?.pagination;

  // Filtrar entregas por "hizo pedido"
  const filteredDeliveries = useMemo(() => {
    if (!deliveriesData?.data) return [];
    if (!madeOrderFilter) return deliveriesData.data;
    
    return deliveriesData.data.filter(delivery => {
      if (madeOrderFilter === 'SI') return delivery.madeOrder === true;
      if (madeOrderFilter === 'NO') return delivery.madeOrder === false;
      return true;
    });
  }, [deliveriesData?.data, madeOrderFilter]);

  const handleClearFilters = () => {
    setSelectedBrandId(undefined);
    setSelectedClientId(undefined);
    setMadeOrderFilter('');
    setPage(1);
  };

  const hasActiveFilters = selectedBrandId || selectedClientId || madeOrderFilter;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold">Historial de Entregas</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Filtros */}
        <FilterContainer
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
          className="mb-4"
        >
          <ClientFilter
            clients={clients}
            value={selectedClientId}
            onChange={(id) => {
              setSelectedClientId(id);
              setPage(1);
            }}
            className="flex-1"
          />

          <BrandFilter
            brands={brands}
            value={selectedBrandId}
            onChange={(id) => {
              setSelectedBrandId(id);
              setPage(1);
            }}
            className="flex-1"
          />

          <div className="flex-1">
            <Label className="text-xs font-medium mb-1.5 block text-slate-700">
              ¿Hizo Pedido?
            </Label>
            <select
              value={madeOrderFilter}
              onChange={(e) => {
                setMadeOrderFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-monchito-purple/20 focus:outline-none transition-all"
            >
              <option value="">Todos</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
          </div>
        </FilterContainer>

        {/* Tabla */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-monchito-purple" />
          </div>
        ) : (
          <div className="flex flex-col">
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
                  {!filteredDeliveries || filteredDeliveries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                        No hay entregas registradas
                      </td>
                    </tr>
                  ) : (
                    filteredDeliveries.map((delivery) => (
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
            {pagination && pagination.totalPages > 1 && (
              <div className="border-t border-slate-100">
                <Pagination
                  currentPage={page}
                  totalPages={pagination.totalPages}
                  onPageChange={setPage}
                  totalItems={pagination.total}
                  itemsPerPage={limit}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
