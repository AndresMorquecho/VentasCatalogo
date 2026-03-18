import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { useQuery } from "@tanstack/react-query";
import { walletApi, type WalletHistoryResponse, type WalletHistoryItem } from "../api/walletApi";
import { ArrowDownCircle, ArrowUpCircle, Loader2, Receipt } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
}

export function WalletHistoryModal({ isOpen, onClose, clientId, clientName }: Props) {
  const { data, isLoading } = useQuery<WalletHistoryResponse>({
    queryKey: ["wallet-history", clientId],
    queryFn: () => walletApi.getClientWalletHistory(clientId),
    enabled: isOpen && !!clientId
  });

  const history: WalletHistoryItem[] = data?.history || [];
  const currentBalance = data?.currentBalance || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-monchito-purple">
            <Receipt className="h-5 w-5" />
            Historial de Billetera Virtual - {clientName}
          </DialogTitle>
          <p className="text-sm text-slate-600">
            Saldo actual: <span className="font-mono font-bold text-emerald-600">${Number(currentBalance).toFixed(2)}</span>
          </p>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-monchito-purple" />
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
              <Receipt className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">No hay movimientos registrados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Tipo</TableHead>
                  <TableHead>Fecha/Hora</TableHead>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Catálogo</TableHead>
                  <TableHead>Atendido por</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => {
                  const isIncome = item.type === 'CREDIT_GENERATION';
                  
                  return (
                    <TableRow key={item.id} className="hover:bg-slate-50/80">
                      <TableCell>
                        {isIncome ? (
                          <div className="flex items-center justify-center">
                            <ArrowDownCircle className="h-5 w-5 text-emerald-600" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <ArrowUpCircle className="h-5 w-5 text-amber-600" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>
                          <p className="font-medium">
                            {format(new Date(item.date), "dd/MM/yyyy", { locale: es })}
                          </p>
                          <p className="text-xs text-slate-500">
                            {format(new Date(item.date), "HH:mm:ss", { locale: es })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.orderReceiptNumber ? (
                          <div>
                            <p className="font-mono font-semibold text-monchito-purple">
                              #{item.orderReceiptNumber}
                            </p>
                            {item.orderNumber && (
                              <p className="text-xs text-slate-500">
                                {item.orderNumber}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.brandName || <span className="text-slate-400">-</span>}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {item.createdBy}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 max-w-xs">
                        {item.notes || <span className="text-slate-400">-</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-mono font-semibold text-sm ${
                          isIncome ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                          {isIncome ? '+' : '-'}${item.amount.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono font-bold text-sm text-slate-800">
                          ${item.balance.toFixed(2)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
