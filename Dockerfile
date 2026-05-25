# Base Node.js
FROM node:18-slim

# Installer dépendances système
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Installer yt-dlp proprement
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Dossier app
WORKDIR /app

# Copier package.json d'abord (cache npm optimisé)
COPY package*.json ./

# Installer dépendances Node
RUN npm install --production

# Copier le reste du projet
COPY . .

# Port Render
ENV PORT=10000
EXPOSE 10000

# Lancer serveur
CMD ["node", "server.js"]