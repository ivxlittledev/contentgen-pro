#!/bin/bash

echo "🚀 Déploiement ContentGen Pro - Production"
echo "=========================================="

# Variables
REPO_URL="https://github.com/ivxlittledev/contentgen-pro.git"
DEPLOY_DIR="/var/www/contentgen-pro"
BACKUP_DIR="/var/backups/contentgen-pro-$(date +%Y%m%d-%H%M%S)"

echo "📋 Déploiement vers: $DEPLOY_DIR"
echo "🔗 Repository: $REPO_URL"
echo ""

# 1. Sauvegarde de l'ancien déploiement
if [ -d "$DEPLOY_DIR" ]; then
    echo "💾 Sauvegarde de l'installation actuelle..."
    mkdir -p /var/backups
    cp -r "$DEPLOY_DIR" "$BACKUP_DIR"
    echo "✅ Sauvegarde créée: $BACKUP_DIR"
fi

# 2. Arrêt des services
echo "🛑 Arrêt des services..."
pm2 stop contentgen-backend 2>/dev/null || echo "Backend PM2 non trouvé"
systemctl stop nginx 2>/dev/null || echo "Nginx non géré par systemctl"

# 3. Téléchargement de la dernière version
echo "📥 Téléchargement depuis GitHub..."
if [ -d "$DEPLOY_DIR" ]; then
    cd "$DEPLOY_DIR"
    git fetch origin
    git reset --hard origin/main
    git clean -fd
else
    git clone "$REPO_URL" "$DEPLOY_DIR"
    cd "$DEPLOY_DIR"
fi

# 4. Configuration de l'environnement de production
echo "⚙️ Configuration environnement production..."
echo "VITE_API_URL=http://69.62.126.243" > .env
echo "NODE_ENV=production" >> .env

# 5. Installation des dépendances et build
echo "📦 Installation des dépendances..."
npm install --production

echo "🔨 Build du projet..."
npm run build

# 6. Préparation du backend
echo "🔧 Configuration backend..."
cd server
npm install --production
cd ..

# 7. Configuration Nginx
echo "🌐 Configuration Nginx..."
cat > /etc/nginx/sites-available/contentgen-pro << 'NGINX_EOF'
server {
    listen 80;
    server_name 69.62.126.243;
    
    root /var/www/contentgen-pro/dist;
    index index.html;
    
    # Frontend - servir les fichiers statiques
    location / {
        try_files $uri $uri/ /index.html;
        
        # Headers pour cache optimisé
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API Backend - proxy vers Node.js
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }
    
    # Gestion des erreurs
    error_page 404 /index.html;
    
    # Sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
NGINX_EOF

# Activer le site
ln -sf /etc/nginx/sites-available/contentgen-pro /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 8. Configuration PM2 pour le backend
echo "📊 Configuration PM2..."
cat > ecosystem.config.js << 'PM2_EOF'
module.exports = {
  apps: [{
    name: 'contentgen-backend',
    script: 'server/server.js',
    cwd: '/var/www/contentgen-pro',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/contentgen/error.log',
    out_file: '/var/log/contentgen/out.log',
    log_file: '/var/log/contentgen/combined.log',
    time: true,
    max_restarts: 10,
    restart_delay: 4000
  }]
};
PM2_EOF

# Créer le dossier de logs
mkdir -p /var/log/contentgen

# 9. Redémarrage des services
echo "🔄 Redémarrage des services..."

# Test de la configuration Nginx
nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Erreur de configuration Nginx"
    exit 1
fi

# Démarrage PM2
pm2 start ecosystem.config.js
pm2 save

# Démarrage Nginx
systemctl start nginx
systemctl enable nginx

# 10. Vérifications finales
echo "🔍 Vérifications finales..."
sleep 5

# Test backend
if curl -f http://localhost:3001/api/health &>/dev/null; then
    echo "✅ Backend opérationnel (port 3001)"
else
    echo "❌ Backend non accessible"
fi

# Test frontend
if curl -f http://localhost/ &>/dev/null; then
    echo "✅ Frontend accessible (port 80)"
else
    echo "❌ Frontend non accessible"
fi

# Status des services
echo ""
echo "📊 Status des services:"
pm2 status
systemctl status nginx --no-pager -l | head -3

echo ""
echo "🎉 Déploiement terminé !"
echo "🌐 Application disponible: http://69.62.126.243"
echo ""
echo "🔑 Comptes de test:"
echo "  - admin / admin123 (Super Admin)"
echo "  - manager / manager123 (Manager)"  
echo "  - redacteur / redacteur123 (Rédacteur)"
echo ""
echo "📝 Logs disponibles:"
echo "  - Backend: /var/log/contentgen/"
echo "  - Nginx: /var/log/nginx/"
echo "  - PM2: pm2 logs contentgen-backend"