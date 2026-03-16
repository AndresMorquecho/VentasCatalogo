
import { Award } from 'lucide-react';
import { LoyaltyTabs } from './LoyaltyTabs';
import { PageHeader } from '@/shared/ui/PageHeader';

export function LoyaltyPage() {
    return (
        <div className="space-y-6">
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
