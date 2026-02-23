import { useCalls as useEntityCalls, useCreateCall } from '@/entities/call';
import type { CallPayload } from '@/entities/call';

export const useCalls = (clientId?: string) => {
    const { data: calls = [], isLoading, refetch } = useEntityCalls(clientId);
    const { mutateAsync: createCall, isPending: isAdding } = useCreateCall();

    const addCall = async (payload: CallPayload) => {
        return createCall(payload);
    };

    return {
        calls,
        isLoading: isLoading || isAdding,
        addCall,
        refetch
    };
};
