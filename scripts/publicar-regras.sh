#!/bin/sh
# Gera firestore.rules com os códigos individuais (CODIGO_*) do .env e publica no projeto real.
#   docker compose run --rm tools sh scripts/publicar-regras.sh
set -e
if [ -z "$VITE_FIREBASE_PROJECT_ID" ]; then
  echo "VITE_FIREBASE_PROJECT_ID não definido no .env"
  exit 1
fi
node scripts/gerar-regras.mjs
firebase deploy --only firestore:rules --project "$VITE_FIREBASE_PROJECT_ID" --non-interactive
