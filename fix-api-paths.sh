#!/bin/bash

# Script para arreglar las rutas de API duplicadas
# Reemplaza '/api/' con '/' en todos los archivos de API

echo "Arreglando rutas de API..."

# Archivos a modificar
files=(
  "src/shared/api/bankAccountApi.ts"
  "src/shared/api/inventoryApi.ts"
  "src/shared/api/cashClosureApi.ts"
  "src/shared/api/clientCreditApi.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Procesando $file..."
    sed -i "s|'/api/|'/|g" "$file"
    sed -i 's|`/api/|`/|g' "$file"
  fi
done

echo "¡Listo! Rutas de API arregladas."
