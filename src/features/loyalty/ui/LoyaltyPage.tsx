
import { Award } from 'lucide-react';
import { LoyaltyTabs } from './LoyaltyTabs';
import { PageHeader } from '@/shared/ui/PageHeader';

export function LoyaltyPage() {
    return (
        <div className="p-6 space-y-6 bg-white min-h-screen">
            <PageHeader 
                title="Fidelización de Clientes" 
                description="Gestiona reglas, premios y canjes del programa de lealtad"
                icon={Award}
            />

            {/* Tabs Module */}
            <LoyaltyTabs />
        </div>
    );
}
