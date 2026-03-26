import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

interface Brand {
  id: string;
  name: string;
}

interface BrandFilterProps {
  brands: Brand[];
  value?: string;
  onChange: (brandId: string | undefined) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  showLabel?: boolean;
}

export function BrandFilter({
  brands,
  value,
  onChange,
  label = 'Marca',
  placeholder = 'Todas las marcas',
  className = '',
  showLabel = true,
}: BrandFilterProps) {
  const [brandSearch, setBrandSearch] = useState('');

  const selectedBrand = useMemo(() => {
    if (!value) return null;
    return brands.find(b => b.id === value);
  }, [value, brands]);

  const filteredBrands = useMemo(() => {
    if (!brandSearch) return brands;
    const search = brandSearch.toLowerCase();
    return brands.filter(brand => brand.name.toLowerCase().includes(search));
  }, [brands, brandSearch]);

  const selectedBrandName = selectedBrand?.name || placeholder;

  return (
    <div className={className}>
      {showLabel && (
        <Label className="text-xs font-medium mb-1.5 block text-slate-700">
          {label}
        </Label>
      )}
      <Select
        value={value || 'ALL'}
        onValueChange={(val) => {
          onChange(val === 'ALL' ? undefined : val);
          setBrandSearch('');
        }}
      >
        <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200 focus:ring-2 focus:ring-monchito-purple/20">
          <SelectValue placeholder={selectedBrandName} />
        </SelectTrigger>
        <SelectContent>
          <div className="sticky top-0 bg-white p-2 border-b border-slate-200 z-10">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar marca..."
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                className="h-8 pl-8 text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <div className="max-h-[300px] overflow-y-auto">
            <SelectItem value="ALL">{placeholder}</SelectItem>
            {filteredBrands.length > 0 ? (
              filteredBrands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))
            ) : (
              <div className="p-2 text-sm text-slate-500 text-center">
                No se encontraron marcas
              </div>
            )}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}
