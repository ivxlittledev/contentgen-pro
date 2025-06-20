import React, { useState, useEffect } from 'react';
import { 
  PenTool, 
  Settings, 
  Eye, 
  Download,
  ChevronDown,
  Sparkles,
  Bot,
  Zap,
  Brain,
  MessageSquare,
  Key,
  Save,
  Copy,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Globe,
  Trash2,
  Plus
} from 'lucide-react';

interface AIProvider {
  id: string;
  name: string;
  icon: any;
  color: string;
  status: 'connected' | 'disconnected' | 'error';
  apiKey?: string;
  lastUsed?: string;
  description: string;
}

interface GenerationHistory {
  id: string;
  provider: string;
  prompt: string;
  content: string;
  timestamp: string;
  wordCount: number;
  template: string;
  status: 'success' | 'error';
}

export function ContentGeneration() {
  const [prompt, setPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('article-news');
  const [tone, setTone] = useState('professional');
  const [language, setLanguage] = useState('french');
  const [wordCount, setWordCount] = useState('800');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('claude');
  const [generatedContent, setGeneratedContent] = useState('');
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [generationHistory, setGenerationHistory] = useState<GenerationHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'generate' | 'history' | 'settings'>('generate');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [creativity, setCreativity] = useState(70);
  const [quickPrompts, setQuickPrompts] = useState<string[]>([]);
  const [showAddPromptModal, setShowAddPromptModal] = useState(false);
  const [newPromptText, setNewPromptText] = useState('');

  useEffect(() => {
    loadProviders();
    loadGenerationHistory();
    loadQuickPrompts();
  }, []);

  const loadProviders = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/ai-providers`);
      if (response.ok) {
        const data = await response.json();
        const providersWithIcons = data.map(provider => ({
          ...provider,
          icon: provider.id === 'claude' ? Bot : 
                provider.id === 'chatgpt' ? MessageSquare : Brain
        }));
        setProviders(providersWithIcons);
      } else {
        // Données de démo si API non disponible
        loadFallbackProviders();
      }
    } catch (error) {
      console.error('Erreur chargement providers:', error);
      // Charger les données de démo en cas d'erreur
      loadFallbackProviders();
    }
  };

  const loadFallbackProviders = () => {
    setProviders([
      {
        id: 'claude',
        name: 'Claude (Anthropic)',
        icon: Bot,
        color: 'orange',
        status: 'disconnected',
        description: 'Modèle avancé pour génération de contenu long-forme',
        apiKey: ''
      },
      {
        id: 'chatgpt',
        name: 'ChatGPT (OpenAI)',
        icon: MessageSquare,
        color: 'green',
        status: 'disconnected',
        description: 'Générateur de contenu polyvalent et créatif',
        apiKey: ''
      },
      {
        id: 'perplexity',
        name: 'Perplexity AI',
        icon: Brain,
        color: 'purple',
        status: 'disconnected',
        description: 'IA spécialisée dans la recherche et l\'actualité',
        apiKey: ''
      }
    ]);
  };

  const loadGenerationHistory = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/content-generation/history`);
      if (response.ok) {
        const data = await response.json();
        setGenerationHistory(data);
      }
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    }
  };

  const loadQuickPrompts = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/quick-prompts`);
      if (response.ok) {
        const data = await response.json();
        setQuickPrompts(data);
      } else {
        // Prompts par défaut si l'API n'est pas disponible
        setQuickPrompts([
          'Rédige un article actualité crypto complet et optimisé SEO',
          'Crée un guide tutoriel SEO détaillé pour débutants', 
          'Écris une review produit tech approfondie et objective',
          'Analyse les tendances du marché avec des données récentes'
        ]);
      }
    } catch (error) {
      console.error('Erreur chargement prompts:', error);
      // Charger les prompts par défaut en cas d'erreur
      setQuickPrompts([
        'Rédige un article actualité crypto complet et optimisé SEO',
        'Crée un guide tutoriel SEO détaillé pour débutants', 
        'Écris une review produit tech approfondie et objective',
        'Analyse les tendances du marché avec des données récentes'
      ]);
    }
  };

  const saveQuickPrompt = async () => {
    if (!newPromptText.trim() || newPromptText.length < 10) {
      alert('Le prompt doit contenir au moins 10 caractères');
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/quick-prompts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          prompt: newPromptText.trim(),
          category: 'custom',
          createdAt: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        await loadQuickPrompts(); // Recharger la liste
        setNewPromptText('');
        setShowAddPromptModal(false);
        alert('✅ Prompt sauvegardé avec succès!');
      } else {
        alert('❌ Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur sauvegarde prompt:', error);
      alert('❌ Erreur de connexion');
    }
  };

  const deleteQuickPrompt = async (promptToDelete: string) => {
    if (!confirm('Supprimer ce prompt ?')) return;

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/quick-prompts`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: promptToDelete })
      });
      
      if (response.ok) {
        await loadQuickPrompts(); // Recharger la liste
        alert('✅ Prompt supprimé');
      } else {
        alert('❌ Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression prompt:', error);
      alert('❌ Erreur de connexion');
    }
  };

  const templates = [
    { id: 'article-news', name: 'Article Actualité', description: 'Articles d\'actualité optimisés SEO' },
    { id: 'blog-post', name: 'Article de Blog', description: 'Contenu de blog engageant avec optimisation SEO' },
    { id: 'crypto-analysis', name: 'Analyse Crypto', description: 'Analyses techniques et fondamentales crypto' },
    { id: 'evergreen-guide', name: 'Guide Evergreen', description: 'Guides intemporels à forte valeur ajoutée' },
    { id: 'product-review', name: 'Test Produit', description: 'Reviews détaillées de produits/services' },
    { id: 'tutorial', name: 'Tutoriel', description: 'Guides pratiques étape par étape' },
    { id: 'listicle', name: 'Liste/Top', description: 'Articles sous forme de listes ou classements' },
    { id: 'interview', name: 'Interview', description: 'Formats d\'interviews et témoignages' }
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/content-generation/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: selectedProvider,
          prompt: prompt.trim(),
          template: selectedTemplate,
          tone,
          language,
          wordCount: parseInt(wordCount),
          creativity,
          seoKeywords: seoKeywords.split(',').map(k => k.trim()).filter(k => k)
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setGeneratedContent(result.content);
        await loadGenerationHistory(); // Recharger l'historique
        console.log('✅ Contenu généré avec succès');
      } else {
        const error = await response.json();
        console.error('❌ Erreur génération:', error);
        alert('Erreur lors de la génération: ' + error.message);
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('Erreur de connexion à l\'API');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const saveApiKey = async (providerId: string, apiKey: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/ai-providers/${providerId}/api-key`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ apiKey })
      });
      
      if (response.ok) {
        const result = await response.json();
        // Mettre à jour immédiatement le provider local
        setProviders(prev => prev.map(p => 
          p.id === providerId 
            ? { ...p, apiKey, status: result.status }
            : p
        ));
        alert(`✅ Clé API ${providerId} sauvegardée avec succès!`);
        console.log(`✅ Clé API ${providerId} sauvegardée`);
      } else {
        alert('❌ Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur sauvegarde clé API:', error);
      alert('❌ Erreur de connexion');
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    console.log('📋 Contenu copié dans le presse-papiers');
  };
  
  const saveAsArticle = async () => {
    if (!generatedContent) return;
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: prompt.split('.')[0] || 'Article généré par IA',
          content: generatedContent,
          source: `ai-${selectedProvider}`,
          templateId: selectedTemplate,
          keywords: seoKeywords.split(',').map(k => k.trim()).filter(k => k)
        })
      });
      
      if (response.ok) {
        console.log('✅ Article sauvegardé');
        alert('Article sauvegardé avec succès!');
      }
    } catch (error) {
      console.error('Erreur sauvegarde article:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Génération de Contenu IA</h1>
          <p className="text-gray-600 mt-1">Créez du contenu avec Claude, ChatGPT et Perplexity</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowApiConfig(!showApiConfig)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Key className="w-4 h-4" />
            <span>API Config</span>
          </button>
        </div>
      </div>
      
      {/* AI Providers Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {providers.map((provider) => {
          const Icon = provider.icon;
          return (
            <div key={provider.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${provider.color === 'orange' ? 'bg-orange-50' : provider.color === 'green' ? 'bg-green-50' : 'bg-purple-50'}`}>
                    <Icon className={`w-5 h-5 ${provider.color === 'orange' ? 'text-orange-600' : provider.color === 'green' ? 'text-green-600' : 'text-purple-600'}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  provider.status === 'connected' ? 'bg-green-500' :
                  provider.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                }`}></div>
              </div>
              <p className="text-sm text-gray-600 mb-3">{provider.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className={`px-2 py-1 rounded-full ${
                  provider.status === 'connected' ? 'bg-green-100 text-green-800' :
                  provider.status === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {provider.status === 'connected' ? 'Connecté' :
                   provider.status === 'error' ? 'Erreur' : 'Non connecté'}
                </span>
                {provider.lastUsed && (
                  <span className="text-gray-500">Utilisé {provider.lastUsed}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* API Configuration Modal */}
      {showApiConfig && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Configuration des APIs IA</h3>
            <button 
              onClick={() => setShowApiConfig(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            {providers.map((provider) => (
              <div key={provider.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <provider.icon className={`w-5 h-5 ${provider.color === 'orange' ? 'text-orange-600' : provider.color === 'green' ? 'text-green-600' : 'text-purple-600'}`} />
                  <h4 className="font-medium text-gray-900">{provider.name}</h4>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Clé API {provider.status === 'connected' && <span className="text-green-600 text-xs">(✓ Connecté)</span>}
                    </label>
                    <div className="flex space-x-2">
                      <input
                        id={`api-key-${provider.id}`}
                        type="password"
                        placeholder={`sk-... (votre clé API ${provider.name.split(' ')[0]})`}
                        defaultValue={provider.apiKey || ''}
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onChange={(e) => {
                          // Mise à jour en temps réel du statut
                          setProviders(prev => prev.map(p => 
                            p.id === provider.id 
                              ? { ...p, apiKey: e.target.value }
                              : p
                          ));
                        }}
                      />
                      <button 
                        onClick={() => {
                          const input = document.getElementById(`api-key-${provider.id}`) as HTMLInputElement;
                          if (input?.value && input.value.length > 10) {
                            saveApiKey(provider.id, input.value);
                          } else {
                            alert('Veuillez entrer une clé API valide');
                          }
                        }}
                        className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        disabled={!provider.apiKey || provider.apiKey.length < 10}
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      {provider.apiKey && provider.apiKey.length > 10 && (
                        <button 
                          onClick={() => {
                            if (confirm('Supprimer cette clé API ?')) {
                              saveApiKey(provider.id, '');
                            }
                          }}
                          className="px-3 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {provider.apiKey && provider.apiKey.length > 0 && provider.apiKey.length < 10 && (
                      <p className="text-red-500 text-xs mt-1">⚠️ Clé API trop courte</p>
                    )}
                    {provider.status === 'connected' && (
                      <p className="text-green-600 text-xs mt-1">✅ API connectée et fonctionnelle</p>
                    )}
                    {provider.status === 'error' && (
                      <p className="text-red-500 text-xs mt-1">❌ Erreur de connexion - vérifiez votre clé</p>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {provider.id === 'claude' && (
                      <p>🔗 Obtenez votre clé API sur: <a href="https://console.anthropic.com" target="_blank" className="text-blue-600 hover:underline">console.anthropic.com</a></p>
                    )}
                    {provider.id === 'chatgpt' && (
                      <p>🔗 Obtenez votre clé API sur: <a href="https://platform.openai.com/api-keys" target="_blank" className="text-blue-600 hover:underline">platform.openai.com</a></p>
                    )}
                    {provider.id === 'perplexity' && (
                      <p>🔗 Obtenez votre clé API sur: <a href="https://docs.perplexity.ai" target="_blank" className="text-blue-600 hover:underline">docs.perplexity.ai</a></p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'generate', label: 'Générer', icon: Sparkles },
            { id: 'history', label: 'Historique', icon: Clock },
            { id: 'settings', label: 'Paramètres', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* Onglet Génération */}
          {activeTab === 'generate' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Provider Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Choisir l'IA
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {providers.map((provider) => {
                      const Icon = provider.icon;
                      return (
                        <button
                          key={provider.id}
                          onClick={() => setSelectedProvider(provider.id)}
                          disabled={provider.status !== 'connected'}
                          className={`p-3 rounded-lg border transition-all ${
                            selectedProvider === provider.id
                              ? 'border-blue-500 bg-blue-50'
                              : provider.status === 'connected'
                              ? 'border-gray-200 hover:border-gray-300'
                              : 'border-gray-200 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <Icon className={`w-6 h-6 mx-auto mb-2 ${
                            selectedProvider === provider.id 
                              ? 'text-blue-600' 
                              : provider.color === 'orange' ? 'text-orange-600' 
                              : provider.color === 'green' ? 'text-green-600' 
                              : 'text-purple-600'
                          }`} />
                          <p className="text-sm font-medium text-gray-900">{provider.name.split(' ')[0]}</p>
                          {provider.status !== 'connected' && (
                            <p className="text-xs text-red-500 mt-1">Non connecté</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Prompt Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Prompt de génération
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Décrivez le contenu que vous souhaitez générer. Soyez précis sur le sujet, l'audience cible et les points clés à couvrir..."
                    className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>

                {/* Template Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Type de contenu
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedTemplate === template.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedTemplate(template.id)}
                      >
                        <h3 className="font-medium text-gray-900 text-sm">{template.name}</h3>
                        <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Basic Settings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ton
                    </label>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="professional">Professionnel</option>
                      <option value="casual">Décontracté</option>
                      <option value="friendly">Amical</option>
                      <option value="authoritative">Autoritaire</option>
                      <option value="conversational">Conversationnel</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Langue
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="french">Français</option>
                      <option value="english">Anglais</option>
                      <option value="spanish">Espagnol</option>
                      <option value="german">Allemand</option>
                      <option value="portuguese">Portugais</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de mots
                    </label>
                    <select
                      value={wordCount}
                      onChange={(e) => setWordCount(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="300">300 mots</option>
                      <option value="500">500 mots</option>
                      <option value="800">800 mots</option>
                      <option value="1200">1200 mots</option>
                      <option value="1500">1500 mots</option>
                      <option value="2000">2000 mots</option>
                    </select>
                  </div>
                </div>

                {/* Advanced Settings */}
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div className="flex items-center space-x-2">
                      <Settings className="w-5 h-5 text-gray-500" />
                      <span className="font-medium text-gray-900">Paramètres avancés</span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showAdvanced && (
                    <div className="px-4 pb-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Niveau de créativité: {creativity}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={creativity}
                            onChange={(e) => setCreativity(parseInt(e.target.value))}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Conservateur</span>
                            <span>Créatif</span>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mots-clés SEO
                          </label>
                          <input
                            type="text"
                            value={seoKeywords}
                            onChange={(e) => setSeoKeywords(e.target.value)}
                            placeholder="crypto, bitcoin, actualité..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isGenerating || !providers.find(p => p.id === selectedProvider)?.status}
                    className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Génération en cours...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Générer le contenu</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Generated Content */}
                {generatedContent && (
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Contenu généré</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => copyToClipboard(generatedContent)}
                          className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-white transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          <span>Copier</span>
                        </button>
                        <button
                          onClick={saveAsArticle}
                          className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          <span>Sauvegarder</span>
                        </button>
                      </div>
                    </div>
                    <div className="prose max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                        {generatedContent}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Tips */}
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-3">💡 Conseils Pro</h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li>• Soyez précis sur votre audience cible</li>
                    <li>• Incluez les points clés à couvrir</li>
                    <li>• Mentionnez le style souhaité</li>
                    <li>• Ajoutez des mots-clés pour le SEO</li>
                    <li>• Testez différentes IAs pour comparer</li>
                  </ul>
                </div>

                {/* Quick Prompts Library */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Bibliothèque de Prompts</h3>
                    <button
                      onClick={() => setShowAddPromptModal(true)}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Ajouter</span>
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {quickPrompts.map((promptText, index) => (
                      <div
                        key={index}
                        className="group relative p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                      >
                        <button
                          onClick={() => setPrompt(promptText)}
                          className="w-full text-left"
                        >
                          <p className="font-medium text-gray-900 text-sm leading-relaxed">
                            {promptText.length > 80 ? `${promptText.substring(0, 80)}...` : promptText}
                          </p>
                        </button>
                        <button
                          onClick={() => deleteQuickPrompt(promptText)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-100 rounded transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    
                    {quickPrompts.length === 0 && (
                      <div className="text-center py-6 text-gray-500">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Aucun prompt sauvegardé</p>
                        <p className="text-xs">Cliquez sur "Ajouter" pour créer votre premier prompt</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Add Prompt Modal */}
                {showAddPromptModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Ajouter un Prompt</h3>
                        <button 
                          onClick={() => setShowAddPromptModal(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Texte du prompt
                          </label>
                          <textarea
                            value={newPromptText}
                            onChange={(e) => setNewPromptText(e.target.value)}
                            placeholder="Exemple: Rédige un article complet sur les dernières tendances crypto avec une analyse technique approfondie..."
                            className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {newPromptText.length}/500 caractères (minimum 10)
                          </p>
                        </div>
                        
                        <div className="flex space-x-3">
                          <button
                            onClick={() => setShowAddPromptModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Annuler
                          </button>
                          <button
                            onClick={saveQuickPrompt}
                            disabled={newPromptText.length < 10}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Sauvegarder
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Onglet Historique */}
          {activeTab === 'history' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Historique des générations</h3>
                <button
                  onClick={loadGenerationHistory}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Actualiser</span>
                </button>
              </div>

              {generationHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun historique</h3>
                  <p className="text-gray-600">Commencez par générer du contenu pour voir l'historique ici</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {generationHistory.map((item) => (
                    <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {item.status === 'success' ? 'Succès' : 'Erreur'}
                            </span>
                            <span className="text-sm text-gray-500">{item.provider}</span>
                            <span className="text-sm text-gray-500">{item.template}</span>
                            <span className="text-sm text-gray-500">{item.wordCount} mots</span>
                          </div>
                          <p className="text-gray-900 font-medium mb-2">{item.prompt}</p>
                          <p className="text-sm text-gray-600 line-clamp-2">{item.content}</p>
                          <p className="text-xs text-gray-500 mt-2">{new Date(item.timestamp).toLocaleString('fr-FR')}</p>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => copyToClipboard(item.content)}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setPrompt(item.prompt);
                              setActiveTab('generate');
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Onglet Paramètres */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Paramètres de génération</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Paramètres par défaut</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Langue par défaut</label>
                      <select className="w-full p-2 border border-gray-300 rounded-lg">
                        <option value="french">Français</option>
                        <option value="english">Anglais</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de mots par défaut</label>
                      <select className="w-full p-2 border border-gray-300 rounded-lg">
                        <option value="800">800 mots</option>
                        <option value="500">500 mots</option>
                        <option value="1200">1200 mots</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Options avancées</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded" />
                      <span className="ml-2 text-sm text-gray-700">Sauvegarde automatique</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded" />
                      <span className="ml-2 text-sm text-gray-700">Optimisation SEO automatique</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded" />
                      <span className="ml-2 text-sm text-gray-700">Notifications de fin de génération</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}