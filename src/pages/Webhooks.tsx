import React, { useState, useEffect } from 'react';
import { 
  Webhook, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink,
  Copy,
  RefreshCw,
  AlertTriangle,
  Settings,
  Zap
} from 'lucide-react';

interface WebhookLog {
  id: string;
  source: 'make.com' | 'n8n.com';
  timestamp: string;
  data: any;
  processed: boolean;
  success?: boolean;
  error?: string;
}

export function Webhooks() {
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchWebhookLogs();
    
    if (autoRefresh) {
      const interval = setInterval(fetchWebhookLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchWebhookLogs = async () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    try {
      const response = await fetch(`${API_URL}/api/webhooks/logs`);
      const data = await response.json();
      setWebhookLogs(data);
    } catch (error) {
      console.error('Erreur lors du chargement des logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'make.com':
        return 'bg-purple-100 text-purple-800';
      case 'n8n.com':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const copyWebhookUrl = (source: string) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const url = `${API_URL}/api/webhooks/${source === 'make.com' ? 'make' : 'n8n'}`;
    navigator.clipboard.writeText(url);
  };

  const testWebhook = async (source: string) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    try {
      const endpoint = source === 'make.com' ? 'make' : 'n8n';
      const response = await fetch(`${API_URL}/api/webhooks/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test',
          title: 'Test d\'article automatique',
          content: 'Ceci est un test de génération d\'article via webhook.',
          source: source,
          timestamp: new Date().toISOString()
        }),
      });

      if (response.ok) {
        fetchWebhookLogs();
      }
    } catch (error) {
      console.error('Erreur lors du test:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Webhooks & Monitoring</h1>
          <p className="text-gray-600 mt-1">Surveillez les webhooks Make.com et N8n en temps réel</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
              autoRefresh 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            <span>{autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}</span>
          </button>
          
          <button 
            onClick={fetchWebhookLogs}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Webhook URLs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Make.com Webhook</h3>
                <p className="text-sm text-gray-600">Endpoint pour les automations Make</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded-lg">
              <code className="text-sm text-gray-800">
                http://localhost:3001/api/webhooks/make
              </code>
            </div>
            
            <div className="flex space-x-2">
              <button 
                onClick={() => copyWebhookUrl('make.com')}
                className="flex items-center space-x-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>Copier</span>
              </button>
              
              <button 
                onClick={() => testWebhook('make.com')}
                className="flex items-center space-x-1 px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                <Webhook className="w-4 h-4" />
                <span>Tester</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">N8n Webhook</h3>
                <p className="text-sm text-gray-600">Endpoint pour les workflows N8n</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded-lg">
              <code className="text-sm text-gray-800">
                http://localhost:3001/api/webhooks/n8n
              </code>
            </div>
            
            <div className="flex space-x-2">
              <button 
                onClick={() => copyWebhookUrl('n8n.com')}
                className="flex items-center space-x-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>Copier</span>
              </button>
              
              <button 
                onClick={() => testWebhook('n8n.com')}
                className="flex items-center space-x-1 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                <Webhook className="w-4 h-4" />
                <span>Tester</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Webhook Logs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Logs des Webhooks</h2>
          <p className="text-sm text-gray-600 mt-1">Historique des appels webhooks reçus</p>
        </div>

        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : webhookLogs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Webhook className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun webhook reçu</h3>
              <p className="text-gray-600">Les webhooks apparaîtront ici dès qu'ils seront reçus</p>
            </div>
          ) : (
            webhookLogs.map((log) => (
              <div key={log.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSourceColor(log.source)}`}>
                        {log.source}
                      </span>
                      
                      {log.processed ? (
                        log.success !== false ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-500" />
                      )}
                      
                      <span className="text-sm text-gray-500">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {log.data.action && (
                        <p className="text-sm">
                          <span className="font-medium">Action:</span> {log.data.action}
                        </p>
                      )}
                      
                      {log.data.title && (
                        <p className="text-sm">
                          <span className="font-medium">Titre:</span> {log.data.title}
                        </p>
                      )}
                      
                      {log.error && (
                        <div className="flex items-center space-x-2 text-red-600">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm">{log.error}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button className="text-gray-400 hover:text-gray-600">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>

                {/* Data Preview */}
                <details className="mt-4">
                  <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                    Voir les données complètes
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-50 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                </details>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}