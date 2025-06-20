# 📡 Guide des Webhooks et APIs - ContentGen Pro

## 🚀 Configuration de Base

**Serveur:** `http://localhost:3001`
**Format:** JSON
**Méthode:** POST pour webhooks, GET/POST/PUT/DELETE pour APIs

---

## 📰 WEBHOOKS CRYPTO RSS (11 sources)

Connectez vos flux RSS crypto directement :

```
POST http://localhost:3001/api/webhooks/crypto/bitcoin
POST http://localhost:3001/api/webhooks/crypto/newsbit  
POST http://localhost:3001/api/webhooks/crypto/rss-amb-crypto
POST http://localhost:3001/api/webhooks/crypto/beincrypto
POST http://localhost:3001/api/webhooks/crypto/blockworks
POST http://localhost:3001/api/webhooks/crypto/coingape
POST http://localhost:3001/api/webhooks/crypto/coinpedia
POST http://localhost:3001/api/webhooks/crypto/cointelegraph
POST http://localhost:3001/api/webhooks/crypto/cryptonews
POST http://localhost:3001/api/webhooks/crypto/news-bitcoin
POST http://localhost:3001/api/webhooks/crypto/thenewscrypto
```

**Payload exemple:**
```json
{
  "title": "Bitcoin atteint un nouveau record",
  "content": "Contenu de l'article RSS...",
  "url": "https://source.com/article",
  "publishDate": "2024-01-15T10:30:00Z",
  "keywords": ["bitcoin", "crypto"],
  "source": "bitcoin"
}
```

---

## 📱 WEBHOOKS SPÉCIALISÉS

### Telegram (URLs et Documents)
```
POST http://localhost:3001/api/webhooks/telegram
```

**Payload URL:**
```json
{
  "type": "url",
  "url": "https://example.com/article",
  "chat_id": "123456789",
  "message_id": "456"
}
```

**Payload Document:**
```json
{
  "type": "document",
  "document": {
    "file_id": "BAADBAADqwADBRQAAQ",
    "file_name": "article.pdf",
    "mime_type": "application/pdf"
  },
  "chat_id": "123456789"
}
```

### IA Trigger (Génération automatique)
```
POST http://localhost:3001/api/webhooks/ia-trigger
```

**Payload:**
```json
{
  "prompt": "Rédigez un article sur les dernières tendances crypto",
  "template": "crypto-analysis",
  "language": "french",
  "wordCount": 800,
  "keywords": ["bitcoin", "ethereum", "defi"]
}
```

---

## 🔗 WEBHOOKS GÉNÉRAUX

### Make.com
```
POST http://localhost:3001/api/webhooks/make
```

### N8n
```
POST http://localhost:3001/api/webhooks/n8n
```

**Payload standard:**
```json
{
  "action": "generate_article",
  "title": "Titre de l'article",
  "content": "Contenu...",
  "template": "blog-post",
  "projectId": "optional-project-id",
  "keywords": ["seo", "keyword"],
  "language": "french"
}
```

---

## 🔧 APIs PRINCIPALES

### Articles
```
GET    /api/articles                    # Liste des articles
POST   /api/articles                    # Créer un article
GET    /api/articles/:id               # Récupérer un article
PUT    /api/articles/:id               # Modifier un article
```

### Scénarios
```
GET    /api/scenarios                   # Liste des scénarios
POST   /api/scenarios                   # Créer un scénario
PUT    /api/scenarios/:id              # Modifier un scénario
DELETE /api/scenarios/:id              # Supprimer un scénario
POST   /api/scenarios/:id/execute      # Exécuter un scénario
POST   /api/scenarios/:id/toggle       # Activer/désactiver
```

### IA Providers
```
GET    /api/ai-providers               # Liste des providers IA
PUT    /api/ai-providers/:id/api-key   # Configurer clé API
POST   /api/ai-providers/:id/test      # Tester connexion
```

### Génération de Contenu IA
```
POST   /api/content-generation/generate    # Générer du contenu
GET    /api/content-generation/history     # Historique générations
```

**Payload génération:**
```json
{
  "provider": "claude",
  "prompt": "Rédigez un article sur...",
  "template": "article-news",
  "tone": "professional",
  "language": "french",
  "wordCount": 800,
  "creativity": 70,
  "seoKeywords": ["crypto", "bitcoin"]
}
```

### Paramètres
```
GET    /api/settings                   # Récupérer paramètres
PUT    /api/settings                   # Modifier paramètres
PUT    /api/settings/general          # Paramètres généraux
PUT    /api/settings/branding         # Paramètres de marque
PUT    /api/settings/security         # Paramètres sécurité
```

### Utilisateurs
```
GET    /api/users                     # Liste utilisateurs
POST   /api/users                     # Créer utilisateur
PUT    /api/users/:id                 # Modifier utilisateur
DELETE /api/users/:id                 # Supprimer utilisateur
POST   /api/users/:id/2fa/enable      # Activer 2FA
```

### Templates
```
GET    /api/templates                 # Liste templates
POST   /api/templates                 # Créer template
```

### Projets
```
GET    /api/projects                  # Liste projets
POST   /api/projects                  # Créer projet
```

### Logs des Webhooks
```
GET    /api/webhooks/logs             # Historique webhooks
```

---

## 🏥 Health Check
```
GET    /api/health
```

Retourne:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🔐 Authentification

Actuellement en mode développement (pas d'auth requise).
Pour production, ajouter headers:
```
Authorization: Bearer YOUR_API_TOKEN
Content-Type: application/json
```

---

## 📊 Codes de Réponse

- `200` : Succès
- `201` : Créé avec succès  
- `400` : Erreur de validation
- `404` : Ressource non trouvée
- `500` : Erreur serveur

---

## 🎯 Exemples d'Intégration N8n/Make

### 1. RSS Crypto → Webhook
```
RSS Trigger → HTTP Request (POST crypto webhook) → Article créé
```

### 2. Telegram → Traitement
```  
Telegram Trigger → HTTP Request (POST telegram webhook) → Article généré
```

### 3. Génération IA Programmée
```
Schedule Trigger → HTTP Request (POST ia-trigger) → Contenu généré
```

### 4. Traduction Automatique
```
Article Created → HTTP Request (GET article) → Translate → HTTP Request (POST article)
```

---

**✅ Votre back-office est maintenant prêt pour toutes vos intégrations N8n et Make.com !**