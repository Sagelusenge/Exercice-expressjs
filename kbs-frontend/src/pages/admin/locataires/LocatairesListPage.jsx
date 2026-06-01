import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useGetLocatairesQuery, 
  useDeleteLocataireMutation,
  useUpdateLocataireMutation 
} from '../../../store/api/locatairesApi';
import { Building2, User, Phone, Mail, Calendar, DollarSign, Trash2, Edit2, Plus, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const LocatairesListPage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ categorie: '', statut_paiement: '', search: '', page: 1, limit: 10 });
  const { data, isLoading, error } = useGetLocatairesQuery(filters);
  const [deleteLocataire] = useDeleteLocataireMutation();
  const [updateLocataire] = useUpdateLocataireMutation();
  const [selectedLocataire, setSelectedLocataire] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({});

  if (error) {
    console.error('Locataires error:', error);
    return <div className="p-6 text-error">Erreur: {error.message || 'Erreur de chargement des locataires'}</div>;
  }

  if (isLoading) {
    return <div className="p-6">Chargement...</div>;
  }

  const handleDelete = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce locataire ?')) {
      try {
        await deleteLocataire(id).unwrap();
        toast.success('Locataire supprimé');
      } catch (err) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const openModal = (locataire) => {
    setSelectedLocataire(locataire);
    setEditForm({
      montant_mensuel_loyer: locataire.montant_mensuel_loyer,
      date_debut_loyer: locataire.date_debut_loyer,
      date_fin_loyer: locataire.date_fin_loyer,
    });
    setIsModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateLocataire({ id: selectedLocataire.id, ...editForm }).unwrap();
      toast.success('Locataire mis à jour');
      setIsModalOpen(false);
      setSelectedLocataire(null);
    } catch (err) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // Debug
  console.log('LocatairesListPage state:', { data, isLoading, error });

  const locataires = data || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Locataires</h1>
          <p className="text-on-surface-variant text-sm">Gestion des locataires de KBS Buildings.</p>
        </div>
        <div className="flex gap-2">
          <button
          onClick={() => navigate('/admin/kbs/locataires/create')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary-container transition"
        >
            <Plus size={16} />
            Ajouter Locataire
          </button>
          <select
            value={filters.categorie}
            onChange={(e) => setFilters(prev => ({ ...prev, categorie: e.target.value }))}
            className="px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Toutes catégories</option>
            <option value="SIMPLE">Simple</option>
            <option value="ENTREPRISE">Entreprise</option>
          </select>
          <select
            value={filters.statut_paiement}
            onChange={(e) => setFilters(prev => ({ ...prev, statut_paiement: e.target.value }))}
            className="px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Tous les statuts</option>
            <option value="A_JOUR">À jour</option>
            <option value="EN_RETARD">En retard</option>
          </select>
        </div>
      </div>

      <div className="bg-surface-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {locataires.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant">
            <p className="font-inter text-body-md">Aucun locataire trouvé.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Locataire</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Loyer mensuel</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Période</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Statut</th>
                <th className="px-4 py-3 text-right text-label-sm font-semibold text-on-surface-variant uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {locataires.map((row) => (
                <tr key={row.id} className="border-b border-outline-variant hover:bg-surface-low">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-on-surface">{row.nom_affichage}</span>
                      <span className="text-xs text-on-surface-variant">{row.code_locataire}</span>
                      <span className="text-xs text-on-surface-variant">{row.categorie}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      {row.telephone && (
                        <span className="text-sm flex items-center gap-1">
                          <Phone size={12} className="text-on-surface-variant" />
                          {row.telephone}
                        </span>
                      )}
                      {row.email && (
                        <span className="text-sm flex items-center gap-1">
                          <Mail size={12} className="text-on-surface-variant" />
                          {row.email}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-primary" />
                      <span className="font-bold">{row.montant_mensuel_loyer} {row.devise}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      {row.date_debut_loyer && (
                        <span className="text-sm flex items-center gap-1">
                          <Calendar size={12} className="text-on-surface-variant" />
                          Du {format(new Date(row.date_debut_loyer), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      )}
                      {row.date_fin_loyer && (
                        <span className="text-sm">
                          Au {format(new Date(row.date_fin_loyer), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
                      row.statut_paiement === 'A_JOUR' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {row.statut_paiement === 'A_JOUR' ? 'À jour' : 'En retard'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openModal(row)}
                        className="p-2 text-blue-600 hover:bg-surface-low rounded"
                        title="Modifier"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="p-2 text-red-600 hover:bg-surface-low rounded"
                        title="Supprimer"
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

      {/* Modal Modification */}
      {isModalOpen && selectedLocataire && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl shadow-lg max-w-lg w-full mx-4">
            <div className="p-6 border-b border-outline-variant">
              <h2 className="text-xl font-bold text-on-surface">Modifier le locataire</h2>
              <p className="text-sm text-on-surface-variant mt-1">
                {selectedLocataire.nom_affichage}
              </p>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Loyer mensuel</label>
                <input
                  type="number"
                  value={editForm.montant_mensuel_loyer}
                  onChange={(e) => setEditForm({ ...editForm, montant_mensuel_loyer: e.target.value })}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Date début loyer</label>
                <input
                  type="date"
                  value={editForm.date_debut_loyer}
                  onChange={(e) => setEditForm({ ...editForm, date_debut_loyer: e.target.value })}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Date fin loyer</label>
                <input
                  type="date"
                  value={editForm.date_fin_loyer}
                  onChange={(e) => setEditForm({ ...editForm, date_fin_loyer: e.target.value })}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedLocataire(null);
                  }}
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

export default LocatairesListPage;
