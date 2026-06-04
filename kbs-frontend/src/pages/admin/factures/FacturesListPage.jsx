import React, { useState, useEffect } from 'react';
import { 
  useGetFacturesQuery, 
  useCreateFactureMutation,
  useUpdateFactureMutation,
  useValiderFactureMutation,
  useRejeterFactureMutation
} from '../../../store/api/facturesApi';
import { useGetLocatairesQuery } from '../../../store/api/locatairesApi';
import { CheckCircle, X, XCircle, Filter, Download, Edit2, Plus } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';

const FacturesListPage = () => {
  const [filters, setFilters] = useState({ statut: '', locataire_id: '', page: 1, limit: 10 });
  const { data: factures, isLoading, isFetching, error } = useGetFacturesQuery(filters);
  const { data: locataires } = useGetLocatairesQuery({ limit: 100 });
  
  const [createFacture, { isLoading: isCreating }] = useCreateFactureMutation();
  const [updateFacture] = useUpdateFactureMutation();
  const [validerFacture] = useValiderFactureMutation();
  const [rejeterFacture] = useRejeterFactureMutation();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    locataire_id: '',
    periode_debut: '',
    periode_fin: '',
    montant_loyer: '',
    devise: 'USD',
    notes_admin: ''
  });

  const handleLocataireChange = (locataireId) => {
    const selectedLocataire = locataires?.find(l => l.id === parseInt(locataireId));
    if (selectedLocataire) {
      const newForm = {
        ...createForm,
        locataire_id: locataireId,
        periode_debut: selectedLocataire.date_debut_loyer ? format(new Date(selectedLocataire.date_debut_loyer), 'yyyy-MM-dd') : '',
        periode_fin: selectedLocataire.date_fin_loyer ? format(new Date(selectedLocataire.date_fin_loyer), 'yyyy-MM-dd') : '',
        montant_loyer: selectedLocataire.montant_mensuel_loyer || '',
        devise: selectedLocataire.devise || 'USD'
      };
      setCreateForm(newForm);
    } else {
      setCreateForm({
        ...createForm,
        locataire_id: '',
        periode_debut: '',
        periode_fin: '',
        montant_loyer: '',
        devise: 'USD'
      });
    }
  };

  // Calculate number of months between two dates
  const calculateMonths = (date1, date2) => {
    if (!date1 || !date2) return 0;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    if (d1 > d2) return 0;
    let months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months += d2.getMonth() - d1.getMonth();
    // Add 1 if the end day is >= start day
    if (d2.getDate() >= d1.getDate()) {
      months += 1;
    }
    return Math.max(1, months);
  };

  // Recalculate total when dates or monthly rent change
  useEffect(() => {
    if (createForm.locataire_id && createForm.montant_loyer && createForm.periode_debut && createForm.periode_fin) {
      const selectedLocataire = locataires?.find(l => l.id === parseInt(createForm.locataire_id));
      const monthlyRent = selectedLocataire?.montant_mensuel_loyer || Number(createForm.montant_loyer);
      const months = calculateMonths(createForm.periode_debut, createForm.periode_fin);
      const total = monthlyRent * months;
      setCreateForm(prev => ({
        ...prev,
        montant_loyer: total
      }));
    }
  }, [createForm.periode_debut, createForm.periode_fin, createForm.locataire_id]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const montant = Number(String(createForm.montant_loyer).replace(',', '.'));
      if (!createForm.locataire_id) {
        toast.error('Sélectionnez un locataire');
        return;
      }
      if (!createForm.periode_debut || !createForm.periode_fin) {
        toast.error('La période est obligatoire');
        return;
      }
      if (new Date(createForm.periode_debut) > new Date(createForm.periode_fin)) {
        toast.error('La date de début doit être avant la date de fin');
        return;
      }
      if (!Number.isFinite(montant) || montant <= 0) {
        toast.error('Le montant doit être supérieur à 0');
        return;
      }

      const formData = {
        ...createForm,
        locataire_id: parseInt(createForm.locataire_id),
        montant_loyer: montant,
        notes_admin: createForm.notes_admin.trim()
      };
      await createFacture(formData).unwrap();
      toast.success('Facture créée');
      setIsCreateModalOpen(false);
      setCreateForm({
        locataire_id: '',
        periode_debut: '',
        periode_fin: '',
        montant_loyer: '',
        devise: 'USD',
        notes_admin: ''
      });
    } catch (err) {
      console.error('Facture create error:', err);
      const errorMessage = err?.data?.message || err?.message || 'Erreur lors de la création';
      toast.error(errorMessage);
    }
  };

  const handleValider = async (id) => {
    try {
      await validerFacture({ id, pdf_url: '' }).unwrap();
      toast.success('Facture validée');
    } catch (err) {
      toast.error('Erreur de validation');
    }
  };

  const handleRejeter = async (id) => {
    const motif = window.prompt('Motif du rejet:');
    if (!motif) return;
    try {
      await rejeterFacture({ id, motif }).unwrap();
      toast.success('Facture rejetée');
    } catch (err) {
      toast.error('Erreur lors du rejet');
    }
  };

  const handleDownload = (facture) => {
    if (facture.pdf_url) {
      window.open(facture.pdf_url, '_blank');
    } else {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`Facture ${facture.reference}`, 14, 20);
      doc.setFontSize(11);
      doc.text(`Locataire: ${facture.nom_locataire || '-'}`, 14, 34);
      doc.text(`Période: ${facture.periode_debut ? format(new Date(facture.periode_debut), 'dd/MM/yyyy') : '-'} - ${facture.periode_fin ? format(new Date(facture.periode_fin), 'dd/MM/yyyy') : '-'}`, 14, 42);
      doc.text(`Montant: ${formatCurrency(facture.montant_loyer || 0)}`, 14, 54);
      doc.text(`Payé: ${formatCurrency(facture.montant_paye || 0)}`, 14, 62);
      doc.text(`Reste à payer: ${formatCurrency(facture.montant_restant || 0)}`, 14, 70);
      doc.text(`Statut: ${facture.statut}`, 14, 82);
      doc.save(`${facture.reference}.pdf`);
    }
  };

  const handleEdit = async (facture) => {
    const nextAmount = window.prompt('Nouveau montant de la facture:', facture.montant_loyer);
    if (nextAmount === null) return;
    try {
      await updateFacture({ id: facture.id, montant_loyer: nextAmount }).unwrap();
      toast.success('Facture mise à jour');
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur de modification');
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
          <h1 className="text-2xl font-bold text-on-surface">Factures</h1>
          <p className="text-on-surface-variant">Liste des factures des locataires.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:opacity-90 transition"
        >
          <Plus size={16} />
          Ajouter Facture
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
            <option value="VALIDEE">Validée</option>
            <option value="REJETEE">Rejetée</option>
          </select>
        </div>
      </div>

      <div className="bg-surface-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {factures?.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant">
            <p className="font-inter text-body-md">Aucune facture trouvée.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Réf</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Locataire</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Période</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Montant</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Payé</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Reste</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Statut</th>
                <th className="px-4 py-3 text-right text-label-sm font-semibold text-on-surface-variant uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {factures?.map((f) => (
                <tr key={f.id} className="border-b border-outline-variant hover:bg-surface-low">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-primary">{f.reference}</span>
                  </td>
                  <td className="px-4 py-3">{f.nom_locataire}</td>
                  <td className="px-4 py-3">
                    {f.periode_debut && f.periode_fin ? (
                      <span>
                        Du {format(new Date(f.periode_debut), 'dd/MM/yyyy')} au {format(new Date(f.periode_fin), 'dd/MM/yyyy')}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold">{formatCurrency(f.montant_loyer)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-emerald-600">{formatCurrency(f.montant_paye || 0)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${Number(f.montant_restant) > 0 ? 'text-error' : 'text-emerald-600'}`}>
                      {formatCurrency(f.montant_restant || 0)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
                      f.statut === 'VALIDEE' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : f.statut === 'REJETEE'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {f.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => handleDownload(f)}
                        className="p-2 text-on-surface-variant hover:bg-surface-low rounded"
                        title="Télécharger"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(f)}
                        className="p-2 text-on-surface-variant hover:bg-surface-low rounded"
                        title="Modifier"
                      >
                        <Edit2 size={16} />
                      </button>
                      {f.statut !== 'VALIDEE' && (
                          <button 
                            onClick={() => handleValider(f.id)}
                            className="p-2 text-emerald-600 hover:bg-surface-low rounded"
                            title="Valider"
                          >
                            <CheckCircle size={16} />
                          </button>
                      )}
                      {f.statut !== 'REJETEE' && (
                          <button 
                            onClick={() => handleRejeter(f.id)}
                            className="p-2 text-red-600 hover:bg-surface-low rounded"
                            title="Rejeter"
                          >
                            <XCircle size={16} />
                          </button>
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
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-outline-variant flex-shrink-0">
              <h2 className="text-lg font-bold text-on-surface">Ajouter Facture</h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4 overflow-y-auto flex-grow">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Locataire</label>
                <select
                  value={createForm.locataire_id}
                  onChange={(e) => handleLocataireChange(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Sélectionnez un locataire</option>
                  {locataires?.map((l) => (
                    <option key={l.id} value={l.id}>{l.nom_affichage} ({l.code_locataire})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Date Début Période</label>
                  <input
                    type="date"
                    value={createForm.periode_debut}
                    onChange={(e) => setCreateForm({ ...createForm, periode_debut: e.target.value })}
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Date Fin Période</label>
                  <input
                    type="date"
                    value={createForm.periode_fin}
                    onChange={(e) => setCreateForm({ ...createForm, periode_fin: e.target.value })}
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Montant Loyer</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={createForm.montant_loyer}
                  onChange={(e) => setCreateForm({ ...createForm, montant_loyer: e.target.value })}
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
                  <option value="USD">$</option>
                  <option value="CDF">Fc</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Notes Admin</label>
                <textarea
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                  value={createForm.notes_admin}
                  onChange={(e) => setCreateForm({ ...createForm, notes_admin: e.target.value })}
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
                  disabled={isCreating}
                  className="px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary-container transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacturesListPage;
