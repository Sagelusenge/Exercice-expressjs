import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetUsersQuery, useDeleteUserMutation, useUpdateUserMutation } from '../../../store/api/usersApi';
import { UserPlus, Search, Edit2, Trash2, Mail, Shield, X } from 'lucide-react';
import { ROLE_LABELS } from '../../../design-system/tokens';
import toast from 'react-hot-toast';

const UsersListPage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: '',
    page: 1,
    limit: 10
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ nom: '', prenom: '', email: '', telephone: '', role: '', adresse: '' });

  const { data, isLoading, isFetching, error } = useGetUsersQuery(filters);
  const [deleteUser] = useDeleteUserMutation();
  const [updateUser] = useUpdateUserMutation();

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        console.log('Deleting user:', id);
        const result = await deleteUser(id).unwrap();
        console.log('Delete result:', result);
        toast.success('Utilisateur supprimé');
      } catch (err) {
        console.error('Delete error:', err);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      nom: user.nom || '',
      prenom: user.prenom || '',
      email: user.email || '',
      telephone: user.telephone || '',
      role: user.role || 'CLIENT',
      adresse: user.adresse || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateUser({ id: editingUser.id, ...editForm }).unwrap();
      toast.success('Utilisateur mis à jour');
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Update error:', err);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // Debug: afficher l'état
  console.log('UsersListPage state:', { data, isLoading, isFetching, error });

  if (isLoading) {
    return <div className="p-6">Chargement...</div>;
  }

  if (error) {
    return <div className="p-6 text-error">Erreur: {error.message || 'Erreur de chargement'}</div>;
  }

  const users = data || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Utilisateurs</h1>
          <p className="text-on-surface-variant">Gérez les accès et les comptes du personnel et des clients.</p>
        </div>
        <button 
          onClick={() => navigate('/admin/users/create')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary-container transition"
        >
          <UserPlus size={20} />
          Nouvel Utilisateur
        </button>
      </div>

      <div className="bg-surface-lowest p-4 rounded-xl border border-outline-variant shadow-sm">
        <div className="max-w-md">
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="bg-surface-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {users.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant">
            <p className="font-inter text-body-md">Aucun utilisateur trouvé.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Utilisateur</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Rôle</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Téléphone</th>
                <th className="px-4 py-3 text-right text-label-sm font-semibold text-on-surface-variant uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-outline-variant hover:bg-surface-low">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-bold">
                        {user?.prenom?.[0] ?? 'U'}{user?.nom?.[0] ?? ''}
                      </div>
                      <div>
                        <div className="font-medium text-on-surface">{user?.prenom ?? 'Utilisateur'} {user?.nom ?? ''}</div>
                        <div className="text-xs text-on-surface-variant flex items-center gap-1">
                          <Mail size={12} /> {user?.email ?? '—'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-surface-low text-on-surface text-sm">
                      <Shield size={14} />
                      {ROLE_LABELS?.[user.role] || user.role || 'CLIENT'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{user.telephone || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => handleOpenEdit(user)}
                        className="p-2 text-blue-600 hover:bg-surface-low rounded"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-error hover:bg-surface-low rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal d'édition */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-outline-variant flex-shrink-0">
              <h2 className="text-lg font-bold text-on-surface">Modifier l'Utilisateur</h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-5 space-y-4 overflow-y-auto flex-grow">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Nom</label>
                  <input
                    type="text"
                    value={editForm.nom}
                    onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Prénom</label>
                  <input
                    type="text"
                    value={editForm.prenom}
                    onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Téléphone</label>
                <input
                  type="text"
                  value={editForm.telephone}
                  onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Rôle</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Adresse</label>
                <textarea
                  value={editForm.adresse}
                  onChange={(e) => setEditForm({ ...editForm, adresse: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-low transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary-container transition"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersListPage;
