#!/bin/bash

echo "🚀 Déploiement manuel des corrections logout"

# Build le projet
npm run build

# Créer un tarball avec les modifications critiques
tar -czf logout-fix.tar.gz src/contexts/AuthContext.tsx src/components/Layout.tsx dist/

echo "📦 Archive créée: logout-fix.tar.gz"
echo "💾 Transférez manuellement ce fichier sur le VPS et extrayez-le dans /var/www/contentgen-pro/"
echo ""
echo "Commands sur le VPS:"
echo "1. scp logout-fix.tar.gz root@69.62.126.243:/tmp/"
echo "2. ssh root@69.62.126.243"
echo "3. cd /var/www/contentgen-pro"
echo "4. tar -xzf /tmp/logout-fix.tar.gz"
echo "5. pm2 restart all"