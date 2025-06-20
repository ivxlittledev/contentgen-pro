#!/bin/bash

echo "🚀 Démarrage de ContentGen Pro..."

# Arrêter les processus existants
echo "🛑 Arrêt des processus existants..."
pkill -f "node server/server.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Attendre que les ports se libèrent
sleep 2

# Démarrer le backend
echo "🖥️ Démarrage du backend sur le port 3001..."
cd /Users/matthias/claudefiles/project
node server/server.js &
BACKEND_PID=$!

# Attendre que le backend soit prêt
sleep 3

# Démarrer le frontend
echo "🌐 Démarrage du frontend sur le port 4000..."
npx vite --host 0.0.0.0 --port 4000 &
FRONTEND_PID=$!

echo "✅ Services démarrés :"
echo "   Backend PID: $BACKEND_PID (http://localhost:3001)"
echo "   Frontend PID: $FRONTEND_PID (http://localhost:4000)"
echo ""
echo "🔗 Accédez à l'application : http://localhost:4000"
echo ""
echo "Pour arrêter les services :"
echo "   kill $BACKEND_PID $FRONTEND_PID"

# Garder le script actif
wait