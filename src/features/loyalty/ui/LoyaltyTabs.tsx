
import { useState } from 'react';
import { Award, Settings, Gift, RefreshCw } from 'lucide-react';
import { LoyaltySummary } from './LoyaltySummary';
import { LoyaltyRules } from './LoyaltyRules';
import { LoyaltyRewards } from './LoyaltyRewards';
import { LoyaltyRedemptions } from './LoyaltyRedemptions';

type Tab = 'resumen' | 'reglas' | 'premios' | 'canjes';

interface TabConfig {
    id: Tab;
    label: string;
    icon: React.ReactNode;
}

const TABS: TabConfig[] = [
    { id: 'resumen', label: 'Resumen', icon: <Award className="h-4 w-4" /> },
    { id: 'reglas', label: 'Reglas', icon: <Settings className="h-4 w-4" /> },
    { id: 'premios', label: 'Premios', icon: <Gift className="h-4 w-4" /> },
    { id: 'canjes', label: 'Canjes', icon: <RefreshCw className="h-4 w-4" /> },
];

export function LoyaltyTabs() {
    const [activeTab, setActiveTab] = useState<Tab>('resumen');

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white rounded-xl border border-slate-200 p-1 flex gap-1 w-fit shadow-sm">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                                ? 'bg-slate-900 text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in duration-200">
                {activeTab === 'resumen' && <LoyaltySummary />}
                {activeTab === 'reglas' && <LoyaltyRules />}
                {activeTab === 'premios' && <LoyaltyRewards />}
                {activeTab === 'canjes' && <LoyaltyRedemptions />}
            </div>
        </div>
    );
}
