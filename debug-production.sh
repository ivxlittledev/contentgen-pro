#!/bin/bash

echo "🔍 Diagnostic ContentGen Pro - Production"
echo "========================================"

# Variables
DEPLOY_DIR="/var/www/contentgen-pro"

echo "📍 Serveur: 69.62.126.243"
echo "📂 Répertoire: $DEPLOY_DIR"
echo ""

# 1. Vérification de l'installation
echo "📁 1. Vérification des fichiers:"
if [ -d "$DEPLOY_DIR" ]; then
    echo "✅ Répertoire d'installation trouvé"
    echo "   - Taille: $(du -sh $DEPLOY_DIR | cut -f1)"
    echo "   - Dernière modification: $(stat -c %y $DEPLOY_DIR 2>/dev/null || stat -f %Sm $DEPLOY_DIR 2>/dev/null)"
    
    # Vérifier les fichiers clés
    [ -f "$DEPLOY_DIR/dist/index.html" ] && echo "✅ Frontend build présent" || echo "❌ Frontend build manquant"
    [ -f "$DEPLOY_DIR/server/server.js" ] && echo "✅ Backend présent" || echo "❌ Backend manquant"
    [ -f "$DEPLOY_DIR/.env" ] && echo "✅ Fichier .env trouvé" || echo "❌ Fichier .env manquant"
    
    if [ -f "$DEPLOY_DIR/.env" ]; then
        echo "   Configuration .env:"
        cat "$DEPLOY_DIR/.env" | sed 's/^/     /'
    fi
else
    echo "❌ Répertoire d'installation non trouvé"
fi

echo ""

# 2. Vérification Git
echo "🔄 2. Status Git:"
if [ -d "$DEPLOY_DIR/.git" ]; then
    cd "$DEPLOY_DIR"
    echo "   Branche actuelle: $(git branch --show-current)"
    echo "   Dernier commit: $(git log -1 --oneline)"
    echo "   Status: $(git status --porcelain | wc -l) fichiers modifiés"
else
    echo "❌ Pas de repository Git trouvé"
fi

echo ""

# 3. Vérification des services
echo "🔧 3. Status des services:"

# PM2
if command -v pm2 &> /dev/null; then
    echo "📊 PM2:"
    pm2 status | grep contentgen || echo "   ❌ Aucun processus contentgen trouvé"
else
    echo "❌ PM2 non installé"
fi

# Nginx
if command -v nginx &> /dev/null; then
    echo "🌐 Nginx:"
    if systemctl is-active --quiet nginx; then
        echo "   ✅ Service actif"
    else
        echo "   ❌ Service inactif"
    fi
    
    # Test de configuration
    nginx -t &>/dev/null && echo "   ✅ Configuration valide" || echo "   ❌ Erreur de configuration"
else
    echo "❌ Nginx non installé"
fi

echo ""

# 4. Tests de connectivité
echo "🌐 4. Tests de connectivité:"

# Backend
echo "🔌 Backend (port 3001):"
if curl -f http://localhost:3001/api/health &>/dev/null; then
    echo "   ✅ API accessible"
    # Test login
    LOGIN_TEST=$(curl -s -X POST http://localhost:3001/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"username":"admin","password":"admin123"}' | jq -r '.message' 2>/dev/null)
    if [ "$LOGIN_TEST" = "Connexion réussie" ]; then
        echo "   ✅ Authentification fonctionnelle"
    else
        echo "   ❌ Problème d'authentification"
    fi
else
    echo "   ❌ API non accessible"
fi

# Frontend
echo "🎨 Frontend (port 80):"
if curl -f http://localhost/ &>/dev/null; then
    echo "   ✅ Frontend accessible"
else
    echo "   ❌ Frontend non accessible"
fi

# Externe
echo "🌍 Accès externe:"
EXTERNAL_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://69.62.126.243/ 2>/dev/null)
if [ "$EXTERNAL_TEST" = "200" ]; then
    echo "   ✅ Accessible depuis l'extérieur (HTTP $EXTERNAL_TEST)"
else
    echo "   ❌ Non accessible depuis l'extérieur (HTTP $EXTERNAL_TEST)"
fi

echo ""

# 5. Vérification des logs
echo "📋 5. Logs récents:"

if [ -f "/var/log/contentgen/error.log" ]; then
    echo "❗ Erreurs backend (5 dernières):"
    tail -5 /var/log/contentgen/error.log | sed 's/^/   /'
fi

if [ -f "/var/log/nginx/error.log" ]; then
    echo "❗ Erreurs Nginx (5 dernières):"
    tail -5 /var/log/nginx/error.log | sed 's/^/   /'
fi

echo ""

# 6. Vérification des ports
echo "🔌 6. Ports en écoute:"
netstat -tulpn 2>/dev/null | grep -E ':(80|3001|443)\s' | sed 's/^/   /' || ss -tulpn | grep -E ':(80|3001|443)\s' | sed 's/^/   /'

echo ""

# 7. Ressources système
echo "💻 7. Ressources système:"
echo "   CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)% utilisé"
echo "   RAM: $(free -h | awk 'NR==2{printf "%.1f%%", $3*100/$2}' 2>/dev/null || echo "N/A")"
echo "   Disque: $(df -h / | awk 'NR==2{print $5}' | cut -d'%' -f1)% utilisé"

echo ""
echo "🔧 Résumé des problèmes potentiels:"

# Diagnostic automatique
ISSUES=0

[ ! -d "$DEPLOY_DIR/dist" ] && echo "   ❌ Build frontend manquant" && ISSUES=$((ISSUES+1))
[ ! -f "$DEPLOY_DIR/.env" ] && echo "   ❌ Configuration .env manquante" && ISSUES=$((ISSUES+1))

if ! curl -f http://localhost:3001/api/health &>/dev/null; then
    echo "   ❌ Backend non accessible - vérifier PM2"
    ISSUES=$((ISSUES+1))
fi

if ! curl -f http://localhost/ &>/dev/null; then
    echo "   ❌ Frontend non accessible - vérifier Nginx"
    ISSUES=$((ISSUES+1))
fi

if [ $ISSUES -eq 0 ]; then
    echo "   ✅ Aucun problème détecté"
else
    echo ""
    echo "💡 Solutions recommandées:"
    echo "   1. Exécuter: ./deploy-production.sh"
    echo "   2. Vérifier les logs: pm2 logs contentgen-backend"
    echo "   3. Redémarrer les services: systemctl restart nginx && pm2 restart contentgen-backend"
fi

echo ""
echo "📞 Support:"
echo "   - Logs PM2: pm2 logs contentgen-backend"
echo "   - Logs Nginx: tail -f /var/log/nginx/error.log"
echo "   - Status services: systemctl status nginx && pm2 status"