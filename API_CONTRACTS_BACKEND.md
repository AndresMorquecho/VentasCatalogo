# Contratos de API para Backend - VentasCatalogo

## Fecha: 2026-02-20

Este documento define los contratos de API REST que el backend debe implementar para conectarse con el frontend existente.

---

## Convenciones Generales

### Base URL
```
https://api.ventascatalogo.com/v1
```

### Headers Comunes
```http
Content-Type: application/json
Authorization: Bearer {token}
```

### Respuestas Estándar

#### Éxito
```json
{
  "success": true,
  "data": { ... }
}
```

#### Error
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensaje descriptivo",
    "details": { ... }
  }
}
```

### Códigos HTTP
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

---

## 1. Pedidos (Orders)

### GET /api/orders
Obtener lista de pedidos con filtros opcionales.

**Query Parameters:**
```
?status=POR_RECIBIR|RECIBIDO_EN_BODEGA|ENTREGADO|CANCELADO
&clientId=string
&brandId=string
&startDate=YYYY-MM-DD
&endDate=YYYY-MM-DD
&search=string
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "receiptNumber": "string",
      "salesChannel": "OFICINA|WHATSAPP|DOMICILIO",
      "type": "NORMAL|PREVENTA|REPROGRAMACION",
      "brandId": "string",
      "brandName": "string",
      "total": 0,
      "realInvoiceTotal": 0,
      "paymentMethod": "EFECTIVO|TRANSFERENCIA|DEPOSITO|CHEQUE",
      "bankAccountId": "string",
      "transactionDate": "ISO8601",
      "payments": [
        {
          "id": "string",
          "amount": 0,
          "method": "string",
          "reference": "string",
          "createdAt": "ISO8601",
          "description": "string"
        }
      ],
      "paidAmount": 0,
      "createdAt": "ISO8601",
      "possibleDeliveryDate": "ISO8601",
      "receptionDate": "ISO8601",
      "deliveryDate": "ISO8601",
      "invoiceNumber": "string",
      "status": "string",
      "clientId": "string",
      "clientName": "string",
      "items": [
        {
          "id": "string",
          "productName": "string",
          "quantity": 0,
          "unitPrice": 0,
          "brandId": "string",
          "brandName": "string",
          "link": "string"
        }
      ],
      "notes": "string"
    }
  ]
}
```

### POST /api/orders
Crear nuevo pedido.

**Request Body:**
```json
{
  "salesChannel": "OFICINA",
  "type": "NORMAL",
  "brandId": "string",
  "brandName": "string",
  "total": 0,
  "paymentMethod": "EFECTIVO",
  "bankAccountId": "string",
  "transactionDate": "ISO8601",
  "possibleDeliveryDate": "ISO8601",
  "clientId": "string",
  "clientName": "string",
  "items": [
    {
      "productName": "string",
      "quantity": 0,
      "unitPrice": 0,
      "brandId": "string",
      "brandName": "string",
      "link": "string"
    }
  ],
  "notes": "string",
  "initialPayment": {
    "amount": 0,
    "method": "EFECTIVO",
    "reference": "string"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "receiptNumber": "ORD-20260220-001",
    ...
  }
}
```

### GET /api/orders/:id
Obtener detalle de un pedido.

**Response:** Igual que un elemento del array de GET /api/orders

### PUT /api/orders/:id
Actualizar pedido existente.

**Request Body:** Igual que POST pero todos los campos opcionales

### DELETE /api/orders/:id
Cancelar pedido (soft delete, cambia status a CANCELADO).

---

## 2. Recepción de Pedidos

### POST /api/orders/batch-reception
Recepcionar múltiples pedidos en batch.

**Request Body:**
```json
{
  "items": [
    {
      "orderId": "string",
      "finalTotal": 0,
      "finalInvoiceNumber": "string",
      "abonoRecepcion": 0
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "processed": 5,
    "failed": 0,
    "orders": [ ... ]
  }
}
```

### POST /api/orders/:id/receive
Recepcionar un pedido individual.

**Request Body:**
```json
{
  "finalTotal": 0,
  "invoiceNumber": "string",
  "abonoRecepcion": 0
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": { ... },
    "creditGenerated": 0
  }
}
```

---

## 3. Entrega de Pedidos

### POST /api/orders/:id/deliver
Entregar un pedido al cliente.

**Request Body:**
```json
{
  "deliveryDate": "ISO8601",
  "notes": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": { ... },
    "rewardsUpdated": {
      "pointsEarned": 0,
      "totalPoints": 0
    }
  }
}
```

---

## 4. Pagos (Payments)

### POST /api/payments
Registrar un abono posterior.

**Request Body:**
```json
{
  "orderId": "string",
  "clientId": "string",
  "amount": 0,
  "method": "EFECTIVO|TRANSFERENCIA|DEPOSITO|CHEQUE|CREDITO_CLIENTE",
  "referenceNumber": "string",
  "notes": "string",
  "bankAccountId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payment": { ... },
    "creditGenerated": 0,
    "order": { ... }
  }
}
```

### GET /api/payments
Obtener historial de pagos.

**Query Parameters:**
```
?orderId=string
&clientId=string
&startDate=YYYY-MM-DD
&endDate=YYYY-MM-DD
```

### DELETE /api/payments/:id
Revertir un pago.

---

## 5. Clientes (Clients)

### GET /api/clients
Obtener lista de clientes.

**Query Parameters:**
```
?search=string
&active=true|false
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "firstName": "string",
      "lastName": "string",
      "cedula": "string",
      "phone": "string",
      "email": "string",
      "address": "string",
      "city": "string",
      "notes": "string",
      "active": true,
      "createdAt": "ISO8601"
    }
  ]
}
```

### POST /api/clients
Crear nuevo cliente.

**Request Body:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "cedula": "string",
  "phone": "string",
  "email": "string",
  "address": "string",
  "city": "string",
  "notes": "string"
}
```

### PUT /api/clients/:id
Actualizar cliente.

### DELETE /api/clients/:id
Desactivar cliente (soft delete).

---

## 6. Créditos de Cliente (Client Credits)

### GET /api/clients/:clientId/credits
Obtener créditos disponibles de un cliente.

**Response:**
```json
{
  "success": true,
  "data": {
    "clientId": "string",
    "clientName": "string",
    "totalAvailable": 0,
    "credits": [
      {
        "id": "string",
        "amount": 0,
        "remainingAmount": 0,
        "originTransactionId": "string",
        "originOrderId": "string",
        "originOrderNumber": "string",
        "createdAt": "ISO8601",
        "expiresAt": "ISO8601",
        "status": "AVAILABLE|USED|EXPIRED"
      }
    ]
  }
}
```

### POST /api/clients/:clientId/credits/use
Usar crédito en un nuevo pedido.

**Request Body:**
```json
{
  "orderId": "string",
  "amount": 0
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "creditUsed": 0,
    "remainingCredit": 0,
    "order": { ... }
  }
}
```

---

## 7. Movimientos Financieros (Financial Movements)

### GET /api/financial-movements
Obtener movimientos financieros.

**Query Parameters:**
```
?type=INCOME|EXPENSE
&source=ORDER_PAYMENT|MANUAL|ADJUSTMENT
&bankAccountId=string
&startDate=YYYY-MM-DD
&endDate=YYYY-MM-DD
&clientId=string
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "type": "INCOME|EXPENSE",
      "source": "ORDER_PAYMENT|MANUAL|ADJUSTMENT",
      "amount": 0,
      "description": "string",
      "bankAccountId": "string",
      "referenceId": "string",
      "clientId": "string",
      "clientName": "string",
      "paymentMethod": "EFECTIVO|TRANSFERENCIA|DEPOSITO|CHEQUE",
      "createdBy": "string",
      "createdByName": "string",
      "createdAt": "ISO8601"
    }
  ]
}
```

### POST /api/financial-movements
Crear movimiento manual.

**Request Body:**
```json
{
  "type": "INCOME|EXPENSE",
  "source": "MANUAL",
  "amount": 0,
  "description": "string",
  "bankAccountId": "string",
  "paymentMethod": "EFECTIVO"
}
```

---

## 8. Dashboard

### GET /api/dashboard/metrics
Obtener métricas del dashboard.

**Query Parameters:**
```
?startDate=YYYY-MM-DD
&endDate=YYYY-MM-DD
```

**Response:**
```json
{
  "success": true,
  "data": {
    "financial": {
      "dailyIncome": 0,
      "monthlyIncome": 0,
      "dailyAbonos": 0,
      "totalPortfolioPending": 0,
      "overduePortfolioPercentage": 0,
      "currentCash": 0
    },
    "operational": {
      "ordersReceivedToday": 0,
      "ordersPending": 0,
      "ordersInWarehouse": 0,
      "ordersDeliveredToday": 0,
      "totalOrdersDelivered": 0,
      "totalActiveClients": 0,
      "ordersByStatus": {
        "porRecibir": 0,
        "recepcionado": 0,
        "entregado": 0,
        "cancelado": 0
      },
      "averageWarehouseTimeDays": 0
    },
    "tracking": {
      "ordersWithoutCall7Days": 0,
      "callsMadeToday": 0,
      "clientsWithoutRecentFollowup": 0
    },
    "loyalty": {
      "pointsGeneratedThisMonth": 0,
      "topClients": [
        {
          "name": "string",
          "points": 0
        }
      ],
      "redemptionsMade": 0
    },
    "alerts": {
      "ordersOver15Days": 0,
      "ordersOver30Days": 0,
      "totalRetainedValue": 0,
      "oldestOrders": [
        {
          "id": "string",
          "clientName": "string",
          "days": 0,
          "value": 0
        }
      ]
    },
    "charts": {
      "salesTrend": [
        {
          "date": "string",
          "amount": 0
        }
      ],
      "orderStatus": [
        {
          "status": "string",
          "count": 0,
          "color": "string"
        }
      ],
      "warehouseTimeTrend": [
        {
          "month": "string",
          "days": 0
        }
      ],
      "comparison": {
        "category": "string",
        "value1": 0,
        "value2": 0
      },
      "weeklyFlow": [
        {
          "week": "string",
          "created": 0,
          "delivered": 0
        }
      ]
    }
  }
}
```

---

## 9. Cierre de Caja (Cash Closure)

### GET /api/cash-closure
Obtener datos para cierre de caja.

**Query Parameters:**
```
?date=YYYY-MM-DD
&startDate=YYYY-MM-DD
&endDate=YYYY-MM-DD
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD"
    },
    "summary": {
      "totalIncome": 0,
      "totalExpense": 0,
      "netBalance": 0,
      "movementCount": 0
    },
    "byClient": {
      "clientId": {
        "clientName": "string",
        "income": 0,
        "expense": 0,
        "balance": 0,
        "count": 0
      }
    },
    "byPaymentMethod": {
      "EFECTIVO": {
        "income": 0,
        "expense": 0,
        "balance": 0,
        "count": 0
      }
    },
    "byBankAccount": {
      "accountId": {
        "accountName": "string",
        "income": 0,
        "expense": 0,
        "balance": 0,
        "count": 0
      }
    },
    "movements": [ ... ]
  }
}
```

---

## 10. Fidelización (Loyalty/Rewards)

### GET /api/rewards
Obtener todos los rewards.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "clientId": "string",
      "totalPoints": 0,
      "availablePoints": 0,
      "lifetimePoints": 0,
      "tier": "BRONZE|SILVER|GOLD|PLATINUM",
      "lastActivityDate": "ISO8601"
    }
  ]
}
```

### GET /api/rewards/:clientId
Obtener rewards de un cliente específico.

### POST /api/rewards/:clientId/redeem
Canjear puntos.

**Request Body:**
```json
{
  "points": 0,
  "rewardType": "string",
  "notes": "string"
}
```

---

## 11. Inventario (Inventory)

### GET /api/inventory/movements
Obtener movimientos de inventario.

**Query Parameters:**
```
?type=ENTRY|DELIVERED
&brandId=string
&clientId=string
&startDate=YYYY-MM-DD
&endDate=YYYY-MM-DD
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "orderId": "string",
      "clientId": "string",
      "brandId": "string",
      "type": "ENTRY|DELIVERED",
      "createdBy": "string",
      "notes": "string",
      "createdAt": "ISO8601"
    }
  ]
}
```

---

## 12. Llamadas (Calls)

### GET /api/calls
Obtener historial de llamadas.

**Query Parameters:**
```
?clientId=string
&orderId=string
&reason=string
&result=string
&startDate=YYYY-MM-DD
&endDate=YYYY-MM-DD
```

### POST /api/calls
Registrar nueva llamada.

**Request Body:**
```json
{
  "clientId": "string",
  "orderId": "string",
  "reason": "string",
  "result": "string",
  "notes": "string",
  "followUpDate": "ISO8601"
}
```

---

## 13. Cuentas Bancarias (Bank Accounts)

### GET /api/bank-accounts
Obtener cuentas bancarias.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "type": "CASH|BANK",
      "accountNumber": "string",
      "bankName": "string",
      "currentBalance": 0,
      "active": true
    }
  ]
}
```

### PUT /api/bank-accounts/:id
Actualizar cuenta bancaria.

---

## 14. Marcas (Brands)

### GET /api/brands
Obtener marcas.

### POST /api/brands
Crear marca.

### PUT /api/brands/:id
Actualizar marca.

### DELETE /api/brands/:id
Desactivar marca.

---

## 15. Usuarios y Auditoría

### GET /api/users
Obtener usuarios.

### POST /api/users
Crear usuario.

### GET /api/audit-log
Obtener log de auditoría.

**Query Parameters:**
```
?module=string
&severity=INFO|WARNING|ERROR
&userId=string
&startDate=YYYY-MM-DD
&endDate=YYYY-MM-DD
```

---

## Notas de Implementación

### Transacciones
Todas las operaciones que involucran múltiples entidades deben ser transaccionales:
- Crear pedido con pago inicial
- Recepcionar pedido con abono
- Entregar pedido (actualizar rewards)
- Registrar abono (generar crédito si hay exceso)

### Consistencia Financiera
El backend debe garantizar que:
- Cada pago crea AMBOS: `FinancialTransaction` + `FinancialMovement`
- Los saldos de cuentas bancarias se actualizan automáticamente
- Los créditos se generan automáticamente cuando hay exceso

### Validaciones
El backend debe validar:
- Cédula ecuatoriana (algoritmo módulo 10)
- Montos positivos
- Saldo pendiente antes de entregar
- Fechas válidas
- Permisos de usuario

### Auditoría
Todas las operaciones críticas deben registrarse en el log de auditoría:
- Crear/editar/eliminar pedidos
- Pagos y abonos
- Recepción y entrega
- Uso de créditos
- Cambios en configuración

---

**Última actualización:** 2026-02-20  
**Versión:** 1.0
