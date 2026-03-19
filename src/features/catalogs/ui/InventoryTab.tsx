import { useState } from 'react';
import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { useCatalogInventory, useCreateCatalogInventory } from '../api/hooks';
import { useBrandList } from '@/features/brands/api/hooks';
import { useToast } from '@/shared/ui/use-toast';
import { Loader2, Package, Filter, RotateCw } from 'lucide-react';

export function InventoryTab() {
  const [brandId, setBrandId] = useState('');
  const [campaign, setCampaign] = useState('');
  const [quantity, setQuantity] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterCampaign, setFilterCampaign] = useState('');

  const { showToast } = useToast();

  const { data: brandsData } = useBrandList();
  const brands = brandsData?.data || [];

  const { data: inventoryData, isLoading } = useCatalogInventory({
    brand_id: filterBrand || undefined,
    campaign: filterCampaign || undefined
  });

  const createMutation = useCreateCatalogInventory();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!brandId || !campaign || !quantity) {
      showToast('Todos los campos son requeridos', 'error');
      return;
    }

    try {
      await createMutation.mutateAsync({
        brand_id: brandId,
        campaign,
        quantity: Number(quantity)
      });

      showToast('Inventario registrado exitosamente', 'success');
      setBrandId('');
      setCampaign('');
      setQuantity('');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Error al registrar inventario', 'error');
    }
  };

  const resetFilters = () => {
    setFilterBrand('');
    setFilterCampaign('');
  };

  return (
    <div className="space-y-3">
      {/* Formulario de ingreso */}
      <Card className="border-monchito-purple/20 bg-monchito-purple/5">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-5 w-5 text-monchito-purple" />
            <h3 className="text-sm font-bold text-monchito-purple">Registrar Ingreso de Catálogos</h3>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-4 gap-3">
            <div>
              <Label className="text-xs font-medium">Marca</Label>
              <Select value={brandId} onValueChange={setBrandId}>
                <SelectTrigger className="h-10 bg-white">
                  <SelectValue placeholder="Seleccionar marca" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium">Campaña</Label>
              <Input
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                placeholder="Ej: Campaña 1"
                className="h-10 bg-white"
              />
            </div>

            <div>
              <Label className="text-xs font-medium">Cantidad</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                className="h-10 bg-white"
              />
            </div>

            <div className="flex items-end">
              <Button type="submit" disabled={createMutation.isPending} className="w-full h-10 bg-monchito-purple hover:bg-monchito-purple/90">
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Registrar'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card className="border-slate-200 bg-slate-50/30">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-4 w-4 text-slate-600" />
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Filtros</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs font-medium">Filtrar por Marca</Label>
              <Select value={filterBrand} onValueChange={setFilterBrand}>
                <SelectTrigger className="h-10 bg-white">
                  <SelectValue placeholder="Todas las marcas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las marcas</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium">Filtrar por Campaña</Label>
              <Input
                value={filterCampaign}
                onChange={(e) => setFilterCampaign(e.target.value)}
                placeholder="Todas las campañas"
                className="h-10 bg-white"
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="w-full h-10 text-[10px] uppercase font-bold tracking-wider hover:bg-red-50 hover:text-red-600"
              >
                <RotateCw className="h-3 w-3 mr-1.5" />
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de stock */}
      <Card>
        <CardContent className="p-0">
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
                      Marca
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Campaña
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Última Actualización
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventoryData?.data.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                        No hay inventario registrado
                      </td>
                    </tr>
                  ) : (
                    inventoryData?.data.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                          {inv.brandName || inv.brandId}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {inv.campaign}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            {inv.quantity} unidades
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {new Date(inv.updatedAt).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
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
    </div>
  );
}
