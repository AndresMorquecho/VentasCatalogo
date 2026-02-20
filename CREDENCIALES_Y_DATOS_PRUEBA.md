# Credenciales y Datos de Prueba

## 🔐 Credenciales de Acceso

### Usuario Administrador (Acceso Completo)
```
Email: admin@temu.com
Contraseña: Admin123!
Rol: Administrador
Permisos: Todos los módulos
```

### Usuario Cajera (Acceso Limitado)
```
Email: cajera@temu.com
Contraseña: Caja123!
Rol: Cajera
Permisos: Pedidos, Pagos, Transacciones, Cierre de Caja, Clientes (solo vista)
```

---

## 👥 Clientes Mockeados

### Cliente 1: Maria Fernanda Gonzalez
```
ID: 1
Cédula: 1723456789
Email: maria.gonzalez@email.com
Teléfono 1: 0998765432 (Claro)
Teléfono 2: 0987654321 (Movistar)
Ciudad: Quito, Pichincha
Dirección: Av. Amazonas y Colon N23-45
Sector: Norte - La Mariscal
Referencia: Frente al parque El Ejido
```

### Cliente 2: Ana Lucia Perez
```
ID: 2
Cédula: 1712345678
Email: ana.perez@email.com
Teléfono: 0987654321 (Movistar)
Ciudad: Guayaquil, Guayas
Dirección: Calle 10 de Agosto 456
```

---

## 🏷️ Marcas Disponibles

### Marca 1: SHEIN
```
ID: 1
Estado: Activa ✅
Descripción: Clothing giant
```

### Marca 2: Nike
```
ID: 2
Estado: Activa ✅
Descripción: Sportswear
```

### Marca 3: Adidas
```
ID: 3
Estado: Inactiva ❌
Descripción: (sin descripción)
```

---

## 🏦 Cuentas Bancarias

### Cuenta 1: Banco Pichincha - Ahorros
```
ID: 1
Tipo: BANK (Bancaria)
Titular: Juan Pérez
Banco: Banco Pichincha
N° Cuenta: 1234567890
Saldo Actual: $1,500.50
Estado: Activa ✅
Descripción: Cuenta de Ahorros Principal
```

### Cuenta 2: Caja Chica Oficina
```
ID: 2
Tipo: CASH (Efectivo)
Titular: Administración
Saldo Actual: $300.00
Estado: Activa ✅
Descripción: Caja menor para gastos diarios
```

### Cuenta 3: Banco Guayaquil - Corriente
```
ID: 3
Tipo: BANK (Bancaria)
(Datos adicionales en el sistema)
```

---

## 📦 Pedidos de Prueba Existentes

El sistema tiene varios pedidos mockeados con diferentes estados:

### Pedido #123 - Maria Fernanda Gonzalez
- Marca: Nike
- Valor: $10.00
- Abonado: $25.00
- Estado: POR_RECIBIR
- **Perfecto para probar saldo a favor** ✨

### Otros Pedidos
- Varios pedidos en diferentes estados (PENDIENTE, POR_RECIBIR, RECIBIDO_EN_BODEGA, ENTREGADO)
- Clientes: Maria Fernanda Gonzalez y Ana Lucia Perez
- Marcas: SHEIN, Nike, Adidas

---

## 🧪 Escenarios de Prueba para Saldo a Favor

### Escenario 1: Crear Pedido Nuevo con Saldo a Favor

**Paso 1: Login**
```
Email: admin@temu.com
Contraseña: Admin123!
```

**Paso 2: Crear Pedido**
1. Ir a "Pedidos" → "Nuevo Pedido"
2. Seleccionar cliente: Maria Fernanda Gonzalez
3. Seleccionar marca: SHEIN
4. Valor del pedido: $50.00
5. Abono inicial: $40.00
6. Método de pago: Efectivo
7. Guardar

**Paso 3: Recibir en Bodega**
1. Ir a "Recepción de Pedidos"
2. Buscar el pedido creado
3. Mover a "Zona de Recepción"
4. Ingresar:
   - Valor Real Factura: $30.00
   - N° Factura: FAC-TEST-001
   - Abono en Recepción: $0.00
5. Confirmar Recepción
6. **Verificar en consola:** `[MockAPI] Generating credit of 10 for client`

**Paso 4: Entregar al Cliente**
1. Ir a "Entregas"
2. Buscar el pedido recibido
3. Click en "Entregar"
4. **Verificar que muestra:**
   - Valor Total (Factura Real): $30.00
   - Total Pagado: $40.00
   - Saldo Pendiente: $0.00
   - Saldo a Favor del Cliente: $10.00 (en verde)
5. Confirmar Entrega (sin cobro)
6. **Verificar mensaje:** "Cliente tiene saldo a favor de $10.00"

---

### Escenario 2: Usar Pedido Existente #123

**Paso 1: Login**
```
Email: admin@temu.com
Contraseña: Admin123!
```

**Paso 2: Ir a Recepción**
1. Ir a "Recepción de Pedidos"
2. Buscar pedido #123 (Maria Fernanda Gonzalez - Nike)
3. Mover a "Zona de Recepción"
4. Ingresar:
   - Valor Real Factura: $10.00
   - N° Factura: FAC-123
   - Abono en Recepción: $0.00
5. Confirmar

**Paso 3: Verificar Entrega**
1. Ir a "Entregas"
2. Buscar pedido #123
3. Click en "Entregar"
4. Debe mostrar saldo a favor de $15.00

---

### Escenario 3: Cliente Debe Más (Precio Aumentó)

**Paso 1: Crear Pedido**
- Cliente: Ana Lucia Perez
- Marca: SHEIN
- Valor: $50.00
- Abono: $20.00

**Paso 2: Recibir con Valor Mayor**
- Valor Real Factura: $60.00
- Resultado: Saldo pendiente $40.00

**Paso 3: Entregar**
- Debe pedir cobro de $40.00
- Formulario de pago obligatorio

---

### Escenario 4: Abono en Recepción Genera Crédito

**Paso 1: Crear Pedido**
- Cliente: Maria Fernanda Gonzalez
- Marca: Nike
- Valor: $50.00
- Abono: $20.00

**Paso 2: Recibir con Abono Excesivo**
- Valor Real Factura: $40.00
- Abono en Recepción: $25.00
- Resultado: Paga $20, genera crédito de $5

**Paso 3: Entregar**
- Debe mostrar saldo a favor de $5.00

---

## 🔍 Verificación de Créditos

### Consola del Navegador (F12)
Buscar mensajes:
```
[MockAPI] Generating credit of X for client due to invoice adjustment.
```

### Módulo de Transacciones
1. Ir a "Transacciones"
2. Buscar transacciones tipo "AJUSTE"
3. Verificar montos y referencias

---

## 📝 Métodos de Pago Disponibles

1. **Efectivo** - No requiere referencia ni cuenta
2. **Transferencia** - Requiere cuenta bancaria y N° referencia
3. **Depósito** - Requiere cuenta bancaria y N° comprobante
4. **Cheque** - Requiere cuenta bancaria y N° cheque

**Nota:** Para Transferencia, Depósito y Cheque, el sistema valida que el N° de comprobante sea único.

---

## 🎯 Flujo Completo Recomendado

1. **Login** con admin@temu.com
2. **Crear Cliente** (opcional, ya hay 2 clientes)
3. **Crear Pedido** con abono inicial
4. **Recibir en Bodega** con valor real menor
5. **Verificar** que se genera crédito
6. **Entregar** sin cobro adicional
7. **Verificar** mensaje de saldo a favor

---

## ⚠️ Notas Importantes

### Limpiar Caché
Antes de probar, asegúrate de limpiar el caché:
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### Reiniciar Dev Server
Si ves errores, reinicia:
```bash
Ctrl + C
npm run dev
```

### Datos en Memoria
Los datos mockeados están en memoria. Si recargas la página:
- Los pedidos creados se pierden
- Los créditos generados se pierden
- Los datos iniciales se restauran

### Permisos por Rol
- **Administrador:** Acceso total
- **Cajera:** No puede crear/editar usuarios, roles, marcas

---

## 🐛 Troubleshooting

### Error: "El valor real no puede ser menor..."
**Solución:** Limpia el caché del navegador (Ctrl + Shift + R)

### No aparece el pedido en Recepción
**Verificar:** El pedido debe estar en estado "POR_RECIBIR"

### No aparece el pedido en Entregas
**Verificar:** El pedido debe estar en estado "RECIBIDO_EN_BODEGA"

### No se genera el crédito
**Verificar en consola:** Debe aparecer mensaje `[MockAPI] Generating credit...`

---

## 📊 Estados de Pedidos

1. **PENDIENTE** - Pedido creado, esperando procesamiento
2. **POR_RECIBIR** - Pedido confirmado, esperando llegada a bodega
3. **RECIBIDO_EN_BODEGA** - Pedido en bodega, listo para entrega
4. **ENTREGADO** - Pedido entregado al cliente

---

## 🎨 Indicadores Visuales

### En Recepción
- Saldo positivo: Texto normal
- Saldo a favor: "Favor: $X.XX" en verde

### En Entrega
- Con deuda: Formulario amarillo de cobro obligatorio
- Con crédito: Alerta verde "Cliente con Saldo a Favor"
- Pagado exacto: Alerta verde "Listo para Entregar"

### En Tabla de Entregas (Alertas de Tiempo)
- Blanco: < 5 días en bodega
- Amarillo: 5-15 días en bodega
- Rojo: > 15 días en bodega (crítico)

---

## 📞 Contacto de Soporte

Si encuentras problemas:
1. Verifica que el dev server esté corriendo
2. Limpia el caché del navegador
3. Revisa la consola del navegador (F12)
4. Verifica que estés usando las credenciales correctas
