import React, { useState } from 'react';
import { 
  useGetReservationsQuery, 
  useUpdateReservationStatutMutation 
} from '../../../store/api/reservationsApi';
import { MapPin, Calendar, Clock, CheckCircle, XCircle, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const ReservationsListPage = () => {
  const [filters, setFilters] = useState({ statut: '', page: 1, limit: 10 });
  const { data, isLoading, error } = useGetReservationsQuery(filters);
  const [updateStatut] = useUpdateReservationStatutMutation();
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notesAdmin, setNotesAdmin] = useState('');

  const handleUpdateStatut = async (statut) => {
    try {
      await updateStatut({ id: selectedReservation.id, statut, notes_admin: notesAdmin }).unwrap();
      toast.success(`Réservation ${statut}`);
      setIsModalOpen(false);
      setNotesAdmin('');
      setSelectedReservation(null);
    } catch (err) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const openModal = (reservation) => {
    setSelectedReservation(reservation);
    setNotesAdmin(reservation.notes_admin || '');
    setIsModalOpen(true);
  };

  if (isLoading) {
    return <div className="p-6">Chargement...</div>;
  }

  if (error) {
    return <div className="p-6 text-error">Erreur: {error.message || 'Erreur de chargement'}</div>;
  }

  const reservations = data || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Réservations</h1>
          <p className="text-on-surface-variant text-sm">Suivi des réservations en temps réel.</p>
        </div>
        <div className="flex gap-2">
          <select
            value={filters.statut}
            onChange={(e) => setFilters(prev => ({ ...prev, statut: e.target.value }))}
            className="px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Tous les statuts</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="EN_COURS">En cours</option>
            <option value="CONFIRMEE">Confirmée</option>
            <option value="ANNULEE">Annulée</option>
            <option value="EXPIREE">Expirée</option>
          </select>
        </div>
      </div>

      <div className="bg-surface-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {reservations.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant">
            <p className="font-inter text-body-md">Aucune réservation trouvée.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Client</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Parcelle</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Date</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Expiration</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Statut</th>
                <th className="px-4 py-3 text-right text-label-sm font-semibold text-on-surface-variant uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((row) => (
                <tr key={row.id} className="border-b border-outline-variant hover:bg-surface-low">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-on-surface">{row.nom_client}</span>
                      <span className="text-xs text-on-surface-variant">{row.code_user}</span>
                      <span className="text-xs text-on-surface-variant">{row.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-primary">{row.ref_parcelle}</span>
                      <span className="text-xs text-on-surface-variant flex items-center gap-1">
                        <MapPin size={10} /> {row.ville}, {row.commune}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm flex items-center gap-2">
                      <Calendar size={14} className="text-on-surface-variant" />
                      {format(new Date(row.created_at), 'dd MMM yyyy', { locale: fr })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {row.date_expiration ? (
                      <span className="text-sm font-medium text-error flex items-center gap-2">
                        <Clock size={14} />
                        {format(new Date(row.date_expiration), 'dd MMM yyyy', { locale: fr })}
                      </span>
                    ) : <span className="text-on-surface-variant italic">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
                      row.statut === 'CONFIRMEE' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : row.statut === 'ANNULEE'
                        ? 'bg-red-100 text-red-700'
                        : row.statut === 'EN_COURS'
                        ? 'bg-blue-100 text-blue-700'
                        : row.statut === 'EXPIREE'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {row.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openModal(row)}
                        className="p-2 text-blue-600 hover:bg-surface-low rounded"
                        title="Gérer"
                      >
                        <Filter size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Gestion Statut */}
      {isModalOpen && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-outline-variant flex-shrink-0">
              <h2 className="text-lg font-bold text-on-surface">Gérer la réservation</h2>
              <p className="text-sm text-on-surface-variant mt-1">
                {selectedReservation.ref_parcelle} - {selectedReservation.nom_client}
              </p>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-grow">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Notes admin</label>
                <textarea
                  value={notesAdmin}
                  onChange={(e) => setNotesAdmin(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                  placeholder="Ajoutez vos notes..."
                />
              </div>
              <div className="flex flex-col gap-2">
                {selectedReservation.statut !== 'EN_COURS' && (
                  <button
                    onClick={() => handleUpdateStatut('EN_COURS')}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Passer en cours
                  </button>
                )}
                {selectedReservation.statut !== 'CONFIRMEE' && (
                  <button
                    onClick={() => handleUpdateStatut('CONFIRMEE')}
                    className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                  >
                    Confirmer
                  </button>
                )}
                {selectedReservation.statut !== 'ANNULEE' && (
                  <button
                    onClick={() => handleUpdateStatut('ANNULEE')}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-outline-variant">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setNotesAdmin('');
                  setSelectedReservation(null);
                }}
                className="w-full px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-low transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationsListPage;
