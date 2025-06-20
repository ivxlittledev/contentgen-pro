import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration de la base de données
const DB_PATH = path.join(__dirname, 'contentgen.db');

let db = null;

// Initialisation de la base de données
export async function initializeDatabase() {
  try {
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });

    console.log('🗄️ Connexion SQLite établie:', DB_PATH);

    // Création des tables
    await createTables();
    await createIndexes();
    
    console.log('✅ Base de données SQLite initialisée');
    return db;
  } catch (error) {
    console.error('❌ Erreur initialisation base:', error);
    throw error;
  }
}

// Création des tables
async function createTables() {
  // Table utilisateurs
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('super_admin', 'manager', 'redacteur')),
      password_hash TEXT NOT NULL,
      avatar TEXT,
      created_at TEXT NOT NULL,
      last_login TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
    )
  `);

  // Table articles
  await db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      excerpt TEXT,
      keywords TEXT, -- JSON array
      project_id TEXT,
      template_id TEXT,
      status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
      seo_data TEXT, -- JSON object
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      source TEXT,
      scenario_id TEXT,
      language TEXT DEFAULT 'FR',
      category TEXT,
      word_count INTEGER,
      author_id TEXT,
      FOREIGN KEY (author_id) REFERENCES users(id),
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (template_id) REFERENCES templates(id)
    )
  `);

  // Table projets
  await db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      domain TEXT,
      description TEXT,
      settings TEXT, -- JSON object
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Table templates
  await db.exec(`
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      content TEXT NOT NULL,
      variables TEXT, -- JSON array
      seo_settings TEXT, -- JSON object
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Table scénarios
  await db.exec(`
    CREATE TABLE IF NOT EXISTS scenarios (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('scraping', 'redaction', 'ia-generator', 'translation')),
      category TEXT,
      status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'paused', 'error', 'pending')),
      source TEXT NOT NULL,
      target TEXT,
      language TEXT DEFAULT 'FR',
      last_execution TEXT,
      next_execution TEXT,
      execution_count INTEGER DEFAULT 0,
      success_rate REAL DEFAULT 100.0,
      avg_execution_time TEXT,
      description TEXT,
      config TEXT, -- JSON object
      created_at TEXT NOT NULL,
      updated_at TEXT
    )
  `);

  // Table AI providers
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ai_providers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
      description TEXT,
      api_key TEXT,
      last_used TEXT,
      capabilities TEXT, -- JSON array
      max_tokens INTEGER,
      pricing TEXT
    )
  `);

  // Table historique de génération
  await db.exec(`
    CREATE TABLE IF NOT EXISTS generation_history (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      prompt TEXT NOT NULL,
      content TEXT,
      timestamp TEXT NOT NULL,
      word_count INTEGER,
      template TEXT,
      status TEXT CHECK (status IN ('success', 'error')),
      settings TEXT, -- JSON object
      user_id TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Table quick prompts
  await db.exec(`
    CREATE TABLE IF NOT EXISTS quick_prompts (
      id TEXT PRIMARY KEY,
      prompt TEXT NOT NULL,
      category TEXT DEFAULT 'custom',
      created_at TEXT NOT NULL,
      updated_at TEXT,
      usage_count INTEGER DEFAULT 0,
      user_id TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Table webhook logs
  await db.exec(`
    CREATE TABLE IF NOT EXISTS webhook_logs (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      data TEXT NOT NULL, -- JSON object
      processed BOOLEAN DEFAULT FALSE,
      type TEXT,
      result TEXT, -- JSON object pour le résultat du traitement
      processing_time INTEGER -- en millisecondes
    )
  `);

  // Table paramètres
  await db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL, -- JSON stringifié
      updated_at TEXT NOT NULL
    )
  `);

  console.log('📋 Tables créées avec succès');
}

// Création des index pour les performances
async function createIndexes() {
  // Index pour les articles
  await db.exec('CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_articles_project ON articles(project_id)');
  
  // Index pour l'historique de génération
  await db.exec('CREATE INDEX IF NOT EXISTS idx_generation_timestamp ON generation_history(timestamp DESC)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_generation_provider ON generation_history(provider)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_generation_user ON generation_history(user_id)');
  
  // Index pour les webhook logs
  await db.exec('CREATE INDEX IF NOT EXISTS idx_webhook_timestamp ON webhook_logs(timestamp DESC)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_webhook_source ON webhook_logs(source)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_webhook_processed ON webhook_logs(processed)');
  
  // Index pour les scénarios
  await db.exec('CREATE INDEX IF NOT EXISTS idx_scenarios_status ON scenarios(status)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_scenarios_type ON scenarios(type)');
  
  console.log('📊 Index créés pour optimiser les performances');
}

// Fonction de nettoyage automatique (articles > 30 jours)
export async function cleanupOldData() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // Supprimer les articles anciens (sauf ceux marqués comme importants)
    const result = await db.run(`
      DELETE FROM articles 
      WHERE created_at < ? 
      AND status != 'published'
      AND category NOT LIKE '%important%'
    `, [thirtyDaysAgo]);
    
    // Supprimer l'historique de génération ancien
    const historyResult = await db.run(`
      DELETE FROM generation_history 
      WHERE timestamp < ?
    `, [thirtyDaysAgo]);
    
    // Supprimer les logs de webhooks anciens
    const logsResult = await db.run(`
      DELETE FROM webhook_logs 
      WHERE timestamp < ?
    `, [thirtyDaysAgo]);
    
    console.log(`🧹 Nettoyage automatique: ${result.changes} articles, ${historyResult.changes} historiques, ${logsResult.changes} logs supprimés`);
    
    // Optimiser la base après nettoyage
    await db.exec('VACUUM');
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  }
}

// Fonctions utilitaires
export function getDatabase() {
  if (!db) {
    throw new Error('Base de données non initialisée. Appelez initializeDatabase() d\'abord.');
  }
  return db;
}

export async function closeDatabase() {
  if (db) {
    await db.close();
    console.log('🔒 Base de données fermée');
  }
}

// Helper pour gérer les transactions
export async function withTransaction(callback) {
  await db.exec('BEGIN TRANSACTION');
  try {
    const result = await callback(db);
    await db.exec('COMMIT');
    return result;
  } catch (error) {
    await db.exec('ROLLBACK');
    throw error;
  }
}

export default {
  initializeDatabase,
  getDatabase,
  closeDatabase,
  cleanupOldData,
  withTransaction
};