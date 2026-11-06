# Imagem SÓ para desenvolvimento local (Vite + Firebase Emulator Suite).
# A publicação é feita pela Vercel, com o build normal do Vite.
FROM node:22-trixie-slim

# Java 21 é exigido pelo emulador do Firestore.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openjdk-21-jre-headless ca-certificates \
 && rm -rf /var/lib/apt/lists/*

RUN npm install -g firebase-tools@14 \
 && firebase setup:emulators:firestore \
 && firebase setup:emulators:ui

WORKDIR /app

# Dependências ficam só dentro do container.
COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 5173 4000 8080 9099 4400 4500
CMD ["npm", "run", "dev"]
