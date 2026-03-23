import { Button } from '../../../shared/ui/button';
import type { Exchange } from '../model/types';

interface Props {
  exchange: Exchange;
}

export function ExchangeGuide({ exchange }: Props) {
  const canPrint =
    exchange.status === 'SENT_TO_SUPPLIER' || exchange.status === 'RECEIVED_FROM_SUPPLIER';

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Botón visible en pantalla */}
      <Button
        onClick={handlePrint}
        disabled={!canPrint}
        variant="outline"
        size="sm"
        title={!canPrint ? 'Solo disponible cuando el cambio está enviado o recibido' : undefined}
      >
        Generar guía
      </Button>

      {/* Contenido de impresión — solo visible al imprimir */}
      <div className="hidden print:block p-8 font-sans text-sm">
        <div className="border-b pb-4 mb-4">
          <h1 className="text-2xl font-bold">Guía de Cambio</h1>
          <p className="text-gray-600">Generada el {new Date().toLocaleDateString('es-CO')}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="font-semibold text-gray-500 text-xs uppercase">Número de cambio</p>
            <p className="text-xl font-bold">{exchange.exchangeNumber}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-500 text-xs uppercase">Cliente</p>
            <p className="text-lg font-medium">{exchange.clientName}</p>
          </div>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-gray-800">
              <th className="text-left py-2 pr-4">Pedido original</th>
              <th className="text-left py-2 pr-4">Producto</th>
              <th className="text-right py-2">Valor original</th>
            </tr>
          </thead>
          <tbody>
            {exchange.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="py-2 pr-4 font-mono text-xs">{item.originalOrderId.slice(0, 8)}...</td>
                <td className="py-2 pr-4">{item.productName}</td>
                <td className="py-2 text-right">${parseFloat(item.originalValue).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-8 pt-4 border-t text-xs text-gray-400">
          <p>Cambio #{exchange.exchangeNumber} — {exchange.clientName}</p>
        </div>
      </div>
    </>
  );
}
