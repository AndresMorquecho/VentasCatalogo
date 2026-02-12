export type CallResult = 'ANSWERED' | 'NO_ANSWER' | 'VOICEMAIL' | 'INVALID' | 'CALL_BACK';
export type CallType = 'COLLECTION' | 'SALES' | 'FOLLOW_UP';

export interface Call {
    id: string;
    clientId: string;
    dateTime: string;
    result: CallResult;
    type: CallType;
    durationSeconds?: number;
    notes?: string;
    userId?: string; 
}

export interface CallPayload {
    clientId: string;
    dateTime?: string;
    result: CallResult;
    type: CallType;
    durationSeconds?: number;
    notes?: string;
}
