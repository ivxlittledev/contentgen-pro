# 🔄 Processus de Développement - ContentGen Pro

## 🎯 Architecture de Développement

### 🏠 **Environnement LOCAL** (Développement)
- **Frontend** : http://localhost:8080 (Vite dev server avec hot-reload)
- **Backend** : http://localhost:3001 (Node.js/Express)
- **Configuration** : `.env` avec `VITE_API_URL=http://localhost:3001`

### 🌐 **Environnement PRODUCTION** (Tests équipe)
- **Frontend + Backend** : http://69.62.126.243
- **Configuration** : `.env` avec `VITE_API_URL=http://69.62.126.243`

## 📋 Workflow de Développement

### 1. **Développement Local**
```bash
# Démarrer le backend
node server/server.js &

# Démarrer le frontend (mode dev avec hot-reload)
npx vite --host 0.0.0.0 --port 8080

# Accès local : http://localhost:8080
```

### 2. **Tests et Validation**
- ✅ Tester les fonctionnalités en local
- ✅ Valider l'authentification avec les identifiants demo
- ✅ Vérifier que toutes les APIs fonctionnent

### 3. **Déploiement Production**
```bash
# 1. Changer la configuration pour la production
echo "VITE_API_URL=http://69.62.126.243" > .env

# 2. Build pour la production
npm run build

# 3. Commit et push sur GitHub
git add .
git commit -m "Update: nouvelles fonctionnalités validées en local"
git push origin main

# 4. L'équipe peut tester sur http://69.62.126.243
```

### 4. **Retour au Développement Local**
```bash
# Remettre la config locale
echo "VITE_API_URL=http://localhost:3001" > .env
```

## 🔑 Identifiants de Test (Valables sur les 2 environnements)

| Username | Password | Rôle | Permissions |
|----------|----------|------|-------------|
| `admin` | `admin123` | Super Admin | Accès complet |
| `manager` | `manager123` | Manager | Gestion contenu |
| `redacteur` | `redacteur123` | Rédacteur | Utilisation basique |

## 🛠️ Scripts de Développement

### Démarrage Rapide Local
```bash
# Script tout-en-un (à créer)
./start-local.sh
```

### Vérification de l'État
```bash
# Vérifier les processus
ps aux | grep -E "(node|vite)" | grep -v grep

# Vérifier les ports
lsof -i :3001  # Backend
lsof -i :8080  # Frontend dev
```

### Test des APIs
```bash
# Test login backend
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Test health check
curl http://localhost:3001/api/health
```

## ⚠️ Points Importants

### Configuration .env
- **JAMAIS commiter** le fichier `.env` avec l'IP de production
- **TOUJOURS** revenir à la config locale après un déploiement
- **VÉRIFIER** que `VITE_API_URL` pointe vers le bon environnement

### Cache et Build
- **Mode DEV** : Utilise directement le code source (pas de cache)
- **Mode PROD** : Utilise le build dans `/dist` (peut avoir du cache)
- **En cas de problème** : `rm -rf dist/ node_modules/.vite`

### Git Workflow
```bash
# Branche principale
main → Déploiement automatique sur 69.62.126.243

# Workflow type
git checkout -b feature/nouvelle-fonctionnalite
# ... développement en local ...
git commit -m "Add: nouvelle fonctionnalité"
git checkout main
git merge feature/nouvelle-fonctionnalite
git push origin main  # → Déploie automatiquement
```

## 🔧 Troubleshooting

### Problème : "Identifiants incorrects"
1. Vérifier que le backend est démarré : `curl http://localhost:3001/api/health`
2. Vérifier la config .env : `cat .env`
3. Tester l'API directement avec curl
4. Vider le cache navigateur

### Problème : Frontend inaccessible
1. Vérifier que Vite est démarré : `lsof -i :8080`
2. Redémarrer Vite : `npx vite --host 0.0.0.0 --port 8080`
3. Vérifier les logs Vite pour les erreurs

### Problème : Cache de build
1. Nettoyer complètement : `rm -rf dist/ node_modules/.vite`
2. Redémarrer en mode dev : `npx vite`
3. Éviter le build en développement

## 📊 Statut Actuel

- ✅ Backend opérationnel (localhost:3001)
- ✅ Code source corrigé pour le développement local
- ⚠️ Frontend dev en cours de démarrage (localhost:8080)
- 🎯 Prochaine étape : Valider l'authentification en mode dev

---

**Dernière mise à jour** : 20 juin 2025, 15:30
**Environnement actuel** : Développement local