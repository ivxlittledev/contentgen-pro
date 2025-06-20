import { getDatabase, withTransaction } from './database.js';

// ===== MODÈLE USERS =====
export const UserModel = {
  async create(userData) {
    const db = getDatabase();
    const user = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      password_hash: userData.passwordHash,
      avatar: userData.avatar || null,
      created_at: userData.createdAt,
      last_login: userData.lastLogin || null,
      status: userData.status || 'active'
    };

    const result = await db.run(`
      INSERT INTO users (id, username, email, name, role, password_hash, avatar, created_at, last_login, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [user.id, user.username, user.email, user.name, user.role, user.password_hash, user.avatar, user.created_at, user.last_login, user.status]);

    return { ...user, passwordHash: user.password_hash };
  },

  async findByUsername(username) {
    const db = getDatabase();
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (user) {
      return { ...user, passwordHash: user.password_hash };
    }
    return null;
  },

  async findById(id) {
    const db = getDatabase();
    const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (user) {
      return { ...user, passwordHash: user.password_hash };
    }
    return null;
  },

  async getAll() {
    const db = getDatabase();
    const users = await db.all('SELECT id, username, email, name, role, avatar, created_at, last_login, status FROM users ORDER BY last_login DESC, created_at DESC');
    return users.map(user => ({
      ...user,
      createdAt: user.created_at,
      lastLogin: user.last_login
    }));
  },

  async updateLastLogin(id, timestamp) {
    const db = getDatabase();
    await db.run('UPDATE users SET last_login = ? WHERE id = ?', [timestamp, id]);
  }
};

// ===== MODÈLE ARTICLES =====
export const ArticleModel = {
  async create(articleData) {
    const db = getDatabase();
    const article = {
      id: articleData.id,
      title: articleData.title,
      content: articleData.content,
      excerpt: articleData.excerpt || null,
      keywords: JSON.stringify(articleData.keywords || []),
      project_id: articleData.projectId || null,
      template_id: articleData.templateId || null,
      status: articleData.status || 'draft',
      seo_data: JSON.stringify(articleData.seoData || {}),
      created_at: articleData.createdAt,
      updated_at: articleData.updatedAt,
      source: articleData.source || null,
      scenario_id: articleData.scenarioId || null,
      language: articleData.language || 'FR',
      category: articleData.category || null,
      word_count: articleData.wordCount || null,
      author_id: articleData.authorId || null
    };

    await db.run(`
      INSERT INTO articles (id, title, content, excerpt, keywords, project_id, template_id, status, seo_data, created_at, updated_at, source, scenario_id, language, category, word_count, author_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [article.id, article.title, article.content, article.excerpt, article.keywords, article.project_id, article.template_id, article.status, article.seo_data, article.created_at, article.updated_at, article.source, article.scenario_id, article.language, article.category, article.word_count, article.author_id]);

    return this.convertFromDb(article);
  },

  async getAll(filters = {}) {
    const db = getDatabase();
    let query = 'SELECT * FROM articles';
    let params = [];
    let conditions = [];

    if (filters.project) {
      conditions.push('project_id = ?');
      params.push(filters.project);
    }

    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    if (filters.author) {
      conditions.push('author_id = ?');
      params.push(filters.author);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    const articles = await db.all(query, params);
    return articles.map(this.convertFromDb);
  },

  async findById(id) {
    const db = getDatabase();
    const article = await db.get('SELECT * FROM articles WHERE id = ?', [id]);
    return article ? this.convertFromDb(article) : null;
  },

  async update(id, updates) {
    const db = getDatabase();
    const setClause = [];
    const params = [];

    Object.keys(updates).forEach(key => {
      if (key === 'keywords' || key === 'seoData') {
        setClause.push(`${key === 'seoData' ? 'seo_data' : key} = ?`);
        params.push(JSON.stringify(updates[key]));
      } else if (key === 'projectId') {
        setClause.push('project_id = ?');
        params.push(updates[key]);
      } else if (key === 'templateId') {
        setClause.push('template_id = ?');
        params.push(updates[key]);
      } else if (key === 'scenarioId') {
        setClause.push('scenario_id = ?');
        params.push(updates[key]);
      } else if (key === 'authorId') {
        setClause.push('author_id = ?');
        params.push(updates[key]);
      } else if (key === 'wordCount') {
        setClause.push('word_count = ?');
        params.push(updates[key]);
      } else if (key === 'updatedAt') {
        setClause.push('updated_at = ?');
        params.push(updates[key]);
      } else {
        setClause.push(`${key} = ?`);
        params.push(updates[key]);
      }
    });

    params.push(id);

    await db.run(`UPDATE articles SET ${setClause.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  },

  convertFromDb(dbArticle) {
    return {
      id: dbArticle.id,
      title: dbArticle.title,
      content: dbArticle.content,
      excerpt: dbArticle.excerpt,
      keywords: JSON.parse(dbArticle.keywords || '[]'),
      projectId: dbArticle.project_id,
      templateId: dbArticle.template_id,
      status: dbArticle.status,
      seoData: JSON.parse(dbArticle.seo_data || '{}'),
      createdAt: dbArticle.created_at,
      updatedAt: dbArticle.updated_at,
      source: dbArticle.source,
      scenarioId: dbArticle.scenario_id,
      language: dbArticle.language,
      category: dbArticle.category,
      wordCount: dbArticle.word_count,
      authorId: dbArticle.author_id
    };
  }
};

// ===== MODÈLE SCENARIOS =====
export const ScenarioModel = {
  async create(scenarioData) {
    const db = getDatabase();
    const scenario = {
      id: scenarioData.id,
      name: scenarioData.name,
      type: scenarioData.type,
      category: scenarioData.category || null,
      status: scenarioData.status || 'pending',
      source: scenarioData.source,
      target: scenarioData.target || null,
      language: scenarioData.language || 'FR',
      last_execution: scenarioData.lastExecution || null,
      next_execution: scenarioData.nextExecution || null,
      execution_count: scenarioData.executionCount || 0,
      success_rate: scenarioData.successRate || 100.0,
      avg_execution_time: scenarioData.avgExecutionTime || null,
      description: scenarioData.description || null,
      config: JSON.stringify(scenarioData.config || {}),
      created_at: scenarioData.createdAt,
      updated_at: scenarioData.updatedAt || null
    };

    await db.run(`
      INSERT INTO scenarios (id, name, type, category, status, source, target, language, last_execution, next_execution, execution_count, success_rate, avg_execution_time, description, config, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [scenario.id, scenario.name, scenario.type, scenario.category, scenario.status, scenario.source, scenario.target, scenario.language, scenario.last_execution, scenario.next_execution, scenario.execution_count, scenario.success_rate, scenario.avg_execution_time, scenario.description, scenario.config, scenario.created_at, scenario.updated_at]);

    return this.convertFromDb(scenario);
  },

  async getAll(filters = {}) {
    const db = getDatabase();
    let query = 'SELECT * FROM scenarios';
    let params = [];
    let conditions = [];

    if (filters.type && filters.type !== 'all') {
      conditions.push('type = ?');
      params.push(filters.type);
    }

    if (filters.status && filters.status !== 'all') {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    if (filters.search) {
      conditions.push('(name LIKE ? OR source LIKE ? OR category LIKE ?)');
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY last_execution DESC';

    const scenarios = await db.all(query, params);
    return scenarios.map(this.convertFromDb);
  },

  async findById(id) {
    const db = getDatabase();
    const scenario = await db.get('SELECT * FROM scenarios WHERE id = ?', [id]);
    return scenario ? this.convertFromDb(scenario) : null;
  },

  async update(id, updates) {
    const db = getDatabase();
    const setClause = [];
    const params = [];

    Object.keys(updates).forEach(key => {
      if (key === 'config') {
        setClause.push('config = ?');
        params.push(JSON.stringify(updates[key]));
      } else if (key === 'lastExecution') {
        setClause.push('last_execution = ?');
        params.push(updates[key]);
      } else if (key === 'nextExecution') {
        setClause.push('next_execution = ?');
        params.push(updates[key]);
      } else if (key === 'executionCount') {
        setClause.push('execution_count = ?');
        params.push(updates[key]);
      } else if (key === 'successRate') {
        setClause.push('success_rate = ?');
        params.push(updates[key]);
      } else if (key === 'avgExecutionTime') {
        setClause.push('avg_execution_time = ?');
        params.push(updates[key]);
      } else if (key === 'updatedAt') {
        setClause.push('updated_at = ?');
        params.push(updates[key]);
      } else {
        setClause.push(`${key} = ?`);
        params.push(updates[key]);
      }
    });

    params.push(id);

    await db.run(`UPDATE scenarios SET ${setClause.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  },

  async delete(id) {
    const db = getDatabase();
    const result = await db.run('DELETE FROM scenarios WHERE id = ?', [id]);
    return result.changes > 0;
  },

  convertFromDb(dbScenario) {
    return {
      id: dbScenario.id,
      name: dbScenario.name,
      type: dbScenario.type,
      category: dbScenario.category,
      status: dbScenario.status,
      source: dbScenario.source,
      target: dbScenario.target,
      language: dbScenario.language,
      lastExecution: dbScenario.last_execution,
      nextExecution: dbScenario.next_execution,
      executionCount: dbScenario.execution_count,
      successRate: dbScenario.success_rate,
      avgExecutionTime: dbScenario.avg_execution_time,
      description: dbScenario.description,
      config: JSON.parse(dbScenario.config || '{}'),
      createdAt: dbScenario.created_at,
      updatedAt: dbScenario.updated_at
    };
  }
};

// ===== MODÈLE GENERATION HISTORY =====
export const GenerationHistoryModel = {
  async create(historyData) {
    const db = getDatabase();
    const history = {
      id: historyData.id,
      provider: historyData.provider,
      prompt: historyData.prompt,
      content: historyData.content || null,
      timestamp: historyData.timestamp,
      word_count: historyData.wordCount || 0,
      template: historyData.template || null,
      status: historyData.status || 'success',
      settings: JSON.stringify(historyData.settings || {}),
      user_id: historyData.userId || null
    };

    await db.run(`
      INSERT INTO generation_history (id, provider, prompt, content, timestamp, word_count, template, status, settings, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [history.id, history.provider, history.prompt, history.content, history.timestamp, history.word_count, history.template, history.status, history.settings, history.user_id]);

    return this.convertFromDb(history);
  },

  async getAll(filters = {}) {
    const db = getDatabase();
    let query = 'SELECT * FROM generation_history';
    let params = [];
    let conditions = [];

    if (filters.provider) {
      conditions.push('provider LIKE ?');
      params.push(`%${filters.provider}%`);
    }

    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    if (filters.userId) {
      conditions.push('user_id = ?');
      params.push(filters.userId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY timestamp DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    const history = await db.all(query, params);
    return history.map(this.convertFromDb);
  },

  async delete(id) {
    const db = getDatabase();
    const result = await db.run('DELETE FROM generation_history WHERE id = ?', [id]);
    return result.changes > 0;
  },

  async deleteAll() {
    const db = getDatabase();
    const result = await db.run('DELETE FROM generation_history');
    return result.changes;
  },

  convertFromDb(dbHistory) {
    return {
      id: dbHistory.id,
      provider: dbHistory.provider,
      prompt: dbHistory.prompt,
      content: dbHistory.content,
      timestamp: dbHistory.timestamp,
      wordCount: dbHistory.word_count,
      template: dbHistory.template,
      status: dbHistory.status,
      settings: JSON.parse(dbHistory.settings || '{}'),
      userId: dbHistory.user_id
    };
  }
};

// ===== MODÈLE WEBHOOK LOGS =====
export const WebhookLogModel = {
  async create(logData) {
    const db = getDatabase();
    const log = {
      id: logData.id,
      source: logData.source,
      timestamp: logData.timestamp,
      data: JSON.stringify(logData.data),
      processed: logData.processed || false,
      type: logData.type || null,
      result: JSON.stringify(logData.result || {}),
      processing_time: logData.processingTime || null
    };

    await db.run(`
      INSERT INTO webhook_logs (id, source, timestamp, data, processed, type, result, processing_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [log.id, log.source, log.timestamp, log.data, log.processed, log.type, log.result, log.processing_time]);

    return this.convertFromDb(log);
  },

  async getAll(limit = 100) {
    const db = getDatabase();
    const logs = await db.all('SELECT * FROM webhook_logs ORDER BY timestamp DESC LIMIT ?', [limit]);
    return logs.map(this.convertFromDb);
  },

  convertFromDb(dbLog) {
    return {
      id: dbLog.id,
      source: dbLog.source,
      timestamp: dbLog.timestamp,
      data: JSON.parse(dbLog.data),
      processed: Boolean(dbLog.processed),
      type: dbLog.type,
      result: JSON.parse(dbLog.result || '{}'),
      processingTime: dbLog.processing_time
    };
  }
};

export default {
  UserModel,
  ArticleModel,
  ScenarioModel,
  GenerationHistoryModel,
  WebhookLogModel
};