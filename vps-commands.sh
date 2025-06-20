#!/bin/bash

echo "🚀 Installation ContentGen Pro sur VPS"
echo "======================================"

# Mise à jour du système
echo "📦 Mise à jour du système..."
apt update && apt upgrade -y

# Installation Node.js 18
echo "📥 Installation Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Installation des outils
echo "📥 Installation des outils nécessaires..."
apt install -y nginx certbot python3-certbot-nginx git
npm install -g pm2

# Vérification des versions
echo "✅ Versions installées :"
node --version
npm --version

# Clone du projet depuis GitHub
echo "📥 Clonage du projet depuis GitHub..."
cd /var/www
rm -rf contentgen-pro 2>/dev/null
git clone https://github.com/ivxlittledev/contentgen-pro.git

# Création des dossiers nécessaires
echo "📁 Création de la structure..."
mkdir -p /var/www/contentgen-pro/frontend
mkdir -p /var/log/pm2

# Installation des dépendances et build du frontend
echo "📦 Installation des dépendances frontend..."
cd /var/www/contentgen-pro
npm install

echo "🔨 Build du frontend..."
npm run build

# Copie du frontend build
echo "📂 Copie du frontend..."
cp -r dist/* frontend/

# Installation des dépendances backend
echo "📦 Installation des dépendances backend..."
cd /var/www/contentgen-pro/server
npm install --production

# Configuration des variables d'environnement
echo "🔧 Configuration des variables d'environnement..."
cd /var/www/contentgen-pro
cp .env.production server/.env

# Configuration Nginx
echo "🔧 Configuration Nginx..."
cp nginx.conf /etc/nginx/sites-available/contentgen
ln -sf /etc/nginx/sites-available/contentgen /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test de la configuration Nginx
if nginx -t; then
    echo "✅ Configuration Nginx valide"
    systemctl reload nginx
    systemctl enable nginx
    systemctl start nginx
else
    echo "❌ Erreur dans la configuration Nginx"
    exit 1
fi

# Configuration PM2
echo "🔧 Démarrage avec PM2..."
cd /var/www/contentgen-pro
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Configuration des permissions
echo "🔐 Configuration des permissions..."
chown -R www-data:www-data /var/www/contentgen-pro
chmod -R 755 /var/www/contentgen-pro

# Affichage du statut final
echo ""
echo "🎉 Installation terminée !"
echo "========================="
echo "🌐 URL: http://69.62.126.243"
echo "📊 Backend API: http://69.62.126.243/api/"
echo "🔗 Webhooks: http://69.62.126.243/api/webhooks/"
echo ""
echo "📊 Statut des services :"
echo "------------------------"
systemctl status nginx --no-pager -l | head -10
echo ""
pm2 status
echo ""
echo "🔧 Commandes utiles :"
echo "pm2 logs contentgen-backend  # Voir les logs"
echo "pm2 restart contentgen-backend  # Redémarrer"
echo "pm2 monit  # Monitoring interactif"
echo "systemctl status nginx  # Statut Nginx"
echo ""
echo "🎯 Testez maintenant : http://69.62.126.243"