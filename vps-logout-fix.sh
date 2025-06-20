#!/bin/bash

echo "🚨 CORRECTION LOGOUT DÉFINITIVE"
echo "================================"

# Aller dans le bon répertoire
cd /var/www/contentgen-pro/frontend/src/contexts/

# Backup
cp AuthContext.tsx AuthContext.tsx.backup

# Réécrire le fichier avec une fonction logout ULTRA simple
cat > AuthContext.tsx << 'EOF'
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

const ROLE_PERMISSIONS = {
  super_admin: {
    sections: ['dashboard', 'scenarios', 'generation', 'templates', 'settings', 'webhooks', 'projects', 'campaigns', 'history'],
    permissions: ['view_all_dashboard', 'manage_scenarios', 'manage_generation', 'manage_templates', 'manage_settings', 'manage_users', 'manage_webhooks', 'manage_api_keys', 'view_system_logs', 'manage_prompts']
  },
  manager: {
    sections: ['dashboard', 'scenarios', 'generation', 'templates', 'projects', 'campaigns', 'history'],
    permissions: ['view_all_dashboard', 'view_scenarios', 'manage_generation', 'manage_templates', 'view_projects', 'manage_prompts', 'view_campaigns']
  },
  redacteur: {
    sections: ['dashboard', 'generation', 'templates'],
    permissions: ['view_own_dashboard', 'use_generation', 'view_templates', 'view_own_prompts']
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

      const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3001'
        : `http://${window.location.hostname}`;

      const response = await fetch(`${API_URL}/api/auth/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
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
      const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3001'
        : `http://${window.location.hostname}`;

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('auth_token', data.token);
        setUser(data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    console.log('🚨 LOGOUT ACTIVÉ - NETTOYAGE TOTAL');
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    window.location.href = '/';
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
    user, login, logout, isAuthenticated: !!user, isLoading, hasPermission, canAccess
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
EOF

echo "✅ AuthContext.tsx corrigé avec logout FORCÉ"

# Rebuild le frontend
cd /var/www/contentgen-pro/frontend
npm run build

# Restart les services
cd /var/www/contentgen-pro/backend
pm2 restart all

echo "🎉 CORRECTION LOGOUT TERMINÉE !"
echo "✅ Testez maintenant: http://69.62.126.243"
echo "🔐 Le logout va maintenant FORCER la déconnexion"