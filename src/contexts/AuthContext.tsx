import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'super_admin' | 'manager' | 'redacteur';
  name: string;
  avatar?: string;
  createdAt: string;
  lastLogin: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  canAccess: (section: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Permissions par rôle
const ROLE_PERMISSIONS = {
  super_admin: {
    sections: ['dashboard', 'scenarios', 'generation', 'templates', 'settings', 'webhooks', 'projects', 'campaigns', 'history'],
    permissions: [
      'view_all_dashboard',
      'manage_scenarios',
      'manage_generation',
      'manage_templates', 
      'manage_settings',
      'manage_users',
      'manage_webhooks',
      'manage_api_keys',
      'view_system_logs',
      'manage_prompts'
    ]
  },
  manager: {
    sections: ['dashboard', 'scenarios', 'generation', 'templates', 'projects', 'campaigns', 'history'],
    permissions: [
      'view_all_dashboard',
      'view_scenarios',
      'manage_generation',
      'manage_templates',
      'view_projects',
      'manage_prompts',
      'view_campaigns'
    ]
  },
  redacteur: {
    sections: ['dashboard', 'generation', 'templates', 'scenarios'],
    permissions: [
      'view_own_dashboard',
      'use_generation',
      'view_templates',
      'view_own_prompts',
      'view_scenarios'
    ]
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Force rebuild

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
      } else {
        localStorage.removeItem('auth_token');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('auth_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('auth_token', data.token);
        setUser(data.user);
        return true;
      } else {
        const error = await response.json();
        console.error('Login failed:', error.message);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    console.log('🔓 Début déconnexion...');
    
    try {
      const token = localStorage.getItem('auth_token');
      console.log('📧 Token trouvé:', token ? 'Oui' : 'Non');
      
      if (token) {
        // Déterminer l'URL de l'API selon l'environnement
        const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'http://localhost:3001'
          : `http://${window.location.hostname}`;
        
        console.log('🌐 API URL utilisée:', API_URL);
        
        // Appel API pour logout côté serveur avec timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 secondes max
        
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log('✅ API logout réussi');
      }
    } catch (error) {
      console.warn('⚠️ Erreur logout API (ignorée):', error.message);
      // On continue quand même avec le logout local
    }
    
    // FORCE la déconnexion locale dans TOUS les cas
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      sessionStorage.clear();
      setUser(null);
      console.log('✅ Déconnexion locale forcée');
      
      // Force un refresh de la page pour s'assurer que tout est nettoyé
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
    } catch (localError) {
      console.error('❌ Erreur critique logout local:', localError);
      // En dernier recours, forcer le reload
      window.location.reload();
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return ROLE_PERMISSIONS[user.role]?.permissions.includes(permission) || false;
  };

  const canAccess = (section: string): boolean => {
    if (!user) return false;
    return ROLE_PERMISSIONS[user.role]?.sections.includes(section) || false;
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
    hasPermission,
    canAccess
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}