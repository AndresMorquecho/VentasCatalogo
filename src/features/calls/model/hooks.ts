import { useCalls as useEntityCalls, useCreateCall } from '@/entities/call';
import type { CallPayload } from '@/entities/call';
import type { CallQueryParams } from '@/entities/call/model/api';

export const useCalls = (params?: CallQueryParams) => {
    const { data, isLoading, refetch } = useEntityCalls(params);
    const { mutateAsync: createCall, isPending: isAdding } = useCreateCall();

    const addCall = async (payload: CallPayload) => {
        return createCall(payload);
    };

    return {
        data,
        isLoading: isLoading || isAdding,
        addCall,
        refetch
    };
};
