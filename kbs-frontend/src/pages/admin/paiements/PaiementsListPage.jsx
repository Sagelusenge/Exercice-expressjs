import React, { useState } from 'react';
import { 
  useGetPaiementsQuery, 
  useValiderPaiementMutation,
  useRejeterPaiementMutation 
} from '../../../store/api/paiementsApi';
import { CheckCircle, XCircle, Filter, DollarSign, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const PaiementsListPage = () => {
  const [filters, setFilters] = useState({ statut: '', page: 1, limit: 10 });
  const { data, isLoading, error } = useGetPaiementsQuery(filters);
  const [validerPaiement] = useValiderPaiementMutation();
  const [rejeterPaiement] = useRejeterPaiementMutation();
  const [selectedPaiement, setSelectedPaiement] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleValider = async (id) => {
    try {
      await validerPaiement(id).unwrap();
      toast.success('Paiement validé');
    } catch (err) {
      toast.error('Erreur lors de la validation');
    }
  };

  const handleRejeter = async (id) => {
    try {
      await rejeterPaiement(id).unwrap();
      toast.success('Paiement rejeté');
    } catch (err) {
      toast.error('Erreur lors du rejet');
    }
  };

  const openModal = (paiement) => {
    setSelectedPaiement(paiement);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return <div className="p-6">Chargement...</div>;
  }

  if (error) {
    return <div className="p-6 text-error">Erreur: {error.message || 'Erreur de chargement'}</div>;
  }

  const paiements = data || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Paiements Ventes</h1>
          <p className="text-on-surface-variant text-sm">Historique des paiements clients pour les parcelles.</p>
        </div>
        <div className="flex gap-2">
          <select
            value={filters.statut}
            onChange={(e) => setFilters(prev => ({ ...prev, statut: e.target.value }))}
            className="px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Tous les statuts</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="PAYE">Payé</option>
            <option value="ANNULE">Annulé</option>
          </select>
        </div>
      </div>

      <div className="bg-surface-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {paiements.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant">
            <p className="font-inter text-body-md">Aucun paiement trouvé.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Client</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Montant</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Mode</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Date</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Statut</th>
                <th className="px-4 py-3 text-right text-label-sm font-semibold text-on-surface-variant uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paiements.map((row) => (
                <tr key={row.id} className="border-b border-outline-variant hover:bg-surface-low">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-on-surface">{row.nom_client}</span>
                      <span className="text-xs text-on-surface-variant">{row.code_user}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-primary" />
                      <span className="font-bold">{row.montant} {row.devise}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm">{row.mode_paiement}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm flex items-center gap-2">
                      <Calendar size={14} className="text-on-surface-variant" />
                      {format(new Date(row.created_at), 'dd MMM yyyy', { locale: fr })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
                      row.statut === 'PAYE' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : row.statut === 'ANNULE'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {row.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {row.statut === 'EN_ATTENTE' && (
                        <>
                          <button
                            onClick={() => handleValider(row.id)}
                            className="p-2 text-emerald-600 hover:bg-surface-low rounded"
                            title="Valider"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => handleRejeter(row.id)}
                            className="p-2 text-red-600 hover:bg-surface-low rounded"
                            title="Rejeter"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => openModal(row)}
                        className="p-2 text-blue-600 hover:bg-surface-low rounded"
                        title="Détails"
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

      {/* Modal Détails */}
      {isModalOpen && selectedPaiement && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-outline-variant flex-shrink-0">
              <h2 className="text-lg font-bold text-on-surface">Détails du paiement</h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedPaiement(null);
                }}
                className="text-on-surface-variant hover:text-on-surface p-1"
              >
                <XCircle size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-grow">
              <div className="flex items-center gap-3">
                <User size={20} className="text-on-surface-variant" />
                <div>
                  <p className="text-sm text-on-surface-variant">Client</p>
                  <p className="font-medium">{selectedPaiement.nom_client}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign size={20} className="text-on-surface-variant" />
                <div>
                  <p className="text-sm text-on-surface-variant">Montant</p>
                  <p className="font-medium">{selectedPaiement.montant} {selectedPaiement.devise}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-on-surface-variant" />
                <div>
                  <p className="text-sm text-on-surface-variant">Date</p>
                  <p className="font-medium">{format(new Date(selectedPaiement.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}</p>
                </div>
              </div>
              {selectedPaiement.reference_transaction && (
                <div>
                  <p className="text-sm text-on-surface-variant">Référence transaction</p>
                  <p className="font-medium">{selectedPaiement.reference_transaction}</p>
                </div>
              )}
              {selectedPaiement.notes && (
                <div>
                  <p className="text-sm text-on-surface-variant">Notes</p>
                  <p className="font-medium">{selectedPaiement.notes}</p>
                </div>
              )}
              {selectedPaiement.preuve_paiement_url && (
                <div>
                  <p className="text-sm text-on-surface-variant">Preuve de paiement</p>
                  <a 
                    href={selectedPaiement.preuve_paiement_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Voir la preuve
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaiementsListPage;
