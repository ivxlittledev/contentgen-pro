import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  PenTool, 
  FileText, 
  FolderOpen, 
  Activity,
  Webhook,
  BarChart3,
  History, 
  Settings,
  User,
  LogOut,
  Zap,
  Shield
} from 'lucide-react';
import { Page } from '../App';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { user, logout, canAccess } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navigationItems = [
    { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scenarios' as Page, label: 'Scénarios', icon: Activity },
    { id: 'generation' as Page, label: 'Génération', icon: PenTool },
    { id: 'templates' as Page, label: 'Templates', icon: FileText },
    { id: 'projects' as Page, label: 'Projets', icon: FolderOpen },
    { id: 'webhooks' as Page, label: 'Webhooks', icon: Webhook },
    { id: 'campaigns' as Page, label: 'Campagnes', icon: BarChart3 },
    { id: 'history' as Page, label: 'Historique', icon: History },
    { id: 'settings' as Page, label: 'Paramètres', icon: Settings },
  ];

  // Filtrer les éléments de navigation selon les permissions
  const visibleNavigationItems = navigationItems.filter(item => canAccess(item.id));

  const getRoleBadge = (role: string) => {
    const badges = {
      super_admin: { label: 'Super Admin', color: 'bg-purple-100 text-purple-800' },
      manager: { label: 'Manager', color: 'bg-blue-100 text-blue-800' },
      redacteur: { label: 'Rédacteur', color: 'bg-green-100 text-green-800' }
    };
    return badges[role as keyof typeof badges] || { label: role, color: 'bg-gray-100 text-gray-800' };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">ContentGen Pro</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Informations utilisateur */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-2 text-gray-600 rounded-lg bg-gray-50">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">{user?.name || 'Utilisateur'}</span>
              </div>
              {user?.role && (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadge(user.role).color}`}>
                  {getRoleBadge(user.role).label}
                </span>
              )}
            </div>
            
            {/* Bouton logout ULTRA simplifié */}
            <button 
              onClick={() => {
                console.log('🔴 Clic logout détecté');
                if (isLoggingOut) {
                  console.log('🔄 Déjà en cours de déconnexion');
                  return;
                }
                setIsLoggingOut(true);
                console.log('🚀 Lancement logout...');
                logout().finally(() => {
                  console.log('🏁 Logout terminé');
                  setIsLoggingOut(false);
                });
              }}
              disabled={isLoggingOut}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              {isLoggingOut ? (
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {isLoggingOut ? 'Déconnexion...' : 'Logout'}
              </span>
            </button>
            
            {/* Bouton force logout en cas d'urgence */}
            <button 
              onClick={() => {
                console.log('🚨 FORCE LOGOUT ACTIVÉ');
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = window.location.origin;
              }}
              className="ml-2 px-2 py-1 text-xs text-red-500 hover:text-red-700 border border-red-300 rounded hover:bg-red-50"
              title="Force Logout (en cas de problème)"
            >
              ⚡
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)]">
          <div className="p-4">
            <ul className="space-y-2">
              {visibleNavigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onNavigate(item.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : ''}`} />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}