# 🚀 Guide de Déploiement Production - ContentGen Pro

## 🎯 Problème Identifié
Le serveur de production (69.62.126.243) ne répond pas ou n'a pas été mis à jour avec les dernières modifications.

## 🔧 Solutions Rapides

### 1. **Diagnostic Complet**
```bash
# Sur votre serveur de production, exécutez :
./debug-production.sh
```
Ce script va identifier tous les problèmes et vous donner un diagnostic complet.

### 2. **Déploiement Forcé**
```bash
# Si le diagnostic révèle des problèmes, exécutez :
./deploy-production.sh
```
Ce script va :
- ✅ Télécharger la dernière version depuis GitHub
- ✅ Configurer l'environnement pour la production
- ✅ Builder le projet avec les bonnes variables
- ✅ Configurer Nginx et PM2 correctement
- ✅ Redémarrer tous les services

### 3. **Vérification Manuelle**
```bash
# Vérifier que les services tournent
pm2 status
systemctl status nginx

# Tester l'API
curl http://localhost:3001/api/health

# Tester le frontend
curl http://localhost/
```

## 📋 Commandes de Dépannage Rapide

### Redémarrer les Services
```bash
# Redémarrer PM2 (backend)
pm2 restart contentgen-backend

# Redémarrer Nginx (frontend)
systemctl restart nginx
```

### Forcer la Mise à Jour Git
```bash
cd /var/www/contentgen-pro
git fetch origin
git reset --hard origin/main
git clean -fd
```

### Reconstruire le Frontend
```bash
cd /var/www/contentgen-pro
echo "VITE_API_URL=http://69.62.126.243" > .env
npm run build
```

## 🔍 Vérification des Logs

### Logs Backend (PM2)
```bash
pm2 logs contentgen-backend
```

### Logs Nginx
```bash
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### Logs Système
```bash
journalctl -f -u nginx
```

## 🚨 Solutions aux Problèmes Courants

### 1. **Backend Non Accessible (Port 3001)**
```bash
cd /var/www/contentgen-pro
pm2 start ecosystem.config.js
pm2 save
```

### 2. **Frontend Non Accessible (Port 80)**
```bash
nginx -t  # Tester la config
systemctl restart nginx
```

### 3. **Problème de Déconnexion**
➡️ **Cause**: Ancien build en cache ou mauvaise configuration API
```bash
# Solution complète
./deploy-production.sh
```

### 4. **Serveur Complètement Arrêté**
```bash
# Redémarrer tout
pm2 restart all
systemctl restart nginx
```

## 📱 Vérification Finale

Une fois le déploiement terminé, testez :

1. **Accès externe** : http://69.62.126.243
2. **Connexion** : admin / admin123
3. **Déconnexion** : Bouton "Se déconnecter" 
4. **Permissions rédacteur** : redacteur / redacteur123
5. **Scénarios** : Accès en lecture seule pour rédacteurs

## 🆘 Si Rien Ne Fonctionne

1. **Contactez-moi** avec les logs de :
   ```bash
   ./debug-production.sh > diagnostic.txt
   pm2 logs contentgen-backend --lines 50 >> diagnostic.txt
   tail -50 /var/log/nginx/error.log >> diagnostic.txt
   ```

2. **Sauvegarde de sécurité** disponible dans `/var/backups/`

3. **Rollback possible** vers la version précédente

## 📞 Support Technique

- **Scripts fournis** : `debug-production.sh` et `deploy-production.sh`
- **Configuration** : Tous les fichiers de config sont dans le repository
- **Documentation** : Ce guide + PROCESSUS-DEV.md

---

**Dernière mise à jour** : 20 juin 2025, 18:00  
**Version** : Production avec permissions scénarios rédacteurs