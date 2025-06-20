import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredSection?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredPermission, 
  requiredSection, 
  fallback 
}: ProtectedRouteProps) {
  const { user, hasPermission, canAccess } = useAuth();

  // Vérifier l'accès à la section
  if (requiredSection && !canAccess(requiredSection)) {
    return fallback || (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Accès non autorisé</h3>
        <p className="text-gray-600 text-center max-w-md">
          Votre rôle <span className="font-semibold text-blue-600">{user?.role}</span> ne vous permet pas d'accéder à cette section.
        </p>
        <div className="mt-4 text-sm text-gray-500">
          Contactez votre administrateur pour plus d'informations.
        </div>
      </div>
    );
  }

  // Vérifier la permission spécifique
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback || (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-16 h-16 text-orange-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Permission insuffisante</h3>
        <p className="text-gray-600 text-center max-w-md">
          Vous n'avez pas les permissions nécessaires pour effectuer cette action.
        </p>
        <div className="mt-4 text-sm text-gray-500">
          Permission requise: <code className="bg-gray-100 px-2 py-1 rounded">{requiredPermission}</code>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}