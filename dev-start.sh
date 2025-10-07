#!/bin/bash

# Script para iniciar backend y frontend simultáneamente

echo "🚀 Iniciando servidores de desarrollo..."

# Función para manejar Ctrl+C
trap 'echo ""; echo "🛑 Deteniendo servidores..."; kill 0' EXIT

# Iniciar backend
cd backend
npm run dev &
BACKEND_PID=$!

# Esperar un poco
sleep 2

# Iniciar frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Servidores iniciados:"
echo "   Backend:  http://localhost:4000"
echo "   Frontend: http://localhost:3000"
echo ""
echo "Presiona Ctrl+C para detener ambos servidores"

# Esperar a que alguno termine
wait