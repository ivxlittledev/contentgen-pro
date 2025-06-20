import React, { useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldOff,
  User,
  Mail,
  Calendar,
  MoreHorizontal,
  QrCode,
  Key,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { User as UserType } from '../../contexts/SettingsContext';

interface UserManagementProps {
  users: UserType[];
  onAddUser: (user: Omit<UserType, 'id' | 'lastActive'>) => Promise<void>;
  onUpdateUser: (id: string, user: Partial<UserType>) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  onToggle2FA: (userId: string, enable: boolean) => Promise<void>;
}

export function UserManagement({ 
  users, 
  onAddUser, 
  onUpdateUser, 
  onDeleteUser,
  onToggle2FA 
}: UserManagementProps) {
  const [showUserModal, setShowUserModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'editor':
        return 'bg-blue-100 text-blue-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEnable2FA = async (user: UserType) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/users/${user.id}/2fa/enable`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setSelectedUser(user);
        setShow2FAModal(true);
        await onToggle2FA(user.id, true);
      }
    } catch (error) {
      console.error('Erreur lors de l\'activation du 2FA:', error);
    }
  };

  const handleDisable2FA = async (user: UserType) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/users/${user.id}/2fa/disable`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await onToggle2FA(user.id, false);
      }
    } catch (error) {
      console.error('Erreur lors de la désactivation du 2FA:', error);
    }
  };

  const verify2FA = async () => {
    if (!selectedUser || !verificationCode) return;

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/users/${selectedUser.id}/2fa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: verificationCode })
      });
      
      const data = await response.json();
      
      if (data.valid) {
        setShow2FAModal(false);
        setVerificationCode('');
        setQrCode(null);
        setSecret(null);
        setSelectedUser(null);
      } else {
        alert('Code invalide, veuillez réessayer');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Utilisateurs & Permissions</h3>
        <button 
          onClick={() => setShowUserModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Inviter un utilisateur</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utilisateur
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rôle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                2FA
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dernière activité
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="h-10 w-10 rounded-full" />
                        ) : (
                          <User className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500 flex items-center space-x-1">
                        <Mail className="w-3 h-3" />
                        <span>{user.email}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(user.status)}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {user.twoFactorEnabled ? (
                      <div className="flex items-center space-x-1 text-green-600">
                        <Shield className="w-4 h-4" />
                        <span className="text-xs">Activé</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-gray-400">
                        <ShieldOff className="w-4 h-4" />
                        <span className="text-xs">Désactivé</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(user.lastActive)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingUser(user);
                        setShowUserModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    {user.twoFactorEnabled ? (
                      <button
                        onClick={() => handleDisable2FA(user)}
                        className="text-orange-600 hover:text-orange-900"
                        title="Désactiver 2FA"
                      >
                        <ShieldOff className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnable2FA(user)}
                        className="text-green-600 hover:text-green-900"
                        title="Activer 2FA"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => onDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit User Modal */}
      {showUserModal && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowUserModal(false);
            setEditingUser(null);
          }}
          onSave={(userData) => {
            if (editingUser) {
              onUpdateUser(editingUser.id, userData);
            } else {
              onAddUser(userData);
            }
            setShowUserModal(false);
            setEditingUser(null);
          }}
        />
      )}

      {/* 2FA Setup Modal */}
      {show2FAModal && selectedUser && (
        <TwoFactorModal
          user={selectedUser}
          qrCode={qrCode}
          secret={secret}
          verificationCode={verificationCode}
          onCodeChange={setVerificationCode}
          onVerify={verify2FA}
          onClose={() => {
            setShow2FAModal(false);
            setSelectedUser(null);
            setQrCode(null);
            setSecret(null);
            setVerificationCode('');
          }}
        />
      )}
    </div>
  );
}

// User Modal Component
function UserModal({ 
  user, 
  onClose, 
  onSave 
}: { 
  user: UserType | null; 
  onClose: () => void; 
  onSave: (user: any) => void; 
}) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'viewer',
    status: user?.status || 'active'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {user ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rôle
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="viewer">Viewer - Lecture seule</option>
              <option value="editor">Editor - Création et modification</option>
              <option value="admin">Admin - Accès complet</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {user ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Two Factor Modal Component
function TwoFactorModal({
  user,
  qrCode,
  secret,
  verificationCode,
  onCodeChange,
  onVerify,
  onClose
}: {
  user: UserType;
  qrCode: string | null;
  secret: string | null;
  verificationCode: string;
  onCodeChange: (code: string) => void;
  onVerify: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Configuration 2FA pour {user.name}
        </h2>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>1. Scannez ce QR code avec votre application d'authentification (Google Authenticator, Authy, etc.)</p>
          </div>
          
          {qrCode && (
            <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
              <QrCode className="w-32 h-32 text-gray-400" />
            </div>
          )}
          
          {secret && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Clé secrète (si scan impossible):</p>
              <code className="text-sm font-mono bg-white px-2 py-1 rounded border">
                {secret}
              </code>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              2. Entrez le code à 6 chiffres généré par votre application:
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono"
              placeholder="123456"
              maxLength={6}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={onVerify}
              disabled={verificationCode.length !== 6}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              Vérifier et activer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}