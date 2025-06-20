import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar?: string;
  lastActive: string;
  status: 'active' | 'inactive';
  twoFactorEnabled: boolean;
}

export interface GeneralSettings {
  companyName: string;
  defaultLanguage: string;
  timezone: string;
  dateFormat: string;
}

export interface BrandingSettings {
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  brandName: string;
}

export interface SecuritySettings {
  twoFactorRequired: boolean;
  sessionTimeout: number;
  allowedDomains: string[];
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
  };
}

export interface IntegrationSettings {
  wordpress: {
    url: string;
    apiKey: string;
    connected: boolean;
  };
  make: {
    webhookUrl: string;
    connected: boolean;
  };
  n8n: {
    instanceUrl: string;
    apiKey: string;
    connected: boolean;
  };
}

export interface AppSettings {
  general: GeneralSettings;
  branding: BrandingSettings;
  security: SecuritySettings;
  integrations: IntegrationSettings;
}

interface SettingsContextType {
  settings: AppSettings;
  users: User[];
  currentUser: User | null;
  updateGeneralSettings: (settings: Partial<GeneralSettings>) => Promise<void>;
  updateBrandingSettings: (settings: Partial<BrandingSettings>) => Promise<void>;
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => Promise<void>;
  updateIntegrationSettings: (settings: Partial<IntegrationSettings>) => Promise<void>;
  addUser: (user: Omit<User, 'id' | 'lastActive'>) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  toggleTwoFactor: (userId: string) => Promise<void>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const defaultSettings: AppSettings = {
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
    sessionTimeout: 8, // hours
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

const defaultUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    lastActive: new Date().toISOString(),
    status: 'active',
    twoFactorEnabled: false
  }
];

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [users, setUsers] = useState<User[]>(defaultUsers);
  const [currentUser, setCurrentUser] = useState<User | null>(defaultUsers[0]);
  const [isLoading, setIsLoading] = useState(false);

  // Load settings from backend on mount
  useEffect(() => {
    loadSettings();
    loadUsers();
  }, []);

  // Apply theme changes to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', settings.branding.primaryColor);
    root.style.setProperty('--secondary-color', settings.branding.secondaryColor);
    
    // Update document title
    document.title = settings.general.companyName;
  }, [settings.branding, settings.general.companyName]);

  const loadSettings = async () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings({ ...defaultSettings, ...data });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    try {
      const response = await fetch(`${API_URL}/api/users`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.length > 0 ? data : defaultUsers);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    try {
      const response = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });
      
      if (response.ok) {
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      throw error;
    }
  };

  const updateGeneralSettings = async (newSettings: Partial<GeneralSettings>) => {
    const updatedSettings = {
      ...settings,
      general: { ...settings.general, ...newSettings }
    };
    await saveSettings(updatedSettings);
  };

  const updateBrandingSettings = async (newSettings: Partial<BrandingSettings>) => {
    const updatedSettings = {
      ...settings,
      branding: { ...settings.branding, ...newSettings }
    };
    await saveSettings(updatedSettings);
  };

  const updateSecuritySettings = async (newSettings: Partial<SecuritySettings>) => {
    const updatedSettings = {
      ...settings,
      security: { ...settings.security, ...newSettings }
    };
    await saveSettings(updatedSettings);
  };

  const updateIntegrationSettings = async (newSettings: Partial<IntegrationSettings>) => {
    const updatedSettings = {
      ...settings,
      integrations: { ...settings.integrations, ...newSettings }
    };
    await saveSettings(updatedSettings);
  };

  const addUser = async (userData: Omit<User, 'id' | 'lastActive'>) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...userData,
          lastActive: new Date().toISOString()
        }),
      });

      if (response.ok) {
        const newUser = await response.json();
        setUsers(prev => [...prev, newUser]);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'utilisateur:', error);
      throw error;
    }
  };

  const updateUser = async (id: string, userData: Partial<User>) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    try {
      const response = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(prev => prev.map(u => u.id === id ? updatedUser : u));
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      throw error;
    }
  };

  const deleteUser = async (id: string) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    try {
      const response = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setUsers(prev => prev.filter(u => u.id !== id));
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      throw error;
    }
  };

  const toggleTwoFactor = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      await updateUser(userId, { twoFactorEnabled: !user.twoFactorEnabled });
    }
  };

  return (
    <SettingsContext.Provider
      value={{
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
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}