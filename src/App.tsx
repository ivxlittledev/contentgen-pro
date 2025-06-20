import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ContentGeneration } from './pages/ContentGeneration';
import { Templates } from './pages/Templates';
import { Projects } from './pages/Projects';
import { Scenarios } from './pages/Scenarios';
import { Webhooks } from './pages/Webhooks';
import { Campaigns } from './pages/Campaigns';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/LoginForm';
import { ProtectedRoute } from './components/ProtectedRoute';

export type Page = 'dashboard' | 'generation' | 'templates' | 'projects' | 'scenarios' | 'webhooks' | 'campaigns' | 'history' | 'settings';

function AuthenticatedApp() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const { user } = useAuth();

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <ProtectedRoute requiredSection="dashboard">
            <Dashboard onNavigate={setCurrentPage} />
          </ProtectedRoute>
        );
      case 'generation':
        return (
          <ProtectedRoute requiredSection="generation">
            <ContentGeneration />
          </ProtectedRoute>
        );
      case 'templates':
        return (
          <ProtectedRoute requiredSection="templates">
            <Templates />
          </ProtectedRoute>
        );
      case 'projects':
        return (
          <ProtectedRoute requiredSection="projects">
            <Projects />
          </ProtectedRoute>
        );
      case 'scenarios':
        return (
          <ProtectedRoute requiredSection="scenarios">
            <Scenarios />
          </ProtectedRoute>
        );
      case 'webhooks':
        return (
          <ProtectedRoute requiredSection="webhooks">
            <Webhooks />
          </ProtectedRoute>
        );
      case 'campaigns':
        return (
          <ProtectedRoute requiredSection="campaigns">
            <Campaigns />
          </ProtectedRoute>
        );
      case 'history':
        return (
          <ProtectedRoute requiredSection="history">
            <History />
          </ProtectedRoute>
        );
      case 'settings':
        return (
          <ProtectedRoute requiredSection="settings">
            <Settings />
          </ProtectedRoute>
        );
      default:
        return (
          <ProtectedRoute requiredSection="dashboard">
            <Dashboard onNavigate={setCurrentPage} />
          </ProtectedRoute>
        );
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthGuard />
    </AuthProvider>
  );
}

function AuthGuard() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return <AuthenticatedApp />;
}

export default App;