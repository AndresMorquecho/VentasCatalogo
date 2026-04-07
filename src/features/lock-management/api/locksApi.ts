import { httpClient } from "@/shared/lib/httpClient";

export interface Lock {
    id: string;
    resourceId: string;
    resourceType: string;
    userId: string;
    userName: string;
    expiresAt: string;
    createdAt: string;
}

export const locksApi = {
    acquire: async (resourceId: string, resourceType: string): Promise<Lock> => {
        return httpClient.post<Lock>('/locks/acquire', { resourceId, resourceType });
    },
    release: async (resourceId: string, resourceType: string): Promise<void> => {
        await httpClient.post('/locks/release', { resourceId, resourceType });
    },
    heartbeat: async (resourceId: string, resourceType: string): Promise<void> => {
        await httpClient.post('/locks/heartbeat', { resourceId, resourceType });
    }
};
