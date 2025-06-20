#!/bin/bash

echo "🚀 Installation ContentGen Pro sur VPS Ubuntu"
echo "============================================="

# Mise à jour du système
echo "📦 Mise à jour du système..."
apt update && apt upgrade -y

# Installation Node.js 18
echo "📥 Installation Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Vérification version Node.js
echo "✅ Node.js version: $(node --version)"
echo "✅ NPM version: $(npm --version)"

# Installation des outils
echo "📥 Installation Nginx, PM2, etc..."
apt install -y nginx certbot python3-certbot-nginx wget curl unzip
npm install -g pm2

# Création de la structure
echo "📁 Création des dossiers..."
mkdir -p /var/www/contentgen-pro/{frontend,backend}
mkdir -p /var/log/pm2

# Téléchargement de l'archive du projet
echo "📥 Téléchargement du projet..."
cd /tmp
wget https://transfer.sh/contentgen-pro-deploy.tar.gz 2>/dev/null || echo "⚠️  Vous devrez uploader l'archive manuellement"

# Si l'archive existe, l'extraire
if [ -f "contentgen-pro-deploy.tar.gz" ]; then
    echo "📦 Extraction de l'archive..."
    tar -xzf contentgen-pro-deploy.tar.gz
    
    # Déplacement des fichiers
    cp -r dist/* /var/www/contentgen-pro/frontend/
    cp -r server/* /var/www/contentgen-pro/backend/
    cp package.json /var/www/contentgen-pro/backend/
    cp ecosystem.config.js /var/www/contentgen-pro/
    cp nginx.conf /etc/nginx/sites-available/contentgen
    cp .env.production /var/www/contentgen-pro/backend/.env
    
    echo "✅ Fichiers copiés"
else
    echo "⚠️  Archive non trouvée. Vous devrez uploader les fichiers manuellement."
fi

# Installation des dépendances backend
echo "📦 Installation des dépendances..."
cd /var/www/contentgen-pro/backend
npm install --production

# Configuration Nginx
echo "🔧 Configuration Nginx..."
ln -sf /etc/nginx/sites-available/contentgen /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test configuration Nginx
if nginx -t; then
    echo "✅ Configuration Nginx valide"
    systemctl reload nginx
else
    echo "❌ Erreur configuration Nginx"
fi

# Configuration PM2
echo "🔧 Configuration PM2..."
cd /var/www/contentgen-pro
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Permissions
echo "🔐 Configuration des permissions..."
chown -R www-data:www-data /var/www/contentgen-pro
chmod -R 755 /var/www/contentgen-pro

# Démarrage des services
echo "🚀 Démarrage des services..."
systemctl enable nginx
systemctl start nginx
systemctl enable pm2-root

# Affichage du statut
echo ""
echo "📊 Statut des services:"
echo "======================="
systemctl status nginx --no-pager -l
echo ""
pm2 status

echo ""
echo "🎉 Installation terminée!"
echo "========================="
echo "🌐 URL: http://$(curl -s ifconfig.me || echo '69.62.126.243')"
echo "📊 Monitoring: pm2 monit"
echo "📜 Logs backend: pm2 logs contentgen-backend"
echo "📜 Logs Nginx: tail -f /var/log/nginx/contentgen-*.log"
echo ""
echo "🔧 Commandes utiles:"
echo "pm2 restart contentgen-backend  # Redémarrer le backend"
echo "pm2 logs contentgen-backend     # Voir les logs"
echo "systemctl reload nginx          # Recharger Nginx"