import React, { useState } from 'react';
import { 
  Save, 
  Globe, 
  Key, 
  Users, 
  Bell,
  Shield,
  Palette
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { GeneralSettings } from '../components/settings/GeneralSettings';
import { BrandingSettings } from '../components/settings/BrandingSettings';
import { UserManagement } from '../components/settings/UserManagement';
import { SecuritySettings } from '../components/settings/SecuritySettings';

export function Settings() {
  const {
    settings,
    users,
    currentUser,
    updateGeneralSettings,
    updateBrandingSettings,
    updateSecuritySettings,
    updateIntegrationSettings,
    addUser,
    updateUser,
    deleteUser,
    toggleTwoFactor,
    isLoading
  } = useSettings();
  
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  const tabs = [
    { id: 'general', name: 'General', icon: Globe },
    { id: 'branding', name: 'Branding', icon: Palette },
    { id: 'users', name: 'Users & Permissions', icon: Users },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'integrations', name: 'Integrations', icon: Key },
    { id: 'notifications', name: 'Notifications', icon: Bell },
  ];

  const handleSave = async (saveFunction: () => Promise<void>) => {
    try {
      setIsSaving(true);
      await saveFunction();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const enable2FA = async (userId: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/users/${userId}/2fa/enable`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await toggleTwoFactor(userId);
      }
    } catch (error) {
      console.error('Erreur lors de l\'activation du 2FA:', error);
    }
  };

  const disable2FA = async (userId: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/users/${userId}/2fa/disable`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await toggleTwoFactor(userId);
      }
    } catch (error) {
      console.error('Erreur lors de la désactivation du 2FA:', error);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <GeneralSettings 
            settings={settings.general}
            onSave={(data) => handleSave(() => updateGeneralSettings(data))}
            isSaving={isSaving}
          />
        );

      case 'branding':
        return (
          <BrandingSettings 
            settings={settings.branding}
            onSave={(data) => handleSave(() => updateBrandingSettings(data))}
            isSaving={isSaving}
          />
        );

      case 'users':
        return (
          <UserManagement
            users={users}
            onAddUser={addUser}
            onUpdateUser={updateUser}
            onDeleteUser={deleteUser}
            onToggle2FA={async (userId, enable) => {
              if (enable) {
                await enable2FA(userId);
              } else {
                await disable2FA(userId);
              }
            }}
          />
        );

      case 'security':
        return (
          <SecuritySettings 
            settings={settings.security}
            onSave={(data) => handleSave(() => updateSecuritySettings(data))}
            isSaving={isSaving}
          />
        );

      case 'integrations':
        return (
          <IntegrationsSettings 
            settings={settings.integrations}
            onSave={(data) => handleSave(() => updateIntegrationSettings(data))}
            isSaving={isSaving}
          />
        );

      case 'notifications':
        return (
          <NotificationsSettings />
        );

      default:
        return <div>Settings content for {activeTab}</div>;
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-600 mt-1">Gérez les préférences et configurations de votre application</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <nav className="bg-white rounded-lg border border-gray-200 p-4">
            <ul className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-blue-600' : ''}`} />
                      <span className="font-medium">{tab.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

// Placeholder components for remaining tabs
function IntegrationsSettings({ settings, onSave, isSaving }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Intégrations API</h3>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">Intégrations disponibles</h4>
        <p className="text-gray-600">
          Configurez vos intégrations avec WordPress, Make.com, N8n et d'autres services.
        </p>
        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Configurer les intégrations
        </button>
      </div>
    </div>
  );
}

function NotificationsSettings() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">Paramètres de notification</h4>
        <p className="text-gray-600">
          Configurez vos préférences de notification email, SMS et push.
        </p>
        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Configurer les notifications
        </button>
      </div>
    </div>
  );
}