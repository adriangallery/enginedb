#!/bin/bash
#
# Script de inicialización del bot
# Configura el repositorio git para permitir commits y push a GitHub
#

set -e

echo "🚀 Inicializando EngineDB Bot..."
echo ""

# Verificar si estamos en un repositorio git
if [ ! -d ".git" ]; then
  echo "📦 Inicializando repositorio git..."

  git init
  git config user.email "bot@enginedb.app"
  git config user.name "EngineDB Bot"

  # Agregar remote
  if [ -n "$GITHUB_TOKEN" ]; then
    REPO="${GITHUB_REPO:-adriangallery/enginedb}"
    REMOTE_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/${REPO}.git"
    git remote add origin "$REMOTE_URL"
    echo "✅ Remote configurado: $REPO"
  fi

  # Fetch para obtener el historial
  if [ -n "$GITHUB_TOKEN" ]; then
    echo "📥 Fetching desde GitHub..."
    git fetch origin main --depth=1 || true
    git branch -M main
    git reset --soft origin/main || true
    echo "✅ Sincronizado con GitHub"
  fi
else
  echo "✅ Repositorio git ya existe"

  # Verificar/actualizar remote
  if [ -n "$GITHUB_TOKEN" ]; then
    REPO="${GITHUB_REPO:-adriangallery/enginedb}"
    REMOTE_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/${REPO}.git"

    # Eliminar remote existente si existe
    git remote remove origin 2>/dev/null || true

    # Agregar remote con token
    git remote add origin "$REMOTE_URL"
    echo "✅ Remote actualizado: $REPO"
  fi
fi

echo ""
echo "✅ Git configurado correctamente"
echo ""

# Crear directorio para la base de datos si no existe
mkdir -p /app/api/data

echo "🎯 Iniciando continuous listener..."
echo ""

# Iniciar el bot
exec node dist/src/continuous-listener.js
