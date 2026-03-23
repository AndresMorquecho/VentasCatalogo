# ✅ Checklist de Pruebas - DateRangePicker

## 🚀 Paso 1: Reiniciar el Servidor

### Windows CMD
```bash
cd VentasCatalogo
restart-dev-server.bat
```

### Windows PowerShell
```bash
cd VentasCatalogo
.\restart-dev-server.ps1
```

### Manual
```bash
cd VentasCatalogo
# Detener servidor (Ctrl+C)
rm -rf node_modules/.vite
npm run dev
```

**Estado**: [ ] Completado

---

## 🧪 Paso 2: Pruebas por Página

### 1. Recepción de Pedidos
**Ruta**: `/orders/reception`

- [ ] Abrir la página
- [ ] Hacer clic en el campo "Rango de Entrega"
- [ ] Verificar que se abre el calendario
- [ ] Seleccionar fecha inicio (ej: 1 de enero)
- [ ] Seleccionar fecha fin (ej: 31 de enero)
- [ ] Verificar que el rango aparece: "01 Ene - 31 Ene 2024"
- [ ] Hacer clic en "Cerrar"
- [ ] Verificar que la tabla se filtra correctamente
- [ ] Hacer clic en la ✕ para limpiar
- [ ] Verificar que el filtro se limpia

**Resultado**: [ ] ✅ Funciona | [ ] ❌ Error

---

### 2. Historial de Recepciones
**Ruta**: `/orders/reception/history`

- [ ] Abrir la página
- [ ] Hacer clic en el campo "Rango de Recepción"
- [ ] Verificar que se abre el calendario
- [ ] Seleccionar un rango de fechas
- [ ] Verificar que el rango aparece correctamente
- [ ] Hacer clic en "Cerrar"
- [ ] Verificar que la tabla se filtra correctamente
- [ ] Probar el botón "Limpiar" del filtro
- [ ] Verificar que todos los filtros se limpian

**Resultado**: [ ] ✅ Funciona | [ ] ❌ Error

---

### 3. Entrega de Pedidos
**Ruta**: `/orders/delivery`

- [ ] Abrir la página
- [ ] Hacer clic en el campo "Rango de Recepción"
- [ ] Verificar que se abre el calendario
- [ ] Seleccionar un rango de fechas
- [ ] Verificar que el rango aparece correctamente
- [ ] Hacer clic en "Cerrar"
- [ ] Verificar que la tabla se filtra correctamente
- [ ] Probar combinación con otros filtros (Empresaria, Marca)
- [ ] Verificar que todos los filtros funcionan juntos

**Resultado**: [ ] ✅ Funciona | [ ] ❌ Error

---

### 4. Historial de Entregas
**Ruta**: `/orders/delivery/history`

- [ ] Abrir la página
- [ ] Hacer clic en el campo "Rango de Entrega"
- [ ] Verificar que se abre el calendario
- [ ] Seleccionar un rango de fechas
- [ ] Verificar que el rango aparece correctamente
- [ ] Hacer clic en "Cerrar"
- [ ] Verificar que la tabla se filtra correctamente
- [ ] Probar el botón de imprimir en un registro
- [ ] Verificar que el PDF se genera correctamente

**Resultado**: [ ] ✅ Funciona | [ ] ❌ Error

---

### 5. Inventario de Pedidos
**Ruta**: `/inventory`

- [ ] Abrir la página
- [ ] Hacer clic en el campo "Rango de Fechas"
- [ ] Verificar que se abre el calendario
- [ ] Seleccionar un rango de fechas
- [ ] Verificar que el rango aparece correctamente
- [ ] Hacer clic en "Cerrar"
- [ ] Verificar que la tabla se filtra correctamente
- [ ] Probar combinación con filtros de Estado y Catálogo
- [ ] Verificar que las estadísticas se actualizan

**Resultado**: [ ] ✅ Funciona | [ ] ❌ Error

---

### 6. Transacciones Financieras
**Ruta**: `/transactions`

- [ ] Abrir la página
- [ ] Hacer clic en el campo "Rango de Fechas"
- [ ] Verificar que se abre el calendario
- [ ] Seleccionar un rango de fechas
- [ ] Verificar que el rango aparece correctamente
- [ ] Hacer clic en "Cerrar"
- [ ] Verificar que la tabla se filtra correctamente
- [ ] Probar combinación con búsqueda por referencia
- [ ] Verificar la paginación

**Resultado**: [ ] ✅ Funciona | [ ] ❌ Error

---

### 7. Detalle de Cliente
**Ruta**: Cualquier cliente → Ver detalles → Tab "Reporte de Pedidos"

- [ ] Abrir un cliente
- [ ] Ir al tab "Reporte de Pedidos"
- [ ] Hacer clic en el campo "Rango de Fechas"
- [ ] Verificar que se abre el calendario
- [ ] Seleccionar un rango de fechas
- [ ] Verificar que el rango aparece correctamente
- [ ] Hacer clic en "Cerrar"
- [ ] Verificar que los pedidos se filtran correctamente
- [ ] Probar el botón de reset de filtros

**Resultado**: [ ] ✅ Funciona | [ ] ❌ Error

---

## 🎨 Paso 3: Pruebas de UI/UX

### Interacción del Calendario
- [ ] El calendario se abre al hacer clic
- [ ] Las instrucciones son claras
- [ ] Se puede navegar entre meses con las flechas
- [ ] El día actual está marcado
- [ ] El rango seleccionado se visualiza correctamente
- [ ] Los días del rango tienen color de fondo
- [ ] El hover en los días funciona
- [ ] El botón "Limpiar" funciona
- [ ] El botón "Cerrar" funciona
- [ ] Se puede cerrar haciendo clic fuera

**Resultado**: [ ] ✅ Todo correcto | [ ] ❌ Hay problemas

---

### Formato de Fechas
- [ ] El formato es "DD MMM - DD MMM YYYY" (ej: "15 Ene - 31 Ene 2024")
- [ ] Los meses están en español
- [ ] El formato es consistente en todas las páginas
- [ ] Las fechas se muestran correctamente en el input

**Resultado**: [ ] ✅ Todo correcto | [ ] ❌ Hay problemas

---

### Responsive Design
- [ ] Probar en pantalla grande (>1024px)
- [ ] Probar en tablet (768px - 1024px)
- [ ] Probar en móvil (<768px)
- [ ] El calendario se adapta al tamaño de pantalla
- [ ] Los botones son fáciles de tocar en móvil
- [ ] No hay scroll horizontal no deseado

**Resultado**: [ ] ✅ Todo correcto | [ ] ❌ Hay problemas

---

## 🐛 Paso 4: Pruebas de Edge Cases

### Casos Especiales
- [ ] Seleccionar solo fecha inicio (sin fecha fin)
- [ ] Seleccionar el mismo día como inicio y fin
- [ ] Seleccionar un rango muy largo (>90 días)
- [ ] Cambiar de mes mientras se selecciona
- [ ] Abrir y cerrar sin seleccionar nada
- [ ] Limpiar y volver a seleccionar
- [ ] Seleccionar, limpiar, y aplicar otros filtros

**Resultado**: [ ] ✅ Todo correcto | [ ] ❌ Hay problemas

---

### Integración con Otros Filtros
- [ ] DateRangePicker + Búsqueda de texto
- [ ] DateRangePicker + Filtro de estado
- [ ] DateRangePicker + Filtro de marca
- [ ] DateRangePicker + Filtro de cliente
- [ ] Limpiar todos los filtros a la vez
- [ ] Aplicar filtros en diferente orden

**Resultado**: [ ] ✅ Todo correcto | [ ] ❌ Hay problemas

---

## 📊 Paso 5: Verificación de Datos

### Precisión de Filtrado
- [ ] Los datos filtrados corresponden al rango seleccionado
- [ ] No hay registros fuera del rango
- [ ] No faltan registros dentro del rango
- [ ] La paginación funciona correctamente
- [ ] Los contadores/estadísticas se actualizan
- [ ] Los totales son correctos

**Resultado**: [ ] ✅ Todo correcto | [ ] ❌ Hay problemas

---

## 🚀 Paso 6: Pruebas de Performance

### Velocidad y Rendimiento
- [ ] El calendario se abre rápidamente (<500ms)
- [ ] La selección de fechas es fluida
- [ ] El filtrado es rápido (<1s)
- [ ] No hay lag al navegar entre meses
- [ ] No hay problemas de memoria
- [ ] La aplicación sigue siendo responsive

**Resultado**: [ ] ✅ Todo correcto | [ ] ❌ Hay problemas

---

## 📱 Paso 7: Pruebas en Diferentes Navegadores

### Compatibilidad
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (si disponible)
- [ ] Navegador móvil (Android/iOS)

**Resultado**: [ ] ✅ Todo correcto | [ ] ❌ Hay problemas

---

## 🎉 Resumen Final

### Páginas Probadas: __ / 7
### Funcionalidades OK: __ / __
### Problemas Encontrados: __

### Estado General:
- [ ] ✅ TODO FUNCIONA PERFECTAMENTE
- [ ] ⚠️ FUNCIONA CON PROBLEMAS MENORES
- [ ] ❌ HAY PROBLEMAS CRÍTICOS

---

## 📝 Notas y Observaciones

```
Escribe aquí cualquier observación, problema o sugerencia:

1. 

2. 

3. 

```

---

## 🆘 Si Encuentras Problemas

### Problema: El calendario no se abre
**Solución**: 
1. Verifica que el servidor esté corriendo
2. Recarga la página (F5)
3. Limpia el cache del navegador (Ctrl+Shift+R)

### Problema: Error "DateRange not found"
**Solución**: 
1. Reinicia el servidor de desarrollo
2. Limpia el cache de Vite: `rm -rf node_modules/.vite`
3. Reinicia: `npm run dev`

### Problema: Las fechas no se filtran
**Solución**: 
1. Verifica que hayas seleccionado ambas fechas
2. Haz clic en "Cerrar" para aplicar
3. Verifica la consola del navegador (F12) para errores

### Problema: El formato de fecha es incorrecto
**Solución**: 
1. Verifica que la localización esté en español
2. Recarga la página
3. Verifica que `date-fns/locale/es` esté importado

---

**¡Buena suerte con las pruebas!** 🚀

Una vez completado este checklist, tendrás la certeza de que el DateRangePicker funciona perfectamente en toda la aplicación.
