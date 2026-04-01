
import { useState } from 'react';
import { Users, ShieldCheck, Activity } from 'lucide-react';
import { UserList } from './UserList';
import { RoleList } from './RoleList';
import { AuditLog } from './AuditLog';
import { useAuth } from '@/shared/auth';
import { Navigate } from 'react-router-dom';
import { PageHeader } from '@/shared/ui/PageHeader';

type Tab = 'users' | 'roles' | 'audit';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'users', label: 'Usuarios', icon: <Users className="h-4 w-4" /> },
    { id: 'roles', label: 'Roles y Permisos', icon: <ShieldCheck className="h-4 w-4" /> },
    { id: 'audit', label: 'Auditoría', icon: <Activity className="h-4 w-4" /> },
];

export function AdminUsersPage() {
    const { isAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('users');

    // Guard: only admin can access
    if (!isAdmin()) return <Navigate to="/" replace />;

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Usuarios y Roles" 
                description="Administra el acceso y los permisos del sistema"
                icon={Users}
            />

            <div className="w-full overflow-x-auto no-scrollbar -mx-1 px-1">
                <div className="bg-white rounded-xl border border-slate-200 p-1 flex flex-nowrap gap-1 w-max shadow-sm min-w-full sm:min-w-0">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-monchito-purple text-white shadow-md shadow-monchito-purple/20'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="animate-in fade-in duration-200">
                {activeTab === 'users' && <UserList />}
                {activeTab === 'roles' && <RoleList />}
                {activeTab === 'audit' && <AuditLog />}
            </div>
        </div>
    );
}
