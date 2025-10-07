#!/bin/bash

echo "🚀 Configurando proyecto para desarrollo local..."

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) encontrado${NC}"

# Verificar MySQL
if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}⚠️  MySQL no encontrado. Asegúrate de tenerlo instalado y corriendo.${NC}"
fi

# Setup BACKEND
echo -e "\n${YELLOW}📦 Configurando BACKEND...${NC}"
cd backend

if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creando archivo .env desde .env.example...${NC}"
    cp .env.example .env
    echo -e "${RED}⚠️  IMPORTANTE: Edita backend/.env con tus credenciales de MySQL y Gmail${NC}"
fi

echo "📦 Instalando dependencias del backend..."
npm install

echo "🗄️  Inicializando base de datos..."
npm run init-db

cd ..

# Setup FRONTEND
echo -e "\n${YELLOW}📦 Configurando FRONTEND...${NC}"
cd frontend

if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creando archivo .env desde .env.example...${NC}"
    cp .env.example .env
fi

echo "📦 Instalando dependencias del frontend..."
npm install

cd ..

echo -e "\n${GREEN}✅ Setup completado!${NC}"
echo -e "\n${YELLOW}📋 Próximos pasos:${NC}"
echo "1. Edita backend/.env con tus credenciales"
echo "2. Terminal 1: cd backend && npm run dev"
echo "3. Terminal 2: cd frontend && npm run dev"
echo "4. Abre http://localhost:3000 en tu navegador"