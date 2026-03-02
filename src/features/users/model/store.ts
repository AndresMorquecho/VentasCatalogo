import { create } from 'zustand';

interface UsersUIState {
    userModalOpen: boolean;
    setUserModalOpen: (open: boolean) => void;
    roleModalOpen: boolean;
    setRoleModalOpen: (open: boolean) => void;
}

export const useUsersStore = create<UsersUIState>((set) => ({
    userModalOpen: false,
    setUserModalOpen: (open) => set({ userModalOpen: open }),
    roleModalOpen: false,
    setRoleModalOpen: (open) => set({ roleModalOpen: open }),
}));
