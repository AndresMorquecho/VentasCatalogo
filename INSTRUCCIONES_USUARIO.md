# 🚀 Instrucciones para Usar el Nuevo DateRangePicker

## ⚠️ IMPORTANTE: Reiniciar el Servidor

El error que estás viendo es porque Vite necesita reiniciar después de instalar `react-day-picker`. 

### Opción 1: Script Automático (Recomendado)
```bash
# En Windows (CMD)
cd VentasCatalogo
restart-dev-server.bat

# En Windows (PowerShell)
cd VentasCatalogo
.\restart-dev-server.ps1
```

### Opción 2: Manual
```bash
cd VentasCatalogo

# 1. Detener el servidor actual (Ctrl+C)

# 2. Limpiar cache de Vite
rm -rf node_modules/.vite

# 3. Reiniciar el servidor
npm run dev
```

## 📱 Cómo Usar el DateRangePicker

### Paso 1: Abrir el Calendario
Haz clic en cualquier campo de fecha que veas en la aplicación:

```
┌────────────────────────────────────┐
│ 📅 Seleccionar rango          ▼   │  ← Click aquí
└────────────────────────────────────┘
```

### Paso 2: Seleccionar Fecha Inicio
Haz clic en la primera fecha del rango que deseas:

```
┌────────────────────────────────────┐
│  Enero 2024                        │
│  L   M   M   J   V   S   D         │
│  1   2   3   4   5   6   7         │
│  8   9  10  11  12  13  14         │
│ [15] 16  17  18  19  20  21  ← Click en 15
│  22  23  24  25  26  27  28        │
└────────────────────────────────────┘
```

### Paso 3: Seleccionar Fecha Fin
Haz clic en la última fecha del rango:

```
┌────────────────────────────────────┐
│  Enero 2024                        │
│  L   M   M   J   V   S   D         │
│  1   2   3   4   5   6   7         │
│  8   9  10  11  12  13  14         │
│ [15][16][17][18][19][20][21]       │
│ [22][23][24][25][26][27][28]       │
│ [29][30][31] ← Click en 31         │
└────────────────────────────────────┘
```

### Paso 4: Cerrar el Calendario
Haz clic en el botón "Cerrar" o fuera del calendario:

```
┌────────────────────────────────────┐
│  Seleccionado: 15 Ene - 31 Ene 2024│
│                  [Limpiar] [Cerrar]│ ← Click aquí
└────────────────────────────────────┘
```

### Resultado Final
El campo mostrará el rango seleccionado:

```
┌────────────────────────────────────┐
│ 📅 15 Ene - 31 Ene 2024    ✕  ▼  │
└────────────────────────────────────┘
```

## 🎯 Funciones Adicionales

### Limpiar el Rango
Haz clic en la ✕ para borrar la selección:

```
┌────────────────────────────────────┐
│ 📅 15 Ene - 31 Ene 2024    ✕  ▼  │
│                             ↑      │
│                        Click aquí  │
└────────────────────────────────────┘
```

### Cambiar de Mes
Usa las flechas para navegar entre meses:

```
┌────────────────────────────────────┐
│  ◀  Enero 2024  ▶                  │
│   ↑              ↑                 │
│  Mes anterior   Mes siguiente      │
└────────────────────────────────────┘
```

### Seleccionar Solo Una Fecha
Si solo haces clic en una fecha, se mostrará así:

```
┌────────────────────────────────────┐
│ 📅 15 Ene 2024             ✕  ▼  │
└────────────────────────────────────┘
```

## 📍 Dónde Encontrar el DateRangePicker

### 1. Recepción de Pedidos
- **Página**: Packing (Bodega)
- **Ruta**: `/orders/reception`
- **Campo**: "Rango de Entrega"

### 2. Historial de Recepciones
- **Página**: Historial de Recepciones
- **Ruta**: `/orders/reception/history`
- **Campo**: "Rango de Recepción"

### 3. Entrega de Pedidos
- **Página**: Entrega al Cliente
- **Ruta**: `/orders/delivery`
- **Campo**: "Rango de Recepción"

### 4. Historial de Entregas
- **Página**: Historial de Entregas
- **Ruta**: `/orders/delivery/history`
- **Campo**: "Rango de Entrega"

### 5. Inventario
- **Página**: Inventario de Pedidos
- **Ruta**: `/inventory`
- **Campo**: "Rango de Fechas"

### 6. Transacciones
- **Página**: Transacciones Financieras
- **Ruta**: `/transactions`
- **Campo**: "Rango de Fechas"

### 7. Detalle de Cliente
- **Modal**: Al ver detalles de un cliente
- **Tab**: "Reporte de Pedidos"
- **Campo**: "Rango de Fechas"

## 💡 Consejos y Trucos

### ✅ Buenas Prácticas
1. **Selecciona siempre ambas fechas** para obtener resultados precisos
2. **Usa el botón "Cerrar"** para confirmar tu selección
3. **Limpia el filtro** cuando quieras ver todos los registros
4. **Navega entre meses** para seleccionar fechas lejanas

### ⚠️ Cosas a Evitar
1. ❌ No cierres el calendario antes de seleccionar ambas fechas
2. ❌ No uses el botón "Atrás" del navegador mientras el calendario está abierto
3. ❌ No intentes escribir fechas manualmente (usa el calendario)

## 🐛 Solución de Problemas

### Problema: El calendario no se abre
**Solución**: Verifica que el servidor esté corriendo y recarga la página (F5)

### Problema: Las fechas no se filtran
**Solución**: 
1. Asegúrate de haber seleccionado ambas fechas (inicio y fin)
2. Haz clic en "Cerrar" para aplicar el filtro
3. Verifica que el rango aparezca en el campo

### Problema: El formato de fecha es incorrecto
**Solución**: El formato correcto es "15 Ene - 31 Ene 2024" en español. Si ves otro formato, recarga la página.

### Problema: Error "DateRange not found"
**Solución**: Reinicia el servidor de desarrollo siguiendo las instrucciones al inicio de este documento.

## 📞 Soporte

Si encuentras algún problema:
1. Revisa este documento primero
2. Reinicia el servidor de desarrollo
3. Limpia el cache del navegador (Ctrl+Shift+R)
4. Verifica la consola del navegador (F12) para errores

## 🎉 ¡Disfruta del Nuevo DateRangePicker!

El nuevo componente hace que seleccionar rangos de fechas sea:
- ✅ Más rápido
- ✅ Más intuitivo
- ✅ Más visual
- ✅ Más consistente

**¡Feliz filtrado de fechas!** 📅✨
