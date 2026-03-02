import { useState } from 'react';
import { Users, ShieldCheck, Activity, Search, Plus } from 'lucide-react';
import { MonchitoTabs } from '@/shared/ui/MonchitoTabs';
import type { MonchitoTabConfig } from '@/shared/ui/MonchitoTabs';
import { UserList } from './UserList';
import { RoleList } from './RoleList';
import { AuditLog } from './AuditLog';
import { useAuth } from '@/shared/auth';
import { Navigate } from 'react-router-dom';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { PageHeader } from "@/shared/ui/PageHeader";
import { useUsers, useRoles } from '../model/hooks';

type Tab = 'users' | 'roles' | 'audit';

const TABS: MonchitoTabConfig[] = [
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'roles', label: 'Roles y Permisos', icon: ShieldCheck },
    { id: 'audit', label: 'Auditoría', icon: Activity },
];

export function AdminUsersPage() {
    const { isAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('users');
    const [searchTerm, setSearchTerm] = useState('');

    const { openCreate: openCreateUser } = useUsers();
    const { openCreate: openCreateRole } = useRoles();

    // Guard: only admin can access
    if (!isAdmin()) return <Navigate to="/" replace />;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Usuarios y Roles"
                description="Administra el acceso y los permisos del sistema."
                icon={Users}
            />

            {/* Tabs & Actions Aligned */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-transparent">
                <MonchitoTabs
                    tabs={TABS}
                    activeTab={activeTab}
                    onTabChange={(id) => setActiveTab(id as Tab)}
                />

                <div className="flex items-center gap-3">
                    {activeTab === 'users' && (
                        <>
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Buscar usuario..."
                                    className="pl-9 bg-white border-slate-200 focus:ring-monchito-purple/20 transition-all shadow-sm rounded-xl h-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button
                                onClick={openCreateUser}
                                className="gap-2 bg-monchito-purple hover:bg-monchito-purple-dark text-white h-10 px-4 rounded-xl text-sm font-semibold shadow-sm transition-all shrink-0"
                            >
                                <Plus className="h-4 w-4" /> Nuevo Usuario
                            </Button>
                        </>
                    )}

                    {activeTab === 'roles' && (
                        <Button
                            onClick={openCreateRole}
                            className="gap-2 bg-monchito-purple hover:bg-monchito-purple-dark text-white h-10 px-4 rounded-xl text-sm font-semibold shadow-sm transition-all shrink-0"
                        >
                            <Plus className="h-4 w-4" /> Nuevo Rol
                        </Button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="animate-in fade-in duration-200">
                {activeTab === 'users' && <UserList search={searchTerm} />}
                {activeTab === 'roles' && <RoleList />}
                {activeTab === 'audit' && <AuditLog />}
            </div>
        </div>
    );
}
