#!/bin/bash

echo "🚀 Déploiement ContentGen Pro sur VPS..."

# Variables
VPS_IP="69.62.126.243"
VPS_USER="root"
VPS_PASSWORD="#rsmHY8Xd@M4"
APP_DIR="/var/www/contentgen-pro"

echo "📦 Construction du frontend..."
npm run build

echo "📡 Connexion au VPS et configuration..."

# Script à exécuter sur le VPS
cat << 'EOF' > /tmp/setup_vps.sh
#!/bin/bash

echo "🔧 Mise à jour du système..."
apt update && apt upgrade -y

echo "📥 Installation de Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

echo "📥 Installation des outils..."
apt install -y nginx certbot python3-certbot-nginx
npm install -g pm2

echo "📁 Création des dossiers..."
mkdir -p /var/www/contentgen-pro/{frontend,backend}
mkdir -p /var/log/pm2

echo "🔐 Configuration des permissions..."
chown -R www-data:www-data /var/www/contentgen-pro
chmod -R 755 /var/www/contentgen-pro

echo "✅ VPS configuré avec succès!"
EOF

# Copier et exécuter le script de setup
scp /tmp/setup_vps.sh root@$VPS_IP:/tmp/
ssh root@$VPS_IP 'bash /tmp/setup_vps.sh'

echo "📂 Upload des fichiers..."

# Upload du frontend (build)
scp -r dist/* root@$VPS_IP:/var/www/contentgen-pro/frontend/

# Upload du backend
scp -r server/* root@$VPS_IP:/var/www/contentgen-pro/backend/
scp package.json root@$VPS_IP:/var/www/contentgen-pro/backend/

# Upload des configurations
scp ecosystem.config.js root@$VPS_IP:/var/www/contentgen-pro/
scp nginx.conf root@$VPS_IP:/etc/nginx/sites-available/contentgen
scp .env.production root@$VPS_IP:/var/www/contentgen-pro/backend/.env

echo "🔧 Configuration finale..."

ssh root@$VPS_IP << 'ENDSSH'
# Installation des dépendances backend
cd /var/www/contentgen-pro/backend
npm install --production

# Configuration Nginx
ln -sf /etc/nginx/sites-available/contentgen /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Démarrage avec PM2
cd /var/www/contentgen-pro
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Permissions finales
chown -R www-data:www-data /var/www/contentgen-pro
systemctl enable nginx
systemctl start nginx

echo "🎉 Déploiement terminé!"
echo "🌐 Votre application est disponible sur: http://69.62.126.243"
ENDSSH

echo "✅ Déploiement réussi!"
echo "🌐 URL: http://69.62.126.243"
echo "📊 Monitoring: pm2 monit"
echo "📜 Logs backend: pm2 logs contentgen-backend"
echo "📜 Logs nginx: tail -f /var/log/nginx/contentgen-*.log"