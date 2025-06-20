import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Play, 
  Pause, 
  Settings, 
  BarChart3, 
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Globe,
  MessageSquare,
  Rss,
  Brain,
  Languages,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Activity
} from 'lucide-react';

interface Scenario {
  id: string;
  name: string;
  type: 'scraping' | 'redaction' | 'ia-generator' | 'translation';
  category: string;
  status: 'active' | 'paused' | 'error' | 'pending';
  source: string;
  target: string;
  language: string;
  lastExecution: string;
  nextExecution: string;
  executionCount: number;
  successRate: number;
  avgExecutionTime: string;
  description: string;
}

const SCENARIO_TYPES = {
  'scraping': {
    label: 'Scrapping & Rédaction',
    icon: Rss,
    color: 'blue',
    description: 'Collecte automatique depuis les sources RSS crypto'
  },
  'redaction': {
    label: 'Rédaction Evergreen',
    icon: MessageSquare,
    color: 'green',
    description: 'Rédaction via Telegram et documents'
  },
  'ia-generator': {
    label: 'IA Générateur',
    icon: Brain,
    color: 'purple',
    description: 'Génération automatique par IA'
  },
  'translation': {
    label: 'Traduction',
    icon: Languages,
    color: 'orange',
    description: 'Traduction et intégration WordPress'
  }
};

const CRYPTO_SOURCES = [
  'Bitcoin', 'Newsbit', 'RSS-AMB Crypto', 'BeInCrypto', 'Blockworks',
  'CoinGape', 'Coinpedia', 'Cointelegraph', 'CryptoNews', 'News Bitcoin', 'TheNewsCrypto'
];

export function Scenarios() {
  const { user, hasPermission } = useAuth();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [filteredScenarios, setFilteredScenarios] = useState<Scenario[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadScenarios();
  }, []);

  useEffect(() => {
    filterScenarios();
  }, [scenarios, selectedType, selectedStatus, searchTerm]);

  const loadScenarios = async () => {
    try {
      setIsLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/scenarios`);
      if (response.ok) {
        const data = await response.json();
        setScenarios(data);
      } else {
        console.error('Erreur lors du chargement des scénarios');
        // Fallback vers les données de démo si l'API n'est pas disponible
        loadFallbackData();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des scénarios:', error);
      loadFallbackData();
    } finally {
      setIsLoading(false);
    }
  };

  const loadFallbackData = () => {
    const mockScenarios: Scenario[] = [
        // Scraping scenarios
        ...CRYPTO_SOURCES.map((source, index) => ({
          id: `scraping-${index}`,
          name: `Scrapping ${source}`,
          type: 'scraping' as const,
          category: 'Crypto News',
          status: index % 4 === 0 ? 'error' as const : index % 3 === 0 ? 'paused' as const : 'active' as const,
          source: source,
          target: 'ContentGen Pro',
          language: 'FR',
          lastExecution: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
          nextExecution: new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
          executionCount: Math.floor(Math.random() * 1000) + 100,
          successRate: Math.floor(Math.random() * 20) + 80,
          avgExecutionTime: `${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 9)}s`,
          description: `Collecte automatique d'articles depuis ${source} avec traitement SEO`
        })),
        // Redaction scenarios
        {
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
          description: 'Rédaction d\'articles evergreen à partir d\'URLs partagées sur Telegram'
        },
        {
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
          description: 'Rédaction d\'articles à partir de documents Telegram'
        },
        // IA Generator
        {
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
          description: 'Génération automatique d\'articles d\'actualité par IA'
        },
        // Translation scenarios
        {
          id: 'translation-de',
          name: 'Traduction DE → WordPress',
          type: 'translation',
          category: 'WordPress Integration',
          status: 'active',
          source: 'Evergreen FR',
          target: 'WordPress DE',
          language: 'DE',
          lastExecution: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          nextExecution: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
          executionCount: 78,
          successRate: 97,
          avgExecutionTime: '6.4s',
          description: 'Traduction automatique vers WordPress allemand'
        },
        {
          id: 'translation-en',
          name: 'Traduction EN → WordPress',
          type: 'translation',
          category: 'WordPress Integration',
          status: 'active',
          source: 'Evergreen FR',
          target: 'WordPress EN',
          language: 'EN',
          lastExecution: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          nextExecution: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString(),
          executionCount: 92,
          successRate: 98,
          avgExecutionTime: '5.8s',
          description: 'Traduction automatique vers WordPress anglais'
        },
        {
          id: 'translation-es',
          name: 'Traduction ES → WordPress',
          type: 'translation',
          category: 'WordPress Integration',
          status: 'paused',
          source: 'Evergreen FR',
          target: 'WordPress ES',
          language: 'ES',
          lastExecution: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          nextExecution: 'Paused',
          executionCount: 34,
          successRate: 95,
          avgExecutionTime: '7.1s',
          description: 'Traduction automatique vers WordPress espagnol'
        },
        {
          id: 'translation-pt',
          name: 'Traduction PT → WordPress',
          type: 'translation',
          category: 'WordPress Integration',
          status: 'error',
          source: 'Evergreen FR',
          target: 'WordPress PT',
          language: 'PT',
          lastExecution: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          nextExecution: 'Error',
          executionCount: 12,
          successRate: 87,
          avgExecutionTime: '9.3s',
          description: 'Traduction automatique vers WordPress portugais'
        }
        ];
        setScenarios(mockScenarios);
  };

  const filterScenarios = () => {
    let filtered = [...scenarios];

    if (selectedType !== 'all') {
      filtered = filtered.filter(s => s.type === selectedType);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(s => s.status === selectedStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredScenarios(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'paused':
        return <Pause className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    const config = SCENARIO_TYPES[type as keyof typeof SCENARIO_TYPES];
    switch (config?.color) {
      case 'blue':
        return 'bg-blue-100 text-blue-800';
      case 'green':
        return 'bg-green-100 text-green-800';
      case 'purple':
        return 'bg-purple-100 text-purple-800';
      case 'orange':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    if (dateString === 'Manuel' || dateString === 'Paused' || dateString === 'Error') {
      return dateString;
    }
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleScenario = async (scenarioId: string, currentStatus: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/scenarios/${scenarioId}/toggle`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        setScenarios(prev => prev.map(s => 
          s.id === scenarioId ? { ...s, status: result.status as any } : s
        ));
        console.log(result.message);
      }
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
    }
  };

  const executeScenario = async (scenarioId: string) => {
    try {
      console.log(`🚀 Exécution du scénario ${scenarioId}...`);
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/scenarios/${scenarioId}/execute`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Résultat:', result);
        
        // Mettre à jour les statistiques du scénario
        setScenarios(prev => prev.map(s => 
          s.id === scenarioId ? { 
            ...s, 
            lastExecution: new Date().toISOString(),
            executionCount: s.executionCount + 1
          } : s
        ));
        
        // Recharger les scénarios pour avoir les dernières stats
        await loadScenarios();
      } else {
        const error = await response.json();
        console.error('❌ Erreur:', error);
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'exécution:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scénarios d'Automatisation</h1>
          <p className="text-gray-600 mt-1">Gérez vos flux de génération de contenu et traductions</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={loadScenarios}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Actualiser</span>
          </button>
          
          {hasPermission('manage_scenarios') && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Scénario</span>
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Object.entries(SCENARIO_TYPES).map(([type, config]) => {
          const Icon = config.icon;
          const count = scenarios.filter(s => s.type === type).length;
          const activeCount = scenarios.filter(s => s.type === type && s.status === 'active').length;
          
          return (
            <div key={type} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${config.color === 'blue' ? 'bg-blue-50' : config.color === 'green' ? 'bg-green-50' : config.color === 'purple' ? 'bg-purple-50' : 'bg-orange-50'}`}>
                  <Icon className={`w-6 h-6 ${config.color === 'blue' ? 'text-blue-600' : config.color === 'green' ? 'text-green-600' : config.color === 'purple' ? 'text-purple-600' : 'text-orange-600'}`} />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-sm text-gray-500">{activeCount} actifs</p>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{config.label}</h3>
              <p className="text-sm text-gray-600">{config.description}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher un scénario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Type:</span>
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les types</option>
              {Object.entries(SCENARIO_TYPES).map(([type, config]) => (
                <option key={type} value={type}>{config.label}</option>
              ))}
            </select>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Statut:</span>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="paused">En pause</option>
              <option value="error">Erreur</option>
              <option value="pending">En attente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Scenarios List */}
      <div className="space-y-4">
        {filteredScenarios.map((scenario) => {
          const TypeIcon = SCENARIO_TYPES[scenario.type]?.icon || Activity;
          
          return (
            <div key={scenario.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`p-2 rounded-lg ${SCENARIO_TYPES[scenario.type]?.color === 'blue' ? 'bg-blue-50' : SCENARIO_TYPES[scenario.type]?.color === 'green' ? 'bg-green-50' : SCENARIO_TYPES[scenario.type]?.color === 'purple' ? 'bg-purple-50' : 'bg-orange-50'}`}>
                        <TypeIcon className={`w-5 h-5 ${SCENARIO_TYPES[scenario.type]?.color === 'blue' ? 'text-blue-600' : SCENARIO_TYPES[scenario.type]?.color === 'green' ? 'text-green-600' : SCENARIO_TYPES[scenario.type]?.color === 'purple' ? 'text-purple-600' : 'text-orange-600'}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{scenario.name}</h3>
                        <p className="text-sm text-gray-600">{scenario.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2 ${getTypeColor(scenario.type)}`}>
                          {SCENARIO_TYPES[scenario.type]?.label}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">Source:</span>
                        <p className="font-medium text-gray-900">{scenario.source}</p>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">Langue:</span>
                        <p className="font-medium text-gray-900">{scenario.language}</p>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">Exécutions:</span>
                        <p className="font-medium text-gray-900">{scenario.executionCount}</p>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">Succès:</span>
                        <p className="font-medium text-gray-900">{scenario.successRate}%</p>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">Durée moy:</span>
                        <p className="font-medium text-gray-900">{scenario.avgExecutionTime}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 text-sm">
                      <div>
                        <span className="text-gray-500">Dernière exécution:</span>
                        <p className="font-medium text-gray-900">{formatDate(scenario.lastExecution)}</p>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">Prochaine exécution:</span>
                        <p className="font-medium text-gray-900">{formatDate(scenario.nextExecution)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(scenario.status)}`}>
                      {getStatusIcon(scenario.status)}
                      <span className="capitalize">{scenario.status}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {hasPermission('manage_scenarios') && (
                        <>
                          <button
                            onClick={() => toggleScenario(scenario.id, scenario.status)}
                            className={`p-2 rounded-lg transition-colors ${
                              scenario.status === 'active' 
                                ? 'text-yellow-600 hover:bg-yellow-50' 
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={scenario.status === 'active' ? 'Mettre en pause' : 'Activer'}
                          >
                            {scenario.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={() => executeScenario(scenario.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Exécuter maintenant"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" title="Voir les statistiques">
                        <BarChart3 className="w-4 h-4" />
                      </button>

                      {hasPermission('manage_scenarios') && (
                        <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" title="Paramètres">
                          <Settings className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredScenarios.length === 0 && (
        <div className="text-center py-12">
          <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun scénario trouvé</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedType !== 'all' || selectedStatus !== 'all'
              ? 'Essayez de modifier vos filtres de recherche'
              : hasPermission('manage_scenarios') 
                ? 'Commencez par créer votre premier scénario d\'automatisation'
                : 'Aucun scénario disponible pour le moment'
            }
          </p>
          {hasPermission('manage_scenarios') && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Créer un scénario
            </button>
          )}
        </div>
      )}
    </div>
  );
}