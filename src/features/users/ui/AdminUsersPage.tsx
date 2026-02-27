
import { useState } from 'react';
import { Users, ShieldCheck, Activity } from 'lucide-react';
import { UserList } from './UserList';
import { RoleList } from './RoleList';
import { AuditLog } from './AuditLog';
import { useAuth } from '@/shared/auth';
import { Navigate } from 'react-router-dom';

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
        <div className="p-6 space-y-6 bg-white min-h-screen">
            <div className="mb-2 px-1">
                <div className="space-y-1 sm:space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Usuarios y Roles</h1>
                    <h2 className="text-base font-medium text-muted-foreground tracking-tight">Administra el acceso y los permisos del sistema.</h2>
                </div>
            </div>

            {/* Tabs */}
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

            {/* Content */}
            <div className="animate-in fade-in duration-200">
                {activeTab === 'users' && <UserList />}
                {activeTab === 'roles' && <RoleList />}
                {activeTab === 'audit' && <AuditLog />}
            </div>
        </div>
    );
}
