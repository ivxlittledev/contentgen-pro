import React, { useState } from 'react';
import { Save, Upload, Palette } from 'lucide-react';
import { BrandingSettings as BrandingSettingsType } from '../../contexts/SettingsContext';

interface BrandingSettingsProps {
  settings: BrandingSettingsType;
  onSave: (settings: Partial<BrandingSettingsType>) => void;
  isSaving: boolean;
}

export function BrandingSettings({ settings, onSave, isSaving }: BrandingSettingsProps) {
  const [formData, setFormData] = useState(settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleColorChange = (field: 'primaryColor' | 'secondaryColor', value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // Apply color immediately to preview
    const root = document.documentElement;
    if (field === 'primaryColor') {
      root.style.setProperty('--primary-color', value);
      // Convert hex to RGB for CSS variables
      const rgb = hexToRgb(value);
      if (rgb) {
        root.style.setProperty('--primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
      }
    } else {
      root.style.setProperty('--secondary-color', value);
      const rgb = hexToRgb(value);
      if (rgb) {
        root.style.setProperty('--secondary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
      }
    }
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const resetColors = () => {
    const defaultColors = {
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981'
    };
    
    setFormData({ ...formData, ...defaultColors });
    
    // Reset CSS variables
    const root = document.documentElement;
    root.style.setProperty('--primary-color', defaultColors.primaryColor);
    root.style.setProperty('--secondary-color', defaultColors.secondaryColor);
    root.style.setProperty('--primary-rgb', '59, 130, 246');
    root.style.setProperty('--secondary-rgb', '16, 185, 129');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Personnalisation de la marque</h3>
        
        <div className="space-y-6">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo de l'entreprise
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-300">
                {formData.logo ? (
                  <img src={formData.logo} alt="Logo" className="w-16 h-16 object-contain" />
                ) : (
                  <Upload className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div>
                <button
                  type="button"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Télécharger un logo
                </button>
                <p className="text-sm text-gray-600 mt-1">PNG, JPG jusqu'à 2MB. Recommandé: 200x200px</p>
              </div>
            </div>
          </div>

          {/* Brand Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de la marque
            </label>
            <input
              type="text"
              value={formData.brandName}
              onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ContentGen Pro"
            />
          </div>
          
          {/* Color Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Couleur principale
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  placeholder="#3B82F6"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Utilisée pour les boutons, liens et éléments interactifs</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Couleur secondaire
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  placeholder="#10B981"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Utilisée pour les accents et éléments de succès</p>
            </div>
          </div>

          {/* Color Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center space-x-2">
              <Palette className="w-4 h-4" />
              <span>Aperçu des couleurs</span>
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <div 
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: formData.primaryColor }}
                ></div>
                <span className="text-sm text-gray-600">Couleur principale</span>
                <button
                  type="button"
                  style={{ backgroundColor: formData.primaryColor }}
                  className="px-3 py-1 text-white text-sm rounded hover:opacity-90 transition-opacity"
                >
                  Bouton exemple
                </button>
              </div>
              
              <div className="flex items-center space-x-4">
                <div 
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: formData.secondaryColor }}
                ></div>
                <span className="text-sm text-gray-600">Couleur secondaire</span>
                <button
                  type="button"
                  style={{ backgroundColor: formData.secondaryColor }}
                  className="px-3 py-1 text-white text-sm rounded hover:opacity-90 transition-opacity"
                >
                  Succès
                </button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={resetColors}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Réinitialiser aux couleurs par défaut
              </button>
            </div>
          </div>

          {/* Preview Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">
              Aperçu de l'interface
            </h4>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: formData.primaryColor }}
                >
                  <span className="text-white text-sm font-semibold">
                    {formData.brandName.charAt(0)}
                  </span>
                </div>
                <span className="font-semibold text-gray-900">{formData.brandName}</span>
              </div>
              
              <div className="flex space-x-2">
                <button 
                  type="button"
                  style={{ backgroundColor: formData.primaryColor }}
                  className="px-4 py-2 text-white text-sm rounded-lg hover:opacity-90 transition-opacity"
                >
                  Bouton principal
                </button>
                <button 
                  type="button"
                  style={{ 
                    borderColor: formData.primaryColor,
                    color: formData.primaryColor
                  }}
                  className="px-4 py-2 text-sm border rounded-lg hover:bg-opacity-10 transition-colors"
                >
                  Bouton secondaire
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={resetColors}
          className="text-gray-600 hover:text-gray-800 underline text-sm"
        >
          Réinitialiser tous les paramètres
        </button>
        
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