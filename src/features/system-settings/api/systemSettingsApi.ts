import { httpClient } from "@/shared/lib/httpClient";

export interface SystemSetting {
    id: string;
    key: string;
    value: string;
    description?: string;
}

export interface NoteTemplate {
    id: string;
    title: string;
    content: string;
    type: string;
    isDefault: boolean;
    isActive: boolean;
}

export interface OrderType {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    isSystem: boolean;
}

export interface SalesChannel {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
}

export const systemSettingsApi = {
    getSettings: async () => {
        return httpClient.get<SystemSetting[]>('/system-settings');
    },
    
    updateSetting: async (key: string, value: string) => {
        return httpClient.patch<SystemSetting>(`/system-settings/${key}`, { value });
    },
    
    getNoteTemplates: async () => {
        return httpClient.get<NoteTemplate[]>('/system-settings/notes');
    },
    
    getDefaultNote: async () => {
        return httpClient.get<NoteTemplate>('/system-settings/notes/default');
    },

    upsertNote: async (data: Partial<NoteTemplate>) => {
        return httpClient.post<NoteTemplate>('/system-settings/notes', data);
    },

    deleteNote: async (id: string) => {
        return httpClient.delete(`/system-settings/notes/${id}`);
    },

    // Order Types
    getOrderTypes: async () => {
        return httpClient.get<OrderType[]>('/system-settings/order-types');
    },

    upsertOrderType: async (data: Partial<OrderType>) => {
        return httpClient.post<OrderType>('/system-settings/order-types', data);
    },

    deleteOrderType: async (id: string) => {
        return httpClient.delete(`/system-settings/order-types/${id}`);
    },

    // Sales Channels
    getSalesChannels: async () => {
        return httpClient.get<SalesChannel[]>('/system-settings/sales-channels');
    },

    upsertSalesChannel: async (data: Partial<SalesChannel>) => {
        return httpClient.post<SalesChannel>('/system-settings/sales-channels', data);
    },

    deleteSalesChannel: async (id: string) => {
        return httpClient.delete(`/system-settings/sales-channels/${id}`);
    }
};
