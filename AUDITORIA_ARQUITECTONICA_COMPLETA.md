# AUDITORÍA ARQUITECTÓNICA COMPLETA
## Sistema de Gestión de Pedidos por Catálogo

**Fecha de Auditoría:** 20 de Febrero de 2026  
**Auditor:** Arquitecto de Software  
**Objetivo:** Análisis exhaustivo pre-backend para identificar riesgos, inconsistencias y proponer modelo ideal

---

## 📋 RESUMEN EJECUTIVO

### Estado General del Sistema
El frontend está **funcionalmente completo** con datos mock y presenta una arquitectura **parcialmente limpia** con separación de capas. Sin embargo, existen **problemas arquitectónicos críticos** que deben resolverse antes de implementar el backend en producción.

### Hallazgos Críticos (Bloqueantes)
1. **Doble Sistema Financiero Desincronizado**: `FinancialTransaction` y `FinancialMovement` son dos agregados independientes que pueden desincronizarse
2. **Créditos sin Aggregate Root**: Los créditos de cliente no tienen entidad propia, solo registros sueltos sin validación de saldo
3. **Datos Derivados en Entidades**: `order.paidAmount` es calculado pero también almacenado, riesgo de inconsistencia
4. **Falta de Límites Transaccionales**: Operaciones multi-entidad sin garantía ACID real
5. **Inventario Desconectado**: No hay validación de stock ni control de concurrencia

### Hallazgos Graves (Alta Prioridad)
6. **Recompensas sin Validación**: Sistema de puntos sin verificación de doble aplicación
7. **Denormalización Peligrosa**: `clientName` duplicado en múltiples entidades sin sincronización garantizada
8. **Falta de Idempotencia**: Operaciones críticas pueden ejecutarse dos veces
9. **Sin Control de Concurrencia**: Dos usuarios pueden modificar el mismo pedido simultáneamente


### Hallazgos Moderados
10. **Código Duplicado**: Lógica financiera repetida en múltiples lugares
11. **Shared Mal Utilizado**: Lógica de negocio en capa de transporte
12. **Componentes Sin Uso**: Varios archivos no referenciados
13. **Falta de Validaciones de Dominio**: Reglas de negocio solo en frontend

### Métricas del Sistema
- **Entidades Principales:** 15
- **Servicios de Aplicación:** 4
- **Features:** 24
- **Shared APIs:** 10
- **Componentes UI:** ~80+
- **Líneas de Código Estimadas:** ~15,000

---

## 🗺️ MAPA DE MÓDULOS Y DEPENDENCIAS

### Arquitectura Actual (Capas)

```
┌─────────────────────────────────────────────────────────────┐
│                        WIDGETS                               │
│              (Header, Sidebar, Layout)                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                         PAGES                                │
│        (Home, Orders, Clients, BankAccounts, Brands)        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                        FEATURES                              │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │ Order Mgmt   │ Payments     │ Reception                │ │
│  │ Delivery     │ Cash Closure │ Financial Audit          │ │
│  │ Loyalty      │ Inventory    │ Clients/Brands/Banks     │ │
│  │ Transactions │ Calls        │ Rewards                  │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION SERVICES                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ financialRecordService (Centralizado)                │   │
│  │ orderPaymentService (Transaccional)                  │   │
│  │ receptionService (Transaccional)                     │   │
│  │ paymentService (Transaccional)                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      DOMAIN ENTITIES                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Order (Aggregate Root)                               │   │
│  │ FinancialTransaction (Aggregate Root?)               │   │
│  │ FinancialMovement (Aggregate Root?)                  │   │
│  │ Client (Aggregate Root)                              │   │
│  │ ClientCredit (Entity sin Root)                       │   │
│  │ ClientReward (Aggregate Root)                        │   │
│  │ BankAccount (Aggregate Root)                         │   │
│  │ InventoryMovement (Entity)                           │   │
│  │ Brand, User, Call, CashClosure                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    SHARED / INFRASTRUCTURE                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ API Layer (Transport - Mock HTTP)                    │   │
│  │ Auth (Session Management)                            │   │
│  │ UI Components (shadcn/ui)                            │   │
│  │ Utils (rewards, permissions, audit)                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```


### Dependencias Entre Módulos (Críticas)

```
Order (Aggregate Root)
  ├─→ Client (FK: clientId)
  ├─→ Brand (FK: brandId)
  ├─→ BankAccount (FK: bankAccountId - opcional)
  ├─→ OrderPayment[] (Value Objects embebidos)
  └─→ OrderItem[] (Value Objects embebidos)

FinancialTransaction (Aggregate Root Independiente)
  ├─→ Client (FK: clientId)
  ├─→ Order (FK: orderId - opcional)
  └─→ NO CONECTADO con FinancialMovement ❌

FinancialMovement (Aggregate Root Independiente)
  ├─→ BankAccount (FK: bankAccountId)
  ├─→ Client (FK: clientId - opcional)
  ├─→ referenceId (string genérico - puede ser OrderPayment.id)
  └─→ NO CONECTADO con FinancialTransaction ❌

ClientCredit (Entity SIN Aggregate Root) ⚠️
  ├─→ Client (FK: clientId)
  ├─→ originTransactionId (string - puede ser FinancialTransaction.id)
  └─→ NO HAY VALIDACIÓN DE SALDO TOTAL

ClientReward (Aggregate Root)
  ├─→ Client (FK: clientId)
  └─→ Calculado desde Orders entregados

InventoryMovement (Entity)
  ├─→ Order (FK: orderId)
  ├─→ Client (FK: clientId)
  ├─→ Brand (FK: brandId)
  └─→ NO VALIDA STOCK NI CONCURRENCIA

CashClosure (Snapshot Read-Only)
  ├─→ FinancialMovement[] (Agregación por rango de fechas)
  ├─→ BankAccount[] (Snapshot de balances)
  └─→ NO MODIFICA NADA (Solo lectura)
```

### Flujo de Datos Crítico: Crear Pedido → Abonar → Recepcionar → Entregar

```
1. CREAR PEDIDO
   OrderFormModal
     ↓
   orderApi.create()
     ↓
   Order { payments: [initial], paidAmount: X }
     ↓
   financialRecordService.createOrderPaymentRecord()
     ↓
   FinancialTransaction + FinancialMovement (AMBOS CREADOS) ✅
     ↓
   BankAccount.currentBalance += X

2. ABONO POSTERIOR
   OrderPaymentForm
     ↓
   orderPaymentService.addOrderPaymentTransactional()
     ↓
   Order.payments.push(newPayment)
     ↓
   financialRecordService.createOrderPaymentRecord()
     ↓
   FinancialTransaction + FinancialMovement ✅
     ↓
   BankAccount.currentBalance += Y

3. RECEPCIÓN EN BODEGA
   ReceptionBatchModal
     ↓
   receptionService.saveBatchWithPayments()
     ↓
   Order.status = 'RECIBIDO_EN_BODEGA'
   Order.realInvoiceTotal = Z
     ↓
   SI (Z < paidAmount):
     financialRecordService.createAdjustmentRecord()
     ClientCredit.create() ⚠️ (Sin validación de duplicados)
     ↓
   inventoryApi.create({ type: 'ENTRY' })

4. ENTREGA AL CLIENTE
   DeliverOrderModal
     ↓
   Order.status = 'ENTREGADO'
   Order.deliveryDate = now
     ↓
   inventoryApi.create({ type: 'DELIVERED' })
     ↓
   rewardsApi.update() (Calcula puntos)
     ↓
   ClientReward.totalPoints += points ⚠️ (Sin validación de doble aplicación)
```


---

## 🚨 PROBLEMAS ENCONTRADOS (Clasificados por Gravedad)

### 🔴 CRÍTICOS (Bloqueantes para Producción)

#### 1. Doble Sistema Financiero Desincronizado

**Descripción:**  
Existen dos entidades financieras independientes que registran el mismo evento:
- `FinancialTransaction`: Para auditoría y comprobantes
- `FinancialMovement`: Para cierre de caja y balance de cuentas

**Problema:**  
Aunque `financialRecordService` intenta crearlos juntos, NO hay garantía transaccional. Si uno falla y el otro no, el sistema queda inconsistente.

**Evidencia:**
```typescript
// financialRecord.service.ts línea 45-65
const transaction = await transactionApi.createTransaction({...});
const movement = createFinancialMovement({...});
await financialMovementApi.create(movement);
// ❌ Si movement falla, transaction ya fue creado
```

**Riesgo:**
- Cierre de caja muestra $1000 pero auditoría muestra $800
- Imposible reconciliar sin intervención manual
- Pérdida de confianza en datos financieros

**Impacto:** ALTO - Afecta integridad financiera del negocio

---

#### 2. Créditos Sin Aggregate Root

**Descripción:**  
`ClientCredit` es una entidad suelta sin aggregate root que la proteja. No hay validación de:
- Saldo total disponible
- Uso duplicado del mismo crédito
- Concurrencia al usar créditos

**Evidencia:**
```typescript
// client-credit/model/types.ts
export type ClientCredit = {
  id: string;
  clientId: string;
  amount: number;
  originTransactionId: string;
  createdAt: string;
};
// ❌ No hay ClientCreditAccount que agrupe y valide
```

**Problema:**
- Dos usuarios pueden usar el mismo crédito simultáneamente
- No hay validación de saldo total antes de usar
- Créditos pueden crearse duplicados para el mismo ajuste

**Riesgo:**
- Cliente usa $50 de crédito que no tiene
- Sistema pierde dinero por créditos mal aplicados
- Fraude interno posible

**Impacto:** ALTO - Pérdida financiera directa

---

#### 3. Datos Derivados Almacenados (order.paidAmount)

**Descripción:**  
`Order.paidAmount` es un campo calculado que también se almacena. Esto viola el principio de "single source of truth".

**Evidencia:**
```typescript
// order/model/model.ts línea 15-17
export function getPaidAmount(order: Order): number {
    return (order.payments || []).reduce((acc, p) => acc + p.amount, 0);
}
// Pero Order.paidAmount también existe como campo almacenado
```

**Problema:**
- Si `payments[]` se modifica pero `paidAmount` no se actualiza → inconsistencia
- Dos fuentes de verdad para el mismo dato
- Riesgo de bugs al usar el campo equivocado

**Riesgo:**
- Dashboard muestra saldo incorrecto
- Validaciones fallan por datos desincronizados
- Reportes financieros incorrectos

**Impacto:** ALTO - Inconsistencia de datos críticos

---

#### 4. Falta de Límites Transaccionales Reales

**Descripción:**  
Las operaciones multi-entidad no tienen garantía ACID. Los servicios de aplicación simulan transacciones pero sin rollback real.

**Evidencia:**
```typescript
// orderPayment.service.ts línea 40-50
try {
    await financialRecordService.createOrderPaymentRecord(...);
    await bankAccountApi.update(...);
    await orderApi.update(...);
} catch (error) {
    console.error("Transaction failed, rolling back (mock)", error);
    throw error; // ❌ No hay rollback real
}
```

**Problema:**
- Si paso 2 falla, paso 1 ya fue ejecutado
- Rollback manual es propenso a errores
- Estado inconsistente entre entidades

**Riesgo:**
- Dinero registrado en cuenta pero no en pedido
- Pedido actualizado pero movimiento financiero no creado
- Sistema en estado corrupto irrecuperable

**Impacto:** CRÍTICO - Integridad transaccional comprometida

---

#### 5. Inventario Desconectado del Flujo Principal

**Descripción:**  
`InventoryMovement` se crea como efecto secundario pero no valida:
- Stock disponible
- Concurrencia (dos entregas del mismo pedido)
- Consistencia con estado del pedido

**Evidencia:**
```typescript
// reception.service.ts línea 120-125
await inventoryApi.create({
    orderId: updatedOrder.id,
    type: 'ENTRY',
    notes: `Ingreso automático...`
});
// ❌ No valida si ya existe un ENTRY para este pedido
```

**Problema:**
- Pedido puede recepcionarse dos veces → doble inventario
- No hay validación de stock al entregar
- Inventario puede estar desincronizado con pedidos

**Riesgo:**
- Inventario fantasma (registrado pero no físico)
- Entregas sin stock real
- Pérdidas por robo/error no detectadas

**Impacto:** ALTO - Control de inventario comprometido


---

### 🟠 GRAVES (Alta Prioridad)

#### 6. Recompensas Sin Validación de Duplicados

**Descripción:**  
El sistema de puntos se actualiza al entregar pedido pero no valida si ya se aplicaron puntos anteriormente.

**Evidencia:**
```typescript
// rewards.ts línea 30-40
export const updateClientRewards = (currentReward: ClientReward, order: Order): ClientReward => {
    const pointsEarned = calculateRewardPoints(order);
    const newTotalPoints = currentReward.totalPoints + pointsEarned;
    // ❌ No valida si este order.id ya fue procesado
}
```

**Problema:**
- Si entrega falla y se reintenta → puntos duplicados
- No hay registro de qué pedidos ya generaron puntos
- Cliente puede obtener puntos múltiples veces

**Riesgo:**
- Fraude en sistema de fidelización
- Pérdida económica por canjes indebidos
- Desconfianza en programa de lealtad

**Impacto:** MEDIO-ALTO - Pérdida económica indirecta

---

#### 7. Denormalización Peligrosa (clientName)

**Descripción:**  
`clientName` está duplicado en múltiples entidades sin sincronización garantizada:
- `Order.clientName`
- `FinancialTransaction.clientName`
- `FinancialMovement.clientName`

**Evidencia:**
```typescript
// clientApi.ts línea 60-65
if (payload.firstName) {
    await orderApi.syncClientName(id, payload.firstName);
}
// ❌ Solo sincroniza Orders, no FinancialTransaction ni FinancialMovement
```

**Problema:**
- Cliente cambia nombre → solo se actualiza en Orders
- Reportes financieros muestran nombre antiguo
- Inconsistencia en auditoría

**Riesgo:**
- Confusión en reportes
- Problemas legales (nombre incorrecto en comprobantes)
- Dificultad para rastrear cliente real

**Impacto:** MEDIO - Inconsistencia de datos de negocio

---

#### 8. Falta de Idempotencia en Operaciones Críticas

**Descripción:**  
Operaciones como recepción, entrega y pagos no son idempotentes. Si se ejecutan dos veces, generan datos duplicados.

**Problema:**
- Usuario hace doble clic → pedido se recepciona dos veces
- Retry de red → pago se registra dos veces
- No hay validación de estado previo

**Evidencia:**
```typescript
// reception.service.ts línea 85
const updatedOrder = receiveOrder(order, finalTotal, batchRef);
// ❌ receiveOrder valida status pero no es atómico con la persistencia
```

**Riesgo:**
- Doble facturación
- Créditos duplicados
- Movimientos financieros duplicados

**Impacto:** MEDIO-ALTO - Inconsistencia financiera

---

#### 9. Sin Control de Concurrencia

**Descripción:**  
No hay versionado optimista ni locks. Dos usuarios pueden modificar el mismo pedido simultáneamente.

**Problema:**
- Usuario A agrega pago de $50
- Usuario B agrega pago de $30 (lee estado antiguo)
- Solo se guarda uno de los pagos → pérdida de datos

**Evidencia:**
```typescript
// Ninguna entidad tiene campo 'version' o 'updatedAt' para control
```

**Riesgo:**
- Pérdida de pagos registrados
- Sobrescritura de cambios
- Inconsistencia en estado del pedido

**Impacto:** MEDIO - Pérdida de datos en escenarios concurrentes


---

### 🟡 MODERADOS (Deuda Técnica)

#### 10. Código Duplicado en Lógica Financiera

**Descripción:**  
Cálculos financieros repetidos en múltiples lugares:
- `getPaidAmount()` en `order/model.ts`
- `getEffectiveTotal()` en `order/model.ts`
- `calculatePendingBalance()` en `financialCalculator.ts`

**Problema:**
- Lógica duplicada aumenta riesgo de bugs
- Difícil mantener consistencia
- Cambios requieren actualizar múltiples archivos

**Impacto:** BAJO-MEDIO - Mantenibilidad

---

#### 11. Shared Mal Utilizado

**Descripción:**  
`shared/api` contiene lógica de negocio que debería estar en domain o application:
- `clientApi.ts` tiene lógica de sincronización de nombres
- `bankAccountApi.ts` expone `_getRawData()` (violación de encapsulación)

**Evidencia:**
```typescript
// bankAccountApi.ts línea 30
_getRawData: () => MOCK_BANK_ACCOUNTS,
// ❌ Expone estado interno
```

**Impacto:** BAJO - Violación de principios arquitectónicos

---

#### 12. Componentes y Código Sin Uso

**Descripción:**  
Varios archivos no están referenciados en el código:

**Archivos Sospechosos:**
- `src/shared/utils/` (carpeta vacía)
- `src/features/financial-movement/api/` (posible duplicado)
- Algunos componentes UI pueden no estar en uso

**Recomendación:** Auditoría de imports para detectar código muerto

**Impacto:** BAJO - Ruido en codebase

---

#### 13. Validaciones Solo en Frontend

**Descripción:**  
Reglas de negocio críticas solo existen en frontend:
- Validación de monto > 0
- Validación de saldo pendiente
- Validación de estado del pedido

**Problema:**
- Backend debe re-implementar todas las validaciones
- Riesgo de inconsistencia entre frontend y backend
- Posible bypass de validaciones con API directa

**Impacto:** MEDIO - Seguridad y consistencia

---

## ✅ ASPECTOS POSITIVOS (Lo que está bien)

1. **Separación de Capas Clara**: Application, Domain, Infrastructure bien definidas
2. **Servicios de Aplicación Centralizados**: `financialRecordService` es un buen patrón
3. **Funciones Puras en Dominio**: `order/model.ts` tiene lógica sin efectos secundarios
4. **React Query Bien Implementado**: Caché y sincronización correctas
5. **Componentes UI Reutilizables**: shadcn/ui bien integrado
6. **Documentación Existente**: `ESTADO_FRONTEND_COMPLETO.md` y `API_CONTRACTS_BACKEND.md`
7. **TypeScript Estricto**: Tipos bien definidos en todas las entidades
8. **Calculadoras Financieras**: `financialCalculator.ts` centraliza cálculos

---

## 🎯 DOMINIO REFINADO PROPUESTO

### Aggregate Roots Identificados

#### 1. Order (Aggregate Root) ✅
**Responsabilidad:** Gestionar ciclo de vida del pedido  
**Entidades Internas:**
- OrderPayment (Value Object)
- OrderItem (Value Object)

**Invariantes:**
- No puede entregarse sin estar recibido
- No puede recibirse dos veces
- Pagos no pueden exceder total (o generan crédito)

**Comandos:**
- CreateOrder
- AddPayment
- ReceiveOrder
- DeliverOrder
- CancelOrder

---

#### 2. ClientAccount (Aggregate Root) ⚠️ NUEVO
**Responsabilidad:** Gestionar información y créditos del cliente  
**Entidades Internas:**
- ClientCredit (Entity)
- ClientReward (Entity)

**Invariantes:**
- Crédito total = suma de créditos individuales
- No puede usar más crédito del disponible
- Puntos solo se aplican una vez por pedido

**Comandos:**
- CreateClient
- UpdateClientInfo
- AddCredit
- UseCredit
- AddRewardPoints
- RedeemReward

**Cambio Crítico:**  
Actualmente `ClientCredit` y `ClientReward` son agregados independientes. Deben unificarse bajo `ClientAccount` para garantizar consistencia.

---

#### 3. FinancialRecord (Aggregate Root) ⚠️ NUEVO
**Responsabilidad:** Registro financiero unificado  
**Entidades Internas:**
- Transaction (para auditoría)
- Movement (para cierre de caja)

**Invariantes:**
- Transaction y Movement siempre se crean juntos
- Referencia única (no duplicados)
- Monto siempre positivo

**Comandos:**
- RecordPayment
- RecordAdjustment
- RecordExpense

**Cambio Crítico:**  
Fusionar `FinancialTransaction` y `FinancialMovement` en un solo agregado que garantice consistencia.

---

#### 4. BankAccount (Aggregate Root) ✅
**Responsabilidad:** Gestionar balance de cuentas  
**Invariantes:**
- Balance no puede ser negativo (opcional según negocio)
- Solo cuentas activas pueden recibir movimientos

**Comandos:**
- CreateAccount
- UpdateBalance
- ActivateAccount
- DeactivateAccount

---

#### 5. InventoryEntry (Aggregate Root) ⚠️ NUEVO
**Responsabilidad:** Control de inventario físico  
**Entidades Internas:**
- InventoryMovement (Entity)

**Invariantes:**
- Un pedido solo puede tener un ENTRY
- Un pedido solo puede tener un DELIVERED
- No puede entregarse sin ENTRY previo

**Comandos:**
- RecordEntry
- RecordDelivery
- RecordReturn

**Cambio Crítico:**  
Actualmente `InventoryMovement` es entidad suelta. Debe agruparse bajo `InventoryEntry` con validaciones.


---

## 💰 MODELO FINANCIERO IDEAL

### Problema Actual
Dos sistemas financieros independientes:
1. **FinancialTransaction**: Auditoría y comprobantes
2. **FinancialMovement**: Cierre de caja y balance

**Riesgo:** Pueden desincronizarse si uno falla y el otro no.

### Solución Propuesta: Aggregate Root Unificado

```typescript
// Aggregate Root: FinancialRecord
interface FinancialRecord {
  id: string;
  type: 'PAYMENT' | 'ADJUSTMENT' | 'EXPENSE';
  referenceNumber: string; // UNIQUE
  amount: number;
  date: string;
  
  // Audit Trail (Transaction)
  audit: {
    clientId: string;
    clientName: string;
    orderId?: string;
    createdBy: string;
    notes?: string;
  };
  
  // Cash Closure (Movement)
  movement: {
    bankAccountId: string;
    source: 'ORDER_PAYMENT' | 'MANUAL' | 'ADJUSTMENT';
    paymentMethod?: 'EFECTIVO' | 'TRANSFERENCIA' | 'DEPOSITO' | 'CHEQUE';
    movementType: 'INCOME' | 'EXPENSE';
  };
  
  // Metadata
  createdAt: string;
  version: number; // Optimistic locking
}
```

### Ventajas
1. **Consistencia Garantizada**: Transaction y Movement siempre sincronizados
2. **Transaccionalidad**: Se crea todo o nada
3. **Auditoría Completa**: Toda la información en un solo lugar
4. **Cierre de Caja Confiable**: Balance siempre correcto

### Migración
```sql
-- Backend PostgreSQL
CREATE TABLE financial_records (
  id UUID PRIMARY KEY,
  type VARCHAR(20) NOT NULL,
  reference_number VARCHAR(100) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  date TIMESTAMP NOT NULL,
  
  -- Audit
  client_id UUID NOT NULL REFERENCES clients(id),
  client_name VARCHAR(200) NOT NULL,
  order_id UUID REFERENCES orders(id),
  created_by VARCHAR(100) NOT NULL,
  notes TEXT,
  
  -- Movement
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id),
  source VARCHAR(20) NOT NULL,
  payment_method VARCHAR(20),
  movement_type VARCHAR(10) NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  version INT DEFAULT 1,
  
  INDEX idx_client (client_id),
  INDEX idx_order (order_id),
  INDEX idx_bank_account (bank_account_id),
  INDEX idx_date (date),
  INDEX idx_reference (reference_number)
);
```

---

## 💳 MODELO DE CRÉDITOS IDEAL

### Problema Actual
`ClientCredit` es entidad suelta sin validación de:
- Saldo total disponible
- Uso concurrente
- Duplicados

### Solución Propuesta: ClientAccount Aggregate

```typescript
// Aggregate Root: ClientAccount
interface ClientAccount {
  id: string; // = clientId
  clientId: string;
  clientName: string;
  
  // Credits
  credits: ClientCredit[];
  totalCreditAvailable: number; // Calculado pero validado
  
  // Rewards
  rewards: {
    totalPoints: number;
    totalOrders: number;
    totalSpent: number;
    level: 'BRONCE' | 'PLATA' | 'ORO' | 'PLATINO';
    redemptions: RewardRedemption[];
  };
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  version: number;
}

interface ClientCredit {
  id: string;
  amount: number;
  remainingAmount: number; // Nuevo campo
  originTransactionId: string;
  originOrderId?: string;
  status: 'AVAILABLE' | 'USED' | 'EXPIRED';
  createdAt: string;
  usedAt?: string;
}
```

### Invariantes Garantizados
1. `totalCreditAvailable = sum(credits.filter(c => c.status === 'AVAILABLE').remainingAmount)`
2. No puede usar más crédito del disponible
3. Crédito usado se marca como 'USED' o se reduce `remainingAmount`
4. Puntos solo se aplican una vez por pedido (validación en comando)

### Comandos del Aggregate
```typescript
class ClientAccount {
  addCredit(amount: number, originTransactionId: string): void {
    // Valida duplicados
    if (this.credits.some(c => c.originTransactionId === originTransactionId)) {
      throw new Error('Credit already exists for this transaction');
    }
    
    const credit = new ClientCredit({
      amount,
      remainingAmount: amount,
      originTransactionId,
      status: 'AVAILABLE'
    });
    
    this.credits.push(credit);
    this.recalculateTotalCredit();
  }
  
  useCredit(amountToUse: number, orderId: string): UsedCredits[] {
    if (amountToUse > this.totalCreditAvailable) {
      throw new Error('Insufficient credit balance');
    }
    
    const usedCredits: UsedCredits[] = [];
    let remaining = amountToUse;
    
    // FIFO: Usar créditos más antiguos primero
    for (const credit of this.credits.filter(c => c.status === 'AVAILABLE')) {
      if (remaining <= 0) break;
      
      const toUse = Math.min(remaining, credit.remainingAmount);
      credit.remainingAmount -= toUse;
      
      if (credit.remainingAmount === 0) {
        credit.status = 'USED';
        credit.usedAt = new Date().toISOString();
      }
      
      usedCredits.push({ creditId: credit.id, amount: toUse });
      remaining -= toUse;
    }
    
    this.recalculateTotalCredit();
    return usedCredits;
  }
  
  addRewardPoints(orderId: string, points: number): void {
    // Validar que no se hayan aplicado puntos para este pedido
    if (this.rewards.redemptions.some(r => r.orderId === orderId)) {
      throw new Error('Reward points already applied for this order');
    }
    
    this.rewards.totalPoints += points;
    this.rewards.totalOrders += 1;
    this.rewards.level = this.calculateLevel();
  }
}
```

### Migración Backend
```sql
CREATE TABLE client_accounts (
  id UUID PRIMARY KEY,
  client_id UUID UNIQUE NOT NULL REFERENCES clients(id),
  total_credit_available DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_reward_points INT NOT NULL DEFAULT 0,
  reward_level VARCHAR(20) NOT NULL DEFAULT 'BRONCE',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  version INT DEFAULT 1
);

CREATE TABLE client_credits (
  id UUID PRIMARY KEY,
  client_account_id UUID NOT NULL REFERENCES client_accounts(id),
  amount DECIMAL(10,2) NOT NULL,
  remaining_amount DECIMAL(10,2) NOT NULL,
  origin_transaction_id VARCHAR(100) UNIQUE NOT NULL,
  origin_order_id UUID REFERENCES orders(id),
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  used_at TIMESTAMP,
  
  INDEX idx_account (client_account_id),
  INDEX idx_status (status)
);

CREATE TABLE reward_applications (
  id UUID PRIMARY KEY,
  client_account_id UUID NOT NULL REFERENCES client_accounts(id),
  order_id UUID UNIQUE NOT NULL REFERENCES orders(id),
  points_earned INT NOT NULL,
  applied_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_account (client_account_id),
  UNIQUE (order_id) -- Garantiza una sola aplicación por pedido
);
```


---

## 🗄️ PROPUESTA DE BASE DE DATOS

### Esquema PostgreSQL Completo

```sql
-- ============================================================================
-- CORE ENTITIES
-- ============================================================================

-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identification_type VARCHAR(20) NOT NULL,
  identification_number VARCHAR(50) NOT NULL,
  first_name VARCHAR(200) NOT NULL,
  country VARCHAR(100) NOT NULL,
  province VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  neighborhood VARCHAR(100),
  sector VARCHAR(100),
  email VARCHAR(200) NOT NULL,
  phone1 VARCHAR(20) NOT NULL,
  operator1 VARCHAR(50) NOT NULL,
  phone2 VARCHAR(20),
  operator2 VARCHAR(50),
  reference TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (identification_number),
  INDEX idx_name (first_name),
  INDEX idx_email (email)
);

-- Brands
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bank Accounts
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('BANK', 'CASH')),
  holder_name VARCHAR(200) NOT NULL,
  bank_name VARCHAR(200) NOT NULL,
  account_number VARCHAR(100) NOT NULL,
  current_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  version INT DEFAULT 1,
  
  INDEX idx_type (type),
  INDEX idx_active (is_active)
);

-- ============================================================================
-- ORDERS AGGREGATE
-- ============================================================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Relations
  client_id UUID NOT NULL REFERENCES clients(id),
  client_name VARCHAR(200) NOT NULL, -- Denormalized for performance
  brand_id UUID NOT NULL REFERENCES brands(id),
  brand_name VARCHAR(200) NOT NULL, -- Denormalized
  
  -- Business Data
  sales_channel VARCHAR(20) NOT NULL,
  type VARCHAR(30) NOT NULL,
  status VARCHAR(30) NOT NULL,
  
  -- Financials
  total DECIMAL(10,2) NOT NULL,
  real_invoice_total DECIMAL(10,2),
  invoice_number VARCHAR(100),
  payment_method VARCHAR(20) NOT NULL,
  bank_account_id UUID REFERENCES bank_accounts(id),
  transaction_date DATE,
  
  -- Dates
  possible_delivery_date DATE NOT NULL,
  reception_date TIMESTAMP,
  delivery_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Metadata
  notes TEXT,
  version INT DEFAULT 1,
  
  INDEX idx_client (client_id),
  INDEX idx_brand (brand_id),
  INDEX idx_status (status),
  INDEX idx_receipt (receipt_number),
  INDEX idx_dates (reception_date, delivery_date)
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_name VARCHAR(200) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  brand_id UUID REFERENCES brands(id),
  brand_name VARCHAR(200),
  link TEXT,
  
  INDEX idx_order (order_id)
);

CREATE TABLE order_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  method VARCHAR(20),
  reference VARCHAR(100),
  bank_account_id UUID REFERENCES bank_accounts(id),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_order (order_id),
  INDEX idx_created (created_at)
);

-- ============================================================================
-- FINANCIAL RECORDS AGGREGATE (UNIFICADO)
-- ============================================================================

CREATE TABLE financial_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('PAYMENT', 'ADJUSTMENT', 'EXPENSE')),
  reference_number VARCHAR(100) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  date TIMESTAMP NOT NULL,
  
  -- Audit Trail
  client_id UUID NOT NULL REFERENCES clients(id),
  client_name VARCHAR(200) NOT NULL,
  order_id UUID REFERENCES orders(id),
  created_by VARCHAR(100) NOT NULL,
  notes TEXT,
  
  -- Cash Closure Movement
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id),
  source VARCHAR(30) NOT NULL,
  payment_method VARCHAR(20),
  movement_type VARCHAR(10) NOT NULL CHECK (movement_type IN ('INCOME', 'EXPENSE')),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  version INT DEFAULT 1,
  
  INDEX idx_client (client_id),
  INDEX idx_order (order_id),
  INDEX idx_bank_account (bank_account_id),
  INDEX idx_date (date),
  INDEX idx_reference (reference_number),
  INDEX idx_type (type)
);

-- ============================================================================
-- CLIENT ACCOUNT AGGREGATE (CRÉDITOS Y RECOMPENSAS)
-- ============================================================================

CREATE TABLE client_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID UNIQUE NOT NULL REFERENCES clients(id),
  
  -- Credits
  total_credit_available DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (total_credit_available >= 0),
  
  -- Rewards
  total_reward_points INT NOT NULL DEFAULT 0 CHECK (total_reward_points >= 0),
  total_orders_completed INT NOT NULL DEFAULT 0,
  total_spent DECIMAL(10,2) NOT NULL DEFAULT 0,
  reward_level VARCHAR(20) NOT NULL DEFAULT 'BRONCE',
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  version INT DEFAULT 1,
  
  INDEX idx_client (client_id)
);

CREATE TABLE client_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_account_id UUID NOT NULL REFERENCES client_accounts(id) ON DELETE CASCADE,
  
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  remaining_amount DECIMAL(10,2) NOT NULL CHECK (remaining_amount >= 0),
  
  origin_transaction_id VARCHAR(100) UNIQUE NOT NULL,
  origin_order_id UUID REFERENCES orders(id),
  
  status VARCHAR(20) NOT NULL CHECK (status IN ('AVAILABLE', 'USED', 'EXPIRED')),
  
  created_at TIMESTAMP DEFAULT NOW(),
  used_at TIMESTAMP,
  
  INDEX idx_account (client_account_id),
  INDEX idx_status (status),
  INDEX idx_origin (origin_transaction_id)
);

CREATE TABLE reward_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_account_id UUID NOT NULL REFERENCES client_accounts(id) ON DELETE CASCADE,
  order_id UUID UNIQUE NOT NULL REFERENCES orders(id),
  points_earned INT NOT NULL CHECK (points_earned > 0),
  applied_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_account (client_account_id),
  UNIQUE (order_id) -- Garantiza una sola aplicación por pedido
);

CREATE TABLE reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_account_id UUID NOT NULL REFERENCES client_accounts(id),
  prize_id UUID NOT NULL,
  prize_name VARCHAR(200) NOT NULL,
  points_used INT NOT NULL CHECK (points_used > 0),
  status VARCHAR(20) NOT NULL,
  redeemed_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_account (client_account_id),
  INDEX idx_status (status)
);

-- ============================================================================
-- INVENTORY AGGREGATE
-- ============================================================================

CREATE TABLE inventory_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID UNIQUE NOT NULL REFERENCES orders(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  brand_id UUID NOT NULL REFERENCES brands(id),
  
  entry_date TIMESTAMP,
  delivery_date TIMESTAMP,
  return_date TIMESTAMP,
  
  status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'IN_WAREHOUSE', 'DELIVERED', 'RETURNED')),
  
  created_by VARCHAR(100) NOT NULL,
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  version INT DEFAULT 1,
  
  INDEX idx_order (order_id),
  INDEX idx_status (status),
  INDEX idx_dates (entry_date, delivery_date)
);

CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_entry_id UUID NOT NULL REFERENCES inventory_entries(id) ON DELETE CASCADE,
  
  type VARCHAR(20) NOT NULL CHECK (type IN ('ENTRY', 'DELIVERED', 'RETURNED')),
  date TIMESTAMP NOT NULL,
  created_by VARCHAR(100) NOT NULL,
  notes TEXT,
  
  delivery_details JSONB, -- { deliveredTo, deliveryDate }
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_entry (inventory_entry_id),
  INDEX idx_type (type),
  INDEX idx_date (date)
);

-- ============================================================================
-- CASH CLOSURE (READ-ONLY SNAPSHOTS)
-- ============================================================================

CREATE TABLE cash_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_date TIMESTAMP NOT NULL,
  to_date TIMESTAMP NOT NULL,
  
  total_income DECIMAL(10,2) NOT NULL,
  total_expense DECIMAL(10,2) NOT NULL,
  net_total DECIMAL(10,2) NOT NULL,
  
  movement_count INT NOT NULL,
  notes TEXT,
  
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_dates (from_date, to_date)
);

CREATE TABLE cash_closure_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_closure_id UUID NOT NULL REFERENCES cash_closures(id) ON DELETE CASCADE,
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id),
  bank_account_name VARCHAR(200) NOT NULL,
  balance DECIMAL(10,2) NOT NULL,
  
  INDEX idx_closure (cash_closure_id)
);

-- ============================================================================
-- AUXILIARY TABLES
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  role VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  call_date TIMESTAMP NOT NULL,
  notes TEXT,
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_order (order_id),
  INDEX idx_client (client_id),
  INDEX idx_date (call_date)
);
```


### Restricciones de Integridad Adicionales

```sql
-- Garantizar que order_payments.amount > 0
ALTER TABLE order_payments ADD CONSTRAINT chk_payment_positive CHECK (amount > 0);

-- Garantizar que un pedido no puede tener status ENTREGADO sin reception_date
CREATE OR REPLACE FUNCTION check_delivery_requires_reception()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'ENTREGADO' AND NEW.reception_date IS NULL THEN
    RAISE EXCEPTION 'Cannot deliver order without reception date';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_delivery
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION check_delivery_requires_reception();

-- Garantizar que client_credits.remaining_amount <= amount
ALTER TABLE client_credits ADD CONSTRAINT chk_remaining_lte_amount 
  CHECK (remaining_amount <= amount);

-- Garantizar que inventory_entry es único por order
-- Ya garantizado por UNIQUE constraint en order_id

-- Trigger para actualizar client_accounts.total_credit_available
CREATE OR REPLACE FUNCTION update_client_credit_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE client_accounts
  SET total_credit_available = (
    SELECT COALESCE(SUM(remaining_amount), 0)
    FROM client_credits
    WHERE client_account_id = NEW.client_account_id
      AND status = 'AVAILABLE'
  ),
  updated_at = NOW(),
  version = version + 1
  WHERE id = NEW.client_account_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_credit_total_insert
AFTER INSERT ON client_credits
FOR EACH ROW
EXECUTE FUNCTION update_client_credit_total();

CREATE TRIGGER trg_update_credit_total_update
AFTER UPDATE ON client_credits
FOR EACH ROW
EXECUTE FUNCTION update_client_credit_total();
```

### Índices de Performance

```sql
-- Índices compuestos para queries comunes
CREATE INDEX idx_orders_client_status ON orders(client_id, status);
CREATE INDEX idx_orders_brand_status ON orders(brand_id, status);
CREATE INDEX idx_orders_status_dates ON orders(status, reception_date, delivery_date);

CREATE INDEX idx_financial_records_client_date ON financial_records(client_id, date);
CREATE INDEX idx_financial_records_bank_date ON financial_records(bank_account_id, date);

CREATE INDEX idx_inventory_status_dates ON inventory_entries(status, entry_date, delivery_date);

-- Índices para búsquedas de texto
CREATE INDEX idx_clients_name_trgm ON clients USING gin(first_name gin_trgm_ops);
CREATE INDEX idx_orders_receipt_trgm ON orders USING gin(receipt_number gin_trgm_ops);
```

---

## 🌐 PROPUESTA DE API REST

### Arquitectura Hexagonal Backend

```
┌─────────────────────────────────────────────────────────────┐
│                     API LAYER (HTTP)                         │
│              (Express/Fastify Controllers)                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                           │
│                  (Use Cases / Commands)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ CreateOrderUseCase                                   │   │
│  │ AddPaymentUseCase                                    │   │
│  │ ReceiveOrderUseCase                                  │   │
│  │ DeliverOrderUseCase                                  │   │
│  │ GenerateCreditUseCase                                │   │
│  │ UseCreditUseCase                                     │   │
│  │ CreateFinancialRecordUseCase                         │   │
│  │ CloseCashUseCase                                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     DOMAIN LAYER                             │
│                  (Aggregates + Logic)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Order Aggregate                                      │   │
│  │ ClientAccount Aggregate                              │   │
│  │ FinancialRecord Aggregate                            │   │
│  │ BankAccount Aggregate                                │   │
│  │ InventoryEntry Aggregate                             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                 INFRASTRUCTURE LAYER                         │
│              (Repositories + External Services)              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ PostgreSQL Repositories                              │   │
│  │ Transaction Manager (Unit of Work)                   │   │
│  │ Event Publisher (Domain Events)                      │   │
│  │ PDF Generator                                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Endpoints Propuestos

#### Orders
```
POST   /api/orders                    # Crear pedido
GET    /api/orders                    # Listar pedidos (filtros)
GET    /api/orders/:id                # Obtener pedido
PUT    /api/orders/:id                # Actualizar pedido
DELETE /api/orders/:id                # Cancelar pedido

POST   /api/orders/:id/payments       # Agregar pago
PUT    /api/orders/:id/payments/:pid  # Editar pago
DELETE /api/orders/:id/payments/:pid  # Eliminar pago

POST   /api/orders/:id/receive        # Recepcionar pedido
POST   /api/orders/:id/deliver        # Entregar pedido
POST   /api/orders/batch-receive      # Recepción batch

GET    /api/orders/:id/receipt        # PDF recibo
GET    /api/orders/:id/labels         # PDF etiquetas
```

#### Clients
```
POST   /api/clients                   # Crear cliente
GET    /api/clients                   # Listar clientes
GET    /api/clients/:id               # Obtener cliente
PUT    /api/clients/:id               # Actualizar cliente
DELETE /api/clients/:id               # Eliminar cliente

GET    /api/clients/:id/account       # Obtener cuenta (créditos + rewards)
GET    /api/clients/:id/credits       # Listar créditos disponibles
POST   /api/clients/:id/credits/use   # Usar crédito
GET    /api/clients/:id/rewards       # Obtener recompensas
POST   /api/clients/:id/rewards/redeem # Canjear premio
```

#### Financial
```
POST   /api/financial/records         # Crear registro financiero
GET    /api/financial/records         # Listar registros (filtros)
GET    /api/financial/records/:id     # Obtener registro

GET    /api/financial/movements       # Listar movimientos (para cierre)
POST   /api/financial/cash-closure    # Crear cierre de caja
GET    /api/financial/cash-closures   # Listar cierres
GET    /api/financial/cash-closures/:id # Obtener cierre detallado
```

#### Bank Accounts
```
POST   /api/bank-accounts             # Crear cuenta
GET    /api/bank-accounts             # Listar cuentas
GET    /api/bank-accounts/:id         # Obtener cuenta
PUT    /api/bank-accounts/:id         # Actualizar cuenta
PATCH  /api/bank-accounts/:id/toggle  # Activar/Desactivar
```

#### Inventory
```
GET    /api/inventory/entries         # Listar entradas
GET    /api/inventory/entries/:id     # Obtener entrada
POST   /api/inventory/entries/:id/movements # Registrar movimiento
```

#### Dashboard
```
GET    /api/dashboard/metrics         # Métricas generales
GET    /api/dashboard/charts          # Datos para gráficos
GET    /api/dashboard/alerts          # Alertas críticas
```

#### Auth
```
POST   /api/auth/login                # Login
POST   /api/auth/logout               # Logout
GET    /api/auth/me                   # Usuario actual
POST   /api/auth/refresh              # Refresh token
```

### Ejemplo de Endpoint Transaccional

```typescript
// POST /api/orders/:id/receive
// Body: { realInvoiceTotal, invoiceNumber, abonoRecepcion? }

async receiveOrder(req: Request, res: Response) {
  const { id } = req.params;
  const { realInvoiceTotal, invoiceNumber, abonoRecepcion } = req.body;
  const userId = req.user.id;
  
  // Use Case con transacción ACID
  const result = await this.receiveOrderUseCase.execute({
    orderId: id,
    realInvoiceTotal,
    invoiceNumber,
    abonoRecepcion: abonoRecepcion || 0,
    userId
  });
  
  // Use Case internamente:
  // 1. Inicia transacción DB
  // 2. Carga Order Aggregate
  // 3. Ejecuta order.receive(realInvoiceTotal)
  // 4. Si genera crédito: Carga ClientAccount y ejecuta addCredit()
  // 5. Si hay abono: Crea FinancialRecord
  // 6. Crea InventoryEntry
  // 7. Commit transacción
  // 8. Publica eventos de dominio
  
  return res.json(result);
}
```


---

## ⚠️ IDENTIFICACIÓN DE RIESGOS

### Riesgos de Inconsistencia

| Riesgo | Probabilidad | Impacto | Severidad |
|--------|--------------|---------|-----------|
| FinancialTransaction y FinancialMovement desincronizados | ALTA | CRÍTICO | 🔴 CRÍTICO |
| ClientCredit duplicado para mismo ajuste | MEDIA | ALTO | 🟠 ALTO |
| Order.paidAmount != sum(payments) | MEDIA | ALTO | 🟠 ALTO |
| ClientName desincronizado entre entidades | ALTA | MEDIO | 🟡 MEDIO |
| Reward points aplicados dos veces | MEDIA | MEDIO | 🟡 MEDIO |

### Riesgos de Concurrencia

| Riesgo | Probabilidad | Impacto | Severidad |
|--------|--------------|---------|-----------|
| Dos usuarios modifican mismo pedido simultáneamente | ALTA | ALTO | 🟠 ALTO |
| Dos usuarios usan mismo crédito simultáneamente | MEDIA | CRÍTICO | 🔴 CRÍTICO |
| Pedido recepcionado dos veces | BAJA | ALTO | 🟡 MEDIO |
| Pedido entregado dos veces | BAJA | ALTO | 🟡 MEDIO |
| BankAccount.balance corrupto por race condition | MEDIA | CRÍTICO | 🔴 CRÍTICO |

### Riesgos Financieros

| Riesgo | Probabilidad | Impacto | Severidad |
|--------|--------------|---------|-----------|
| Cierre de caja incorrecto por datos derivados | ALTA | CRÍTICO | 🔴 CRÍTICO |
| Crédito usado sin validación de saldo | MEDIA | ALTO | 🟠 ALTO |
| Pago registrado pero no aplicado a pedido | BAJA | CRÍTICO | 🟠 ALTO |
| Abono excede saldo pero no genera crédito | BAJA | MEDIO | 🟡 MEDIO |
| Balance de cuenta negativo | BAJA | ALTO | 🟡 MEDIO |

### Riesgos de Doble Ejecución

| Riesgo | Probabilidad | Impacto | Severidad |
|--------|--------------|---------|-----------|
| Pago registrado dos veces por retry | MEDIA | ALTO | 🟠 ALTO |
| Crédito generado dos veces | MEDIA | ALTO | 🟠 ALTO |
| Puntos de recompensa aplicados dos veces | MEDIA | MEDIO | 🟡 MEDIO |
| Movimiento de inventario duplicado | BAJA | MEDIO | 🟡 MEDIO |

### Riesgos de Datos Derivados

| Riesgo | Probabilidad | Impacto | Severidad |
|--------|--------------|---------|-----------|
| Order.paidAmount desincronizado | ALTA | ALTO | 🟠 ALTO |
| ClientAccount.totalCreditAvailable incorrecto | MEDIA | CRÍTICO | 🔴 CRÍTICO |
| ClientReward.totalSpent incorrecto | MEDIA | MEDIO | 🟡 MEDIO |
| Dashboard muestra datos obsoletos | ALTA | BAJO | 🟢 BAJO |

---

## 📋 PLAN DE ACCIÓN

### FASE 1: Correcciones Obligatorias Pre-Backend (2-3 días)

#### 1.1 Eliminar order.paidAmount del Modelo
**Acción:** Remover campo `paidAmount` de `Order` type y usar solo `getPaidAmount()`  
**Archivos:**
- `src/entities/order/model/types.ts`
- Todos los componentes que usan `order.paidAmount`

**Validación:** Buscar todos los usos de `.paidAmount` y reemplazar por `getPaidAmount(order)`

---

#### 1.2 Agregar Validación de Duplicados en Recepción
**Acción:** Validar que pedido no esté ya recibido antes de recepcionar  
**Archivos:**
- `src/application/order/reception.service.ts`

```typescript
// Agregar validación
if (order.status === 'RECIBIDO_EN_BODEGA') {
  throw new Error('Order already received');
}
```

---

#### 1.3 Agregar Validación de Duplicados en Entrega
**Acción:** Validar que pedido no esté ya entregado  
**Archivos:**
- Componente de entrega

```typescript
if (order.status === 'ENTREGADO') {
  throw new Error('Order already delivered');
}
```

---

#### 1.4 Documentar Limitaciones Actuales
**Acción:** Crear documento `LIMITACIONES_MOCK.md` que liste:
- Falta de transaccionalidad real
- Falta de control de concurrencia
- Falta de validación de duplicados en créditos
- Falta de validación de duplicados en recompensas

---

### FASE 2: Decisiones de Dominio (1 día)

#### 2.1 Definir Aggregate Roots Finales
**Decisión:** Confirmar con stakeholders:
- ¿FinancialRecord unificado o separado?
- ¿ClientAccount agrupa créditos y rewards?
- ¿InventoryEntry es aggregate o entity?

**Entregable:** Documento `AGGREGATE_ROOTS_FINAL.md`

---

#### 2.2 Definir Reglas de Negocio Críticas
**Decisión:** Documentar invariantes obligatorios:
- ¿Balance de cuenta puede ser negativo?
- ¿Crédito expira? ¿Cuándo?
- ¿Puntos se pueden restar?
- ¿Pedido se puede cancelar después de recibido?

**Entregable:** Documento `REGLAS_NEGOCIO.md`

---

### FASE 3: Ajustes en Frontend (2-3 días)

#### 3.1 Refactorizar Servicios de Aplicación
**Acción:** Preparar servicios para llamadas HTTP reales  
**Archivos:**
- `src/application/**/*.service.ts`

**Cambios:**
- Remover lógica de rollback manual
- Simplificar a llamadas HTTP únicas
- Agregar manejo de errores HTTP

---

#### 3.2 Agregar Manejo de Errores de Concurrencia
**Acción:** Preparar UI para errores 409 Conflict  
**Componentes:** Todos los formularios de edición

```typescript
catch (error) {
  if (error.status === 409) {
    toast.error('Otro usuario modificó este registro. Por favor recarga.');
  }
}
```

---

#### 3.3 Agregar Indicadores de Carga Optimistas
**Acción:** Mejorar UX con estados de carga  
**Componentes:** Todos los botones async

---

### FASE 4: Diseño Backend (3-5 días)

#### 4.1 Implementar Aggregate Roots
**Tecnología:** Node.js + TypeScript + PostgreSQL  
**Framework:** Express o Fastify  
**ORM:** TypeORM o Prisma

**Orden de Implementación:**
1. BankAccount (más simple)
2. Client + ClientAccount
3. Order
4. FinancialRecord
5. InventoryEntry

---

#### 4.2 Implementar Unit of Work Pattern
**Acción:** Garantizar transaccionalidad ACID  
**Librería:** TypeORM Transaction Manager

```typescript
await this.dataSource.transaction(async (manager) => {
  // Todas las operaciones aquí son atómicas
  await manager.save(order);
  await manager.save(financialRecord);
  await manager.save(clientAccount);
});
```

---

#### 4.3 Implementar Optimistic Locking
**Acción:** Agregar campo `version` a todas las entidades  
**Validación:** Comparar version antes de actualizar

```typescript
@VersionColumn()
version: number;

// Al actualizar
const result = await repo.update(
  { id, version: currentVersion },
  { ...updates, version: currentVersion + 1 }
);

if (result.affected === 0) {
  throw new ConflictError('Record was modified by another user');
}
```

---

#### 4.4 Implementar Domain Events
**Acción:** Publicar eventos para efectos secundarios  
**Eventos:**
- `OrderReceived` → Crear InventoryEntry
- `OrderDelivered` → Aplicar RewardPoints
- `CreditGenerated` → Notificar cliente
- `PaymentReceived` → Actualizar Dashboard

---

### FASE 5: Migración de Datos (1-2 días)

#### 5.1 Crear Scripts de Migración
**Acción:** Migrar datos mock a PostgreSQL  
**Herramienta:** TypeORM Migrations

---

#### 5.2 Validar Integridad de Datos
**Acción:** Verificar que todos los datos migraron correctamente  
**Queries de Validación:**
```sql
-- Validar que todos los orders tienen client válido
SELECT * FROM orders o 
WHERE NOT EXISTS (SELECT 1 FROM clients c WHERE c.id = o.client_id);

-- Validar que sum(payments) = paidAmount (si aún existe)
SELECT o.id, 
  (SELECT SUM(amount) FROM order_payments WHERE order_id = o.id) as calc,
  o.paid_amount as stored
FROM orders o
WHERE calc != stored;
```

---

### FASE 6: Testing (3-5 días)

#### 6.1 Unit Tests de Aggregates
**Cobertura:** 100% de lógica de dominio  
**Framework:** Jest

---

#### 6.2 Integration Tests de Use Cases
**Cobertura:** Todos los flujos críticos  
**Escenarios:**
- Crear pedido → Abonar → Recepcionar → Entregar
- Generar crédito → Usar crédito
- Cierre de caja con múltiples movimientos

---

#### 6.3 E2E Tests
**Cobertura:** Flujos completos desde UI  
**Framework:** Playwright o Cypress

---

### FASE 7: Deployment (2-3 días)

#### 7.1 Configurar Infraestructura
**Servicios:**
- PostgreSQL (RDS o similar)
- Backend API (EC2, ECS, o serverless)
- Frontend (S3 + CloudFront o Vercel)

---

#### 7.2 Configurar Monitoreo
**Herramientas:**
- Logs: CloudWatch o Datadog
- Métricas: Prometheus + Grafana
- Alertas: PagerDuty o similar

---

#### 7.3 Plan de Rollback
**Acción:** Documentar cómo revertir a mock si falla  
**Estrategia:** Feature flags para activar/desactivar backend

---

## 📊 RESUMEN DE ENTREGABLES

### Documentos a Crear
1. ✅ `AUDITORIA_ARQUITECTONICA_COMPLETA.md` (este documento)
2. ⏳ `LIMITACIONES_MOCK.md`
3. ⏳ `AGGREGATE_ROOTS_FINAL.md`
4. ⏳ `REGLAS_NEGOCIO.md`
5. ⏳ `PLAN_MIGRACION_BACKEND.md`

### Código a Refactorizar
1. ⏳ Remover `order.paidAmount`
2. ⏳ Agregar validaciones de duplicados
3. ⏳ Simplificar servicios de aplicación
4. ⏳ Agregar manejo de errores de concurrencia

### Backend a Implementar
1. ⏳ Aggregate Roots (5)
2. ⏳ Use Cases (15+)
3. ⏳ Repositories (5)
4. ⏳ API Endpoints (40+)
5. ⏳ Unit Tests (100+)
6. ⏳ Integration Tests (30+)

---

## 🎯 CONCLUSIÓN

El frontend está **funcionalmente completo** pero presenta **riesgos arquitectónicos críticos** que deben resolverse antes de producción:

### Problemas Críticos Identificados
1. Doble sistema financiero sin garantía de consistencia
2. Créditos sin aggregate root ni validación
3. Datos derivados almacenados (riesgo de desincronización)
4. Falta de límites transaccionales reales
5. Inventario desconectado sin validaciones

### Recomendación Final
**NO iniciar backend sin resolver los problemas críticos del dominio.**

El modelo actual funcionará con datos mock pero **fallará en producción** por:
- Inconsistencias financieras
- Pérdida de dinero por créditos mal gestionados
- Corrupción de datos por concurrencia
- Imposibilidad de reconciliar cierre de caja

### Próximos Pasos Inmediatos
1. Revisar este documento con el equipo
2. Tomar decisiones de dominio (Fase 2)
3. Implementar correcciones obligatorias (Fase 1)
4. Diseñar backend con arquitectura hexagonal (Fase 4)
5. Implementar con TDD y transaccionalidad ACID

**Tiempo Estimado Total:** 15-20 días de desarrollo  
**Riesgo de No Hacerlo:** Sistema inestable en producción con pérdidas financieras

---

**Fin del Documento de Auditoría**

