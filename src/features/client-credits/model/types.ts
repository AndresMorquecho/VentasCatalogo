export interface ClientCreditSummary {
    clientId: string;
    clientName: string;
    clientIdentification?: string;
    clientPhone?: string;
    totalCredit: number;
    totalGenerated: number;
    totalUsed: number;
    lastUpdated: string;
    credits: Array<{
        id: string;
        amount: number;
        originTransactionId: string;
        createdAt: string;
    }>;
}
