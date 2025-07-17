# Utiliser une image R officielle
FROM r-base:4.4.0

# Installer les dépendances système nécessaires pour RPostgreSQL, Plumber et leurs dépendances
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libcurl4-openssl-dev \
    libssl-dev \
    libxml2-dev \
    libsodium-dev \
    libudunits2-dev \
    libproj-dev \
    libgeos-dev \
    libharfbuzz-dev \
    libfribidi-dev \
    libcairo2-dev \
    && rm -rf /var/lib/apt/lists/*

# Installer les packages R avec validation stricte
RUN R -e "install.packages(c('plumber', 'RPostgreSQL', 'jsonlite'), repos='https://cloud.r-project.org/', dependencies=TRUE)" && \
    R -e "if (!all(c('plumber', 'RPostgreSQL', 'jsonlite') %in% installed.packages()[,1])) { stop('Un ou plusieurs packages R manquants') }; print('Packages installés avec succès')" || { echo "Échec de l'installation des packages"; exit 1; }

# Créer et définir le répertoire de travail
WORKDIR /app

# Copier le fichier R dans le conteneur
COPY r-api.R /app/r-api.R

# Exposer le port sur lequel l'API écoute
EXPOSE 8086

# Lancer le script R contenant l'API Plumber
CMD ["R", "-e", "pr <- plumber::plumb('/app/r-api.R'); pr$run(host='0.0.0.0', port=8086)"]