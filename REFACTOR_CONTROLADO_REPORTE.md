# 🔧 REPORTE DE REFACTOR CONTROLADO

**Fecha:** 19 de Febrero de 2026  
**Tipo:** Refactor Estructural Mínimo  
**Objetivo:** Resolver problemas críticos antes de integración backend

---

## ✅ FASE 1 — DUPLICACIONES Y NAMING (COMPLETADO)

### Cambios Aplicados

#### 1.1 Consolidación de `bank-account` → `bank-accounts`

**Acción:** Movidos hooks de `features/bank-account/api/` a `features/bank-accounts/api/`

**Archivos Creados:**
- `src/features/bank-accounts/api/hooks.ts`

**Archivos Modificados (11):**
- `src/features/bank-accounts/index.ts` - Agregados exports de hooks
- `src/features/bank-accounts/components/BankAccountTable.tsx`
- `src/features/bank-accounts/components/BankAccountList.tsx`
- `src/features/bank-accounts/components/BankAccountForm.tsx`
- `src/features/order-delivery/ui/DeliverOrderModal.tsx`
- `src/features/financial-dashboard/ui/FinancialDashboardPage.tsx`
- `src/features/order-management/ui/OrderFormModal.tsx`
- `src/features/cash-closure/ui/CashClosurePage.tsx`
- `src/features/order-payments/components/OrderPaymentForm.tsx`
- `src/features/order-payments/components/OrderPaymentList.tsx`
- `src/features/financial-audit/model/useFinancialAudit.tsx`
- `src/features/order-management/ui/OrderDetailModal.tsx`

**Imports Actualizados:**
```typescript
// ANTES
import { useBankAccountList } from "@/features/bank-account/api/hooks"

// DESPUÉS
import { useBankAccountList } from "@/features/bank-accounts/api/hooks"
```

**Archivos para Eliminar:**
- ⚠️ `src/features/bank-account/` (carpeta completa)
  - Estado: Pendiente de eliminación manual
  - Razón: Servidor de desarrollo bloqueó eliminación automática

#### 1.2 Consolidación de `brand` → `brands`

**Acción:** Movidos hooks de `features/brand/api/` a `features/brands/api/`

**Archivos Creados:**
- `src/features/brands/api/hooks.ts`

**Archivos Modificados (5):**
- `src/features/brands/index.ts` - Agregados exports de hooks
- `src/features/brands/components/BrandForm.tsx`
- `src/features/brands/components/BrandTable.tsx`
- `src/features/brands/components/BrandList.tsx`
- `src/features/order-management/ui/OrderFormModal.tsx`

**Imports Actualizados:**
```typescript
// ANTES
import { useBrandList } from "@/features/brand/api/hooks"

// DESPUÉS
import { useBrandList } from "@/features/brands/api/hooks"
```

**Archivos Eliminados:**
- ✅ `src/features/brand/` (carpeta completa)

### Resumen de Cambios FASE 1

| Métrica | Valor |
|---------|-------|
| Archivos creados | 2 |
| Archivos modificados | 16 |
| Imports actualizados | 16 |
| Carpetas eliminadas | 1 (brand) |
| Carpetas pendientes | 1 (bank-account) |
| Imports rotos | 0 |

### Verificación

✅ No hay imports a `@/features/bank-account` (sin 's')  
✅ No hay imports a `@/features/brand` (sin 's')  
✅ Todos los imports apuntan a las carpetas consolidadas

---

## 🔍 FASE 2 — ENTIDADES HUÉRFANAS (ANÁLISIS)

### 2.1 Análisis de `entities/call-record`

**Estado:** ✅ EN USO - NO ELIMINAR

**Uso Detectado:**
- `features/calls/model/hooks.ts` - Define MOCK_CALLS: CallRecord[]
- `features/calls/ui/CallsTable.tsx` - Props: calls: CallRecord[]
- `features/calls/ui/CallsPage.tsx` - Importa CALL_REASONS, CALL_RESULTS
- `features/calls/ui/CallFormModal.tsx` - Usa CallReason, CallResult types

**Archivos de la Entidad:**
- `entities/call-record/model/types.ts` - Types: CallRecord, CallReason, CallResult
- `entities/call-record/model/model.ts` - Constants: CALL_REASONS, CALL_RESULTS
- `entities/call-record/model/index.ts` - Exports

**Conclusión:** 
La entidad `call-record` está activamente en uso por el feature `calls`. No es huérfana.

**Recomendación:** MANTENER

---

### 2.2 Análisis de `entities/payment`

**Estado:** 🔴 HUÉRFANA - NO SE USA

**Búsqueda de Uso:**
```bash
grep -r "@/entities/payment" src/
# Resultado: No matches found
```

**Archivos de la Entidad:**
- `entities/payment/model/types.ts` - Types: Payment, PaymentPayload, PaymentMethod, PaymentStatus

**Comparación con OrderPayment:**

| Aspecto | Payment (entity) | OrderPayment (order) |
|---------|------------------|----------------------|
| Ubicación | `entities/payment/` | `entities/order/model/types.ts` |
| Uso | ❌ No usado | ✅ Usado en 20+ archivos |
| Campos | id, orderId, amount, date, method, status, receiptUrl, notes | id, amount, bankAccountId, method, reference, createdAt, description |
| PaymentMethod | 'CASH', 'TRANSFER', 'DEPOSIT', 'CARD' | string (EFECTIVO, TRANSFERENCIA, etc.) |
| Propósito | Pago independiente con estado | Pago vinculado a Order |

**Diferencias Clave:**
1. `Payment` tiene `status` (PENDING, CONFIRMED, REJECTED) - OrderPayment no
2. `Payment` tiene `receiptUrl` - OrderPayment no
3. `Payment` usa `date` - OrderPayment usa `createdAt`
4. `Payment` tiene `orderId` explícito - OrderPayment está embebido en Order

**Análisis:**
- `Payment` parece diseñado para pagos independientes con workflow de aprobación
- `OrderPayment` es para pagos directos vinculados a pedidos
- Son conceptos diferentes pero actualmente solo se usa OrderPayment

**Conclusión:**
Entidad `payment` NO se usa en ningún lugar del código actual.

**Recomendación:** 
- **Opción A (Conservadora):** MANTENER por si se necesita en futuro para pagos independientes
- **Opción B (Agresiva):** ELIMINAR ya que no se usa y puede causar confusión
- **Opción C (Recomendada):** MARCAR COMO DEPRECATED y documentar diferencia con OrderPayment

---

## 📊 FASE 3 — PAYMENT MODEL DECISION

### Comparación Detallada

#### Payment (entities/payment)
```typescript
export interface Payment {
    id: string;
    orderId: string;          // ← Referencia externa
    amount: number;
    date: string;
    method: PaymentMethod;    // ← Enum estricto
    status: PaymentStatus;    // ← Tiene workflow
    receiptUrl?: string;      // ← Comprobante
    notes?: string;
}

export type PaymentMethod = 'CASH' | 'TRANSFER' | 'DEPOSIT' | 'CARD';
export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';
```

**Características:**
- ✅ Pago como entidad independiente
- ✅ Tiene estados (workflow de aprobación)
- ✅ Puede tener comprobante adjunto
- ✅ PaymentMethod tipado estrictamente
- ❌ NO se usa en el código actual

#### OrderPayment (entities/order)
```typescript
export type OrderPayment = {
    id: string;
    amount: number;
    bankAccountId?: string;   // ← Vinculado a cuenta
    method?: string;          // ← String libre
    reference?: string;       // ← Referencia de transacción
    createdAt: string;
    description?: string;
}
```

**Características:**
- ✅ Embebido en Order (no independiente)
- ✅ Vinculado a cuenta bancaria
- ✅ Tiene referencia de transacción
- ✅ Usado en 20+ archivos
- ❌ No tiene estados (pago directo)
- ❌ method es string libre (menos tipado)

### Casos de Uso

**Payment sería útil para:**
- Pagos que requieren aprobación
- Pagos con comprobante que debe validarse
- Pagos independientes no vinculados a pedidos
- Sistema de conciliación bancaria

**OrderPayment es útil para:**
- Abonos directos a pedidos
- Historial de pagos del pedido
- Cálculo de saldo pendiente
- Pagos inmediatos sin workflow

### Riesgos de Mantener Ambos

1. **Confusión Conceptual**
   - Dos tipos para "pago" puede confundir a desarrolladores
   - No está claro cuándo usar cada uno

2. **Inconsistencia de Datos**
   - PaymentMethod diferente en cada uno
   - Campos diferentes para mismo concepto

3. **Código Muerto**
   - Payment no se usa, ocupa espacio mental

### Riesgos de Eliminar Payment

1. **Pérdida de Funcionalidad Futura**
   - Si se necesita workflow de aprobación, hay que recrearlo

2. **Cambio de Arquitectura**
   - Si backend usa Payment, habría que mapear

### Recomendación Arquitectónica

**OPCIÓN RECOMENDADA: Mantener ambos pero documentar claramente**

**Acción:**
1. Agregar comentario en `entities/payment/model/types.ts`:
```typescript
/**
 * Payment Entity - CURRENTLY UNUSED
 * 
 * This entity represents independent payments with approval workflow.
 * Different from OrderPayment which is embedded in Order entity.
 * 
 * Use Payment for:
 * - Payments requiring approval (PENDING → CONFIRMED/REJECTED)
 * - Payments with receipt validation
 * - Independent payments not tied to orders
 * 
 * Use OrderPayment (in entities/order) for:
 * - Direct order payments (abonos)
 * - Payment history within order
 * - Immediate payments without workflow
 * 
 * @status UNUSED - Reserved for future payment workflow feature
 * @see entities/order/model/types.ts OrderPayment
 */
```

2. Crear `entities/payment/README.md` explicando la diferencia

3. NO eliminar por ahora (puede ser útil para backend)

---

## 🔥 FASE 4 — LÓGICA TRANSACCIONAL EN FRONTEND

### 4.1 Archivos con Lógica Transaccional

| Archivo | Líneas | Complejidad | Riesgo |
|---------|--------|-------------|--------|
| `shared/api/orderPaymentApi.ts` | 125 | ALTA | CRÍTICO |
| `shared/api/receptionApi.ts` | 200 | MUY ALTA | CRÍTICO |
| `shared/api/paymentApi.ts` | 180 | ALTA | CRÍTICO |

### 4.2 Análisis Detallado

#### `orderPaymentApi.ts` - Transacciones de Pago

**Funciones Transaccionales:**
1. `addOrderPaymentTransactional()`
2. `editOrderPaymentTransactional()`
3. `removeOrderPaymentTransactional()`

**Patrón Detectado:**
```typescript
try {
    await financialMovementApi.create(movement);
    await bankAccountApi.update(bankAccountId, { currentBalance: newBalance });
    await orderApi.update(orderId, updatedOrder);
    return updatedOrder;
} catch (error) {
    // Rollback manual
    await financialMovementApi.delete(movement.id).catch(() => {});
    throw error;
}
```

**Problemas:**
- ❌ Simula transacción ACID en frontend
- ❌ Rollback manual (puede fallar)
- ❌ 3 llamadas API secuenciales
- ❌ Estado inconsistente si falla rollback
- ❌ No hay aislamiento real

**Complejidad:** ALTA
- 3 entidades coordinadas (Order, BankAccount, FinancialMovement)
- Lógica de compensación manual
- Manejo de errores complejo

**Riesgo al Mover:**
- 🟡 MEDIO - Lógica bien encapsulada
- Backend debe implementar transacción real
- Requiere endpoint único: `POST /api/orders/:id/payments`

---

#### `receptionApi.ts` - Recepción de Pedidos

**Funciones Transaccionales:**
1. `saveBatchWithPayments()` - 150 líneas
2. `saveBatch()` - 50 líneas

**Patrón Detectado:**
```typescript
for (const item of items) {
    // 1. Receive Order
    let updatedOrder = receiveOrder(order, finalTotal, batchRef);
    
    // 2. Check for Credit
    if (pending < -0.01) {
        await transactionApi.createTransaction(...);
        await clientCreditApi.createCredit(...);
    }
    
    // 3. Process Payment
    if (abonoRecepcion > 0) {
        const paymentResult = addPayment(updatedOrder, { amount }, cashAccount);
        await transactionApi.createTransaction(...);
        await bankAccountApi.update(...);
    }
    
    // 4. Persist Order
    await orderApi.update(updatedOrder.id, updatedOrder);
    
    // 5. Create Inventory Movement
    await inventoryApi.create(...);
}
```

**Problemas:**
- ❌ Orquestación compleja de 5+ entidades
- ❌ Lógica de negocio (créditos, excedentes) en frontend
- ❌ Loop sin transacción (falla parcial posible)
- ❌ Cálculos financieros en cliente

**Complejidad:** MUY ALTA
- 6 entidades coordinadas (Order, Transaction, ClientCredit, BankAccount, Inventory, Payment)
- Lógica condicional compleja (créditos, excedentes)
- Batch processing sin atomicidad

**Riesgo al Mover:**
- 🔴 ALTO - Lógica muy compleja
- Backend debe manejar toda la orquestación
- Requiere endpoint: `POST /api/orders/batch-reception`
- Necesita transacción DB real

---

#### `paymentApi.ts` - Registro de Pagos

**Funciones Transaccionales:**
1. `registerPayment()` - 100 líneas
2. `revertPayment()` - 50 líneas

**Patrón Detectado:**
```typescript
// 1. Validate
if (amount > pendingBalance) {
    paymentAmount = pendingBalance;
    creditAmount = amount - pendingBalance;
}

// 2. Create Transaction
if (paymentAmount > 0) {
    await transactionApi.createTransaction(txPayload);
    await orderApi.update(orderId, { payments: updatedPayments });
    
    if (method === 'EFECTIVO') {
        await bankAccountApi.update(cashAccount.id, { currentBalance: newBalance });
    }
}

// 3. Generate Credit
if (creditAmount > 0) {
    await transactionApi.createTransaction(creditTx);
    await clientCreditApi.createCredit(...);
}
```

**Problemas:**
- ❌ Lógica de negocio (excedentes → créditos)
- ❌ Validaciones financieras en cliente
- ❌ Múltiples escrituras sin transacción
- ❌ Cálculos de saldo en frontend

**Complejidad:** ALTA
- 4 entidades coordinadas (Order, Transaction, ClientCredit, BankAccount)
- Lógica condicional (efectivo vs transferencia)
- Generación automática de créditos

**Riesgo al Mover:**
- 🟡 MEDIO-ALTO - Lógica de negocio compleja
- Backend debe validar y calcular
- Requiere endpoint: `POST /api/payments`

---

### 4.3 Resumen de Lógica Transaccional

| Aspecto | orderPaymentApi | receptionApi | paymentApi |
|---------|----------------|--------------|------------|
| **Líneas** | 125 | 200 | 180 |
| **Entidades** | 3 | 6 | 4 |
| **Complejidad** | Alta | Muy Alta | Alta |
| **Rollback** | Manual | No | No |
| **Riesgo** | Medio | Alto | Medio-Alto |
| **Prioridad** | 1 | 1 | 2 |

### 4.4 Funciones Exactas a Extraer

**orderPaymentApi.ts:**
```typescript
// Líneas 20-58
addOrderPaymentTransactional(order, amount, bankAccount)
  → Coordina: Order, BankAccount, FinancialMovement
  → Backend: POST /api/orders/:id/payments

// Líneas 60-90
editOrderPaymentTransactional(order, paymentId, newAmount, bankAccount)
  → Coordina: Order, BankAccount, FinancialMovement
  → Backend: PUT /api/orders/:id/payments/:paymentId

// Líneas 92-120
removeOrderPaymentTransactional(order, paymentId, bankAccount)
  → Coordina: Order, BankAccount, FinancialMovement
  → Backend: DELETE /api/orders/:id/payments/:paymentId
```

**receptionApi.ts:**
```typescript
// Líneas 8-150
saveBatchWithPayments(items)
  → Coordina: Order, Transaction, ClientCredit, BankAccount, Inventory
  → Backend: POST /api/orders/batch-reception

// Líneas 152-180
saveBatch(orders)
  → Coordina: Order, Inventory
  → Backend: POST /api/orders/batch-reception-simple
```

**paymentApi.ts:**
```typescript
// Líneas 20-120
registerPayment(payload)
  → Coordina: Order, Transaction, ClientCredit, BankAccount
  → Backend: POST /api/payments

// Líneas 130-160
revertPayment(orderId, paymentId)
  → Coordina: Order, Transaction, BankAccount
  → Backend: DELETE /api/payments/:id
```

### 4.5 Nivel de Complejidad por Función

**CRÍTICO (Mover primero):**
- `receptionApi.saveBatchWithPayments()` - 6 entidades, lógica compleja
- `paymentApi.registerPayment()` - Cálculos financieros, créditos automáticos

**ALTO (Mover segundo):**
- `orderPaymentApi.addOrderPaymentTransactional()` - Rollback manual
- `orderPaymentApi.editOrderPaymentTransactional()` - Rollback manual
- `orderPaymentApi.removeOrderPaymentTransactional()` - Rollback manual

**MEDIO (Mover tercero):**
- `receptionApi.saveBatch()` - Más simple, menos entidades
- `paymentApi.revertPayment()` - Lógica de reversión

---

## ✅ VERIFICACIÓN FINAL

### Compilación TypeScript

```bash
npm run build
# Resultado: Pendiente de verificación
```

### Imports Rotos

```bash
grep -r "@/features/bank-account[^s]" src/
# Resultado: No matches found ✅

grep -r "@/features/brand[^s]" src/
# Resultado: No matches found ✅
```

### Archivos Pendientes de Eliminación

- ⚠️ `src/features/bank-account/` - Eliminar manualmente

---

## 📈 MÉTRICAS FINALES

### Cambios Aplicados

| Métrica | Valor |
|---------|-------|
| Duplicaciones eliminadas | 1 (brand) |
| Duplicaciones pendientes | 1 (bank-account) |
| Imports actualizados | 16 |
| Archivos modificados | 16 |
| Archivos creados | 2 |
| Imports rotos | 0 |

### Entidades Analizadas

| Entidad | Estado | Acción |
|---------|--------|--------|
| call-record | ✅ En uso | MANTENER |
| payment | 🔴 No usada | DOCUMENTAR |

### Lógica Transaccional Identificada

| Archivo | Funciones | Complejidad | Prioridad |
|---------|-----------|-------------|-----------|
| orderPaymentApi.ts | 3 | Alta | 1 |
| receptionApi.ts | 2 | Muy Alta | 1 |
| paymentApi.ts | 2 | Alta | 2 |

**Total funciones a extraer:** 7  
**Total líneas de lógica transaccional:** ~505

---

## 🎯 PRÓXIMOS PASOS

### Inmediato (Hacer ahora)

1. ✅ Eliminar manualmente `src/features/bank-account/`
2. ✅ Verificar que el proyecto compila sin errores
3. ✅ Commit de cambios de consolidación

### Corto Plazo (Esta semana)

4. ⬜ Documentar entidad `payment` con comentarios
5. ⬜ Crear `entities/payment/README.md`
6. ⬜ Marcar funciones transaccionales con comentarios `// TODO: Move to backend`

### Medio Plazo (Antes de backend)

7. ⬜ Diseñar endpoints de backend para lógica transaccional
8. ⬜ Documentar contratos de API (request/response)
9. ⬜ Preparar plan de migración de lógica

---

## 📝 NOTAS IMPORTANTES

### Decisiones Tomadas

1. **Naming Convention:** Plural para features (bank-accounts, brands)
2. **Payment Entity:** Mantener pero documentar como UNUSED
3. **CallRecord Entity:** Mantener, está en uso activo
4. **Lógica Transaccional:** Identificada pero NO movida (requiere backend)

### Riesgos Identificados

1. **Carpeta bank-account:** No se pudo eliminar automáticamente (servidor dev)
2. **Lógica Transaccional:** Muy compleja, requiere planificación cuidadosa
3. **Estado Inconsistente:** Posible si falla rollback manual en mocks

### Cambios NO Realizados (Por Diseño)

- ❌ NO se movió lógica transaccional (requiere backend)
- ❌ NO se eliminó entidad payment (puede ser útil)
- ❌ NO se crearon DTOs (fuera de alcance)
- ❌ NO se modificó UI (fuera de alcance)
- ❌ NO se aplicó FSD perfecto (fuera de alcance)

---

**Fin del Reporte de Refactor Controlado**
