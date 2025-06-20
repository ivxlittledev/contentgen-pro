# 🚀 ContentGen Pro - Déploiement VPS

## 📋 Prérequis VPS
- Ubuntu 22.04 LTS
- 2GB RAM minimum
- Node.js 18+
- Nginx
- PM2

## 🔧 Installation sur VPS

### 1. Connexion au VPS
```bash
ssh root@69.62.126.243
# Password: #rsmHY8Xd@M4
```

### 2. Installation des dépendances
```bash
# Mise à jour système
apt update && apt upgrade -y

# Installation Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Installation outils
apt install -y nginx certbot python3-certbot-nginx git
npm install -g pm2

# Vérification versions
node --version  # doit afficher v18.x.x
npm --version
```

### 3. Clonage du projet
```bash
# Création du dossier
mkdir -p /var/www/contentgen-pro
cd /var/www/contentgen-pro

# Clone du repo GitHub
git clone https://github.com/[REPO-URL]/contentgen-pro.git .

# Installation dépendances backend
cd server
npm install --production
```

### 4. Configuration du frontend
```bash
# Build du frontend (si pas déjà fait)
cd /var/www/contentgen-pro
npm install
npm run build

# Copie dans le bon dossier
mkdir -p /var/www/contentgen-pro/frontend
cp -r dist/* /var/www/contentgen-pro/frontend/
```

### 5. Configuration Nginx
```bash
# Copie de la config Nginx
cp nginx.conf /etc/nginx/sites-available/contentgen
ln -sf /etc/nginx/sites-available/contentgen /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test et reload
nginx -t
systemctl reload nginx
systemctl enable nginx
```

### 6. Configuration PM2
```bash
# Variables d'environnement
cp .env.production server/.env

# Démarrage avec PM2
cp ecosystem.config.js /var/www/contentgen-pro/
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Exécuter la commande affichée par pm2 startup
```

### 7. Permissions finales
```bash
chown -R www-data:www-data /var/www/contentgen-pro
chmod -R 755 /var/www/contentgen-pro
```

## 🌐 Accès à l'application
- **URL**: http://69.62.126.243
- **Backend API**: http://69.62.126.243/api/
- **Webhooks**: http://69.62.126.243/api/webhooks/

## 📊 Monitoring
```bash
# Statut des services
pm2 status
systemctl status nginx

# Logs en temps réel
pm2 logs contentgen-backend
tail -f /var/log/nginx/contentgen-*.log

# Monitoring interactif
pm2 monit
```

## 🔧 Commandes utiles
```bash
# Redémarrer le backend
pm2 restart contentgen-backend

# Recharger Nginx
systemctl reload nginx

# Voir les processus
pm2 list

# Logs erreurs
pm2 logs contentgen-backend --err

# Mettre à jour le code
cd /var/www/contentgen-pro
git pull origin main
npm run build
cp -r dist/* frontend/
pm2 restart contentgen-backend
```

## 🔐 SSL (Optionnel)
Si vous avez un domaine :
```bash
certbot --nginx -d votre-domaine.com
```

## 📝 Variables d'environnement (.env.production)
```
NODE_ENV=production
PORT=3001
VITE_API_URL=http://69.62.126.243
```