import { useState } from 'react';
import { Settings, Gift, RefreshCw, Users, Search, Plus } from 'lucide-react';
import { MonchitoTabs } from '@/shared/ui/MonchitoTabs';
import type { MonchitoTabConfig } from '@/shared/ui/MonchitoTabs';
import { LoyaltySummary } from './LoyaltySummary';
import { LoyaltyRules } from './LoyaltyRules';
import { LoyaltyRewards } from './LoyaltyRewards';
import { LoyaltyRedemptions } from './LoyaltyRedemptions';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { useLoyaltyPrizes, useLoyaltyRules } from '../model/hooks';

type Tab = 'resumen' | 'reglas' | 'premios' | 'canjes';

const TABS: MonchitoTabConfig[] = [
    { id: 'resumen', label: 'Resumen y Saldos', icon: Users },
    { id: 'reglas', label: 'Reglas', icon: Settings },
    { id: 'premios', label: 'Premios', icon: Gift },
    { id: 'canjes', label: 'Canjes', icon: RefreshCw },
];

export function LoyaltyTabs() {
    const [activeTab, setActiveTab] = useState<Tab>('resumen');
    const [searchTerm, setSearchTerm] = useState('');

    // Hooks to trigger creation modals from here
    const { rules } = useLoyaltyRules();
    const { openCreate: openCreatePrize } = useLoyaltyPrizes();
    const { openCreate: openCreateRule } = useLoyaltyRules();

    return (
        <div className="space-y-6">
            {/* Tab Navigation & Actions Aligned */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
                <MonchitoTabs
                    tabs={TABS}
                    activeTab={activeTab}
                    onTabChange={(id) => setActiveTab(id as Tab)}
                />

                <div className="flex items-center gap-3">
                    {activeTab === 'resumen' && (
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Buscar cliente..."
                                className="pl-9 bg-white border-slate-200 focus:ring-monchito-purple/20 transition-all shadow-sm rounded-xl h-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    )}

                    {activeTab === 'premios' && (
                        <Button
                            onClick={openCreatePrize}
                            className="gap-2 bg-[#570d64] hover:bg-[#4a0a55] h-10 rounded-xl px-4 text-sm font-semibold shadow-sm transition-all"
                        >
                            <Plus className="h-4 w-4" /> Nuevo Premio
                        </Button>
                    )}

                    {activeTab === 'reglas' && rules.length === 0 && (
                        <Button
                            onClick={openCreateRule}
                            className="gap-2 bg-[#570d64] hover:bg-[#4a0a55] h-10 rounded-xl px-4 text-sm font-semibold shadow-sm transition-all"
                        >
                            <Plus className="h-4 w-4" /> Crear Regla Inicial
                        </Button>
                    )}
                </div>
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in duration-200">
                {activeTab === 'resumen' && <LoyaltySummary searchTerm={searchTerm} />}
                {activeTab === 'reglas' && <LoyaltyRules />}
                {activeTab === 'premios' && <LoyaltyRewards />}
                {activeTab === 'canjes' && <LoyaltyRedemptions />}
            </div>
        </div>
    );
}