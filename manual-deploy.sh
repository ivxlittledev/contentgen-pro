#!/bin/bash

echo "🚀 Déploiement Manuel ContentGen Pro"
echo "=================================="

echo "Étape 1: Connectez-vous au VPS avec:"
echo "ssh root@69.62.126.243"
echo "Password: #rsmHY8Xd@M4"
echo ""

echo "Étape 2: Exécutez ces commandes sur le VPS:"
echo ""
cat << 'EOF'
# Mise à jour du système
apt update && apt upgrade -y

# Installation Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Installation des outils nécessaires
apt install -y nginx certbot python3-certbot-nginx git
npm install -g pm2

# Création des dossiers
mkdir -p /var/www/contentgen-pro/{frontend,backend}
mkdir -p /var/log/pm2

# Clone du projet (alternative)
# git clone https://github.com/votre-repo/contentgen-pro.git /tmp/contentgen-pro

echo "✅ VPS configuré!"
EOF

echo ""
echo "Étape 3: Je vais maintenant uploader les fichiers..."
read -p "Appuyez sur Entrée pour continuer..."

# Upload des fichiers
echo "📂 Upload du frontend..."
scp -r dist/* root@69.62.126.243:/var/www/contentgen-pro/frontend/ 2>/dev/null || echo "❌ Erreur upload frontend"

echo "📂 Upload du backend..."
scp -r server/* root@69.62.126.243:/var/www/contentgen-pro/backend/ 2>/dev/null || echo "❌ Erreur upload backend"
scp package.json root@69.62.126.243:/var/www/contentgen-pro/backend/ 2>/dev/null || echo "❌ Erreur upload package.json"

echo "📂 Upload des configurations..."
scp ecosystem.config.js root@69.62.126.243:/var/www/contentgen-pro/ 2>/dev/null || echo "❌ Erreur upload ecosystem"
scp nginx.conf root@69.62.126.243:/etc/nginx/sites-available/contentgen 2>/dev/null || echo "❌ Erreur upload nginx"
scp .env.production root@69.62.126.243:/var/www/contentgen-pro/backend/.env 2>/dev/null || echo "❌ Erreur upload .env"

echo ""
echo "Étape 4: Configuration finale sur le VPS:"
echo "Reconnectez-vous au VPS et exécutez:"
echo ""
cat << 'EOF'
# Installation des dépendances
cd /var/www/contentgen-pro/backend
npm install --production

# Configuration Nginx
ln -sf /etc/nginx/sites-available/contentgen /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Démarrage de l'application
cd /var/www/contentgen-pro
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Permissions
chown -R www-data:www-data /var/www/contentgen-pro

# Démarrage des services
systemctl enable nginx
systemctl start nginx

echo "🎉 Déploiement terminé!"
echo "🌐 Application disponible sur: http://69.62.126.243"
EOF

echo ""
echo "🌐 Une fois terminé, votre application sera accessible sur:"
echo "http://69.62.126.243"