import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

interface Client {
  id: string;
  firstName: string;
  identificationNumber: string;
}

interface ClientFilterProps {
  clients: Client[];
  value?: string;
  onChange: (clientId: string | undefined) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  showLabel?: boolean;
}

export function ClientFilter({
  clients,
  value,
  onChange,
  label = 'Cliente',
  placeholder = 'Buscar cliente...',
  className = '',
  showLabel = true,
}: ClientFilterProps) {
  const [clientSearch, setClientSearch] = useState('');

  const selectedClient = useMemo(() => {
    if (!value) return null;
    return clients.find(c => c.id === value);
  }, [value, clients]);

  const filteredClients = useMemo(() => {
    if (!clientSearch) return [];
    const search = clientSearch.toLowerCase();
    return clients.filter(client => 
      client.firstName.toLowerCase().includes(search) ||
      client.identificationNumber.includes(search)
    );
  }, [clients, clientSearch]);

  const handleClear = () => {
    onChange(undefined);
    setClientSearch('');
  };

  const handleSelectClient = (client: Client) => {
    onChange(client.id);
    setClientSearch('');
  };

  return (
    <div className={className}>
      {showLabel && (
        <Label className="text-xs font-medium mb-1.5 block text-slate-700">
          {label}
        </Label>
      )}
      <div className="relative">
        <Input
          value={selectedClient ? selectedClient.firstName : clientSearch}
          onChange={(e) => {
            setClientSearch(e.target.value);
            if (value) onChange(undefined);
          }}
          placeholder={placeholder}
          className="h-9 text-sm pr-8 rounded-lg border-slate-200 focus:ring-2 focus:ring-monchito-purple/20"
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {!value && clientSearch && filteredClients.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
            {filteredClients.slice(0, 50).map((client) => (
              <button
                key={client.id}
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex flex-col border-b border-slate-100 last:border-0"
                onClick={() => handleSelectClient(client)}
              >
                <span className="font-medium text-slate-900">{client.firstName}</span>
                <span className="text-xs text-slate-500">{client.identificationNumber}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
