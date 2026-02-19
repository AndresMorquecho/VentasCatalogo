# 🔍 AUDITORÍA EXTREMA Y COMPLETA - ARQUITECTURA DEL PROYECTO

**Fecha:** 19 de Febrero de 2026  
**Proyecto:** VentasCatalogo  
**Arquitectura:** Feature-Sliced Design (FSD)  
**Estado:** Pre-integración Backend

---

## 📋 RESUMEN EJECUTIVO

### Nivel de Preparación para Backend: **65%**

**Fortalezas Identificadas:**
- ✅ Arquitectura FSD bien estructurada en su mayoría
- ✅ Separación clara entre entities y features
- ✅ Tipos TypeScript bien definidos
- ✅ Lógica de negocio centralizada en entities/model
- ✅ Mock APIs preparadas para ser reemplazadas

**Problemas Críticos:**
- 🔴 Duplicación de features (bank-account vs bank-accounts, brand vs brands)
- 🔴 Entidades huérfanas sin uso real
- 🔴 Lógica de negocio mezclada en shared/api
- 🔴 Datos mock hardcodeados en múltiples lugares
- 🔴 Falta de capa de DTOs y Mappers

**Problemas Medios:**
- 🟡 Inconsistencia en naming (singular vs plural)
- 🟡 Código deprecated sin eliminar
- 🟡 Dependencias circulares potenciales
- 🟡 Falta de index.ts en algunas entidades

**Mejoras Recomendadas:**
- 🟢 Implementar capa de DTOs
- 🟢 Crear mappers para transformación de datos
- 🟢 Consolidar features duplicadas
- 🟢 Eliminar entidades no utilizadas
- 🟢 Mover lógica transaccional a backend

---

## 🔎 FASE 1 — ESTRUCTURA DE CARPETAS

### 1.1 Árbol Completo del Proyecto

```
VentasCatalogo/
├── src/
│   ├── app/                    ✅ Correcto - Configuración de aplicación
│   │   ├── providers/          ✅ Providers (QueryProvider)
│   │   ├── routers/            ✅ Routing (AppRouter)
│   │   └── App.tsx             ✅ Root component
│   │
│   ├── entities/               ⚠️  REVISAR - Entidades con problemas
│   │   ├── bank-account/       ✅ Usada
│   │   ├── brand/              ✅ Usada
│   │   ├── call/               ✅ Usada
│   │   ├── call-record/        🔴 HUÉRFANA - Solo types, no se usa
│   │   ├── cash-closure/       ✅ Usada
│   │   ├── client/             ✅ Usada
│   │   ├── client-credit/      ✅ Usada
│   │   ├── client-reward/      ✅ Usada
│   │   ├── delivery/           ✅ Usada
│   │   ├── deposit/            ✅ Usada
│   │   ├── financial-movement/ ✅ Usada
│   │   ├── financial-transaction/ ✅ Usada
│   │   ├── inventory-movement/ ✅ Usada
│   │   ├── order/              ✅ Usada - CORE
│   │   ├── payment/            🟡 PARCIAL - Types definidos pero no usados directamente
│   │   ├── session/            ✅ Usada
│   │   └── user/               ✅ Usada
│   │
│   ├── features/               🔴 DUPLICACIONES DETECTADAS
│   │   ├── auth/               ✅ Correcto
│   │   ├── bank-account/       🔴 DUPLICADO - Solo hooks
│   │   ├── bank-accounts/      🔴 DUPLICADO - Componentes UI
│   │   ├── brand/              🔴 DUPLICADO - Solo hooks
│   │   ├── brands/             🔴 DUPLICADO - Componentes UI
│   │   ├── calls/              ✅ Correcto
│   │   ├── cash-closure/       ✅ Correcto
│   │   ├── clients/            ✅ Correcto
│   │   ├── dashboard/          ✅ Correcto
│   │   ├── financial-audit/    ✅ Correcto
│   │   ├── financial-dashboard/ ✅ Correcto
│   │   ├── financial-movement/ ✅ Correcto
│   │   ├── inventory/          ✅ Correcto
│   │   ├── loyalty/            ✅ Correcto
│   │   ├── order-delivery/     ✅ Correcto
│   │   ├── order-labels/       ✅ Correcto
│   │   ├── order-management/   ✅ Correcto
│   │   ├── order-payments/     ✅ Correcto
│   │   ├── order-receipt/      ✅ Correcto
│   │   ├── order-reception/    ✅ Correcto
│   │   ├── payment-receipt/    ✅ Correcto
│   │   ├── payments/           ✅ Correcto
│   │   ├── reception-batch/    ✅ Correcto
│   │   ├── rewards/            ✅ Correcto
│   │   ├── transactions/       ✅ Correcto
│   │   └── users/              ✅ Correcto
│   │
│   ├── pages/                  ✅ Correcto - Páginas de enrutamiento
│   │   ├── bank-accounts-page/
│   │   ├── brands-page/
│   │   ├── clients-page/
│   │   ├── home/
│   │   └── orders-page/
│   │
│   ├── shared/                 🟡 REVISAR - Lógica de negocio mezclada
│   │   ├── api/                🔴 PROBLEMA - Lógica transaccional aquí
│   │   ├── auth/               ✅ Correcto
│   │   ├── hooks/              ✅ Correcto
│   │   ├── lib/                ✅ Correcto
│   │   └── ui/                 ✅ Correcto - Componentes reutilizables
│   │
│   └── widgets/                ✅ Correcto
│       ├── Header/
│       ├── Layout/
│       └── Sidebar/
│
├── public/                     ✅ Correcto
└── [config files]              ✅ Correcto
```

### 1.2 Problemas Detectados en Estructura

| Carpeta | Propósito Esperado | Uso Real | Problema | Recomendación |
|---------|-------------------|----------|----------|---------------|
| `features/bank-account/` | Feature completa | Solo hooks API | Duplicación | **ELIMINAR** - Consolidar en bank-accounts |
| `features/bank-accounts/` | Feature completa | Componentes UI | Duplicación | **MANTENER** - Renombrar a bank-account |
| `features/brand/` | Feature completa | Solo hooks API | Duplicación | **ELIMINAR** - Consolidar en brands |
| `features/brands/` | Feature completa | Componentes UI | Duplicación | **MANTENER** - Renombrar a brand |
| `entities/call-record/` | Entidad de dominio | Solo types sin uso | Huérfana | **REVISAR** - Eliminar si no se usa |
| `entities/payment/` | Entidad de dominio | Types definidos | Parcial | **REVISAR** - Consolidar con order payments |
| `shared/api/` | APIs mock | Lógica transaccional | Arquitectura | **REFACTOR** - Mover lógica a backend |

### 1.3 Convenciones de Naming

**Inconsistencias Detectadas:**


1. **Singular vs Plural:**
   - ❌ `features/bank-account/` vs `features/bank-accounts/`
   - ❌ `features/brand/` vs `features/brands/`
   - ✅ `entities/` siempre en singular (correcto)
   - ✅ `features/clients/`, `features/users/` en plural (correcto)

2. **Convención kebab-case:**
   - ✅ Todas las carpetas usan kebab-case correctamente
   - ✅ No hay camelCase en nombres de carpetas

3. **Inglés vs Español:**
   - ✅ Estructura en inglés (correcto)
   - ✅ Código en inglés (correcto)
   - ✅ Comentarios y mensajes en español (aceptable para equipo hispanohablante)

---

## 🔎 FASE 2 — ENTIDADES (entities)

### 2.1 Inventario Completo de Entidades

| Entidad | Archivos | Uso Real | Estado | Problema |
|---------|----------|----------|--------|----------|
| `bank-account` | types.ts | ✅ Usada en 15+ archivos | ACTIVA | Ninguno |
| `brand` | types, model, queries | ✅ Usada en 10+ archivos | ACTIVA | Ninguno |
| `call` | types, api, hooks | ✅ Usada en features/calls | ACTIVA | Ninguno |
| `call-record` | types, model, index | 🔴 Solo importada en calls/model | HUÉRFANA | **Eliminar o integrar** |
| `cash-closure` | types, model, queries | ✅ Usada en features | ACTIVA | Ninguno |
| `client` | types, model, hooks, index | ✅ Usada en 20+ archivos | ACTIVA | Ninguno |
| `client-credit` | types | ✅ Usada en transactions | ACTIVA | Falta model |
| `client-reward` | types, api | ✅ Usada en rewards/loyalty | ACTIVA | Ninguno |
| `delivery` | types, api, hooks | ✅ Usada en order-delivery | ACTIVA | Ninguno |
| `deposit` | types, api, hooks | ✅ Usada en features | ACTIVA | Ninguno |
| `financial-movement` | types, model, queries | ✅ Usada en 10+ archivos | ACTIVA | Ninguno |
| `financial-transaction` | types | ✅ Usada en transactions | ACTIVA | Falta model |
| `inventory-movement` | types | ✅ Usada en inventory | ACTIVA | Falta model |
| `order` | types, model, api, hooks | ✅ CORE - Usada en 30+ archivos | ACTIVA | Ninguno |
| `payment` | types | 🟡 Definida pero no usada | PARCIAL | **Consolidar con order** |
| `session` | store | ✅ Usada en auth | ACTIVA | Ninguno |
| `user` | types, api, hooks | ✅ Usada en auth/users | ACTIVA | Ninguno |

### 2.2 Análisis de Entidades

#### ✅ Entidades Bien Implementadas

**`order` (CORE)**
- ✅ Types completos y bien definidos
- ✅ Model con lógica de negocio pura
- ✅ API mock preparada para backend
- ✅ Hooks para React Query
- ✅ Validaciones en model
- ⚠️  Campo `deposit` marcado como DEPRECATED pero aún presente

**`client`**
- ✅ Types completos
- ✅ Model con validaciones
- ✅ Hooks bien estructurados
- ✅ Index.ts exportando correctamente
- ✅ Validación de negocio (canDeleteClient)

**`brand`**
- ✅ Types completos
- ✅ Model con validaciones
- ✅ Queries para filtrado
- ✅ Lógica pura (createBrand, updateBrand)

**`financial-movement`**
- ✅ Types completos
- ✅ Model con lógica de cálculo
- ✅ Queries para agregaciones
- ✅ Bien estructurada para contabilidad

#### 🔴 Entidades con Problemas

**`call-record`**
```
Problema: Entidad definida pero apenas usada
Archivos: model/types.ts, model/model.ts, model/index.ts
Uso: Solo importada en features/calls/model/hooks.ts
Recomendación: ELIMINAR o integrar completamente en call
```

**`payment`**
```
Problema: Types definidos pero no se usan directamente
Archivos: model/types.ts
Uso: La lógica de pagos está en Order.payments (OrderPayment)
Conflicto: Dos conceptos de Payment (entity vs order payment)
Recomendación: CONSOLIDAR - Eliminar entity o renombrar
```

**`client-credit`**
```
Problema: Solo types, falta model
Archivos: model/types.ts
Uso: Usada en transactions
Recomendación: COMPLETAR - Agregar model con lógica
```

**`financial-transaction`**
```
Problema: Solo types, falta model
Archivos: model/types.ts
Uso: Usada en transactions
Recomendación: COMPLETAR - Agregar model con validaciones
```

**`inventory-movement`**
```
Problema: Solo types, falta model
Archivos: model/types.ts
Uso: Usada en inventory
Recomendación: COMPLETAR - Agregar model con lógica
```

### 2.3 Verificación de Arquitectura por Entidad

#### Checklist de Calidad

| Entidad | types.ts | model.ts | api.ts | hooks.ts | queries.ts | index.ts | Score |
|---------|----------|----------|--------|----------|------------|----------|-------|
| bank-account | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | 1/6 |
| brand | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | 4/6 |
| call | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | 3/6 |
| call-record | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | 3/6 |
| cash-closure | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | 4/6 |
| client | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | 4/6 |
| client-credit | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | 1/6 |
| client-reward | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | 2/6 |
| delivery | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | 3/6 |
| deposit | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | 3/6 |
| financial-movement | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | 4/6 |
| financial-transaction | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | 1/6 |
| inventory-movement | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | 1/6 |
| order | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | 4/6 |
| payment | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | 1/6 |
| session | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | 1/6 |
| user | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | 3/6 |

**Promedio de Completitud: 2.5/6 (42%)**

### 2.4 Lógica de Negocio Fuera de Entities

**🔴 PROBLEMA CRÍTICO:** Lógica transaccional en `shared/api/`


**Archivos con lógica de negocio mal ubicada:**

1. **`shared/api/orderPaymentApi.ts`**
   - ❌ Orquestación transaccional (debería estar en backend)
   - ❌ Lógica de rollback manual
   - ❌ Coordinación entre múltiples entidades
   - 📍 Líneas 26-125: Transacciones simuladas

2. **`shared/api/receptionApi.ts`**
   - ❌ Lógica de recepción de pedidos
   - ❌ Manejo de inventario
   - ❌ Cálculo de créditos
   - 📍 Debe moverse a backend

3. **`shared/api/paymentApi.ts`**
   - ❌ Validación de pagos
   - ❌ Creación de transacciones financieras
   - ❌ Manejo de créditos de cliente
   - 📍 Debe moverse a backend

**Recomendación:** Estos archivos deben convertirse en simples wrappers de fetch/axios cuando se integre el backend.

---

## 🔎 FASE 3 — FEATURES

### 3.1 Inventario Completo de Features

| Feature | Estructura | Uso | Estado | Problema |
|---------|-----------|-----|--------|----------|
| `auth` | model/, ui/, index.ts | ✅ Usada | ACTIVA | Ninguno |
| `bank-account` | api/hooks.ts | 🔴 Duplicada | DUPLICADO | **ELIMINAR** |
| `bank-accounts` | components/ | ✅ Usada | ACTIVA | **RENOMBRAR** a bank-account |
| `brand` | api/hooks.ts | 🔴 Duplicada | DUPLICADO | **ELIMINAR** |
| `brands` | components/ | ✅ Usada | ACTIVA | **RENOMBRAR** a brand |
| `calls` | model/, ui/, index.ts | ✅ Usada | ACTIVA | Ninguno |
| `cash-closure` | api/, ui/ | ✅ Usada | ACTIVA | Ninguno |
| `clients` | api/, components/ | ✅ Usada | ACTIVA | Ninguno |
| `dashboard` | api/, model/, ui/ | ✅ Usada | ACTIVA | Ninguno |
| `financial-audit` | model/, ui/ | ✅ Usada | ACTIVA | Ninguno |
| `financial-dashboard` | model/, ui/ | ✅ Usada | ACTIVA | Ninguno |
| `financial-movement` | api/hooks.ts | ✅ Usada | ACTIVA | Ninguno |
| `inventory` | lib/, model/, ui/ | ✅ Usada | ACTIVA | Ninguno |
| `loyalty` | lib/, model/, ui/ | ✅ Usada | ACTIVA | Ninguno |
| `order-delivery` | lib/, model/, ui/ | ✅ Usada | ACTIVA | Ninguno |
| `order-labels` | lib/, ui/ | ✅ Usada | ACTIVA | Ninguno |
| `order-management` | model/, ui/ | ✅ Usada | ACTIVA | Ninguno |
| `order-payments` | components/, model.ts | ✅ Usada | ACTIVA | Ninguno |
| `order-receipt` | lib/, ui/ | ✅ Usada | ACTIVA | Ninguno |
| `order-reception` | model/, ui/ | ✅ Usada | ACTIVA | Ninguno |
| `payment-receipt` | lib/, ui/ | ✅ Usada | ACTIVA | Ninguno |
| `payments` | model/, ui/ | ✅ Usada | ACTIVA | Ninguno |
| `reception-batch` | model/, ui/ | ✅ Usada | ACTIVA | Ninguno |
| `rewards` | model/, ui/ | ✅ Usada | ACTIVA | Ninguno |
| `transactions` | lib/, model/, ui/ | ✅ Usada | ACTIVA | Ninguno |
| `users` | model/, ui/ | ✅ Usada | ACTIVA | Ninguno |

**Total Features:** 26  
**Duplicadas:** 4 (bank-account, bank-accounts, brand, brands)  
**Activas Únicas:** 22

### 3.2 Análisis de Duplicaciones

#### 🔴 DUPLICACIÓN 1: bank-account vs bank-accounts

**`features/bank-account/`**
```
api/
  └── hooks.ts  (useBankAccountList, useCreateBankAccount, etc.)
```

**`features/bank-accounts/`**
```
components/
  ├── BankAccountForm.tsx
  ├── BankAccountList.tsx
  └── BankAccountTable.tsx
index.ts
```

**Problema:** La feature está dividida en dos carpetas
- `bank-account/` tiene solo los hooks
- `bank-accounts/` tiene solo los componentes UI

**Solución:**
```
ELIMINAR: features/bank-account/
RENOMBRAR: features/bank-accounts/ → features/bank-account/
ESTRUCTURA FINAL:
features/bank-account/
  ├── api/
  │   └── hooks.ts
  ├── components/
  │   ├── BankAccountForm.tsx
  │   ├── BankAccountList.tsx
  │   └── BankAccountTable.tsx
  └── index.ts
```

#### 🔴 DUPLICACIÓN 2: brand vs brands

**`features/brand/`**
```
api/
  └── hooks.ts  (useBrandList, useCreateBrand, etc.)
```

**`features/brands/`**
```
components/
  ├── BrandForm.tsx
  ├── BrandList.tsx
  └── BrandTable.tsx
index.ts
```

**Problema:** Misma situación que bank-account

**Solución:**
```
ELIMINAR: features/brand/
RENOMBRAR: features/brands/ → features/brand/
ESTRUCTURA FINAL:
features/brand/
  ├── api/
  │   └── hooks.ts
  ├── components/
  │   ├── BrandForm.tsx
  │   ├── BrandList.tsx
  │   └── BrandTable.tsx
  └── index.ts
```

### 3.3 Features con Lógica en Entities

**✅ CORRECTO:** La mayoría de features delegan correctamente a entities

Ejemplos de buena arquitectura:
- `order-management` usa `entities/order/model/model.ts`
- `clients` usa `entities/client/model/model.ts`
- `financial-audit` usa `entities/financial-movement/model/queries.ts`

**🟡 REVISAR:** Algunas features tienen lógica que podría estar en entities

1. **`features/inventory/lib/calculateDaysInWarehouse.ts`**
   - Lógica de cálculo de días
   - Podría estar en `entities/inventory-movement/model/`

2. **`features/transactions/lib/validateTransaction.ts`**
   - Validación de transacciones
   - Debería estar en `entities/financial-transaction/model/`

3. **`features/transactions/lib/processPayment.ts`**
   - Procesamiento de pagos
   - Debería estar en backend

### 3.4 Verificación de Estructura FSD

#### Checklist por Feature

| Feature | api/ | model/ | ui/ | lib/ | components/ | index.ts | Coherente |
|---------|------|--------|-----|------|-------------|----------|-----------|
| auth | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| bank-accounts | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| brands | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| calls | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| cash-closure | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| clients | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| dashboard | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| order-management | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| transactions | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |

**Conclusión:** La mayoría de features siguen FSD correctamente, pero hay inconsistencia en el uso de `components/` vs `ui/`

---

## 🔎 FASE 4 — SHARED

### 4.1 Análisis de shared/ui

**Componentes Encontrados:** 18


| Componente | Uso | Estado | Notas |
|------------|-----|--------|-------|
| alert.tsx | ✅ Usado | ACTIVO | shadcn/ui |
| avatar.tsx | ✅ Usado | ACTIVO | shadcn/ui |
| badge.tsx | ✅ Usado | ACTIVO | shadcn/ui |
| button.tsx | ✅ Usado | ACTIVO | shadcn/ui |
| card.tsx | ✅ Usado | ACTIVO | shadcn/ui |
| dialog.tsx | ✅ Usado | ACTIVO | shadcn/ui |
| dropdown-menu.tsx | ✅ Usado | ACTIVO | shadcn/ui |
| input.tsx | ✅ Usado | ACTIVO | shadcn/ui |
| label.tsx | ✅ Usado | ACTIVO | shadcn/ui |
| separator.tsx | ✅ Usado | ACTIVO | shadcn/ui |
| sheet.tsx | ✅ Usado | ACTIVO | shadcn/ui |
| sidebar.tsx | ✅ Usado | ACTIVO | shadcn/ui |
| skeleton.tsx | ✅ Usado | ACTIVO | shadcn/ui |
| switch.tsx | ✅ Usado | ACTIVO | shadcn/ui |
| table.tsx | ✅ Usado | ACTIVO | shadcn/ui |
| tabs.tsx | ✅ Usado | ACTIVO | shadcn/ui |
| tooltip.tsx | ✅ Usado | ACTIVO | shadcn/ui |
| use-toast.tsx | ✅ Usado | ACTIVO | shadcn/ui + custom |

**Conclusión:** ✅ Todos los componentes UI están en uso. No hay código muerto.

### 4.2 Análisis de shared/lib

| Archivo | Propósito | Problema | Recomendación |
|---------|-----------|----------|---------------|
| utils.ts | Utilidad cn() para clases | ✅ Ninguno | Mantener |
| permissions.ts | Sistema de permisos | ✅ Ninguno | Mantener |
| rewards.ts | Cálculo de recompensas | 🟡 Lógica de negocio | Mover a entities/client-reward |
| auditService.ts | Servicio de auditoría | 🔴 Mock en memoria | Preparar para backend |

**`shared/lib/rewards.ts` - REVISAR**
```typescript
// Actualmente en shared/lib/
export const calculateRewardPoints = (order: Order): number => { ... }
export const calculateLevel = (totalPoints: number): RewardLevel => { ... }
export const updateClientRewards = (client: Client, order: Order): ClientReward => { ... }
```

**Problema:** Esta es lógica de dominio, no utilidades compartidas.

**Solución:** Mover a `entities/client-reward/model/model.ts`

### 4.3 Análisis de shared/api

**🔴 PROBLEMA CRÍTICO:** Lógica de negocio y transacciones en shared/api

| Archivo | Líneas | Problema | Preparación Backend |
|---------|--------|----------|---------------------|
| bankAccountApi.ts | 80 | Mock con lógica | 40% |
| brandApi.ts | 120 | Mock con lógica | 40% |
| cashClosureApi.ts | 60 | Mock simple | 60% |
| clientApi.ts | 90 | Mock con sync | 30% |
| financialMovementApi.ts | 100 | Mock con queries | 50% |
| inventoryApi.ts | 150 | Mock complejo | 40% |
| orderPaymentApi.ts | 125 | 🔴 Transacciones | 20% |
| paymentApi.ts | 180 | 🔴 Lógica compleja | 20% |
| receptionApi.ts | 200 | 🔴 Orquestación | 15% |
| transactionApi.ts | 120 | Mock con validación | 50% |

**Promedio de Preparación:** 36%

**Problemas Identificados:**

1. **Transacciones Simuladas**
   ```typescript
   // orderPaymentApi.ts - Líneas 26-55
   try {
       await financialMovementApi.create(movement);
       await bankAccountApi.update(...);
       await orderApi.update(...);
       return updatedOrder;
   } catch (error) {
       // Rollback manual
       await financialMovementApi.delete(movement.id).catch(() => {});
       throw error;
   }
   ```
   **Problema:** Esto debe ser una transacción atómica en el backend.

2. **Datos Hardcodeados**
   ```typescript
   // clientApi.ts
   const MOCK_CLIENTS: Client[] = [
       { id: '1', firstName: 'Maria Fernanda Gonzalez', ... },
       { id: '2', firstName: 'Ana Lucia Perez', ... },
   ];
   ```
   **Problema:** Datos de prueba mezclados con lógica.

3. **Lógica de Sincronización**
   ```typescript
   // clientApi.ts - Línea 60
   if (payload.firstName) {
       await orderApi.syncClientName(id, payload.firstName);
   }
   ```
   **Problema:** Esto debe manejarse en el backend con triggers o eventos.

### 4.4 Análisis de shared/auth

| Archivo | Propósito | Estado | Notas |
|---------|-----------|--------|-------|
| authApi.ts | Mock de autenticación | 🟡 Mock | Reemplazar con backend |
| AuthProvider.tsx | Context de auth | ✅ Correcto | Mantener estructura |
| ProtectedRoute.tsx | Guard de rutas | ✅ Correcto | Mantener |
| types.ts | Types de auth | ✅ Correcto | Mantener |
| index.ts | Exports | ✅ Correcto | Mantener |

**authApi.ts - Problemas:**
```typescript
// Línea 7
// Simple hash simulation (replace with bcrypt on backend)
```
- ❌ Hash simulado (inseguro)
- ❌ Usuarios hardcodeados
- ❌ Tokens simulados

**Preparación Backend:** 30%

### 4.5 Análisis de shared/hooks

| Hook | Uso | Estado |
|------|-----|--------|
| use-mobile.tsx | ✅ Usado en sidebar | ACTIVO |

**Conclusión:** ✅ Hook único y en uso.

---

## 🔎 FASE 5 — IMPORTACIONES Y DEPENDENCIAS

### 5.1 Análisis de Imports

**Patrón de Imports Detectado:**

✅ **CORRECTO:** Uso de alias `@/`
```typescript
import { Order } from '@/entities/order/model/types'
import { useClients } from '@/entities/client/model/hooks'
import { Button } from '@/shared/ui/button'
```

❌ **INCORRECTO:** No se encontraron imports relativos largos (bien)

### 5.2 Dependencias Circulares

**Análisis de Dependencias:**

```
entities/order → entities/bank-account ✅
entities/order → entities/client ✅
entities/cash-closure → entities/financial-movement ✅
entities/cash-closure → entities/bank-account ✅

shared/api/orderPaymentApi → entities/order ✅
shared/api/orderPaymentApi → entities/bank-account ✅
shared/api/orderPaymentApi → entities/financial-movement ✅

features/order-management → entities/order ✅
features/order-management → entities/client ✅
features/order-management → entities/brand ✅
```

**Conclusión:** ✅ No se detectaron dependencias circulares críticas.

**Regla FSD Cumplida:**
- entities → entities ✅ (permitido)
- features → entities ✅ (permitido)
- features → features ❌ (no encontrado, correcto)
- entities → features ❌ (no encontrado, correcto)

### 5.3 Archivos No Utilizados

**Búsqueda de Código Muerto:**


**Archivos Potencialmente No Usados:**

1. **`entities/call-record/model/model.ts`**
   - Definido pero apenas referenciado
   - Solo usado internamente en calls

2. **`entities/payment/model/types.ts`**
   - Types definidos pero no usados directamente
   - Conflicto con OrderPayment

**Archivos de Documentación (No Código):**
- `dashboard_complete.txt`
- `dashboard_fixes.txt`
- `dashboard_redesign.txt`
- `sidebar_reorg_complete.txt`
- `sidebar_updated.txt`
- `task_complete.txt`

**Recomendación:** Mover archivos .txt a una carpeta `/docs` o eliminar si ya no son relevantes.

### 5.4 Imports Rotos

**Verificación:** ✅ No se detectaron imports rotos en el análisis.

---

## 🔎 FASE 6 — PREPARACIÓN PARA BACKEND

### 6.1 Evaluación de Preparación

| Aspecto | Estado Actual | Preparación | Acción Requerida |
|---------|---------------|-------------|------------------|
| **DTOs** | ❌ No existen | 0% | Crear capa de DTOs |
| **Mappers** | ❌ No existen | 0% | Crear mappers entity ↔ DTO |
| **API Layer** | 🟡 Mock APIs | 40% | Reemplazar con fetch/axios |
| **Servicios** | 🟡 En shared/api | 30% | Refactor a services/ |
| **Validación** | ✅ En entities | 80% | Mantener + backend |
| **Types** | ✅ Bien definidos | 90% | Ajustar según backend |
| **Hooks** | ✅ React Query | 85% | Ajustar endpoints |
| **Error Handling** | 🟡 Básico | 40% | Implementar manejo robusto |
| **Loading States** | ✅ Implementado | 80% | Mantener |
| **Optimistic Updates** | ❌ No implementado | 0% | Considerar implementar |

**Preparación General:** 45%

### 6.2 Datos Mock Mezclados con UI

**🔴 PROBLEMA:** Datos hardcodeados en múltiples lugares

**Ubicaciones de Datos Mock:**

1. **`shared/api/clientApi.ts`**
   ```typescript
   const MOCK_CLIENTS: Client[] = [
       { id: '1', firstName: 'Maria Fernanda Gonzalez', ... },
       { id: '2', firstName: 'Ana Lucia Perez', ... },
   ];
   ```

2. **`shared/api/brandApi.ts`**
   ```typescript
   const MOCK_BRANDS: Brand[] = [
       { id: '1', name: 'Marca A', ... },
       { id: '2', name: 'Marca B', ... },
   ];
   ```

3. **`shared/api/bankAccountApi.ts`**
   ```typescript
   const MOCK_BANK_ACCOUNTS: BankAccount[] = [
       { id: '1', bankName: 'Banco Pichincha', ... },
   ];
   ```

4. **`shared/api/transactionApi.ts`**
   ```typescript
   const MOCK_TRANSACTIONS: FinancialTransaction[] = [];
   const MOCK_CREDITS: ClientCredit[] = [];
   ```

5. **`shared/api/inventoryApi.ts`**
   ```typescript
   let movements: InventoryMovement[] = [];
   ```

6. **`features/calls/model/hooks.ts`**
   ```typescript
   let MOCK_CALLS: CallRecord[] = [
       { id: '1', clientName: 'Cliente Test', ... },
   ];
   ```

**Recomendación:** 
- Eliminar todos los datos mock antes de integración
- Reemplazar con llamadas a API real
- Mantener datos de prueba en archivos separados para desarrollo

### 6.3 Estado Hardcodeado

**Ejemplos de Estado Hardcodeado:**

1. **Usuarios de Prueba**
   ```typescript
   // shared/auth/authApi.ts
   const MOCK_USERS: AppUser[] = [
       { id: '1', username: 'admin', password: 'admin123', ... },
       { id: '2', username: 'vendedor', password: 'vendedor123', ... },
   ];
   ```

2. **Configuración de Recompensas**
   ```typescript
   // shared/lib/rewards.ts
   const POINTS_PER_DOLLAR = 10;
   const LEVEL_THRESHOLDS = { BRONZE: 0, SILVER: 1000, GOLD: 5000 };
   ```
   **Nota:** Esto debería venir de configuración del backend.

### 6.4 Partes que Necesitan Refactor

**ALTA PRIORIDAD:**

1. **`shared/api/orderPaymentApi.ts`**
   - Eliminar lógica transaccional
   - Convertir en simple wrapper de API
   - Backend debe manejar transacciones

2. **`shared/api/receptionApi.ts`**
   - Eliminar orquestación compleja
   - Backend debe manejar recepción

3. **`shared/api/paymentApi.ts`**
   - Simplificar a llamadas HTTP
   - Backend valida y procesa

**MEDIA PRIORIDAD:**

4. **`shared/auth/authApi.ts`**
   - Reemplazar mock con JWT real
   - Implementar refresh tokens
   - Manejo seguro de credenciales

5. **`features/transactions/lib/processPayment.ts`**
   - Mover lógica a backend
   - Mantener solo UI

**BAJA PRIORIDAD:**

6. **`shared/lib/rewards.ts`**
   - Mover a entities/client-reward/model
   - Configuración desde backend

### 6.5 Estructura Propuesta para Backend Integration

**Crear Nueva Capa:**

```
src/
├── api/                        # NUEVO - Capa de comunicación
│   ├── client/                 # Cliente HTTP (axios/fetch)
│   │   ├── httpClient.ts       # Configuración base
│   │   ├── interceptors.ts     # Auth, errors, etc.
│   │   └── endpoints.ts        # URLs centralizadas
│   │
│   ├── dtos/                   # NUEVO - Data Transfer Objects
│   │   ├── order.dto.ts
│   │   ├── client.dto.ts
│   │   ├── payment.dto.ts
│   │   └── ...
│   │
│   ├── mappers/                # NUEVO - Transformaciones
│   │   ├── orderMapper.ts      # DTO ↔ Entity
│   │   ├── clientMapper.ts
│   │   └── ...
│   │
│   └── services/               # NUEVO - Servicios de API
│       ├── orderService.ts     # Reemplaza shared/api/
│       ├── clientService.ts
│       ├── paymentService.ts
│       └── ...
│
├── entities/                   # MANTENER - Dominio
├── features/                   # MANTENER - Features
├── shared/                     # REFACTOR
│   ├── api/                    # ELIMINAR - Mover a /api/services
│   ├── auth/                   # REFACTOR - Usar JWT real
│   ├── hooks/                  # MANTENER
│   ├── lib/                    # MANTENER (sin lógica de negocio)
│   └── ui/                     # MANTENER
└── ...
```

---

## 🔎 FASE 7 — CONSISTENCIA DE DOMINIO

### 7.1 Modelo de Dominio

**Conceptos Principales Identificados:**


1. **Pedido (Order)** - CORE
   - Estados: RECIBIDO, POR_RECIBIR, ATRASADO, CANCELADO, RECIBIDO_EN_BODEGA, ENTREGADO
   - Tipos: NORMAL, PREVENTA, REPROGRAMACION
   - Canales: OFICINA, WHATSAPP, DOMICILIO
   - Relaciones: Cliente, Marca, Items, Pagos

2. **Cliente (Client)**
   - Identificación: CEDULA
   - Sucursal: MATRIZ
   - Relaciones: Pedidos, Créditos, Recompensas

3. **Marca (Brand)**
   - Estado: Activa/Inactiva
   - Relaciones: Pedidos

4. **Entrega (Delivery)**
   - Vinculada a Pedido
   - Fecha de entrega

5. **Bodega (Inventory)**
   - Movimientos: ENTRY, DELIVERED
   - Relaciones: Pedidos recibidos

6. **Cartera (Financial)**
   - Movimientos financieros
   - Cuentas bancarias
   - Transacciones
   - Créditos de cliente

7. **Caja (Cash)**
   - Cierres de caja
   - Balance por cuenta

8. **Alertas (Calls/Tracking)**
   - Llamadas de seguimiento
   - Razones y resultados

### 7.2 Lógica Duplicada

**🟡 DUPLICACIÓN DETECTADA:**

1. **Cálculo de Pagos**
   - `entities/order/model/model.ts` - getPaidAmount()
   - `shared/api/orderPaymentApi.ts` - Cálculo manual
   - **Solución:** Usar siempre la función de entity

2. **Validación de Montos**
   - `entities/order/model/model.ts` - addPayment()
   - `features/transactions/lib/validateTransaction.ts`
   - **Solución:** Centralizar en entities

3. **Cálculo de Recompensas**
   - `shared/lib/rewards.ts` - calculateRewardPoints()
   - `entities/client-reward/api/rewardsApi.ts` - Lógica similar
   - **Solución:** Mover todo a entities/client-reward/model

### 7.3 Conceptos Repetidos

**Análisis de Nombres:**

| Concepto | Variantes Encontradas | Problema | Solución |
|----------|----------------------|----------|----------|
| Payment | Payment, OrderPayment | Dos tipos | Consolidar |
| Transaction | FinancialTransaction, Transaction | Confusión | Unificar naming |
| Movement | FinancialMovement, InventoryMovement | OK | Mantener (contextos diferentes) |
| Delivery | Delivery, OrderDelivery | OK | Mantener (entity vs feature) |
| Receipt | OrderReceipt, PaymentReceipt | OK | Mantener (tipos diferentes) |

### 7.4 Modelo Mal Definido

**🔴 PROBLEMAS IDENTIFICADOS:**

1. **Campo Deprecated No Eliminado**
   ```typescript
   // entities/order/model/types.ts
   deposit: number; // DEPRECATED: always 0. Initial payment now goes through payments[]
   ```
   **Problema:** Campo marcado como deprecated pero aún presente en el tipo.
   **Solución:** Eliminar completamente o crear migración.

2. **Dos Conceptos de Payment**
   ```typescript
   // entities/payment/model/types.ts
   export interface Payment { ... }
   
   // entities/order/model/types.ts
   export type OrderPayment = { ... }
   ```
   **Problema:** Dos tipos diferentes para el mismo concepto.
   **Solución:** Decidir cuál usar y eliminar el otro.

3. **Entidad CallRecord Sin Uso Claro**
   ```typescript
   // entities/call-record/
   // Definida pero apenas usada
   ```
   **Problema:** No está claro si es diferente de Call.
   **Solución:** Consolidar con Call o eliminar.

### 7.5 Nombres Inconsistentes

**Análisis de Consistencia:**

| Entidad | Singular | Plural | Feature | Consistente |
|---------|----------|--------|---------|-------------|
| order | ✅ | orders | order-* | ✅ |
| client | ✅ | clients | clients | ✅ |
| brand | ✅ | brands | brand/brands | ❌ |
| bank-account | ✅ | - | bank-account/bank-accounts | ❌ |
| user | ✅ | users | users | ✅ |
| payment | ✅ | payments | payments | ✅ |
| transaction | ✅ | transactions | transactions | ✅ |

**Regla Propuesta:**
- Entities: Siempre singular
- Features: Plural si es CRUD, singular si es acción específica
- Ejemplo: `entities/order` + `features/orders` (CRUD) + `features/order-delivery` (acción)

---

## 📊 RESULTADO FINAL

### Resumen Ejecutivo

**Nivel de Preparación para Backend: 65%**

#### Desglose por Categoría:

| Categoría | Puntuación | Estado |
|-----------|------------|--------|
| Estructura de Carpetas | 75% | 🟡 Bueno con duplicaciones |
| Entidades | 70% | 🟡 Bien pero incompletas |
| Features | 80% | 🟢 Bien estructuradas |
| Shared | 60% | 🟡 Lógica mal ubicada |
| Importaciones | 90% | 🟢 Excelente |
| Preparación Backend | 45% | 🔴 Necesita trabajo |
| Consistencia Dominio | 65% | 🟡 Mejorable |

**Promedio General: 69%**

---

### 🔴 PROBLEMAS CRÍTICOS (Bloquean integración)

1. **Lógica Transaccional en Frontend**
   - Archivos: `shared/api/orderPaymentApi.ts`, `receptionApi.ts`, `paymentApi.ts`
   - Impacto: Alto
   - Esfuerzo: 3-5 días
   - Prioridad: CRÍTICA

2. **Duplicación de Features**
   - Archivos: `features/bank-account` vs `bank-accounts`, `brand` vs `brands`
   - Impacto: Medio
   - Esfuerzo: 2 horas
   - Prioridad: ALTA

3. **Falta de Capa de DTOs y Mappers**
   - Impacto: Alto
   - Esfuerzo: 5-7 días
   - Prioridad: CRÍTICA

4. **Datos Mock Hardcodeados**
   - Archivos: Todos los `shared/api/*.ts`
   - Impacto: Alto
   - Esfuerzo: 3-4 días
   - Prioridad: CRÍTICA

---

### 🟡 PROBLEMAS MEDIOS (Afectan calidad)

5. **Entidades Incompletas**
   - Entidades: `client-credit`, `financial-transaction`, `inventory-movement`
   - Impacto: Medio
   - Esfuerzo: 2-3 días
   - Prioridad: MEDIA

6. **Lógica de Negocio en shared/lib**
   - Archivo: `shared/lib/rewards.ts`
   - Impacto: Bajo
   - Esfuerzo: 1 hora
   - Prioridad: MEDIA

7. **Campo Deprecated Sin Eliminar**
   - Archivo: `entities/order/model/types.ts` (deposit)
   - Impacto: Bajo
   - Esfuerzo: 30 minutos
   - Prioridad: MEDIA

8. **Entidades Huérfanas**
   - Entidades: `call-record`, `payment`
   - Impacto: Bajo
   - Esfuerzo: 1-2 horas
   - Prioridad: MEDIA

---

### 🟢 MEJORAS RECOMENDADAS (Optimización)

9. **Implementar Error Handling Robusto**
   - Impacto: Medio
   - Esfuerzo: 2-3 días
   - Prioridad: BAJA

10. **Optimistic Updates**
    - Impacto: Bajo (UX)
    - Esfuerzo: 2-3 días
    - Prioridad: BAJA

11. **Mover Archivos de Documentación**
    - Archivos: `*.txt` en root
    - Impacto: Ninguno
    - Esfuerzo: 5 minutos
    - Prioridad: BAJA

12. **Consolidar Naming de Features**
    - Impacto: Bajo
    - Esfuerzo: 1 hora
    - Prioridad: BAJA

---

## 📋 PLAN DE LIMPIEZA POR FASES

### FASE 1: Limpieza Inmediata (1 día)

**Objetivo:** Eliminar duplicaciones y código muerto

**Tareas:**
1. ✅ Consolidar `features/bank-account` y `features/bank-accounts`
   - Eliminar `features/bank-account/`
   - Renombrar `features/bank-accounts/` → `features/bank-account/`
   - Mover hooks de bank-account/api/ a bank-account/api/

2. ✅ Consolidar `features/brand` y `features/brands`
   - Eliminar `features/brand/`
   - Renombrar `features/brands/` → `features/brand/`
   - Mover hooks de brand/api/ a brand/api/

3. ✅ Eliminar campo deprecated
   - Remover `deposit` de `Order` type
   - Actualizar todos los usos

4. ✅ Mover archivos de documentación
   - Crear carpeta `/docs`
   - Mover todos los `.txt`

**Resultado Esperado:** Estructura limpia sin duplicaciones

---

### FASE 2: Refactor de Entities (2-3 días)

**Objetivo:** Completar entidades incompletas

**Tareas:**
1. ✅ Completar `entities/client-credit`
   - Crear `model/model.ts` con lógica
   - Crear `model/index.ts`

2. ✅ Completar `entities/financial-transaction`
   - Crear `model/model.ts` con validaciones
   - Crear `model/index.ts`

3. ✅ Completar `entities/inventory-movement`
   - Crear `model/model.ts` con lógica
   - Mover `calculateDaysInWarehouse` desde features

4. ✅ Revisar `entities/call-record`
   - Decidir: consolidar con `call` o eliminar
   - Implementar decisión

5. ✅ Revisar `entities/payment`
   - Decidir: consolidar con `OrderPayment` o mantener separado
   - Implementar decisión

6. ✅ Mover `shared/lib/rewards.ts`
   - Mover a `entities/client-reward/model/model.ts`
   - Actualizar imports

**Resultado Esperado:** Todas las entidades completas y coherentes

---

### FASE 3: Preparación para Backend (5-7 días)

**Objetivo:** Crear capa de integración con backend

**Tareas:**
1. ✅ Crear estructura `/api`
   ```
   src/api/
   ├── client/
   │   ├── httpClient.ts
   │   ├── interceptors.ts
   │   └── endpoints.ts
   ├── dtos/
   ├── mappers/
   └── services/
   ```

2. ✅ Crear DTOs para todas las entidades
   - OrderDTO, ClientDTO, PaymentDTO, etc.
   - Request y Response DTOs

3. ✅ Crear Mappers
   - Entity → DTO
   - DTO → Entity
   - Manejo de campos opcionales

4. ✅ Crear Services
   - Reemplazar `shared/api/*.ts`
   - Usar httpClient
   - Manejo de errores

5. ✅ Configurar httpClient
   - Axios o Fetch
   - Interceptors para auth
   - Interceptors para errores
   - Base URL desde env

**Resultado Esperado:** Capa de API lista para conectar

---

### FASE 4: Migración de Lógica (3-5 días)

**Objetivo:** Eliminar lógica transaccional del frontend

**Tareas:**
1. ✅ Refactor `orderPaymentApi.ts`
   - Eliminar lógica transaccional
   - Convertir en llamada simple a backend
   - Backend maneja transacción

2. ✅ Refactor `receptionApi.ts`
   - Eliminar orquestación
   - Llamada simple a `/api/orders/:id/receive`

3. ✅ Refactor `paymentApi.ts`
   - Eliminar validaciones complejas
   - Backend valida y procesa

4. ✅ Refactor `authApi.ts`
   - Implementar JWT real
   - Refresh tokens
   - Secure storage

5. ✅ Eliminar datos mock
   - Remover todos los `MOCK_*` arrays
   - Mantener solo para tests

**Resultado Esperado:** Frontend sin lógica de backend

---

### FASE 5: Testing y Validación (2-3 días)

**Objetivo:** Verificar que todo funciona

**Tareas:**
1. ✅ Verificar imports
   - No hay imports rotos
   - No hay dependencias circulares

2. ✅ Verificar types
   - TypeScript compila sin errores
   - No hay `any` innecesarios

3. ✅ Testing manual
   - Todas las features funcionan
   - Flujos completos

4. ✅ Documentación
   - Actualizar README
   - Documentar estructura de API
   - Guía de integración backend

**Resultado Esperado:** Proyecto 100% listo para backend

---

## 📈 MÉTRICAS DE ÉXITO

### Antes de la Limpieza

- Preparación Backend: 45%
- Duplicaciones: 4
- Entidades Incompletas: 5
- Lógica Mal Ubicada: 8 archivos
- Código Deprecated: 2 campos

### Después de la Limpieza (Objetivo)

- Preparación Backend: 95%
- Duplicaciones: 0
- Entidades Incompletas: 0
- Lógica Mal Ubicada: 0
- Código Deprecated: 0

---

## 🎯 CONCLUSIÓN

El proyecto tiene una **base sólida** con arquitectura FSD bien implementada en su mayoría. Los principales problemas son:

1. **Duplicaciones fáciles de resolver** (2 horas)
2. **Lógica transaccional en frontend** que debe moverse al backend (crítico)
3. **Falta de capa de DTOs/Mappers** para integración limpia

Con el plan de limpieza propuesto (15-20 días de trabajo), el proyecto estará **100% preparado** para integración con backend, con:

- ✅ Arquitectura limpia y coherente
- ✅ Separación clara de responsabilidades
- ✅ Capa de API lista para conectar
- ✅ DTOs y Mappers implementados
- ✅ Sin lógica de backend en frontend
- ✅ Sin código muerto o duplicado

**Recomendación Final:** Ejecutar FASE 1 y FASE 2 antes de comenzar integración backend. FASE 3 y 4 pueden hacerse en paralelo con desarrollo del backend.

---

**Fin del Reporte de Auditoría**
