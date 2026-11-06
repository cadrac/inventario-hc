#!/bin/sh
# Inicia o Firebase Emulator Suite dentro do container.
# Os dados ficam no volume /data (subpasta "export") e sobrevivem a reinícios.
# Obs.: o Firebase apaga e recria a pasta de exportação, por isso não pode ser
# a própria raiz do volume.
set -e
node scripts/gerar-regras.mjs

DIR=/data/export
IMPORT=""
if [ -f "$DIR/firebase-export-metadata.json" ]; then
  IMPORT="--import=$DIR"
  echo "Restaurando dados salvos de $DIR"
fi

exec firebase emulators:start --project demo-inventario $IMPORT --export-on-exit=$DIR
