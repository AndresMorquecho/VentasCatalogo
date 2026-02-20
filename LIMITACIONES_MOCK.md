# LIMITACIONES DEL SISTEMA MOCK

## ⚠️ ADVERTENCIA IMPORTANTE

Este frontend funciona con datos MOCK (simulados en memoria). Las siguientes limitaciones son **críticas** y deben resolverse en el backend real antes de producción.

---

## 🔴 LIMITACIONES CRÍTICAS

### 1. Sin Transaccionalidad Real (ACID)

**Problema:**  
Las operaciones multi-entidad no tienen garantía ACID. Si una operación falla a mitad de camino, el sistema queda en estado inconsistente.

**Ejemplo:**
```typescript
// Si esto falla...
await financialRecordService.createOrderPaymentRecord(...);
// ...pero esto ya se ejecutó, el sistema queda inconsistente
await bankAccountApi.update(...);
```

**Impacto:** Datos financieros corruptos, imposibles de reconciliar.

**Solución Backend:** Usar transacciones de base de datos con rollback automático.

---

### 2. Sin Control de Concurrencia

**Problema:**  
Dos usuarios pueden modificar el mismo registro simultáneamente sin detección de conflictos.

**Ejemplo:**
- Usuario A lee pedido con saldo $50
- Usuario B lee pedido con saldo $50
- Usuario A agrega pago de $30 → saldo $20
- Usuario B agrega pago de $50 → saldo $0 (INCORRECTO, debería ser -$30)

**Impacto:** Pérdida de datos, sobrescritura de cambios.

**Solución Backend:** Implementar Optimistic Locking con campo `version`.

---

### 3. Sin Validación de Unicidad Real

**Problema:**  
Validaciones de duplicados son en memoria y no garantizan unicidad en escenarios concurrentes.

**Ejemplo:**
- Dos requests simultáneos para crear crédito con mismo `originTransactionId`
- Ambos pasan validación porque leen estado antes de que el otro escriba
- Se crean dos créditos duplicados

**Impacto:** Créditos duplicados, puntos duplicados, movimientos duplicados.

**Solución Backend:** Constraints UNIQUE en base de datos.

---

### 4. Sin Persistencia Real

**Problema:**  
Todos los datos se pierden al recargar la página o reiniciar el servidor.

**Impacto:** Imposible usar en producción.

**Solución Backend:** PostgreSQL con persistencia en disco.

---

## 🟠 LIMITACIONES GRAVES

### 5. Datos Derivados Sin Garantía

**Problema:**  
Campos calculados (como totales, balances) pueden desincronizarse si no se recalculan correctamente.

**Ejemplo Corregido:**
- ✅ `order.paidAmount` fue REMOVIDO
- ✅ Ahora se usa `getPaidAmount(order)` que calcula desde `payments[]`

**Pendiente en Backend:**
- `ClientAccount.totalCreditAvailable` debe recalcularse con trigger
- `BankAccount.currentBalance` debe validarse contra suma de movimientos

---

### 6. Sin Validación de Reglas de Negocio en Backend

**Problema:**  
Todas las validaciones están solo en frontend. Backend debe re-implementarlas.

**Validaciones Críticas a Implementar:**
- ✅ No recepcionar pedido ya recibido
- ✅ No entregar pedido ya entregado
- ✅ No crear crédito duplicado
- ✅ No aplicar puntos duplicados
- ⏳ No usar más crédito del disponible
- ⏳ No permitir balance negativo en cuentas (opcional según negocio)
- ⏳ No entregar pedido sin estar en bodega

---

### 7. Sin Idempotencia

**Problema:**  
Operaciones no son idempotentes. Si se ejecutan dos veces (por retry de red), generan datos duplicados.

**Solución Backend:**
- Usar IDs de idempotencia en requests críticos
- Validar duplicados por ID único antes de crear

---

## 🟡 LIMITACIONES MODERADAS

### 8. Sin Auditoría Completa

**Problema:**  
No hay registro de quién modificó qué y cuándo (más allá de `createdBy`).

**Solución Backend:**
- Agregar campos `createdBy`, `createdAt`, `updatedBy`, `updatedAt` a todas las entidades
- Implementar audit log para cambios críticos

---

### 9. Sin Manejo de Errores Robusto

**Problema:**  
Errores de red, timeouts, y fallos parciales no se manejan correctamente.

**Solución Backend:**
- Implementar retry con backoff exponencial
- Implementar circuit breakers
- Logs estructurados para debugging

---

### 10. Sin Validación de Permisos

**Problema:**  
No hay control de acceso. Cualquier usuario puede hacer cualquier operación.

**Solución Backend:**
- Implementar autenticación JWT
- Implementar autorización basada en roles
- Validar permisos en cada endpoint

---

## ✅ CORRECCIONES YA IMPLEMENTADAS

### 1. Eliminado `order.paidAmount` ✅
- **Antes:** Campo almacenado que podía desincronizarse
- **Ahora:** Calculado dinámicamente con `getPaidAmount(order)`
- **Beneficio:** Imposible tener inconsistencia

### 2. Validación de Recepción Duplicada ✅
- **Implementado:** Validación en `receiveOrder()` y `reception.service.ts`
- **Validación:** `if (order.status === 'RECIBIDO_EN_BODEGA') throw error`

### 3. Validación de Entrega Duplicada ✅
- **Implementado:** Validación en `DeliverOrderModal`
- **Validación:** `if (order.status === 'ENTREGADO') throw error`

### 4. Validación de Inventario Duplicado ✅
- **Implementado:** Validación antes de crear ENTRY y DELIVERED
- **Validación:** Busca movimientos existentes antes de crear

### 5. Validación de Recompensas Duplicadas ✅
- **Implementado:** Campo `appliedOrderIds` en `ClientReward`
- **Validación:** Verifica que pedido no fue procesado antes

### 6. Validación de Créditos Duplicados ✅
- **Implementado:** Validación en `clientCreditApi.createCredit()`
- **Validación:** Verifica `originTransactionId` único

---

## 📋 CHECKLIST PARA BACKEND

### Antes de Producción

- [ ] Implementar transacciones ACID con PostgreSQL
- [ ] Implementar Optimistic Locking (campo `version`)
- [ ] Agregar constraints UNIQUE en DB
- [ ] Implementar validaciones de negocio en backend
- [ ] Implementar idempotencia en endpoints críticos
- [ ] Implementar autenticación y autorización
- [ ] Implementar audit log
- [ ] Implementar manejo de errores robusto
- [ ] Implementar monitoreo y alertas
- [ ] Testing exhaustivo (unit, integration, e2e)

### Validaciones Críticas a Implementar

- [ ] No recepcionar pedido ya recibido
- [ ] No entregar pedido ya entregado
- [ ] No crear crédito duplicado para mismo `originTransactionId`
- [ ] No aplicar puntos duplicados para mismo `orderId`
- [ ] No crear movimiento de inventario duplicado
- [ ] No usar más crédito del disponible
- [ ] No permitir pagos negativos
- [ ] Validar que `sum(payments) <= effectiveTotal + tolerance`

---

## 🚀 PRÓXIMOS PASOS

1. Revisar este documento con el equipo
2. Priorizar implementación de backend
3. Seguir el plan de acción en `AUDITORIA_ARQUITECTONICA_COMPLETA.md`
4. Implementar con TDD (Test-Driven Development)
5. No lanzar a producción sin resolver limitaciones críticas

---

**Última Actualización:** 20 de Febrero de 2026  
**Estado:** Frontend listo para backend, con validaciones básicas implementadas

