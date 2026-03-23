import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../shared/ui/tabs';
import { Button } from '../../../shared/ui/button';
import { Input } from '../../../shared/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../shared/ui/dialog';
import { Badge } from '../../../shared/ui/badge';
import { useExchanges } from '../model/useExchanges';
import { ExchangeDetailModal } from './ExchangeDetailModal';
import { ExchangeGuide } from './ExchangeGuide';
import type { Exchange, ExchangeStatus } from '../model/types';

const STATUS_LABELS: Record<ExchangeStatus, string> = {
  RECEIVED_FROM_CLIENT: 'Pendientes',
  SENT_TO_SUPPLIER: 'Enviados',
  RECEIVED_FROM_SUPPLIER: 'Recibidos',
};

const STATUS_COLORS: Record<ExchangeStatus, string> = {
  RECEIVED_FROM_CLIENT: 'bg-yellow-100 text-yellow-800',
  SENT_TO_SUPPLIER: 'bg-blue-100 text-blue-800',
  RECEIVED_FROM_SUPPLIER: 'bg-green-100 text-green-800',
};

const TABS: ExchangeStatus[] = ['RECEIVED_FROM_CLIENT', 'SENT_TO_SUPPLIER', 'RECEIVED_FROM_SUPPLIER'];

export function ExchangesPage() {
  const [activeTab, setActiveTab] = useState<ExchangeStatus>('RECEIVED_FROM_CLIENT');
  const [search, setSearch] = useState('');
  const [selectedExchange, setSelectedExchange] = useState<Exchange | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: exchanges = [], isLoading } = useExchanges({ status: activeTab });

  const filtered = exchanges.filter(
    (ex) =>
      ex.exchangeNumber.toLowerCase().includes(search.toLowerCase()) ||
      ex.clientName.toLowerCase().includes(search.toLowerCase())
  );

  const totalDiff = (ex: Exchange) => {
    return ex.items.reduce((sum, it) => sum + (it.differenceValue ? parseFloat(it.differenceValue) : 0), 0);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-monchito-purple">Cambios de Pedidos</h1>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-monchito-purple hover:bg-monchito-purple/90 text-white"
        >
          + Nuevo cambio
        </Button>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Buscar por número o cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <Tabs value={activeTab} defaultValue={activeTab} onValueChange={(v) => setActiveTab(v as ExchangeStatus)}>
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {STATUS_LABELS[tab]}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((tab) => (
          <TabsContent key={tab} value={tab}>
            {isLoading ? (
              <p className="text-sm text-gray-500 py-8 text-center">Cargando...</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-gray-500 py-8 text-center">No hay cambios en este estado</p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Número</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Pedidos</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Diferencia total</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((ex) => {
                      const diff = totalDiff(ex);
                      return (
                        <tr
                          key={ex.id}
                          className="border-b hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedExchange(ex)}
                        >
                          <td className="px-4 py-3 font-mono font-semibold text-monchito-purple">
                            {ex.exchangeNumber}
                          </td>
                          <td className="px-4 py-3">{ex.clientName}</td>
                          <td className="px-4 py-3 text-gray-500">{ex.items.length} ítem(s)</td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                diff > 0
                                  ? 'text-red-600 font-medium'
                                  : diff < 0
                                  ? 'text-green-600 font-medium'
                                  : 'text-gray-400'
                              }
                            >
                              {diff === 0 ? '—' : diff > 0 ? `+$${diff.toFixed(2)}` : `-$${Math.abs(diff).toFixed(2)}`}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={STATUS_COLORS[ex.status as ExchangeStatus]}>
                              {STATUS_LABELS[ex.status as ExchangeStatus]}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {new Date(ex.createdAt).toLocaleDateString('es-CO')}
                          </td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <ExchangeGuide exchange={ex} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Modal detalle */}
      {selectedExchange && (
        <ExchangeDetailModal
          exchange={selectedExchange}
          open={!!selectedExchange}
          onClose={() => setSelectedExchange(null)}
        />
      )}

      {/* Modal nuevo cambio */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo cambio</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 mb-2">
            Para crear un cambio, ve al perfil del cliente y selecciona sus pedidos entregados.
          </p>
          <Button variant="outline" onClick={() => setShowForm(false)}>
            Cerrar
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
