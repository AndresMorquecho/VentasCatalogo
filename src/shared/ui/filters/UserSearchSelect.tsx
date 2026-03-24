import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { useUsers } from '@/entities/user/model/hooks';
import { useDebounce } from '@/shared/lib/hooks';

interface UserSearchSelectProps {
  value?: string;
  onChange: (username: string | undefined) => void;
  label?: string;
  placeholder?: string;
}

export function UserSearchSelect({
  value,
  onChange,
  label = 'Usuario',
  placeholder = 'Buscar usuario...',
}: UserSearchSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data: usersData } = useUsers({ search: debouncedSearch, limit: 20 });
  const users = usersData?.data || [];

  const selectedUser = users.find(u => u.username === value);

  const handleSelect = (username: string) => {
    onChange(username);
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
      
      {value && selectedUser ? (
        <div className="flex items-center gap-2 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
          <span className="flex-1 truncate">{selectedUser.username}</span>
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
              {users.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No se encontraron usuarios
                </div>
              ) : (
                users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelect(user.username)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
                  >
                    <div className="font-medium">{user.username}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {user.role}
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
