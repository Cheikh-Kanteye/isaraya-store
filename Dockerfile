# Étape 1 : Build de l'app React
FROM node:18 AS build

WORKDIR /app

# Copier package.json et pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Installer pnpm
RUN npm install -g pnpm

# Installer les dépendances
RUN pnpm install --frozen-lockfile

# Copier le reste du code
COPY . .

# Build
RUN pnpm run build

# Étape 2 : Serveur final
FROM node:18

WORKDIR /app

# Installer serve et json-server
RUN npm install -g serve json-server

# Copier le build React depuis dist
COPY --from=build /app/dist ./dist

EXPOSE 8080
EXPOSE 3001 
