#!/bin/bash

echo "🚀 Iniciando setup del backend..."

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Verificar archivo .env
if [ ! -f .env ]; then
    echo "⚠️  Archivo .env no encontrado. Copiando desde .env.example..."
    cp .env.example .env
    echo "📝 Por favor, edita el archivo .env con tus credenciales."
    exit 1
fi

# Inicializar base de datos
echo "🗄️  Inicializando base de datos..."
npm run init-db

echo "✅ Setup completado exitosamente!"
echo "🚀 Ejecuta 'npm run dev' para iniciar el servidor"