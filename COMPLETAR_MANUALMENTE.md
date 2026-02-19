# 🔧 TAREAS PARA COMPLETAR MANUALMENTE

## ⚠️ ACCIÓN INMEDIATA REQUERIDA

### 1. Eliminar Carpeta Duplicada

La carpeta `src/features/bank-account/` no pudo ser eliminada automáticamente debido al servidor de desarrollo.

**Pasos:**
1. Detener el servidor de desarrollo si está corriendo
2. Ejecutar:
   ```bash
   rm -rf src/features/bank-account
   ```
   O en Windows PowerShell:
   ```powershell
   Remove-Item -Recurse -Force src/features/bank-account
   ```

### 2. Verificar Compilación

```bash
npm run build
```

Si hay errores, revisar el reporte completo en `REFACTOR_CONTROLADO_REPORTE.md`

### 3. Commit de Cambios

```bash
git add .
git commit -m "refactor: consolidate duplicate features (bank-accounts, brands)"
```

---

## 📝 DOCUMENTACIÓN PENDIENTE

### 4. Documentar Entidad Payment

Agregar al inicio de `src/entities/payment/model/types.ts`:

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

### 5. Crear README para Payment

Crear `src/entities/payment/README.md`:

```markdown
# Payment Entity

## Status: UNUSED

Esta entidad está definida pero actualmente NO se usa en el código.

## Diferencia con OrderPayment

| Aspecto | Payment | OrderPayment |
|---------|---------|--------------|
| Ubicación | entities/payment | entities/order |
| Propósito | Pago independiente | Pago de pedido |
| Workflow | Sí (PENDING/CONFIRMED/REJECTED) | No |
| Comprobante | Sí (receiptUrl) | No |
| Uso actual | ❌ No usado | ✅ Usado |

## Cuándo Usar

### Payment (Futuro)
- Pagos que requieren aprobación
- Pagos con comprobante que debe validarse
- Pagos independientes no vinculados a pedidos

### OrderPayment (Actual)
- Abonos directos a pedidos
- Historial de pagos del pedido
- Pagos inmediatos sin workflow

## Decisión Arquitectónica

Mantener ambos tipos porque representan conceptos diferentes:
- Payment: Entidad independiente con estado
- OrderPayment: Valor embebido en Order

Si el backend solo usa uno, mapear según corresponda.
```

### 6. Marcar Lógica Transaccional

Agregar comentarios en los archivos identificados:

**`src/shared/api/orderPaymentApi.ts`** (línea 1):
```typescript
/**
 * TODO: MOVE TO BACKEND
 * This file contains transactional logic that should be handled by the backend.
 * See REFACTOR_CONTROLADO_REPORTE.md for details.
 * 
 * Required endpoints:
 * - POST /api/orders/:id/payments
 * - PUT /api/orders/:id/payments/:paymentId
 * - DELETE /api/orders/:id/payments/:paymentId
 */
```

**`src/shared/api/receptionApi.ts`** (línea 1):
```typescript
/**
 * TODO: MOVE TO BACKEND
 * This file contains complex transactional logic that should be handled by the backend.
 * See REFACTOR_CONTROLADO_REPORTE.md for details.
 * 
 * Required endpoints:
 * - POST /api/orders/batch-reception
 * - POST /api/orders/batch-reception-simple
 */
```

**`src/shared/api/paymentApi.ts`** (línea 1):
```typescript
/**
 * TODO: MOVE TO BACKEND
 * This file contains payment registration logic that should be handled by the backend.
 * See REFACTOR_CONTROLADO_REPORTE.md for details.
 * 
 * Required endpoints:
 * - POST /api/payments
 * - DELETE /api/payments/:id
 */
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

Antes de continuar con el desarrollo:

- [ ] Carpeta `src/features/bank-account/` eliminada
- [ ] `npm run build` ejecuta sin errores
- [ ] Cambios commiteados en git
- [ ] Documentación de Payment agregada
- [ ] README de Payment creado
- [ ] Comentarios TODO agregados en archivos transaccionales
- [ ] Equipo notificado de los cambios

---

## 📚 ARCHIVOS DE REFERENCIA

- `REFACTOR_CONTROLADO_REPORTE.md` - Reporte completo detallado
- `RESUMEN_REFACTOR.md` - Resumen ejecutivo
- `AUDITORIA_ARQUITECTURA.md` - Auditoría completa original
- `PLAN_ACCION_INMEDIATO.md` - Plan de acción completo

---

## 🆘 SI ALGO FALLA

1. **Imports rotos:**
   ```bash
   grep -r "@/features/bank-account[^s]" src/
   grep -r "@/features/brand[^s]" src/
   ```
   Si encuentra algo, actualizar manualmente a la versión plural.

2. **Errores de compilación:**
   - Revisar `REFACTOR_CONTROLADO_REPORTE.md` sección "Archivos Modificados"
   - Verificar que todos los imports estén actualizados

3. **Servidor de desarrollo no inicia:**
   - Eliminar `node_modules/.vite`
   - Reiniciar servidor: `npm run dev`

---

**Tiempo estimado:** 15-20 minutos
