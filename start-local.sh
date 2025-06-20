#!/bin/bash

echo "🚀 Démarrage ContentGen Pro - Environnement LOCAL"
echo "================================================="

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Exécuter depuis le répertoire racine du projet"
    exit 1
fi

# Configurer l'environnement local
echo "📝 Configuration environnement local..."
echo "VITE_API_URL=http://localhost:3001" > .env
echo "✅ Variables d'environnement configurées pour LOCAL"

# Arrêter les processus existants
echo "🛑 Arrêt des processus existants..."
pkill -f "node server/server.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
lsof -ti :3001 | xargs kill -9 2>/dev/null || true
lsof -ti :8080 | xargs kill -9 2>/dev/null || true

echo "⏱️  Attente libération des ports..."
sleep 3

# Démarrer le backend
echo "🖥️  Démarrage backend (port 3001)..."
node server/server.js &
BACKEND_PID=$!

echo "⏱️  Attente démarrage backend..."
sleep 5

# Vérifier que le backend est démarré
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend opérationnel"
else
    echo "❌ Erreur: Backend non accessible"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Démarrer le frontend en mode développement
echo "🌐 Démarrage frontend dev (port 8080)..."
echo "   - Hot reload activé"
echo "   - Code source direct (pas de build)"
npx vite --host 0.0.0.0 --port 8080 &
FRONTEND_PID=$!

echo "⏱️  Attente démarrage frontend..."
sleep 5

echo ""
echo "🎉 ContentGen Pro démarré avec succès !"
echo "======================================="
echo ""
echo "📱 URLs d'accès :"
echo "   🌐 Frontend: http://localhost:8080"
echo "   🔌 Backend:  http://localhost:3001"
echo "   🏥 Health:   http://localhost:3001/api/health"
echo ""
echo "🔑 Identifiants de test :"
echo "   👑 Admin:     admin / admin123"
echo "   👤 Manager:   manager / manager123"
echo "   ✏️  Rédacteur: redacteur / redacteur123"
echo ""
echo "🔧 PIDs des processus :"
echo "   Backend:  $BACKEND_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo "🛑 Pour arrêter :"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "   ou Ctrl+C dans ce terminal"
echo ""
echo "🎯 Mode: DÉVELOPPEMENT LOCAL"
echo "   - Hot reload activé"
echo "   - Variables env: LOCAL"
echo "   - Cache désactivé"
echo ""
echo "📋 Prochaines étapes :"
echo "   1. Aller sur http://localhost:8080"
echo "   2. Tester la connexion avec admin/admin123"
echo "   3. Valider les fonctionnalités"
echo ""

# Garder le script actif et afficher les logs
echo "📊 Logs en temps réel (Ctrl+C pour arrêter) :"
echo "=============================================="
wait