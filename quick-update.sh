#!/bin/bash

# Script ultra-rapide pour les petites modifications
echo "⚡ Mise à jour rapide..."

# Build et push
npm run build > /dev/null 2>&1
git add . > /dev/null 2>&1
git commit -m "⚡ Quick update: $(date '+%H:%M:%S')" > /dev/null 2>&1
git push > /dev/null 2>&1

# Update sur VPS (en arrière-plan)
ssh root@69.62.126.243 'cd /var/www/contentgen-pro && git pull && npm run build && cp -r dist/* frontend/ && pm2 restart contentgen-backend' > /dev/null 2>&1 &

echo "✅ Mise à jour en cours... (sera prête dans ~30 secondes)"
echo "🌐 URL: http://69.62.126.243"