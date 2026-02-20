export type { Client, ClientPayload, IdentificationType } from './types';
export {
    createClient,
    updateClient,
    validateClient,
    canDeleteClient,
} from './model';
export type { ClientValidationErrors } from './model';
