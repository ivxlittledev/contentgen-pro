import React, { useState } from 'react';
import { Save, Shield, Clock, Globe, Key, AlertTriangle } from 'lucide-react';
import { SecuritySettings as SecuritySettingsType } from '../../contexts/SettingsContext';

interface SecuritySettingsProps {
  settings: SecuritySettingsType;
  onSave: (settings: Partial<SecuritySettingsType>) => void;
  isSaving: boolean;
}

export function SecuritySettings({ settings, onSave, isSaving }: SecuritySettingsProps) {
  const [formData, setFormData] = useState(settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const updatePasswordPolicy = (field: string, value: any) => {
    setFormData({
      ...formData,
      passwordPolicy: {
        ...formData.passwordPolicy,
        [field]: value
      }
    });
  };

  const addAllowedDomain = () => {
    const domain = prompt('Entrez le domaine à autoriser (ex: example.com):');
    if (domain && !formData.allowedDomains.includes(domain)) {
      setFormData({
        ...formData,
        allowedDomains: [...formData.allowedDomains, domain]
      });
    }
  };

  const removeAllowedDomain = (domain: string) => {
    setFormData({
      ...formData,
      allowedDomains: formData.allowedDomains.filter(d => d !== domain)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center space-x-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <span>Paramètres de Sécurité</span>
        </h3>

        {/* 2FA Settings */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Authentification à deux facteurs (2FA)</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.twoFactorRequired}
                    onChange={(e) => setFormData({ ...formData, twoFactorRequired: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Exiger la 2FA pour tous les utilisateurs
                  </span>
                </label>
                <p className="text-xs text-gray-500 ml-6">
                  Tous les nouveaux utilisateurs devront configurer la 2FA
                </p>
              </div>
              
              {formData.twoFactorRequired && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Shield className="w-3 h-3 mr-1" />
                  Sécurisé
                </span>
              )}
            </div>

            {formData.twoFactorRequired && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                  <div>
                    <h5 className="text-sm font-medium text-blue-900">Important</h5>
                    <p className="text-sm text-blue-800 mt-1">
                      Cette option obligera tous les utilisateurs existants à configurer la 2FA lors de leur prochaine connexion.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Session Settings */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Gestion des sessions</span>
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Délai d'expiration des sessions (heures)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="1"
                  max="24"
                  value={formData.sessionTimeout}
                  onChange={(e) => setFormData({ ...formData, sessionTimeout: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm font-medium text-gray-900 w-16">
                  {formData.sessionTimeout}h
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1h (Très sécurisé)</span>
                <span>24h (Pratique)</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Les utilisateurs seront déconnectés automatiquement après cette période d'inactivité
              </p>
            </div>
          </div>
        </div>

        {/* Password Policy */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center space-x-2">
            <Key className="w-4 h-4" />
            <span>Politique des mots de passe</span>
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longueur minimale
              </label>
              <select
                value={formData.passwordPolicy.minLength}
                onChange={(e) => updatePasswordPolicy('minLength', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={6}>6 caractères (Faible)</option>
                <option value={8}>8 caractères (Recommandé)</option>
                <option value={10}>10 caractères (Fort)</option>
                <option value={12}>12 caractères (Très fort)</option>
              </select>
            </div>

            <div className="space-y-3">
              <h5 className="text-sm font-medium text-gray-700">Exigences de caractères</h5>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.passwordPolicy.requireUppercase}
                  onChange={(e) => updatePasswordPolicy('requireUppercase', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Au moins une lettre majuscule (A-Z)
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.passwordPolicy.requireNumbers}
                  onChange={(e) => updatePasswordPolicy('requireNumbers', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Au moins un chiffre (0-9)
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.passwordPolicy.requireSymbols}
                  onChange={(e) => updatePasswordPolicy('requireSymbols', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Au moins un caractère spécial (!@#$%^&*)
                </span>
              </label>
            </div>

            {/* Password Strength Indicator */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h6 className="text-sm font-medium text-gray-700 mb-2">Exemple de mot de passe valide:</h6>
              <code className="text-sm bg-white px-3 py-2 rounded border">
                {formData.passwordPolicy.requireSymbols 
                  ? `MyP@ssw0rd${formData.passwordPolicy.minLength > 10 ? '123!' : '!'}`
                  : formData.passwordPolicy.requireNumbers && formData.passwordPolicy.requireUppercase
                  ? `MyPassword${formData.passwordPolicy.minLength > 10 ? '1234' : '1'}`
                  : `password${formData.passwordPolicy.minLength > 8 ? '1234' : ''}`
                }
              </code>
            </div>
          </div>
        </div>

        {/* Domain Restrictions */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center space-x-2">
            <Globe className="w-4 h-4" />
            <span>Restriction par domaine email</span>
          </h4>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Limitez les inscriptions aux adresses email de domaines spécifiques. 
              Laissez vide pour autoriser tous les domaines.
            </p>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={addAllowedDomain}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                Ajouter un domaine
              </button>
            </div>

            {formData.allowedDomains.length > 0 && (
              <div className="space-y-2">
                <h6 className="text-sm font-medium text-gray-700">Domaines autorisés:</h6>
                <div className="space-y-1">
                  {formData.allowedDomains.map((domain, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                      <span className="text-sm text-gray-700">{domain}</span>
                      <button
                        type="button"
                        onClick={() => removeAllowedDomain(domain)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Supprimer
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.allowedDomains.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                  <div>
                    <h5 className="text-sm font-medium text-yellow-900">Aucune restriction</h5>
                    <p className="text-sm text-yellow-800 mt-1">
                      Toutes les adresses email sont autorisées à s'inscrire.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="text-md font-medium text-blue-900 mb-3">Résumé de la sécurité</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-900">2FA obligatoire:</span>
              <span className={`ml-2 ${formData.twoFactorRequired ? 'text-green-700' : 'text-red-700'}`}>
                {formData.twoFactorRequired ? 'Oui' : 'Non'}
              </span>
            </div>
            <div>
              <span className="font-medium text-blue-900">Expiration session:</span>
              <span className="ml-2 text-blue-800">{formData.sessionTimeout}h</span>
            </div>
            <div>
              <span className="font-medium text-blue-900">Mot de passe min:</span>
              <span className="ml-2 text-blue-800">{formData.passwordPolicy.minLength} caractères</span>
            </div>
            <div>
              <span className="font-medium text-blue-900">Domaines restreints:</span>
              <span className="ml-2 text-blue-800">
                {formData.allowedDomains.length > 0 ? `${formData.allowedDomains.length} domaine(s)` : 'Non'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
        </button>
      </div>
    </form>
  );
}