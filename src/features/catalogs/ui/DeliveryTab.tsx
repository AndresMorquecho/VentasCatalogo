import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { useCreateCatalogDelivery, useValidateClientBehavior, useCatalogInventory } from '../api/hooks';
import { useBrandList } from '@/features/brands/api/hooks';
import { useClientList } from '@/features/clients/api/hooks';
import { useCreateOrder } from '@/entities/order/model/hooks';
import { useToast } from '@/shared/ui/use-toast';
import { Loader2, AlertTriangle, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { PaymentModal, type PaymentModalData } from '@/shared/ui/PaymentModal';

export function DeliveryTab() {
  const [clientId, setClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [brandId, setBrandId] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  const [campaign, setCampaign] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [type, setType] = useState<'GRATIS' | 'CON_COSTO'>('GRATIS');
  const [unitPrice, setUnitPrice] = useState('0');
  const [notes, setNotes] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { showToast } = useToast();

  const { data: brandsData } = useBrandList();
  const brands = brandsData?.data || [];

  const { data: clientsData } = useClientList();
  const clients = clientsData?.data || [];

  // Obtener inventario disponible
  const { data: inventoryData } = useCatalogInventory();
  const inventory = inventoryData?.data || [];

  const validateMutation = useValidateClientBehavior();
  const createMutation = useCreateCatalogDelivery();
  const createOrderMutation = useCreateOrder();

  // Filtrar marcas que tienen inventario
  const brandsWithInventory = useMemo(() => {
    const brandIds = new Set(inventory.map(inv => inv.brandId));
    return brands.filter(brand => brandIds.has(brand.id));
  }, [brands, inventory]);

  // Filtrar campañas disponibles para la marca seleccionada
  const availableCampaigns = useMemo(() => {
    if (!brandId) return [];
    return inventory
      .filter(inv => inv.brandId === brandId && inv.quantity > 0)
      .map(inv => inv.campaign);
  }, [brandId, inventory]);

  // Obtener stock actual de la campaña seleccionada
  const currentStock = useMemo(() => {
    if (!brandId || !campaign) return null;
    const inv = inventory.find(i => i.brandId === brandId && i.campaign === campaign);
    return inv ? inv.quantity : 0;
  }, [brandId, campaign, inventory]);

  // Calcular stock restante
  const remainingStock = useMemo(() => {
    if (currentStock === null) return null;
    const qty = Number(quantity) || 0;
    return currentStock - qty;
  }, [currentStock, quantity]);

  // Calcular precio total
  const totalPrice = useMemo(() => {
    const qty = Number(quantity) || 0;
    const price = Number(unitPrice) || 0;
    return qty * price;
  }, [quantity, unitPrice]);

  // Filtrar clientes por búsqueda
  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients;
    const search = clientSearch.toLowerCase();
    return clients.filter(client => 
      client.firstName.toLowerCase().includes(search) ||
      client.identificationNumber.includes(search)
    );
  }, [clients, clientSearch]);

  // Filtrar marcas por búsqueda
  const filteredBrands = useMemo(() => {
    if (!brandSearch) return brandsWithInventory;
    const search = brandSearch.toLowerCase();
    return brandsWithInventory.filter(brand => 
      brand.name.toLowerCase().includes(search)
    );
  }, [brandsWithInventory, brandSearch]);

  const selectedClient = clients.find(c => c.id === clientId);
  const selectedBrand = brands.find(b => b.id === brandId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId || !brandId || !campaign || !quantity) {
      showToast('Todos los campos son requeridos', 'error');
      return;
    }

    // Validar comportamiento
    try {
      const validation = await validateMutation.mutateAsync({
        client_id: clientId,
        brand_id: brandId
      });

      if (validation.warning) {
        setWarningMessage(validation.message || '');
        setShowWarning(true);
        // El flujo continuaría desde el modal de advertencia
        return;
      }

      // Si no hay warning, verificar si es CON_COSTO
      if (type === 'CON_COSTO') {
        if (totalPrice <= 0) {
          showToast('El precio total debe ser mayor a 0 para entregas con costo', 'error');
          return;
        }
        setShowPaymentModal(true);
      } else {
        await createDelivery();
      }
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Error al validar', 'error');
    }
  };

  const handlePaymentSubmit = async (paymentData: PaymentModalData) => {
    try {
      // Calcular el total de los pagos
      const totalAmount = paymentData.payments.reduce((sum, p) => sum + p.amount, 0);
      
      // Calcular precio unitario basado en el total pagado (permitir 0 para catálogos gratis)
      const unitPrice = Number(quantity) > 0 ? totalAmount / Number(quantity) : 0;
      
      // 1. Crear el pedido tipo CATALOGO
      const orderData = {
        client_id: clientId,
        client_name: selectedClient?.firstName || '',
        brand_id: brandId,
        brand_name: selectedBrand?.name || '',
        sales_channel: 'OFICINA' as const,
        type: 'CATALOGO' as const,
        payment_method: paymentData.payments[0]?.method || 'EFECTIVO',
        items: [{
          product_name: `Catálogo ${selectedBrand?.name} - ${campaign}`,
          quantity: Number(quantity),
          unit_price: unitPrice,
          brand_id: brandId,
          brand_name: selectedBrand?.name || '',
        }],
        total: totalPrice, // El total esperado
        transaction_date: new Date().toISOString(),
        possible_delivery_date: new Date().toISOString(),
        payments: paymentData.payments.map(p => ({
          amount: p.amount,
          method: p.method,
          bank_account_id: p.bankAccountId,
          reference: p.transactionReference,
          notes: p.notes
        })),
        notes: `Venta de catálogo - ${notes || ''}`
      };

      const order = await createOrderMutation.mutateAsync(orderData as any);

      // 2. Crear la entrega vinculada al pedido
      await createMutation.mutateAsync({
        client_id: clientId,
        brand_id: brandId,
        campaign,
        quantity: Number(quantity),
        type: 'CON_COSTO',
        order_id: order.id,
        notes: notes || undefined
      });

      showToast('Venta de catálogo registrada exitosamente', 'success');
      resetForm();
      setShowPaymentModal(false);
    } catch (error: any) {
      showToast(error.response?.data?.error || error.message || 'Error al registrar venta', 'error');
      throw error; // Re-throw para que PaymentModal maneje el estado de loading
    }
  };

  const resetForm = () => {
    setClientId('');
    setClientSearch('');
    setBrandId('');
    setBrandSearch('');
    setCampaign('');
    setQuantity('1');
    setType('GRATIS');
    setUnitPrice('0');
    setNotes('');
    setShowWarning(false);
    setShowPaymentModal(false);
  };

  const createDelivery = async () => {
    try {
      await createMutation.mutateAsync({
        client_id: clientId,
        brand_id: brandId,
        campaign,
        quantity: Number(quantity),
        type: 'GRATIS',
        notes: notes || undefined
      });

      showToast('Entrega registrada exitosamente', 'success');
      resetForm();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Error al registrar entrega', 'error');
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold">Registrar Entrega de Catálogo</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Cliente con búsqueda */}
              <div className="relative">
                <Label className="text-xs font-medium">Cliente</Label>
                <div className="relative">
                  <Input
                    value={selectedClient ? selectedClient.firstName : clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setClientId('');
                      setShowClientDropdown(true);
                    }}
                    onFocus={() => setShowClientDropdown(true)}
                    placeholder="Buscar cliente..."
                    className="pr-8"
                  />
                  <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
                </div>
                {showClientDropdown && filteredClients.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredClients.slice(0, 50).map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex flex-col"
                        onClick={() => {
                          setClientId(client.id);
                          setClientSearch('');
                          setShowClientDropdown(false);
                        }}
                      >
                        <span className="font-medium">{client.firstName}</span>
                        <span className="text-xs text-gray-500">{client.identificationNumber}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Marca con búsqueda */}
              <div className="relative">
                <Label className="text-xs font-medium">Marca (con inventario)</Label>
                <div className="relative">
                  <Input
                    value={selectedBrand ? selectedBrand.name : brandSearch}
                    onChange={(e) => {
                      setBrandSearch(e.target.value);
                      setBrandId('');
                      setCampaign('');
                      setShowBrandDropdown(true);
                    }}
                    onFocus={() => setShowBrandDropdown(true)}
                    placeholder="Buscar marca..."
                    className="pr-8"
                  />
                  <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
                </div>
                {showBrandDropdown && filteredBrands.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredBrands.map((brand) => (
                      <button
                        key={brand.id}
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                        onClick={() => {
                          setBrandId(brand.id);
                          setBrandSearch('');
                          setShowBrandDropdown(false);
                        }}
                      >
                        {brand.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Campaña filtrada por marca */}
              <div>
                <Label className="text-xs font-medium">Campaña (disponible)</Label>
                <select
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  disabled={!brandId}
                >
                  <option value="">Seleccionar campaña</option>
                  {availableCampaigns.map((camp) => (
                    <option key={camp} value={camp}>
                      {camp}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs font-medium">Cantidad</Label>
                <Input
                  type="number"
                  min="1"
                  max={currentStock || undefined}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
            </div>

            {/* Indicador de stock */}
            {currentStock !== null && campaign && Number(quantity) > 0 && (
              <div className="border-l-4 border-slate-300 pl-4 py-2">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-slate-600">Stock actual:</span>
                    <span className="ml-2 font-semibold text-slate-900">{currentStock} unidades</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Quedarán:</span>
                    <span className={`ml-2 font-semibold ${remainingStock !== null && remainingStock < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {remainingStock !== null ? remainingStock : 0} unidades
                    </span>
                  </div>
                </div>
                {remainingStock !== null && remainingStock < 0 && (
                  <p className="text-xs text-red-600 mt-2">⚠️ La cantidad solicitada excede el stock disponible</p>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-end gap-6 py-2">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Tipo de Entrega</Label>
                <div className="flex gap-4 items-center h-10">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="gratis"
                      value="GRATIS"
                      checked={type === 'GRATIS'}
                      onChange={(e) => setType(e.target.value as any)}
                      className="h-4 w-4 accent-emerald-600"
                    />
                    <Label htmlFor="gratis" className="text-sm cursor-pointer">Gratis</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="con_costo"
                      value="CON_COSTO"
                      checked={type === 'CON_COSTO'}
                      onChange={(e) => setType(e.target.value as any)}
                      className="h-4 w-4 accent-emerald-600"
                    />
                    <Label htmlFor="con_costo" className="text-sm cursor-pointer">Con Costo</Label>
                  </div>
                </div>
              </div>

              {type === 'CON_COSTO' && (
                <div className="flex items-end gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="w-32">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase">Precio Unitario ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      className="h-10 focus:ring-emerald-500"
                      placeholder="0.00"
                      autoFocus
                    />
                  </div>
                  <div className="flex flex-col items-end h-10 justify-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-600">Total</span>
                    <span className="text-lg font-bold text-slate-900 leading-tight">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-500">Observaciones (opcional)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales sobre la entrega"
                className="bg-slate-50/50"
              />
            </div>

            <Button type="submit" disabled={createMutation.isPending || validateMutation.isPending} className="w-full h-11 bg-primary hover:opacity-90 text-white font-bold transition-all shadow-md mt-2">
              {(createMutation.isPending || validateMutation.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Procesando Entrega...
                </>
              ) : (
                'Confirmar y Entregar Catálogo'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Modal de advertencia */}
      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Advertencia
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm">{warningMessage}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWarning(false)}>
              Cancelar
            </Button>
            <Button onClick={createDelivery} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Continuar de todas formas'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de pago compartido */}
      {showPaymentModal && selectedClient && selectedBrand && (
        <PaymentModal
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
          onSubmit={handlePaymentSubmit}
          paymentContext={{
            type: 'PEDIDO',
            clientId: clientId,
            clientName: selectedClient.firstName,
            referenceNumber: `CAT-${Date.now()}`,
            description: `Venta de catálogo ${selectedBrand.name} - ${campaign} (Total: $${totalPrice.toFixed(2)})`
          }}
          expectedAmount={totalPrice}
          allowMultiplePayments={true}
          initialAmount={totalPrice}
          lockAmount={false}
        />
      )}
    </>
  );
}
