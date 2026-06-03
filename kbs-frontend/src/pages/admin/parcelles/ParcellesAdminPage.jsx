import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useGetParcellesAdminQuery, 
  useDeleteParcelleMutation,
  useUpdateParcelleMutation
} from '../../../store/api/parcellesApi';
import { Plus, Search, Edit2, Trash2, Eye, Filter, X, Save, Map, Home, DollarSign, MapPin, Star, Image as ImageIcon } from 'lucide-react';
import { TYPE_PARCELLE_LABELS, STATUS_COLORS } from '../../../design-system/tokens';
import { formatCurrency } from '../../../utils/formatters';
import toast from 'react-hot-toast';

// Helper to get complete image URL
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `http://localhost:5000${url}`;
};

const ParcellesAdminPage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    statut: '',
    page: 1,
    limit: 10
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingParcelle, setEditingParcelle] = useState(null);
  const [editForm, setEditForm] = useState({
    titre: '',
    description: '',
    localisation: '',
    ville: '',
    commune: '',
    quartier: '',
    superficie: '',
    type_parcelle: 'RESIDENTIELLE',
    prix_vente: '',
    statut: 'DISPONIBLE',
    est_vedette: false,
    photo: null
  });
  const [photoPreview, setPhotoPreview] = useState(null);

  const { data, isLoading, isFetching, error } = useGetParcellesAdminQuery(filters);
  const [deleteParcelle] = useDeleteParcelleMutation();
  const [updateParcelle, { isLoading: isUpdating }] = useUpdateParcelleMutation();

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette parcelle ?')) {
      try {
        console.log('Deleting parcelle:', id);
        await deleteParcelle(id).unwrap();
        toast.success('Parcelle supprimée avec succès');
      } catch (err) {
        console.error('Delete error:', err);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleOpenEdit = (parcelle) => {
    setEditingParcelle(parcelle);
    setEditForm({
      titre: parcelle.titre || '',
      description: parcelle.description || '',
      localisation: parcelle.localisation || '',
      ville: parcelle.ville || '',
      commune: parcelle.commune || '',
      quartier: parcelle.quartier || '',
      superficie: parcelle.superficie?.toString() || '',
      type_parcelle: parcelle.type_parcelle || 'RESIDENTIELLE',
      prix_vente: parcelle.prix_vente?.toString() || '',
      statut: parcelle.statut || 'DISPONIBLE',
      est_vedette: Boolean(parcelle.est_vedette),
      photo: null
    });
    const imageUrl = getImageUrl(parcelle.photo_url || parcelle.image_principale);
    setPhotoPreview(imageUrl);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('titre', editForm.titre);
      if (editForm.description) formDataToSend.append('description', editForm.description);
      if (editForm.localisation) formDataToSend.append('localisation', editForm.localisation);
      formDataToSend.append('ville', editForm.ville);
      formDataToSend.append('commune', editForm.commune);
      if (editForm.quartier) formDataToSend.append('quartier', editForm.quartier);
      formDataToSend.append('superficie', parseFloat(editForm.superficie));
      formDataToSend.append('type_parcelle', editForm.type_parcelle);
      formDataToSend.append('prix_vente', parseFloat(editForm.prix_vente));
      formDataToSend.append('statut', editForm.statut);
      formDataToSend.append('est_vedette', editForm.est_vedette ? 1 : 0);
      if (editForm.photo) {
        formDataToSend.append('photo', editForm.photo);
      }

      await updateParcelle({ id: editingParcelle.id, body: formDataToSend }).unwrap();
      toast.success('Parcelle mise à jour avec succès');
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Update error:', err);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditForm({ ...editForm, photo: file });
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Debug: afficher l'état
  console.log('ParcellesAdminPage state:', { data, isLoading, isFetching, error });

  if (isLoading) {
    return <div className="p-6">Chargement...</div>;
  }

  if (error) {
    return <div className="p-6 text-error">Erreur: {error.message || 'Erreur de chargement'}</div>;
  }

  const parcelles = data?.data || [];
  const pagination = data?.pagination || null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Gestion des Parcelles</h1>
          <p className="text-on-surface-variant">Consultez et gérez l'inventaire de vos parcelles.</p>
        </div>
        <button 
          onClick={() => navigate('/admin/parcelles/create')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary-container transition"
        >
          <Plus size={20} />
          Nouvelle Parcelle
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-surface-lowest p-4 rounded-xl border border-outline-variant shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-on-surface mb-1">Rechercher</label>
          <input
            placeholder="Code, nom..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="w-40">
          <label className="block text-sm font-medium text-on-surface mb-1">Type</label>
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Tous</option>
            {Object.entries(TYPE_PARCELLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="w-40">
          <label className="block text-sm font-medium text-on-surface mb-1">Statut</label>
          <select
            value={filters.statut}
            onChange={(e) => setFilters(prev => ({ ...prev, statut: e.target.value }))}
            className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Tous</option>
            <option value="DISPONIBLE">Disponible</option>
            <option value="RESERVEE">Réservée</option>
            <option value="VENDUE">Vendue</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="A_AMORCELLER">À amorceller</option>
          </select>
        </div>
        <button 
          onClick={() => setFilters({ search: '', type: '', statut: '', page: 1, limit: 10 })}
          className="flex items-center gap-2 px-3 py-2 border border-outline-variant rounded-lg hover:bg-surface-low transition"
        >
          <Filter size={18} />
          Reset
        </button>
      </div>

      {/* Liste */}
      <div className="bg-surface-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {parcelles.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant">
            <p className="font-inter text-body-md">Aucune parcelle trouvée.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Code</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Nom</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Type</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Prix</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Statut</th>
                <th className="px-4 py-3 text-right text-label-sm font-semibold text-on-surface-variant uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {parcelles.map((parcelle) => (
                <tr key={parcelle.id} className="border-b border-outline-variant hover:bg-surface-low">
                  <td className="px-4 py-3">
                    <span className="font-mono font-medium text-primary">{parcelle.reference || parcelle.code_parcelle || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-on-surface">{parcelle.titre || parcelle.nom || 'Sans nom'}</div>
                      <div className="text-xs text-on-surface-variant">{parcelle.localisation || '—'}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {TYPE_PARCELLE_LABELS?.[parcelle.type_parcelle] || parcelle.type_parcelle || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-secondary">
                      {parcelle.prix_vente ? formatCurrency(parcelle.prix_vente) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const config = STATUS_COLORS?.[parcelle.statut] || STATUS_COLORS?.DISPONIBLE || {};
                      return (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm border ${config?.bg ?? ''} ${config?.text ?? ''} ${config?.border ?? ''}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${config?.dot ?? ''}`} />
                          {parcelle.statut || 'DISPONIBLE'}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button className="p-2 text-on-surface-variant hover:bg-surface-low rounded" title="Voir">
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => handleOpenEdit(parcelle)}
                        className="p-2 text-blue-600 hover:bg-surface-low rounded"
                        title="Modifier"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(parcelle.id)}
                        className="p-2 text-error hover:bg-surface-low rounded"
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

      {/* Modal d'édition */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl shadow-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-outline-variant flex-shrink-0">
              <h2 className="text-lg font-bold text-on-surface">Modifier la Parcelle</h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-5 space-y-6 overflow-y-auto flex-grow">
              {/* Informations de base */}
              <div>
                <h3 className="font-montserrat font-semibold text-title-lg text-on-surface mb-4 flex items-center gap-2">
                  <Map size={20} className="text-secondary" />
                  Informations de Base
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-label-sm font-medium text-on-surface mb-2">
                      Titre *
                    </label>
                    <input
                      type="text"
                      name="titre"
                      value={editForm.titre}
                      onChange={(e) => setEditForm({ ...editForm, titre: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-label-sm font-medium text-on-surface mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Localisation */}
              <div>
                <h3 className="font-montserrat font-semibold text-title-lg text-on-surface mb-4 flex items-center gap-2">
                  <MapPin size={20} className="text-secondary" />
                  Localisation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-label-sm font-medium text-on-surface mb-2">
                      Ville *
                    </label>
                    <select
                      name="ville"
                      value={editForm.ville}
                      onChange={(e) => setEditForm({ ...editForm, ville: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Sélectionner une ville</option>
                      <option value="Goma">Goma</option>
                      <option value="Kinshasa">Kinshasa</option>
                      <option value="Bukavu">Bukavu</option>
                      <option value="Lubumbashi">Lubumbashi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-label-sm font-medium text-on-surface mb-2">
                      Commune *
                    </label>
                    <input
                      type="text"
                      name="commune"
                      value={editForm.commune}
                      onChange={(e) => setEditForm({ ...editForm, commune: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-label-sm font-medium text-on-surface mb-2">
                      Quartier
                    </label>
                    <input
                      type="text"
                      name="quartier"
                      value={editForm.quartier}
                      onChange={(e) => setEditForm({ ...editForm, quartier: e.target.value })}
                      className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-label-sm font-medium text-on-surface mb-2">
                      Localisation précise
                    </label>
                    <input
                      type="text"
                      name="localisation"
                      value={editForm.localisation}
                      onChange={(e) => setEditForm({ ...editForm, localisation: e.target.value })}
                      className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Photo */}
              <div>
                <h3 className="font-montserrat font-semibold text-title-lg text-on-surface mb-4 flex items-center gap-2">
                  <ImageIcon size={20} className="text-secondary" />
                  Photo
                </h3>
                <div>
                  <label className="block text-label-sm font-medium text-on-surface mb-2">
                    Photo de la parcelle
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {photoPreview && (
                    <div className="mt-4">
                      <img
                        src={photoPreview}
                        alt="Aperçu"
                        className="w-full h-48 object-cover rounded-lg border border-outline-variant"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Caractéristiques */}
              <div>
                <h3 className="font-montserrat font-semibold text-title-lg text-on-surface mb-4 flex items-center gap-2">
                  <Home size={20} className="text-secondary" />
                  Caractéristiques
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-label-sm font-medium text-on-surface mb-2">
                      Superficie (m²) *
                    </label>
                    <input
                      type="number"
                      name="superficie"
                      value={editForm.superficie}
                      onChange={(e) => setEditForm({ ...editForm, superficie: e.target.value })}
                      required
                      min="1"
                      step="0.01"
                      className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-label-sm font-medium text-on-surface mb-2">
                      Type de parcelle *
                    </label>
                    <select
                      name="type_parcelle"
                      value={editForm.type_parcelle}
                      onChange={(e) => setEditForm({ ...editForm, type_parcelle: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {Object.entries(TYPE_PARCELLE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-label-sm font-medium text-on-surface mb-2">
                      Statut *
                    </label>
                    <select
                      name="statut"
                      value={editForm.statut}
                      onChange={(e) => setEditForm({ ...editForm, statut: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="DISPONIBLE">Disponible</option>
                      <option value="RESERVEE">Réservée</option>
                      <option value="VENDUE">Vendue</option>
                      <option value="MAINTENANCE">En maintenance</option>
                      <option value="A_AMORCELLER">À amorceller</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Prix et vedette */}
              <div>
                <h3 className="font-montserrat font-semibold text-title-lg text-on-surface mb-4 flex items-center gap-2">
                  <DollarSign size={20} className="text-secondary" />
                  Prix et Mise en Avant
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-label-sm font-medium text-on-surface mb-2">
                      Prix de vente (USD) *
                    </label>
                    <input
                      type="number"
                      name="prix_vente"
                      value={editForm.prix_vente}
                      onChange={(e) => setEditForm({ ...editForm, prix_vente: e.target.value })}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      name="est_vedette"
                      id="edit-est_vedette"
                      checked={editForm.est_vedette}
                      onChange={(e) => setEditForm({ ...editForm, est_vedette: e.target.checked })}
                      className="w-5 h-5 accent-secondary"
                    />
                    <label htmlFor="edit-est_vedette" className="flex items-center gap-2 text-label-md text-on-surface cursor-pointer">
                      <Star size={16} className="text-secondary" />
                      Marquer comme vedette
                    </label>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-low transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary-container transition disabled:opacity-50"
                >
                  {isUpdating ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParcellesAdminPage;
