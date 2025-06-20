import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { GeneralSettings as GeneralSettingsType } from '../../contexts/SettingsContext';

interface GeneralSettingsProps {
  settings: GeneralSettingsType;
  onSave: (settings: Partial<GeneralSettingsType>) => void;
  isSaving: boolean;
}

export function GeneralSettings({ settings, onSave, isSaving }: GeneralSettingsProps) {
  const [formData, setFormData] = useState(settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Paramètres Généraux</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de l'entreprise
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ContentGen Pro"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Langue par défaut
            </label>
            <select 
              value={formData.defaultLanguage}
              onChange={(e) => setFormData({ ...formData, defaultLanguage: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="de">Deutsch</option>
              <option value="it">Italiano</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fuseau horaire
            </label>
            <select 
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Europe/Paris">Europe/Paris (CET)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Format de date
            </label>
            <select 
              value={formData.dateFormat}
              onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="dd/mm/yyyy">DD/MM/YYYY (Français)</option>
              <option value="mm/dd/yyyy">MM/DD/YYYY (Américain)</option>
              <option value="yyyy-mm-dd">YYYY-MM-DD (ISO)</option>
              <option value="dd.mm.yyyy">DD.MM.YYYY (Allemand)</option>
            </select>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Aperçu des paramètres</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Entreprise:</strong> {formData.companyName}</p>
              <p><strong>Langue:</strong> {formData.defaultLanguage}</p>
              <p><strong>Fuseau:</strong> {formData.timezone}</p>
              <p><strong>Date:</strong> {new Date().toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              })}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
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