# Étape 1 : Construction de l'application Angular
FROM node:18 AS build
WORKDIR /app

# Copier les fichiers sources Angular
COPY . .

# Installer les dépendances et construire le projet
RUN npm install
RUN npm run build

# Étape 2 : Image finale avec NGINX
FROM nginx:alpine
# Copier les fichiers compilés Angular dans le dossier servi par NGINX
COPY --from=build /app/dist /usr/share/nginx/html

# Optionnel : Copier une configuration NGINX personnalisée si tu en as une
# COPY nginx.conf /etc/nginx/nginx.conf

# Exposer le port 80
EXPOSE 80

# Démarrer NGINX
CMD ["nginx", "-g", "daemon off;"]
