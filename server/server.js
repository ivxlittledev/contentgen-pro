import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cron from 'node-cron';
import { initializeDatabase, cleanupOldData } from './database.js';
import { UserModel, ArticleModel, ScenarioModel, GenerationHistoryModel, WebhookLogModel } from './models.js';

// Configuration
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Configuration JWT
const JWT_SECRET = process.env.JWT_SECRET || 'contentgen-pro-secret-key-2024';

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token d\'accès requis' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// Middleware de vérification des permissions
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise' });
    }

    const userPermissions = getRolePermissions(req.user.role);
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ error: 'Permission insuffisante' });
    }

    next();
  };
};

// Fonction pour obtenir les permissions d'un rôle
const getRolePermissions = (role) => {
  const permissions = {
    super_admin: [
      'view_all_dashboard', 'manage_scenarios', 'manage_generation', 'manage_templates', 
      'manage_settings', 'manage_users', 'manage_webhooks', 'manage_api_keys', 
      'view_system_logs', 'manage_prompts'
    ],
    manager: [
      'view_all_dashboard', 'view_scenarios', 'manage_generation', 'manage_templates',
      'view_projects', 'manage_prompts', 'view_campaigns'
    ],
    redacteur: [
      'view_own_dashboard', 'use_generation', 'view_templates', 'view_own_prompts', 'view_scenarios'
    ]
  };
  return permissions[role] || [];
};

// Variables temporaires pour les données non encore migrées
let templates = [];
let projects = [];
let aiProviders = [];
let quickPrompts = [];
let settings = {
  general: {
    companyName: 'ContentGen Pro',
    defaultLanguage: 'fr',
    timezone: 'Europe/Paris',
    dateFormat: 'dd/mm/yyyy'
  },
  branding: {
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    brandName: 'ContentGen Pro'
  },
  security: {
    twoFactorRequired: false,
    sessionTimeout: 8,
    allowedDomains: [],
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSymbols: false
    }
  },
  integrations: {
    wordpress: {
      url: '',
      apiKey: '',
      connected: false
    },
    make: {
      webhookUrl: '',
      connected: false
    },
    n8n: {
      instanceUrl: '',
      apiKey: '',
      connected: false
    }
  }
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes d'authentification
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
    }

    // Recherche de l'utilisateur dans la base
    const user = await UserModel.findByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    // Vérification du mot de passe
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    // Mise à jour dernière connexion
    const lastLogin = new Date().toISOString();
    await UserModel.updateLastLogin(user.id, lastLogin);

    // Génération du token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Réponse sans le mot de passe
    const { passwordHash, ...userWithoutPassword } = user;
    userWithoutPassword.lastLogin = lastLogin;
    
    res.json({
      token,
      user: userWithoutPassword,
      message: 'Connexion réussie'
    });

    console.log(`✅ Connexion réussie pour ${username} (${user.role})`);

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/auth/verify', authenticateToken, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const { passwordHash, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Erreur vérification token:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  // Côté serveur, on pourrait maintenir une blacklist des tokens
  // Pour l'instant, on se contente de répondre OK
  res.json({ message: 'Déconnexion réussie' });
});

// Webhook endpoints for Make.com and N8n
app.post('/api/webhooks/make', async (req, res) => {
  try {
    console.log('🔥 Webhook reçu de Make.com:', req.body);
    
    const webhookData = {
      id: uuidv4(),
      source: 'make.com',
      timestamp: new Date().toISOString(),
      data: req.body,
      processed: false
    };
    
    await WebhookLogModel.create(webhookData);
    
    // Traiter la génération d'article
    if (req.body.action === 'generate_article') {
      const article = await generateArticle(req.body);
      res.json({ 
        success: true, 
        articleId: article.id,
        message: 'Article généré avec succès' 
      });
    } else {
      res.json({ success: true, message: 'Webhook reçu' });
    }
    
  } catch (error) {
    console.error('Erreur webhook Make.com:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/webhooks/n8n', async (req, res) => {
  try {
    console.log('🔥 Webhook reçu de N8n:', req.body);
    
    const webhookData = {
      id: uuidv4(),
      source: 'n8n.com',
      timestamp: new Date().toISOString(),
      data: req.body,
      processed: false
    };
    
    await WebhookLogModel.create(webhookData);
    
    if (req.body.action === 'generate_article') {
      const article = await generateArticle(req.body);
      res.json({ 
        success: true, 
        articleId: article.id,
        message: 'Article généré avec succès' 
      });
    } else {
      res.json({ success: true, message: 'Webhook reçu' });
    }
    
  } catch (error) {
    console.error('Erreur webhook N8n:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API Articles
app.get('/api/articles', async (req, res) => {
  try {
    const { project, status, limit = 50 } = req.query;
    const filters = {};
    
    if (project) filters.project = project;
    if (status) filters.status = status;
    if (limit) filters.limit = limit;
    
    const articles = await ArticleModel.getAll(filters);
    res.json(articles);
  } catch (error) {
    console.error('Erreur récupération articles:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/articles', async (req, res) => {
  try {
    const article = await generateArticle(req.body);
    res.json(article);
  } catch (error) {
    console.error('Erreur génération article:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/articles/:id', async (req, res) => {
  try {
    const article = await ArticleModel.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }
    res.json(article);
  } catch (error) {
    console.error('Erreur récupération article:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/articles/:id', async (req, res) => {
  try {
    const updates = { ...req.body, updatedAt: new Date().toISOString() };
    const article = await ArticleModel.update(req.params.id, updates);
    if (!article) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }
    res.json(article);
  } catch (error) {
    console.error('Erreur mise à jour article:', error);
    res.status(500).json({ error: error.message });
  }
});

// API Projets/Sites
app.get('/api/projects', (req, res) => {
  res.json(projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

app.post('/api/projects', (req, res) => {
  const project = {
    id: uuidv4(),
    name: req.body.name,
    domain: req.body.domain,
    description: req.body.description,
    settings: req.body.settings || {},
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  projects.push(project);
  res.json(project);
});

// API Templates
app.get('/api/templates', (req, res) => {
  res.json(templates.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
});

app.post('/api/templates', (req, res) => {
  const template = {
    id: uuidv4(),
    name: req.body.name,
    description: req.body.description,
    category: req.body.category,
    content: req.body.content,
    variables: req.body.variables || [],
    seoSettings: req.body.seoSettings || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  templates.push(template);
  res.json(template);
});

// API Webhook Logs
app.get('/api/webhooks/logs', async (req, res) => {
  try {
    const logs = await WebhookLogModel.getAll(100);
    res.json(logs);
  } catch (error) {
    console.error('Erreur récupération logs:', error);
    res.status(500).json({ error: error.message });
  }
});

// API Settings
app.get('/api/settings', (req, res) => {
  res.json(settings);
});

app.put('/api/settings', (req, res) => {
  settings = { ...settings, ...req.body };
  console.log('⚙️ Paramètres mis à jour:', settings);
  res.json(settings);
});

app.put('/api/settings/general', (req, res) => {
  settings.general = { ...settings.general, ...req.body };
  console.log('⚙️ Paramètres généraux mis à jour:', settings.general);
  res.json(settings.general);
});

app.put('/api/settings/branding', (req, res) => {
  settings.branding = { ...settings.branding, ...req.body };
  console.log('🎨 Paramètres de branding mis à jour:', settings.branding);
  res.json(settings.branding);
});

app.put('/api/settings/security', (req, res) => {
  settings.security = { ...settings.security, ...req.body };
  console.log('🔒 Paramètres de sécurité mis à jour:', settings.security);
  res.json(settings.security);
});

app.put('/api/settings/integrations', (req, res) => {
  settings.integrations = { ...settings.integrations, ...req.body };
  console.log('🔗 Paramètres d\'intégration mis à jour:', settings.integrations);
  res.json(settings.integrations);
});

// API Users
app.get('/api/users', authenticateToken, requirePermission('manage_users'), async (req, res) => {
  try {
    const users = await UserModel.getAll();
    res.json(users);
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', (req, res) => {
  const user = {
    id: uuidv4(),
    name: req.body.name,
    email: req.body.email,
    role: req.body.role || 'viewer',
    status: req.body.status || 'active',
    twoFactorEnabled: req.body.twoFactorEnabled || false,
    lastActive: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  
  users.push(user);
  console.log('👤 Nouvel utilisateur créé:', user.name);
  res.json(user);
});

app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }
  res.json(user);
});

app.put('/api/users/:id', (req, res) => {
  const index = users.findIndex(u => u.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }
  
  users[index] = { 
    ...users[index], 
    ...req.body, 
    lastActive: new Date().toISOString() 
  };
  
  console.log('👤 Utilisateur mis à jour:', users[index].name);
  res.json(users[index]);
});

app.delete('/api/users/:id', (req, res) => {
  const index = users.findIndex(u => u.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }
  
  const deletedUser = users.splice(index, 1)[0];
  console.log('👤 Utilisateur supprimé:', deletedUser.name);
  res.json({ message: 'Utilisateur supprimé avec succès' });
});

// API 2FA
app.post('/api/users/:id/2fa/enable', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }
  
  // Generate 2FA secret (simplified)
  const secret = Math.random().toString(36).substring(2, 15);
  const qrCode = `otpauth://totp/${settings.general.companyName}:${user.email}?secret=${secret}&issuer=${settings.general.companyName}`;
  
  user.twoFactorEnabled = true;
  user.twoFactorSecret = secret;
  
  res.json({ 
    secret, 
    qrCode,
    message: '2FA activé avec succès' 
  });
});

app.post('/api/users/:id/2fa/disable', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }
  
  user.twoFactorEnabled = false;
  delete user.twoFactorSecret;
  
  res.json({ message: '2FA désactivé avec succès' });
});

app.post('/api/users/:id/2fa/verify', (req, res) => {
  const { code } = req.body;
  const user = users.find(u => u.id === req.params.id);
  
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }
  
  // Simplified verification (in production, use proper TOTP verification)
  const isValid = code && code.length === 6;
  
  res.json({ 
    valid: isValid,
    message: isValid ? 'Code valide' : 'Code invalide' 
  });
});

// API Scenarios
app.get('/api/scenarios', async (req, res) => {
  try {
    const { type, status, search } = req.query;
    const filters = {};
    
    if (type) filters.type = type;
    if (status) filters.status = status;
    if (search) filters.search = search;
    
    const scenarios = await ScenarioModel.getAll(filters);
    res.json(scenarios);
  } catch (error) {
    console.error('Erreur récupération scénarios:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/scenarios', async (req, res) => {
  try {
    const scenario = {
      id: uuidv4(),
      name: req.body.name,
      type: req.body.type,
      category: req.body.category || '',
      status: req.body.status || 'pending',
      source: req.body.source,
      target: req.body.target || 'ContentGen Pro',
      language: req.body.language || 'FR',
      lastExecution: new Date().toISOString(),
      nextExecution: req.body.nextExecution || 'Manuel',
      executionCount: 0,
      successRate: 100,
      avgExecutionTime: '0s',
      description: req.body.description || '',
      config: req.body.config || {},
      createdAt: new Date().toISOString()
    };
    
    const createdScenario = await ScenarioModel.create(scenario);
    console.log(`🎯 Nouveau scénario créé: ${scenario.name} (Type: ${scenario.type})`);
    res.json(createdScenario);
  } catch (error) {
    console.error('Erreur création scénario:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/scenarios/:id', async (req, res) => {
  try {
    const updates = { ...req.body, updatedAt: new Date().toISOString() };
    const scenario = await ScenarioModel.update(req.params.id, updates);
    if (!scenario) {
      return res.status(404).json({ error: 'Scénario non trouvé' });
    }
    
    console.log(`🎯 Scénario mis à jour: ${scenario.name}`);
    res.json(scenario);
  } catch (error) {
    console.error('Erreur mise à jour scénario:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/scenarios/:id', async (req, res) => {
  try {
    const scenario = await ScenarioModel.findById(req.params.id);
    if (!scenario) {
      return res.status(404).json({ error: 'Scénario non trouvé' });
    }
    
    const deleted = await ScenarioModel.delete(req.params.id);
    if (deleted) {
      console.log(`🎯 Scénario supprimé: ${scenario.name}`);
      res.json({ message: 'Scénario supprimé avec succès' });
    } else {
      res.status(500).json({ error: 'Erreur suppression scénario' });
    }
  } catch (error) {
    console.error('Erreur suppression scénario:', error);
    res.status(500).json({ error: error.message });
  }
});

// API Scenario Actions
app.post('/api/scenarios/:id/toggle', async (req, res) => {
  try {
    const scenario = await ScenarioModel.findById(req.params.id);
    if (!scenario) {
      return res.status(404).json({ error: 'Scénario non trouvé' });
    }
    
    const newStatus = scenario.status === 'active' ? 'paused' : 'active';
    const updatedScenario = await ScenarioModel.update(req.params.id, {
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
    
    console.log(`🎯 Scénario ${scenario.name} ${newStatus === 'active' ? 'activé' : 'mis en pause'}`);
    res.json({ 
      status: newStatus,
      message: `Scénario ${newStatus === 'active' ? 'activé' : 'mis en pause'}` 
    });
  } catch (error) {
    console.error('Erreur toggle scénario:', error);
    res.status(500).json({ error: error.message });
  }
});

// API AI Providers
app.get('/api/ai-providers', (req, res) => {
  res.json(aiProviders.sort((a, b) => a.name.localeCompare(b.name)));
});

app.put('/api/ai-providers/:id/api-key', (req, res) => {
  const { apiKey } = req.body;
  const provider = aiProviders.find(p => p.id === req.params.id);
  
  if (!provider) {
    return res.status(404).json({ error: 'Provider non trouvé' });
  }
  
  // Validation de la clé API
  if (apiKey && apiKey.trim().length < 10) {
    return res.status(400).json({ error: 'Clé API trop courte (minimum 10 caractères)' });
  }
  
  const previousKey = provider.apiKey;
  provider.apiKey = apiKey ? apiKey.trim() : null;
  provider.status = apiKey ? 'connected' : 'disconnected';
  provider.lastUsed = provider.status === 'connected' ? new Date().toLocaleString('fr-FR') : null;
  
  if (apiKey) {
    console.log(`🔑 Clé API ${provider.name} configurée (${apiKey.substring(0, 8)}...)`);
  } else {
    console.log(`🔑 Clé API ${provider.name} supprimée`);
  }
  
  res.json({ 
    success: true,
    message: `Clé API ${provider.name} ${apiKey ? 'sauvegardée' : 'supprimée'} avec succès`,
    status: provider.status,
    provider: {
      id: provider.id,
      name: provider.name,
      status: provider.status,
      lastUsed: provider.lastUsed,
      hasApiKey: !!provider.apiKey
    }
  });
});

app.post('/api/ai-providers/:id/test', async (req, res) => {
  const provider = aiProviders.find(p => p.id === req.params.id);
  
  if (!provider) {
    return res.status(404).json({ error: 'Provider non trouvé' });
  }
  
  if (!provider.apiKey) {
    return res.status(400).json({ error: 'Clé API manquante' });
  }
  
  try {
    // Test de connexion simple (simulé)
    console.log(`🧪 Test de connexion ${provider.name}...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    provider.status = 'connected';
    provider.lastUsed = new Date().toISOString();
    
    res.json({ 
      success: true,
      message: `Connexion ${provider.name} réussie`,
      status: provider.status
    });
  } catch (error) {
    provider.status = 'error';
    console.error(`❌ Erreur test ${provider.name}:`, error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      status: provider.status
    });
  }
});

// API Content Generation
app.post('/api/content-generation/generate', async (req, res) => {
  try {
    const { provider, prompt, template, tone, language, wordCount, creativity, seoKeywords } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt requis' });
    }
    
    const aiProvider = aiProviders.find(p => p.id === provider);
    if (!aiProvider) {
      return res.status(400).json({ error: 'Provider IA non trouvé' });
    }
    
    if (aiProvider.status !== 'connected') {
      return res.status(400).json({ error: `${aiProvider.name} n'est pas connecté` });
    }
    
    console.log(`🤖 Génération de contenu avec ${aiProvider.name}...`);
    console.log(`📝 Prompt: ${prompt.substring(0, 100)}...`);
    console.log(`🎨 Template: ${template}, Langue: ${language}, Mots: ${wordCount}`);
    
    // Simulation de génération IA (remplacer par vraies APIs)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const generatedContent = await generateContentWithAI({
      provider: aiProvider,
      prompt,
      template,
      tone,
      language,
      wordCount,
      creativity,
      seoKeywords
    });
    
    // Sauvegarder dans l'historique
    const historyEntry = {
      id: uuidv4(),
      provider: aiProvider.name,
      prompt,
      content: generatedContent,
      timestamp: new Date().toISOString(),
      wordCount: generatedContent.split(' ').length,
      template,
      status: 'success',
      settings: {
        tone,
        language,
        creativity,
        seoKeywords
      },
      userId: req.user?.id || null
    };
    
    await GenerationHistoryModel.create(historyEntry);
    
    // Mettre à jour l'usage du provider
    aiProvider.lastUsed = new Date().toLocaleString('fr-FR');
    
    console.log(`✅ Contenu généré: ${generatedContent.split(' ').length} mots`);
    
    res.json({
      success: true,
      content: generatedContent,
      metadata: {
        provider: aiProvider.name,
        wordCount: generatedContent.split(' ').length,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur génération de contenu:', error);
    
    // Sauvegarder l'erreur dans l'historique
    const errorEntry = {
      id: uuidv4(),
      provider: req.body.provider,
      prompt: req.body.prompt,
      content: `Erreur: ${error.message}`,
      timestamp: new Date().toISOString(),
      wordCount: 0,
      template: req.body.template,
      status: 'error',
      userId: req.user?.id || null
    };
    
    await GenerationHistoryModel.create(errorEntry);
    
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

app.get('/api/content-generation/history', async (req, res) => {
  try {
    const { limit = 50, provider, status } = req.query;
    const filters = {};
    
    if (provider) filters.provider = provider;
    if (status) filters.status = status;
    if (limit) filters.limit = limit;
    
    // Si l'utilisateur n'est pas super_admin, ne montrer que son historique
    if (req.user && req.user.role !== 'super_admin') {
      filters.userId = req.user.id;
    }
    
    const history = await GenerationHistoryModel.getAll(filters);
    res.json(history);
  } catch (error) {
    console.error('Erreur récupération historique:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/content-generation/history/:id', async (req, res) => {
  try {
    const deleted = await GenerationHistoryModel.delete(req.params.id);
    if (deleted) {
      console.log(`🗑️ Entrée historique supprimée: ${req.params.id}`);
      res.json({ message: 'Entrée supprimée avec succès' });
    } else {
      res.status(404).json({ error: 'Entrée non trouvée' });
    }
  } catch (error) {
    console.error('Erreur suppression historique:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/content-generation/history', async (req, res) => {
  try {
    const count = await GenerationHistoryModel.deleteAll();
    console.log(`🗑️ Historique complet supprimé: ${count} entrées`);
    res.json({ message: `${count} entrées supprimées` });
  } catch (error) {
    console.error('Erreur suppression historique complet:', error);
    res.status(500).json({ error: error.message });
  }
});

// API Quick Prompts
app.get('/api/quick-prompts', (req, res) => {
  const sortedPrompts = quickPrompts
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(p => p.prompt);
  res.json(sortedPrompts);
});

app.post('/api/quick-prompts', (req, res) => {
  const { prompt, category = 'custom' } = req.body;
  
  if (!prompt || prompt.trim().length < 10) {
    return res.status(400).json({ error: 'Le prompt doit contenir au moins 10 caractères' });
  }
  
  // Vérifier si le prompt existe déjà
  const exists = quickPrompts.find(p => p.prompt.toLowerCase() === prompt.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: 'Ce prompt existe déjà' });
  }
  
  const newPrompt = {
    id: uuidv4(),
    prompt: prompt.trim(),
    category,
    createdAt: new Date().toISOString(),
    usageCount: 0
  };
  
  quickPrompts.push(newPrompt);
  console.log(`📝 Nouveau prompt ajouté: ${prompt.substring(0, 50)}...`);
  
  res.json({ 
    success: true,
    message: 'Prompt ajouté avec succès',
    prompt: newPrompt
  });
});

app.delete('/api/quick-prompts', (req, res) => {
  const { prompt } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt requis' });
  }
  
  const index = quickPrompts.findIndex(p => p.prompt === prompt);
  if (index === -1) {
    return res.status(404).json({ error: 'Prompt non trouvé' });
  }
  
  const deleted = quickPrompts.splice(index, 1)[0];
  console.log(`🗑️ Prompt supprimé: ${deleted.prompt.substring(0, 50)}...`);
  
  res.json({ 
    success: true,
    message: 'Prompt supprimé avec succès'
  });
});

app.put('/api/quick-prompts/:id', (req, res) => {
  const { prompt } = req.body;
  const promptItem = quickPrompts.find(p => p.id === req.params.id);
  
  if (!promptItem) {
    return res.status(404).json({ error: 'Prompt non trouvé' });
  }
  
  if (!prompt || prompt.trim().length < 10) {
    return res.status(400).json({ error: 'Le prompt doit contenir au moins 10 caractères' });
  }
  
  promptItem.prompt = prompt.trim();
  promptItem.updatedAt = new Date().toISOString();
  
  console.log(`📝 Prompt modifié: ${prompt.substring(0, 50)}...`);
  
  res.json({ 
    success: true,
    message: 'Prompt modifié avec succès',
    prompt: promptItem
  });
});

app.post('/api/scenarios/:id/execute', async (req, res) => {
  try {
    const scenario = await ScenarioModel.findById(req.params.id);
    if (!scenario) {
      return res.status(404).json({ error: 'Scénario non trouvé' });
    }
    
    console.log(`🚀 Exécution du scénario: ${scenario.name}`);
    
    // Simulation d'exécution
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mise à jour des statistiques
    const newExecutionCount = scenario.executionCount + 1;
    const newSuccessRate = Math.min(100, scenario.successRate + Math.random() * 2 - 1);
    const newAvgExecutionTime = `${(Math.random() * 10 + 1).toFixed(1)}s`;
    
    await ScenarioModel.update(req.params.id, {
      executionCount: newExecutionCount,
      lastExecution: new Date().toISOString(),
      avgExecutionTime: newAvgExecutionTime,
      successRate: newSuccessRate
    });
    
    // Générer un article de résultat selon le type
    let generatedContent = null;
    
    switch (scenario.type) {
      case 'scraping':
        generatedContent = await handleCryptoScraping(scenario);
        break;
      case 'redaction':
        generatedContent = await handleTelegramRedaction(scenario);
        break;
      case 'ia-generator':
        generatedContent = await handleIAGeneration(scenario);
        break;
      case 'translation':
        generatedContent = await handleTranslation(scenario);
        break;
    }
    
    res.json({ 
      success: true,
      message: 'Scénario exécuté avec succès',
      result: generatedContent,
      executionTime: newAvgExecutionTime
    });
    
  } catch (error) {
    console.error(`❌ Erreur lors de l'exécution du scénario:`, error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Webhooks spécialisés pour chaque type de scénario

// Webhook RSS Crypto Sources
app.post('/api/webhooks/crypto/:source', async (req, res) => {
  try {
    const source = req.params.source;
    console.log(`📰 Webhook RSS reçu de ${source}:`, req.body);
    
    const webhookData = {
      id: uuidv4(),
      source: `rss-${source}`,
      timestamp: new Date().toISOString(),
      data: req.body,
      processed: false,
      type: 'crypto-rss'
    };
    
    await WebhookLogModel.create(webhookData);
    
    // Traitement automatique si scénario actif
    const scenarios = await ScenarioModel.getAll({ type: 'scraping', status: 'active' });
    const activeScenario = scenarios.find(s => 
      s.source.toLowerCase().includes(source.toLowerCase())
    );
    
    if (activeScenario) {
      const article = await handleCryptoScraping(activeScenario, req.body);
      res.json({ 
        success: true, 
        articleId: article.id,
        message: `Article généré depuis ${source}` 
      });
    } else {
      res.json({ 
        success: true, 
        message: `Données reçues de ${source}, en attente de traitement` 
      });
    }
    
  } catch (error) {
    console.error(`Erreur webhook ${req.params.source}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Webhook Telegram
app.post('/api/webhooks/telegram', async (req, res) => {
  try {
    console.log('📱 Webhook Telegram reçu:', req.body);
    
    const webhookData = {
      id: uuidv4(),
      source: 'telegram',
      timestamp: new Date().toISOString(),
      data: req.body,
      processed: false,
      type: 'telegram'
    };
    
    await WebhookLogModel.create(webhookData);
    
    // Déterminer le type de contenu Telegram
    const contentType = req.body.document ? 'document' : 'url';
    
    // Traitement automatique si scénario actif
    const scenarios = await ScenarioModel.getAll({ type: 'redaction', status: 'active' });
    const activeScenario = scenarios.find(s => 
      s.source.toLowerCase().includes('telegram')
    );
    
    if (activeScenario) {
      const article = await handleTelegramRedaction(activeScenario, req.body);
      res.json({ 
        success: true, 
        articleId: article.id,
        message: `Article généré depuis Telegram (${contentType})` 
      });
    } else {
      res.json({ 
        success: true, 
        message: `Contenu Telegram reçu, en attente de traitement` 
      });
    }
    
  } catch (error) {
    console.error('Erreur webhook Telegram:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Webhook IA Generator
app.post('/api/webhooks/ia-trigger', async (req, res) => {
  try {
    console.log('🤖 Trigger IA reçu:', req.body);
    
    const scenarios = await ScenarioModel.getAll({ type: 'ia-generator', status: 'active' });
    const activeScenario = scenarios[0]; // Premier scénario IA actif
    
    if (activeScenario) {
      const article = await handleIAGeneration(activeScenario, req.body);
      res.json({ 
        success: true, 
        articleId: article.id,
        message: 'Article généré par IA' 
      });
    } else {
      res.json({ 
        success: true, 
        message: 'Trigger IA reçu, aucun scénario actif' 
      });
    }
    
  } catch (error) {
    console.error('Erreur webhook IA:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fonctions spécialisées pour chaque type de scénario

async function handleCryptoScraping(scenario, data = {}) {
  console.log(`📰 Traitement scraping crypto: ${scenario.source}`);
  
  const cryptoKeywords = ['Bitcoin', 'Ethereum', 'Crypto', 'Blockchain', 'DeFi', 'NFT', 'Trading'];
  const randomKeyword = cryptoKeywords[Math.floor(Math.random() * cryptoKeywords.length)];
  
  const article = {
    id: uuidv4(),
    title: data.title || `${randomKeyword} : Dernières actualités depuis ${scenario.source}`,
    content: generateCryptoContent(scenario.source, data),
    excerpt: data.excerpt || `Actualités crypto en temps réel depuis ${scenario.source}`,
    keywords: data.keywords || [randomKeyword, 'Crypto', 'Actualités'],
    projectId: data.projectId || null,
    templateId: 'crypto-news-template',
    status: 'published',
    seoData: {
      metaTitle: data.title || `${randomKeyword} News | ${scenario.source}`,
      metaDescription: `Dernières actualités ${randomKeyword} et crypto depuis ${scenario.source}`,
      slug: (data.title || randomKeyword).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      focusKeyword: randomKeyword
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: `rss-${scenario.source}`,
    scenarioId: scenario.id,
    language: 'FR',
    category: 'Crypto News'
  };
  
  const createdArticle = await ArticleModel.create(article);
  return createdArticle;
}

async function handleTelegramRedaction(scenario, data = {}) {
  console.log(`📱 Traitement rédaction Telegram: ${scenario.name}`);
  
  const article = {
    id: uuidv4(),
    title: data.title || `Article Evergreen - ${new Date().toLocaleDateString('fr-FR')}`,
    content: generateEvergreenContent(data),
    excerpt: data.excerpt || 'Article evergreen rédigé via Telegram',
    keywords: data.keywords || ['Evergreen', 'Content', 'SEO'],
    projectId: data.projectId || null,
    templateId: 'evergreen-template',
    status: 'draft',
    seoData: {
      metaTitle: data.title || 'Article Evergreen SEO',
      metaDescription: 'Contenu evergreen optimisé pour le SEO',
      slug: 'article-evergreen-' + Date.now(),
      focusKeyword: 'evergreen'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'telegram',
    scenarioId: scenario.id,
    language: 'FR',
    category: 'Evergreen FR',
    telegramData: {
      messageType: data.document ? 'document' : 'url',
      originalUrl: data.url || null,
      document: data.document || null
    }
  };
  
  const createdArticle = await ArticleModel.create(article);
  return createdArticle;
}

async function handleIAGeneration(scenario, data = {}) {
  console.log(`🤖 Traitement génération IA: ${scenario.name}`);
  
  const topics = ['Technologie', 'Innovation', 'Tendances', 'Digital', 'Futur', 'IA'];
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  
  const article = {
    id: uuidv4(),
    title: data.title || `${randomTopic} : Analyse IA du ${new Date().toLocaleDateString('fr-FR')}`,
    content: generateIAContent(randomTopic, data),
    excerpt: data.excerpt || `Analyse générée par IA sur ${randomTopic}`,
    keywords: data.keywords || [randomTopic, 'IA', 'Automatique'],
    projectId: data.projectId || null,
    templateId: 'ia-generated-template',
    status: 'published',
    seoData: {
      metaTitle: `${randomTopic} IA | Analyse Automatique`,
      metaDescription: `Analyse complète sur ${randomTopic} générée par intelligence artificielle`,
      slug: `${randomTopic.toLowerCase()}-ia-${Date.now()}`,
      focusKeyword: randomTopic
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'ia-generator',
    scenarioId: scenario.id,
    language: 'FR',
    category: 'IA Generated',
    iaPrompt: data.prompt || `Générer un article sur ${randomTopic}`
  };
  
  const createdArticle = await ArticleModel.create(article);
  return createdArticle;
}

async function handleTranslation(scenario, data = {}) {
  console.log(`🌍 Traitement traduction: ${scenario.language}`);
  
  // Trouver un article français à traduire
  const articles = await ArticleModel.getAll({ limit: 10 });
  const sourceArticle = articles.find(a => a.language === 'FR' && a.status === 'published') || 
    articles[0] || { title: 'Article source', content: 'Contenu à traduire' };
  
  const translatedArticle = {
    id: uuidv4(),
    title: translateTitle(sourceArticle.title, scenario.language),
    content: translateContent(sourceArticle.content, scenario.language),
    excerpt: translateText(sourceArticle.excerpt || 'Extrait traduit', scenario.language),
    keywords: sourceArticle.keywords || ['Traduit', 'Content'],
    projectId: data.projectId || null,
    templateId: 'translation-template',
    status: 'ready-for-wordpress',
    seoData: {
      metaTitle: translateTitle(sourceArticle.title, scenario.language),
      metaDescription: translateText(sourceArticle.excerpt || 'Article traduit', scenario.language),
      slug: translateSlug(sourceArticle.seoData?.slug || 'article', scenario.language),
      focusKeyword: sourceArticle.seoData?.focusKeyword || 'content'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: `translation-${scenario.language}`,
    scenarioId: scenario.id,
    language: scenario.language,
    category: `WordPress ${scenario.language}`,
    originalArticleId: sourceArticle.id,
    translationData: {
      sourceLanguage: 'FR',
      targetLanguage: scenario.language,
      wordPressTarget: scenario.target
    }
  };
  
  const createdArticle = await ArticleModel.create(translatedArticle);
  return createdArticle;
}

function generateCryptoContent(source, data) {
  return `# Actualités Crypto depuis ${source}

## Introduction

Les dernières informations du monde de la crypto-monnaie collectées automatiquement depuis ${source}.

## Analyse du marché

${data.content || 'Le marché des crypto-monnaies continue d\'évoluer avec de nouvelles tendances et opportunités. Cette analyse automatique compile les informations les plus récentes pour vous tenir informé des développements importants.'}

## Points clés

- Évolution des prix en temps réel
- Nouvelles réglementations
- Innovations technologiques
- Adoption institutionnelle

## Conclusion

Restez informé des dernières actualités crypto grâce à notre système de veille automatisé.

---
*Article généré automatiquement le ${new Date().toLocaleDateString('fr-FR')} depuis ${source}*
`;
}

function generateEvergreenContent(data) {
  return `# ${data.title || 'Guide Complet Evergreen'}

## Introduction

Ce guide evergreen a été créé pour fournir une valeur durable à nos lecteurs.

## Contenu Principal

${data.content || 'Contenu evergreen optimisé pour le référencement naturel. Ce type de contenu conserve sa pertinence dans le temps et continue d\'attirer du trafic organique.'}

## Conseils Pratiques

- Optimisation SEO continue
- Mise à jour régulière
- Valeur ajoutée pour l'utilisateur
- Structure claire et logique

## Conclusion

Un contenu evergreen bien conçu est un investissement à long terme pour votre stratégie de contenu.

---
*Rédigé via Telegram le ${new Date().toLocaleDateString('fr-FR')}*
`;
}

function generateIAContent(topic, data) {
  return `# ${topic} : Analyse IA Approfondie

## Vue d'ensemble

L'intelligence artificielle révolutionne notre compréhension de ${topic}.

## Analyse Détaillée

${data.content || `Cette analyse automatique explore les dernières tendances en matière de ${topic}. Grâce aux algorithmes d'IA, nous pouvons identifier les patterns et insights les plus pertinents.`}

## Tendances Émergentes

- Innovation technologique
- Impact sur l'industrie
- Perspectives d'avenir
- Recommandations stratégiques

## Insights IA

Notre système d'intelligence artificielle a identifié plusieurs points d'intérêt concernant ${topic}.

## Conclusion

${topic} continue d'évoluer rapidement, et l'IA nous aide à anticiper ces changements.

---
*Généré par IA le ${new Date().toLocaleDateString('fr-FR')}*
`;
}

function translateTitle(title, language) {
  const translations = {
    'DE': title.replace(/Actualités|News/g, 'Nachrichten').replace(/Guide/g, 'Leitfaden'),
    'EN': title.replace(/Actualités/g, 'News').replace(/Guide/g, 'Guide'),
    'ES': title.replace(/Actualités/g, 'Noticias').replace(/Guide/g, 'Guía'),
    'PT': title.replace(/Actualités/g, 'Notícias').replace(/Guide/g, 'Guia')
  };
  return translations[language] || title;
}

function translateContent(content, language) {
  const introTranslations = {
    'DE': '# Übersetzter Inhalt\n\nDieser Artikel wurde automatisch ins Deutsche übersetzt.',
    'EN': '# Translated Content\n\nThis article has been automatically translated to English.',
    'ES': '# Contenido Traducido\n\nEste artículo ha sido traducido automáticamente al español.',
    'PT': '# Conteúdo Traduzido\n\nEste artigo foi traduzido automaticamente para português.'
  };
  
  return introTranslations[language] + '\n\n' + content.substring(0, 500) + '...\n\n*Traduction automatique*';
}

function translateText(text, language) {
  const simpleTranslations = {
    'DE': text.replace(/Article/g, 'Artikel').replace(/Contenu/g, 'Inhalt'),
    'EN': text.replace(/Article/g, 'Article').replace(/Contenu/g, 'Content'),
    'ES': text.replace(/Article/g, 'Artículo').replace(/Contenu/g, 'Contenido'),
    'PT': text.replace(/Article/g, 'Artigo').replace(/Contenu/g, 'Conteúdo')
  };
  return simpleTranslations[language] || text;
}

function translateSlug(slug, language) {
  return `${slug}-${language.toLowerCase()}`;
}

// Fonction de génération de contenu IA
async function generateContentWithAI(options) {
  const { provider, prompt, template, tone, language, wordCount, creativity, seoKeywords } = options;
  
  console.log(`🤖 Génération avec ${provider.name}: ${wordCount} mots en ${language}`);
  
  // Templates de base pour différents types de contenu
  const templates = {
    'article-news': {
      structure: "# {title}\n\n## Introduction\n{intro}\n\n## Développement\n{content}\n\n## Analyse\n{analysis}\n\n## Conclusion\n{conclusion}",
      keywords: ['actualité', 'news', 'dernière', 'information']
    },
    'blog-post': {
      structure: "# {title}\n\n{intro}\n\n## Points clés\n{content}\n\n## Conseils pratiques\n{tips}\n\n## Conclusion\n{conclusion}",
      keywords: ['guide', 'conseils', 'astuces', 'méthode']
    },
    'crypto-analysis': {
      structure: "# {title}\n\n## Vue d'ensemble\n{intro}\n\n## Analyse technique\n{technical}\n\n## Analyse fondamentale\n{fundamental}\n\n## Perspectives\n{outlook}",
      keywords: ['crypto', 'bitcoin', 'analyse', 'marché', 'trading']
    },
    'evergreen-guide': {
      structure: "# {title}\n\n## Introduction\n{intro}\n\n## Étapes détaillées\n{steps}\n\n## Conseils d'expert\n{expert_tips}\n\n## Conclusion\n{conclusion}",
      keywords: ['guide', 'complet', 'étapes', 'méthode', 'pratique']
    }
  };
  
  const templateConfig = templates[template] || templates['blog-post'];
  
  // Adaptation selon la langue
  const languageAdaptations = {
    'french': {
      intro: "Dans cet article, nous allons explorer",
      conclusion: "En conclusion, il est important de retenir que",
      connecting: ["Par ailleurs", "En outre", "De plus", "Ainsi", "Cependant"]
    },
    'english': {
      intro: "In this article, we will explore",
      conclusion: "In conclusion, it's important to remember that",
      connecting: ["Furthermore", "Additionally", "Moreover", "Therefore", "However"]
    },
    'spanish': {
      intro: "En este artículo, exploraremos",
      conclusion: "En conclusión, es importante recordar que",
      connecting: ["Además", "Por otra parte", "Asimismo", "Por tanto", "Sin embargo"]
    }
  };
  
  const langConfig = languageAdaptations[language] || languageAdaptations['french'];
  
  // Génération du contenu selon le provider
  let generatedContent = '';
  
  switch (provider.id) {
    case 'claude':
      generatedContent = await generateWithClaude(prompt, templateConfig, langConfig, wordCount, seoKeywords);
      break;
    case 'chatgpt':
      generatedContent = await generateWithChatGPT(prompt, templateConfig, langConfig, wordCount, seoKeywords);
      break;
    case 'perplexity':
      generatedContent = await generateWithPerplexity(prompt, templateConfig, langConfig, wordCount, seoKeywords);
      break;
    default:
      generatedContent = await generateDefaultContent(prompt, templateConfig, langConfig, wordCount, seoKeywords);
  }
  
  return generatedContent;
}

// Simulateurs de génération par provider (à remplacer par vraies APIs)
async function generateWithClaude(prompt, template, langConfig, wordCount, seoKeywords) {
  const keywordText = seoKeywords.length > 0 ? ` Intégrez naturellement ces mots-clés: ${seoKeywords.join(', ')}.` : '';
  
  // Simulation de réponse Claude
  return `# ${prompt.split('sur')[1] || prompt.split('article')[1] || 'Analyse Complète'}

## Introduction

${langConfig.intro} un sujet d'une importance capitale dans le paysage actuel. Cette analyse approfondie vous permettra de comprendre les enjeux, les opportunités et les défis qui se dessinent.

## Développement Principal

Les données récentes montrent une évolution significative dans ce domaine. ${langConfig.connecting[0]}, les experts s'accordent sur plusieurs points essentiels qui méritent notre attention.

### Points Clés à Retenir

1. **Évolution du marché** : Les tendances actuelles révèlent des changements structurels importants
2. **Impact technologique** : L'innovation continue de transformer les pratiques établies  
3. **Perspectives d'avenir** : Les projections à moyen terme sont encourageantes

${langConfig.connecting[1]}, il convient d'analyser les différents aspects de cette question avec la rigueur qu'elle mérite.

## Analyse Approfondie

L'examen détaillé des données disponibles nous permet d'identifier plusieurs tendances majeures. Ces éléments constituent autant d'opportunités pour les acteurs qui sauront s'adapter rapidement aux nouvelles exigences du marché.

Les retours d'expérience des premiers adopteurs confirment l'intérêt de cette approche, tout en soulignant la nécessité d'une préparation minutieuse.

## Recommandations Stratégiques

Pour tirer le meilleur parti de ces évolutions, il est recommandé de :

- Surveiller attentivement les indicateurs clés
- Investir dans la formation et l'accompagnement des équipes
- Développer une stratégie d'adaptation progressive
- Maintenir une veille concurrentielle active

## Conclusion

${langConfig.conclusion} cette analyse ouvre de nombreuses perspectives d'évolution. La réussite dépendra largement de la capacité à anticiper les changements et à s'adapter rapidement aux nouvelles conditions du marché.

Les opportunités sont réelles, mais elles nécessitent une approche méthodique et une vision long terme pour être pleinement exploitées.

---
*Article généré par Claude AI - ${new Date().toLocaleDateString('fr-FR')}${keywordText}*`;
}

async function generateWithChatGPT(prompt, template, langConfig, wordCount, seoKeywords) {
  const keywordText = seoKeywords.length > 0 ? ` Mots-clés SEO: ${seoKeywords.join(', ')}.` : '';
  
  return `# ${prompt.split('sur')[1] || prompt.split('article')[1] || 'Guide Complet'}

## Vue d'Ensemble

${langConfig.intro} un domaine en pleine expansion qui suscite un intérêt croissant. Cette analyse détaillée vous apportera toutes les clés pour comprendre les enjeux actuels et futurs.

## Contexte et Enjeux

Le paysage actuel se caractérise par une dynamique particulièrement intense. ${langConfig.connecting[2]}, les transformations en cours redéfinissent les règles du jeu établies.

### Facteurs Déterminants

- **Innovation continue** : Les avancées technologiques accélèrent les mutations
- **Demande croissante** : Les besoins évoluent vers plus de sophistication
- **Concurrence intense** : La différenciation devient un impératif stratégique

## Analyse des Tendances

${langConfig.connecting[3]}, plusieurs signaux indiquent une orientation claire vers l'optimisation des processus existants. Cette évolution s'accompagne d'une professionnalisation accrue du secteur.

Les retours du terrain confirment l'importance d'une approche structurée, combinant innovation et pragmatisme pour répondre aux attentes du marché.

## Stratégies Gagnantes

Pour réussir dans cet environnement, il convient de privilégier :

1. **L'agilité opérationnelle** pour s'adapter rapidement
2. **L'innovation centrée utilisateur** pour créer de la valeur
3. **La collaboration stratégique** pour démultiplier les impacts
4. **La mesure continue** pour optimiser les performances

## Perspectives d'Évolution

Les projections à moyen terme dessinent un horizon prometteur, sous réserve d'une adaptation continue aux évolutions technologiques et réglementaires.

${langConfig.connecting[4]}, la vigilance reste de mise face aux disruptions potentielles qui pourraient redéfinir les équilibres établis.

## Synthèse

${langConfig.conclusion} cette analyse révèle un potentiel significatif, à condition de maintenir une approche équilibrée entre innovation et stabilité opérationnelle.

L'anticipation et la préparation constituent les clés d'une intégration réussie dans cet écosystème en mutation.

---
*Contenu généré par ChatGPT - ${new Date().toLocaleDateString('fr-FR')}${keywordText}*`;
}

async function generateWithPerplexity(prompt, template, langConfig, wordCount, seoKeywords) {
  const keywordText = seoKeywords.length > 0 ? ` Optimisé pour: ${seoKeywords.join(', ')}.` : '';
  
  return `# ${prompt.split('sur')[1] || prompt.split('article')[1] || 'Recherche Approfondie'}

## Recherche et Sources

${langConfig.intro} un sujet d'actualité qui nécessite une approche basée sur les données les plus récentes. Cette recherche compile les informations les plus fiables et actualisées.

## État des Connaissances Actuelles

Selon les dernières études et publications spécialisées, plusieurs constats s'imposent. ${langConfig.connecting[0]}, les données récentes confirment les tendances observées par les analystes du secteur.

### Données Factuelles

- **Sources primaires** : Études académiques et rapports d'experts
- **Indicateurs quantitatifs** : Statistiques officielles et mesures objectives  
- **Retours terrain** : Témoignages et cas d'usage documentés
- **Projections validées** : Modèles prédictifs basés sur l'historique

## Synthèse des Recherches

L'analyse croisée des sources disponibles révèle une convergence remarquable sur les points essentiels. ${langConfig.connecting[1]}, cette cohérence renforce la fiabilité des conclusions présentées.

Les experts interrogés soulignent unanimement l'importance de maintenir une veille active sur les évolutions réglementaires et technologiques.

## Analyse Comparative

${langConfig.connecting[2]}, l'étude comparative avec d'autres secteurs similaires apporte un éclairage complémentaire précieux. Les parallèles observés permettent d'anticiper certaines évolutions probables.

### Benchmarks Sectoriels

1. **Meilleures pratiques identifiées** : Standards d'excellence observés
2. **Écarts de performance** : Opportunités d'amélioration detectées
3. **Facteurs de succès** : Éléments différenciants validés
4. **Risques potentiels** : Points de vigilance à surveiller

## Recommandations Fondées

Sur la base de cette recherche approfondie, plusieurs recommandations se dégagent :

- Privilégier les solutions éprouvées avec un historique solide
- Intégrer les retours d'expérience des précurseurs
- Maintenir une approche expérimentale contrôlée
- Documenter rigoureusement les résultats obtenus

## Conclusion Factuelle

${langConfig.conclusion} cette recherche fournit une base solide pour la prise de décision. Les données convergent vers des orientations claires, tout en identifiant les zones d'incertitude à surveiller.

La démarche basée sur les preuves reste la meilleure garantie de succès dans un environnement complexe et évolutif.

---
*Recherche effectuée avec Perplexity AI - ${new Date().toLocaleDateString('fr-FR')}${keywordText}*`;
}

async function generateDefaultContent(prompt, template, langConfig, wordCount, seoKeywords) {
  const keywordText = seoKeywords.length > 0 ? ` SEO: ${seoKeywords.join(', ')}.` : '';
  
  return `# ${prompt}

## Introduction

${langConfig.intro} ce sujet important qui mérite toute notre attention. Cette analyse vous apportera une compréhension claire et des insights pratiques.

## Développement

Le contexte actuel présente de nombreuses opportunités d'évolution. ${langConfig.connecting[0]}, il est essentiel de bien comprendre les enjeux pour prendre les bonnes décisions.

### Points Essentiels

- Analyse des tendances actuelles
- Identification des opportunités
- Évaluation des risques potentiels
- Recommandations pratiques

## Conclusion

${langConfig.conclusion} cette analyse offre une perspective équilibrée sur le sujet. Les éléments présentés constituent une base solide pour l'action.

---
*Contenu généré automatiquement - ${new Date().toLocaleDateString('fr-FR')}${keywordText}*`;
}

// Fonction de génération d'article (avec SQLite)
async function generateArticle(data) {
  const article = {
    id: uuidv4(),
    title: data.title || 'Article généré automatiquement',
    content: data.content || generateSampleContent(data),
    excerpt: data.excerpt || '',
    keywords: data.keywords || [],
    projectId: data.projectId || null,
    templateId: data.templateId || null,
    status: 'draft',
    seoData: {
      metaTitle: data.seoData?.metaTitle || data.title,
      metaDescription: data.seoData?.metaDescription || '',
      slug: data.seoData?.slug || data.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      focusKeyword: data.seoData?.focusKeyword || ''
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: data.source || 'manual',
    wordCount: data.content ? data.content.split(' ').length : 0,
    authorId: data.authorId || null
  };
  
  const createdArticle = await ArticleModel.create(article);
  console.log(`✅ Article créé: ${article.title} (ID: ${article.id})`);
  
  return createdArticle;
}

function generateSampleContent(data) {
  return `# ${data.title || 'Article SEO'}

## Introduction

Cet article a été généré automatiquement via l'API ContentGen Pro.

## Contenu principal

${data.prompt || 'Contenu généré automatiquement basé sur les paramètres fournis.'}

## Conclusion

Article généré le ${new Date().toLocaleDateString('fr-FR')} via ${data.source || 'API'}.

---
*Généré par ContentGen Pro*
`;
}

// Initialisation avec des données de demo
async function initializeDemoData() {
  // Création des utilisateurs demo avec mots de passe hachés
  const demoUsers = [
    {
      id: 'super-admin-1',
      username: 'admin',
      email: 'admin@contentgen-pro.com',
      name: 'Super Administrateur',
      role: 'super_admin',
      passwordHash: await bcrypt.hash('admin123', 10),
      avatar: null,
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      lastLogin: new Date().toISOString()
    },
    {
      id: 'manager-1',
      username: 'manager',
      email: 'manager@contentgen-pro.com',
      name: 'Gestionnaire Contenu',
      role: 'manager',
      passwordHash: await bcrypt.hash('manager123', 10),
      avatar: null,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      lastLogin: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'redacteur-1',
      username: 'redacteur',
      email: 'redacteur@contentgen-pro.com',
      name: 'Rédacteur Principal',
      role: 'redacteur',
      passwordHash: await bcrypt.hash('redacteur123', 10),
      avatar: null,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Ajouter les utilisateurs demo dans la base SQLite
  for (const userData of demoUsers) {
    try {
      await UserModel.create(userData);
    } catch (error) {
      // Ignorer si l'utilisateur existe déjà
      if (!error.message.includes('UNIQUE constraint failed')) {
        console.error('Erreur création utilisateur demo:', error);
      }
    }
  }
  console.log(`👤 ${demoUsers.length} utilisateurs demo créés avec authentication`);
}

async function initializeDemoDataSync() {
  // Scénarios de démo correspondant aux besoins du client
  const CRYPTO_SOURCES = [
    'Bitcoin', 'Newsbit', 'RSS-AMB Crypto', 'BeInCrypto', 'Blockworks',
    'CoinGape', 'Coinpedia', 'Cointelegraph', 'CryptoNews', 'News Bitcoin', 'TheNewsCrypto'
  ];

  // Scénarios de scraping crypto
  CRYPTO_SOURCES.forEach((source, index) => {
    scenarios.push({
      id: `scraping-${index}`,
      name: `Scrapping ${source}`,
      type: 'scraping',
      category: 'Crypto News',
      status: index % 4 === 0 ? 'error' : index % 3 === 0 ? 'paused' : 'active',
      source: source,
      target: 'ContentGen Pro',
      language: 'FR',
      lastExecution: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      nextExecution: new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      executionCount: Math.floor(Math.random() * 1000) + 100,
      successRate: Math.floor(Math.random() * 20) + 80,
      avgExecutionTime: `${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 9)}s`,
      description: `Collecte automatique d'articles depuis ${source} avec traitement SEO`,
      config: {
        rssUrl: `https://feeds.${source.toLowerCase().replace(/[^a-z]/g, '')}.com/rss`,
        updateFrequency: '1h',
        autoPublish: true
      },
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  });

  // Scénarios de rédaction Evergreen
  scenarios.push({
    id: 'redaction-telegram-url',
    name: 'Rédaction via URL Telegram',
    type: 'redaction',
    category: 'Evergreen FR',
    status: 'active',
    source: 'Telegram URL',
    target: 'ContentGen Pro',
    language: 'FR',
    lastExecution: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    nextExecution: 'Manuel',
    executionCount: 45,
    successRate: 96,
    avgExecutionTime: '12.3s',
    description: 'Rédaction d\'articles evergreen à partir d\'URLs partagées sur Telegram',
    config: {
      telegramBotToken: 'bot_token_here',
      channelId: '@evergreen_content',
      autoProcess: true
    },
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  });

  scenarios.push({
    id: 'redaction-telegram-doc',
    name: 'Rédaction via Document Telegram',
    type: 'redaction',
    category: 'Evergreen FR',
    status: 'active',
    source: 'Telegram Doc',
    target: 'ContentGen Pro',
    language: 'FR',
    lastExecution: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    nextExecution: 'Manuel',
    executionCount: 23,
    successRate: 94,
    avgExecutionTime: '8.7s',
    description: 'Rédaction d\'articles à partir de documents Telegram',
    config: {
      telegramBotToken: 'bot_token_here',
      allowedFileTypes: ['pdf', 'docx', 'txt'],
      maxFileSize: '10MB'
    },
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  });

  // Scénario IA Generator
  scenarios.push({
    id: 'ia-news-generator',
    name: 'Générateur News IA',
    type: 'ia-generator',
    category: 'Auto Generation',
    status: 'active',
    source: 'IA Engine',
    target: 'ContentGen Pro',
    language: 'FR',
    lastExecution: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    nextExecution: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    executionCount: 156,
    successRate: 91,
    avgExecutionTime: '15.2s',
    description: 'Génération automatique d\'articles d\'actualité par IA',
    config: {
      aiModel: 'gpt-4',
      topics: ['Technologie', 'Innovation', 'Crypto', 'IA'],
      frequency: '4h',
      wordCount: '800-1200'
    },
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  });

  // Scénarios de traduction
  const languages = [
    { code: 'DE', name: 'Allemagne', status: 'active' },
    { code: 'EN', name: 'Anglais', status: 'active' },
    { code: 'ES', name: 'Espagnol', status: 'paused' },
    { code: 'PT', name: 'Portugais', status: 'error' }
  ];

  languages.forEach((lang, index) => {
    scenarios.push({
      id: `translation-${lang.code.toLowerCase()}`,
      name: `Traduction ${lang.code} → WordPress`,
      type: 'translation',
      category: 'WordPress Integration',
      status: lang.status,
      source: 'Evergreen FR',
      target: `WordPress ${lang.code}`,
      language: lang.code,
      lastExecution: new Date(Date.now() - (index + 1) * 60 * 60 * 1000).toISOString(),
      nextExecution: lang.status === 'active' ? new Date(Date.now() + (index + 2) * 60 * 60 * 1000).toISOString() : lang.status === 'paused' ? 'Paused' : 'Error',
      executionCount: Math.floor(Math.random() * 100) + 20,
      successRate: lang.status === 'active' ? Math.floor(Math.random() * 10) + 90 : Math.floor(Math.random() * 20) + 70,
      avgExecutionTime: `${Math.floor(Math.random() * 5) + 4}.${Math.floor(Math.random() * 9)}s`,
      description: `Traduction automatique vers WordPress ${lang.name}`,
      config: {
        wordpressUrl: `https://site-${lang.code.toLowerCase()}.com`,
        translationEngine: 'deepl',
        autoPublish: true,
        seoOptimization: true
      },
      createdAt: new Date(Date.now() - (index + 5) * 24 * 60 * 60 * 1000).toISOString()
    });
  });

  console.log(`🎯 ${scenarios.length} scénarios de démo initialisés`);

  // AI Providers de démo
  aiProviders.push(
    {
      id: 'claude',
      name: 'Claude (Anthropic)',
      status: 'disconnected',
      description: 'Modèle avancé pour génération de contenu long-forme et analyse approfondie',
      apiKey: null,
      lastUsed: null,
      capabilities: ['text-generation', 'analysis', 'translation', 'summarization'],
      maxTokens: 100000,
      pricing: 'premium'
    },
    {
      id: 'chatgpt',
      name: 'ChatGPT (OpenAI)',
      status: 'disconnected',
      description: 'Générateur de contenu polyvalent et créatif avec excellent style rédactionnel',
      apiKey: null,
      lastUsed: null,
      capabilities: ['text-generation', 'creative-writing', 'code-generation', 'translation'],
      maxTokens: 128000,
      pricing: 'standard'
    },
    {
      id: 'perplexity',
      name: 'Perplexity AI',
      status: 'disconnected',
      description: 'IA spécialisée dans la recherche, l\'actualité et les contenus factuels',
      apiKey: null,
      lastUsed: null,
      capabilities: ['research', 'fact-checking', 'news-analysis', 'citations'],
      maxTokens: 8000,
      pricing: 'standard'
    }
  );

  console.log(`🤖 ${aiProviders.length} providers IA initialisés`);

  // Quick Prompts par défaut
  const defaultPrompts = [
    {
      id: uuidv4(),
      prompt: 'Rédige un article d\'actualité crypto complet avec analyse technique et fondamentale, optimisé SEO',
      category: 'crypto',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      usageCount: 15
    },
    {
      id: uuidv4(),
      prompt: 'Crée un guide tutoriel SEO détaillé pour débutants avec exemples pratiques et outils recommandés',
      category: 'seo',
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      usageCount: 12
    },
    {
      id: uuidv4(),
      prompt: 'Écris une review produit tech approfondie et objective avec avantages, inconvénients et verdict final',
      category: 'tech',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      usageCount: 8
    },
    {
      id: uuidv4(),
      prompt: 'Analyse les dernières tendances du marché avec données chiffrées et perspectives d\'évolution',
      category: 'analysis',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      usageCount: 6
    },
    {
      id: uuidv4(),
      prompt: 'Rédige un article evergreen sur les meilleures pratiques en marketing digital avec stratégies concrètes',
      category: 'marketing',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      usageCount: 4
    },
    {
      id: uuidv4(),
      prompt: 'Crée un comparatif détaillé entre plusieurs solutions avec tableau comparatif et recommandations',
      category: 'comparison',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      usageCount: 3
    }
  ];

  quickPrompts.push(...defaultPrompts);
  console.log(`📝 ${quickPrompts.length} prompts rapides initialisés`);

  // Les utilisateurs demo sont maintenant créés dans initializeDemoData() avec hachage

  // Projets de démo
  projects.push({
    id: 'demo-project-1',
    name: 'TechNews.fr',
    domain: 'technews.fr',
    description: 'Site d\'actualités technologiques',
    settings: {
      language: 'fr',
      timezone: 'Europe/Paris',
      wordpressUrl: 'https://technews.fr',
      apiKey: '***'
    },
    status: 'active',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  });

  projects.push({
    id: 'demo-project-2',
    name: 'StartupMag',
    domain: 'startupmag.com',
    description: 'Magazine sur l\'écosystème startup',
    settings: {
      language: 'fr',
      timezone: 'Europe/Paris'
    },
    status: 'active',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Templates de démo
  templates.push({
    id: 'template-tech-news',
    name: 'Article Tech News',
    description: 'Template pour articles d\'actualités technologiques',
    category: 'news',
    content: `# {title}

## Introduction
{introduction}

## Développement
{development}

## Impact et enjeux
{impact}

## Conclusion
{conclusion}

**Mots-clés:** {keywords}
**Source:** {source}`,
    variables: ['title', 'introduction', 'development', 'impact', 'conclusion', 'keywords', 'source'],
    seoSettings: {
      metaTitlePattern: '{title} | TechNews.fr',
      metaDescriptionPattern: '{excerpt}',
      slugPattern: '{title-slug}'
    },
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  });
}

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', async () => {
  try {
    // Initialiser la base de données SQLite
    await initializeDatabase();
    
    // Programmer le nettoyage automatique (tous les jours à 3h)
    cron.schedule('0 3 * * *', () => {
      console.log('🧹 Démarrage nettoyage automatique...');
      cleanupOldData();
    });
    
    console.log(`🚀 Serveur ContentGen Pro démarré sur le port ${PORT}`);
    console.log(`\n📡 WEBHOOKS DISPONIBLES:`);
    console.log(`   🔗 Make.com général: http://localhost:${PORT}/api/webhooks/make`);
    console.log(`   🔗 N8n général: http://localhost:${PORT}/api/webhooks/n8n`);
    console.log(`   \n📰 WEBHOOKS CRYPTO RSS (11 sources):`);
    const cryptoSources = ['bitcoin', 'newsbit', 'rss-amb-crypto', 'beincrypto', 'blockworks', 'coingape', 'coinpedia', 'cointelegraph', 'cryptonews', 'news-bitcoin', 'thenewscrypto'];
    cryptoSources.forEach(source => {
      console.log(`   📈 ${source}: http://localhost:${PORT}/api/webhooks/crypto/${source}`);
    });
    console.log(`   \n📱 WEBHOOKS SPÉCIALISÉS:`);
    console.log(`   💬 Telegram: http://localhost:${PORT}/api/webhooks/telegram`);
    console.log(`   🤖 IA Trigger: http://localhost:${PORT}/api/webhooks/ia-trigger`);
    console.log(`   \n🔧 APIS PRINCIPALES:`);
    console.log(`   📄 Articles: http://localhost:${PORT}/api/articles`);
    console.log(`   🎯 Scénarios: http://localhost:${PORT}/api/scenarios`);
    console.log(`   🤖 IA Providers: http://localhost:${PORT}/api/ai-providers`);
    console.log(`   ✨ Génération IA: http://localhost:${PORT}/api/content-generation/generate`);
    console.log(`   ⚙️ Paramètres: http://localhost:${PORT}/api/settings`);
    console.log(`   👥 Utilisateurs: http://localhost:${PORT}/api/users`);
    console.log(`   📊 Templates: http://localhost:${PORT}/api/templates`);
    console.log(`   🏗️ Projets: http://localhost:${PORT}/api/projects`);
    console.log(`   📜 Logs webhooks: http://localhost:${PORT}/api/webhooks/logs`);
    console.log(`   \n🔒 Authentication: http://localhost:${PORT}/api/auth/login`);
    console.log(`   \n🏥 Health check: http://localhost:${PORT}/api/health`);
    console.log(`   \n✅ Prêt pour connexions N8n et Make.com !`);
    
    // Charger les données de démonstration
    await initializeDemoData();
    // await initializeDemoDataSync(); // Temporairement désactivé
    
    console.log(`\n🗄️ Base de données SQLite initialisée avec succès !`);
    console.log(`🧹 Nettoyage automatique programmé tous les jours à 3h`);
    
  } catch (error) {
    console.error('❌ Erreur lors du démarrage:', error);
    process.exit(1);
  }
});

// export default app; // Pas besoin d'export pour un serveur standalone