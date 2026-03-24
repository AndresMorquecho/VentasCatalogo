import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { useClients } from '@/entities/client/model/hooks';
import { useDebounce } from '@/shared/lib/hooks';

interface ClientSearchSelectProps {
  value?: string;
  onChange: (clientId: string | undefined) => void;
  label?: string;
  placeholder?: string;
}

export function ClientSearchSelect({
  value,
  onChange,
  label = 'Cliente',
  placeholder = 'Buscar cliente...',
}: ClientSearchSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data: clientsData } = useClients({ search: debouncedSearch, limit: 20 });
  const clients = clientsData?.data || [];

  const selectedClient = clients.find(c => c.id === value);

  useEffect(() => {
    if (value && !selectedClient && clients.length > 0) {
      // If we have a value but no match, try to load that specific client
      setSearchTerm('');
    }
  }, [value, selectedClient, clients.length]);

  const handleSelect = (clientId: string) => {
    onChange(clientId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onChange(undefined);
    setSearchTerm('');
  };

  return (
    <div className="relative w-full">
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      
      {value && selectedClient ? (
        <div className="flex items-center gap-2 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
          <span className="flex-1 truncate">{selectedClient.firstName}</span>
          <button
            type="button"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={placeholder}
              className="pl-9"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
            />
          </div>

          {isOpen && searchTerm.length >= 2 && (
            <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg max-h-60 overflow-auto">
              {clients.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No se encontraron clientes
                </div>
              ) : (
                clients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => handleSelect(client.id)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
                  >
                    <div className="font-medium">{client.firstName}</div>
                    <div className="text-xs text-muted-foreground">
                      {client.identificationNumber}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
