# 🚀 PLAN DE ACCIÓN INMEDIATO

## Prioridad 1: CRÍTICO (Hacer AHORA)

### 1. Consolidar Features Duplicadas (2 horas)

```bash
# bank-account
rm -rf src/features/bank-account
mv src/features/bank-accounts src/features/bank-account

# brand  
rm -rf src/features/brand
mv src/features/brands src/features/brand
```

**Actualizar imports en:**
- `src/pages/bank-accounts-page/BankAccountsPage.tsx`
- `src/pages/brands-page/BrandsPage.tsx`
- `src/app/routers/AppRouter.tsx`

### 2. Eliminar Campo Deprecated (30 min)

**Archivo:** `src/entities/order/model/types.ts`

```typescript
// ELIMINAR esta línea:
deposit: number; // DEPRECATED

// ELIMINAR de OrderPayload también
```

**Buscar y actualizar todos los usos:**
```bash
# Buscar referencias
grep -r "\.deposit" src/
```

### 3. Mover Archivos de Documentación (5 min)

```bash
mkdir docs
mv *.txt docs/
```

---

## Prioridad 2: ALTA (Esta semana)

### 4. Completar Entidades Incompletas (2-3 días)

#### `entities/client-credit/model/model.ts`
```typescript
export function createClientCredit(data: Omit<ClientCredit, 'id' | 'createdAt'>): ClientCredit {
    return {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...data
    };
}

export function useCredit(credit: ClientCredit, amount: number): ClientCredit {
    if (credit.amount < amount) {
        throw new Error('Saldo insuficiente');
    }
    return {
        ...credit,
        amount: credit.amount - amount
    };
}
```

#### `entities/financial-transaction/model/model.ts`
```typescript
export function validateTransaction(data: Partial<FinancialTransaction>): ValidationErrors {
    const errors: ValidationErrors = {};
    
    if (!data.referenceNumber || data.referenceNumber.trim().length === 0) {
        errors.referenceNumber = 'La referencia es obligatoria';
    }
    
    if (!data.amount || data.amount <= 0) {
        errors.amount = 'El monto debe ser mayor a 0';
    }
    
    return errors;
}
```

#### `entities/inventory-movement/model/model.ts`
```typescript
// Mover desde features/inventory/lib/calculateDaysInWarehouse.ts
export function calculateDaysInWarehouse(entryDate: string): number {
    const entry = new Date(entryDate);
    const now = new Date();
    const diff = now.getTime() - entry.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}
```

### 5. Decidir sobre Entidades Conflictivas (1 hora)

#### Opción A: Eliminar `entities/call-record`
```bash
rm -rf src/entities/call-record
# Consolidar todo en entities/call
```

#### Opción B: Eliminar `entities/payment`
```bash
rm -rf src/entities/payment
# Usar solo OrderPayment de entities/order
```

### 6. Mover Lógica de Rewards (1 hora)

**De:** `src/shared/lib/rewards.ts`  
**A:** `src/entities/client-reward/model/model.ts`

```bash
# Crear archivo
touch src/entities/client-reward/model/model.ts

# Mover contenido
# Actualizar imports en:
# - features/loyalty/
# - entities/client-reward/api/rewardsApi.ts
```

---

## Prioridad 3: MEDIA (Próximas 2 semanas)

### 7. Crear Capa de API (5-7 días)

```bash
mkdir -p src/api/{client,dtos,mappers,services}
```

#### Estructura:
```
src/api/
├── client/
│   ├── httpClient.ts       # Axios/Fetch configurado
│   ├── interceptors.ts     # Auth, errors
│   └── endpoints.ts        # URLs centralizadas
├── dtos/
│   ├── order.dto.ts
│   ├── client.dto.ts
│   └── ...
├── mappers/
│   ├── orderMapper.ts
│   ├── clientMapper.ts
│   └── ...
└── services/
    ├── orderService.ts
    ├── clientService.ts
    └── ...
```

#### Ejemplo httpClient.ts:
```typescript
import axios from 'axios';

const httpClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor
httpClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
httpClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Redirect to login
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default httpClient;
```

#### Ejemplo orderService.ts:
```typescript
import httpClient from '../client/httpClient';
import { orderMapper } from '../mappers/orderMapper';
import type { OrderDTO, CreateOrderDTO } from '../dtos/order.dto';
import type { Order } from '@/entities/order/model/types';

export const orderService = {
    async getAll(): Promise<Order[]> {
        const response = await httpClient.get<OrderDTO[]>('/orders');
        return response.data.map(orderMapper.toDomain);
    },

    async getById(id: string): Promise<Order> {
        const response = await httpClient.get<OrderDTO>(`/orders/${id}`);
        return orderMapper.toDomain(response.data);
    },

    async create(order: Order): Promise<Order> {
        const dto = orderMapper.toDTO(order);
        const response = await httpClient.post<OrderDTO>('/orders', dto);
        return orderMapper.toDomain(response.data);
    },

    async update(id: string, order: Partial<Order>): Promise<Order> {
        const dto = orderMapper.toDTO(order);
        const response = await httpClient.put<OrderDTO>(`/orders/${id}`, dto);
        return orderMapper.toDomain(response.data);
    },

    async delete(id: string): Promise<void> {
        await httpClient.delete(`/orders/${id}`);
    }
};
```

### 8. Crear DTOs (2 días)

#### Ejemplo order.dto.ts:
```typescript
export interface OrderDTO {
    id: string;
    receipt_number: string;  // snake_case del backend
    sales_channel: string;
    type: string;
    brand_id: string;
    brand_name: string;
    total: number;
    real_invoice_total?: number;
    payment_method: string;
    bank_account_id?: string;
    transaction_date?: string;
    payments: OrderPaymentDTO[];
    paid_amount: number;
    created_at: string;
    possible_delivery_date: string;
    reception_date?: string;
    delivery_date?: string;
    invoice_number?: string;
    status: string;
    client_id: string;
    client_name: string;
    items: OrderItemDTO[];
    notes?: string;
}

export interface CreateOrderDTO {
    sales_channel: string;
    type: string;
    brand_id: string;
    total: number;
    payment_method: string;
    bank_account_id?: string;
    possible_delivery_date: string;
    client_id: string;
    items: OrderItemDTO[];
    notes?: string;
}

export interface OrderItemDTO {
    product_name: string;
    quantity: number;
    unit_price: number;
    brand_id?: string;
    brand_name?: string;
    link?: string;
}

export interface OrderPaymentDTO {
    id: string;
    amount: number;
    bank_account_id?: string;
    method?: string;
    reference?: string;
    created_at: string;
    description?: string;
}
```

### 9. Crear Mappers (2 días)

#### Ejemplo orderMapper.ts:
```typescript
import type { Order, OrderItem, OrderPayment } from '@/entities/order/model/types';
import type { OrderDTO, OrderItemDTO, OrderPaymentDTO } from '../dtos/order.dto';

export const orderMapper = {
    toDomain(dto: OrderDTO): Order {
        return {
            id: dto.id,
            receiptNumber: dto.receipt_number,
            salesChannel: dto.sales_channel as any,
            type: dto.type as any,
            brandId: dto.brand_id,
            brandName: dto.brand_name,
            total: dto.total,
            realInvoiceTotal: dto.real_invoice_total,
            deposit: 0, // Deprecated
            paymentMethod: dto.payment_method as any,
            bankAccountId: dto.bank_account_id,
            transactionDate: dto.transaction_date,
            payments: dto.payments.map(this.paymentToDomain),
            paidAmount: dto.paid_amount,
            createdAt: dto.created_at,
            possibleDeliveryDate: dto.possible_delivery_date,
            receptionDate: dto.reception_date,
            deliveryDate: dto.delivery_date,
            invoiceNumber: dto.invoice_number,
            status: dto.status as any,
            clientId: dto.client_id,
            clientName: dto.client_name,
            items: dto.items.map(this.itemToDomain),
            notes: dto.notes
        };
    },

    toDTO(order: Partial<Order>): Partial<OrderDTO> {
        return {
            receipt_number: order.receiptNumber,
            sales_channel: order.salesChannel,
            type: order.type,
            brand_id: order.brandId,
            brand_name: order.brandName,
            total: order.total,
            real_invoice_total: order.realInvoiceTotal,
            payment_method: order.paymentMethod,
            bank_account_id: order.bankAccountId,
            transaction_date: order.transactionDate,
            payments: order.payments?.map(this.paymentToDTO),
            paid_amount: order.paidAmount,
            possible_delivery_date: order.possibleDeliveryDate,
            reception_date: order.receptionDate,
            delivery_date: order.deliveryDate,
            invoice_number: order.invoiceNumber,
            status: order.status,
            client_id: order.clientId,
            client_name: order.clientName,
            items: order.items?.map(this.itemToDTO),
            notes: order.notes
        };
    },

    itemToDomain(dto: OrderItemDTO): OrderItem {
        return {
            id: crypto.randomUUID(),
            productName: dto.product_name,
            quantity: dto.quantity,
            unitPrice: dto.unit_price,
            brandId: dto.brand_id,
            brandName: dto.brand_name,
            link: dto.link
        };
    },

    itemToDTO(item: OrderItem): OrderItemDTO {
        return {
            product_name: item.productName,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            brand_id: item.brandId,
            brand_name: item.brandName,
            link: item.link
        };
    },

    paymentToDomain(dto: OrderPaymentDTO): OrderPayment {
        return {
            id: dto.id,
            amount: dto.amount,
            bankAccountId: dto.bank_account_id,
            method: dto.method,
            reference: dto.reference,
            createdAt: dto.created_at,
            description: dto.description
        };
    },

    paymentToDTO(payment: OrderPayment): OrderPaymentDTO {
        return {
            id: payment.id,
            amount: payment.amount,
            bank_account_id: payment.bankAccountId,
            method: payment.method,
            reference: payment.reference,
            created_at: payment.createdAt,
            description: payment.description
        };
    }
};
```

---

## Checklist de Verificación

### Antes de Integrar Backend

- [ ] Features duplicadas consolidadas
- [ ] Campo deprecated eliminado
- [ ] Entidades incompletas completadas
- [ ] Lógica de rewards movida a entity
- [ ] Entidades conflictivas resueltas
- [ ] Capa de API creada
- [ ] DTOs definidos para todas las entidades
- [ ] Mappers implementados
- [ ] httpClient configurado
- [ ] Services creados
- [ ] Datos mock eliminados de shared/api
- [ ] Variables de entorno configuradas
- [ ] TypeScript compila sin errores
- [ ] No hay imports rotos

### Durante Integración Backend

- [ ] Endpoints del backend documentados
- [ ] Formato de DTOs acordado con backend
- [ ] Manejo de errores implementado
- [ ] Loading states funcionando
- [ ] Auth con JWT implementado
- [ ] Refresh tokens configurados
- [ ] CORS configurado en backend
- [ ] Testing de integración

---

## Comandos Útiles

```bash
# Verificar imports rotos
npm run build

# Buscar TODOs
grep -r "TODO\|FIXME\|DEPRECATED" src/

# Buscar datos mock
grep -r "MOCK_" src/

# Buscar console.log (limpiar antes de producción)
grep -r "console.log" src/

# Verificar tipos
npm run type-check

# Lint
npm run lint
```

---

## Contacto y Soporte

Si tienes dudas durante la implementación, revisa:
1. AUDITORIA_ARQUITECTURA.md (reporte completo)
2. Este archivo (plan de acción)
3. Documentación de FSD: https://feature-sliced.design/

**¡Éxito con la integración!** 🚀
