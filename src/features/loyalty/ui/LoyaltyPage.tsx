
import { Award } from 'lucide-react';
import { LoyaltyTabs } from './LoyaltyTabs';

export function LoyaltyPage() {
    return (
        <div className="p-6 space-y-6 bg-white min-h-screen">
            {/* Header */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-50">
                        <Award className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Fidelización de Clientes</h1>
                        <p className="text-slate-500 text-sm mt-0.5">
                            Gestiona reglas, premios y canjes del programa de lealtad.
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs Module */}
            <LoyaltyTabs />
        </div>
    );
}
