import React, { useState } from 'react';
import { 
  useGetPaiementsLoyerQuery, 
  useCreatePaiementLoyerMutation,
  useValiderPaiementLoyerMutation,
  useRejeterPaiementLoyerMutation
} from '../../../store/api/paiementsLoyerApi';
import { useGetLocatairesQuery } from '../../../store/api/locatairesApi';
import { useGetFacturesQuery } from '../../../store/api/facturesApi';
import { CheckCircle, X, XCircle, Filter, Plus } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const PaiementsLoyerPage = () => {
  const [filters, setFilters] = useState({ statut: '', locataire_id: '', page: 1, limit: 10 });
  const { data: paiements, isLoading, isFetching, error } = useGetPaiementsLoyerQuery(filters);
  const { data: locataires } = useGetLocatairesQuery({ limit: 100 });
  const { data: factures } = useGetFacturesQuery({ limit: 100 });
  
  const [createPaiementLoyer] = useCreatePaiementLoyerMutation();
  const [validerPaiementLoyer] = useValiderPaiementLoyerMutation();
  const [rejeterPaiementLoyer] = useRejeterPaiementLoyerMutation();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    locataire_id: '',
    facture_id: '',
    montant_paye: '',
    devise: 'USD',
    mode_paiement: '',
    reference_paiement: '',
    preuve_url: '',
    notes: ''
  });

  const selectedFacture = factures?.find((f) => String(f.id) === String(createForm.facture_id));
  const selectedLocataire = locataires?.find((l) => String(l.id) === String(selectedFacture?.locataire_id));

  const getLocataireName = (locataire) => {
    if (!locataire) return '';
    return locataire.nom_affichage || locataire.nom_locataire || `${locataire.nom || ''} ${locataire.prenom || ''}`.trim();
  };

  const handleFactureChange = (factureId) => {
    const facture = factures?.find(
      (f) => String(f.id) === String(factureId)
    );
    const locataire = locataires?.find((l) => String(l.id) === String(facture?.locataire_id));

    setCreateForm((prev) => ({
      ...prev,
      locataire_id: facture?.locataire_id || '',
      facture_id: factureId,
      montant_paye: facture?.montant_restant ?? facture?.montant_loyer ?? prev.montant_paye,
      devise: facture?.devise || locataire?.devise || prev.devise || 'USD',
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      if (!createForm.facture_id) {
        toast.error('Selectionnez une facture');
        return;
      }

      const montant = Number(String(createForm.montant_paye).replace(',', '.'));
      if (!Number.isFinite(montant) || montant <= 0) {
        toast.error('Le montant payé doit être supérieur à 0');
        return;
      }

      await createPaiementLoyer({
        ...createForm,
        montant_paye: montant,
      }).unwrap();
      toast.success('Paiement de loyer créé');
      setIsCreateModalOpen(false);
      setCreateForm({
        locataire_id: '',
        facture_id: '',
        montant_paye: '',
        devise: 'USD',
        mode_paiement: '',
        reference_paiement: '',
        preuve_url: '',
        notes: ''
      });
    } catch (err) {
      toast.error('Erreur lors de la création');
    }
  };

  const handleValider = async (id) => {
    try {
      await validerPaiementLoyer(id).unwrap();
      toast.success('Paiement validé');
    } catch (err) {
      toast.error('Erreur de validation');
    }
  };

  const handleRejeter = async (id) => {
    try {
      await rejeterPaiementLoyer(id).unwrap();
      toast.success('Paiement rejeté');
    } catch (err) {
      toast.error('Erreur lors du rejet');
    }
  };

  if (isLoading) {
    return <div className="p-6">Chargement...</div>;
  }

  if (error) {
    return <div className="p-6 text-error">Erreur: {error.message || 'Erreur de chargement'}</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Paiements de Loyer</h1>
          <p className="text-on-surface-variant">Gérez les paiements de loyer des locataires.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary-container transition"
        >
          <Plus size={16} />
          Ajouter Paiement
        </button>
      </div>

      <div className="bg-surface-lowest rounded-xl border border-outline-variant p-4">
        <div className="flex gap-4 items-center">
          <Filter size={18} className="text-on-surface-variant" />
          <select
            value={filters.statut}
            onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
            className="px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Tous les statuts</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="VALIDE">Validé</option>
            <option value="REJETE">Rejeté</option>
          </select>
        </div>
      </div>

      <div className="bg-surface-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {paiements?.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant">
            <p className="font-inter text-body-md">Aucun paiement de loyer trouvé.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Réf</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Locataire</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Facture</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Payé</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Reste</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Mode Paiement</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Date</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Statut</th>
                <th className="px-4 py-3 text-right text-label-sm font-semibold text-on-surface-variant uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paiements?.map((p) => (
                <tr key={p.id} className="border-b border-outline-variant hover:bg-surface-low">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-primary">{p.reference}</span>
                  </td>
                  <td className="px-4 py-3">{p.nom_locataire}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-on-surface">{p.facture_reference || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold">{formatCurrency(p.montant_paye)} {p.devise}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-error">
                      {p.montant_restant !== null && p.montant_restant !== undefined ? formatCurrency(p.montant_restant) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{p.mode_paiement}</td>
                  <td className="px-4 py-3">
                    {p.date_paiement ? format(new Date(p.date_paiement), 'dd/MM/yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
                      p.statut === 'VALIDE' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : p.statut === 'REJETE'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {p.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {p.statut === 'EN_ATTENTE' && (
                        <>
                          <button 
                            onClick={() => handleValider(p.id)}
                            className="p-2 text-emerald-600 hover:bg-surface-low rounded"
                            title="Valider"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button 
                            onClick={() => handleRejeter(p.id)}
                            className="p-2 text-red-600 hover:bg-surface-low rounded"
                            title="Rejeter"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-outline-variant flex-shrink-0">
              <h2 className="text-lg font-bold text-on-surface">Ajouter Paiement de Loyer</h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4 overflow-y-auto flex-grow">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Facture</label>
                <select
                  value={createForm.facture_id}
                  onChange={(e) => handleFactureChange(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Selectionnez une facture</option>
                  {factures
                    ?.filter((f) => Number(f.montant_restant ?? f.montant_loyer ?? 0) > 0 && f.statut !== 'REJETEE')
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.reference} - {f.nom_locataire || 'Locataire'} - Reste {formatCurrency(f.montant_restant ?? f.montant_loyer ?? 0)}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Locataire</label>
                <input
                  type="text"
                  value={selectedLocataire ? getLocataireName(selectedLocataire) : ''}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface-low text-on-surface-variant"
                  readOnly
                  placeholder="Automatique apres selection de la facture"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Reste à payer</label>
                <input
                  type="text"
                  value={selectedFacture ? formatCurrency(selectedFacture.montant_restant ?? selectedFacture.montant_loyer ?? 0) : ''}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface-low text-error font-semibold"
                  readOnly
                  placeholder="Automatique après sélection de la facture"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Montant Payé</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={createForm.montant_paye}
                  onChange={(e) => setCreateForm({ ...createForm, montant_paye: e.target.value })}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Devise</label>
                <select
                  value={createForm.devise}
                  onChange={(e) => setCreateForm({ ...createForm, devise: e.target.value })}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="USD">USD</option>
                  <option value="CDF">CDF</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Mode de Paiement</label>
                <select
                  value={createForm.mode_paiement}
                  onChange={(e) => setCreateForm({ ...createForm, mode_paiement: e.target.value })}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Sélectionnez un mode</option>
                  <option value="CASH">Cash</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="VIREMENT">Virement</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Référence Paiement</label>
                <input
                  type="text"
                  value={createForm.reference_paiement}
                  onChange={(e) => setCreateForm({ ...createForm, reference_paiement: e.target.value })}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">URL Preuve (optionnel)</label>
                <input
                  type="text"
                  value={createForm.preuve_url}
                  onChange={(e) => setCreateForm({ ...createForm, preuve_url: e.target.value })}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Notes</label>
                <textarea
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-low transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary-container transition"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaiementsLoyerPage;
