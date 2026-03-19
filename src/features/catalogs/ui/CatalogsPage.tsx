import { useState } from 'react';
import { BookOpen, Package, Send, History } from 'lucide-react';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Button } from '@/shared/ui/button';
import { InventoryTab } from './InventoryTab';
import { DeliveryTab } from './DeliveryTab';
import { HistoryTab } from './HistoryTab';

export function CatalogsPage() {
  const [activeTab, setActiveTab] = useState('inventory');

  return (
    <div className="space-y-3">
      <PageHeader 
        title="Catálogos" 
        icon={BookOpen}
        actions={
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'inventory' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('inventory')}
              className={activeTab === 'inventory' ? 'bg-monchito-purple hover:bg-monchito-purple/90' : ''}
            >
              <Package className="h-4 w-4 mr-2" />
              Inventario
            </Button>
            <Button
              variant={activeTab === 'delivery' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('delivery')}
              className={activeTab === 'delivery' ? 'bg-monchito-purple hover:bg-monchito-purple/90' : ''}
            >
              <Send className="h-4 w-4 mr-2" />
              Entrega
            </Button>
            <Button
              variant={activeTab === 'history' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('history')}
              className={activeTab === 'history' ? 'bg-monchito-purple hover:bg-monchito-purple/90' : ''}
            >
              <History className="h-4 w-4 mr-2" />
              Historial
            </Button>
          </div>
        }
      />

      {activeTab === 'inventory' && <InventoryTab />}
      {activeTab === 'delivery' && <DeliveryTab />}
      {activeTab === 'history' && <HistoryTab />}
    </div>
  );
}
