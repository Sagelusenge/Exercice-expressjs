import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useGetVentesQuery, 
  useDeleteVenteMutation,
  useUpdateVenteMutation,
  useConfirmerVenteMutation
} from '../../../store/api/ventesApi';
import { Trash2, Edit2, Printer, CheckCircle, Plus, X } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const VentesListPage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ page: 1, limit: 10 });
  const { data, isLoading, isFetching, error } = useGetVentesQuery(filters);
  
  const [deleteVente] = useDeleteVenteMutation();
  const [updateVente] = useUpdateVenteMutation();
  const [confirmerVente] = useConfirmerVenteMutation();

  const [selectedVente, setSelectedVente] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ montant_total: '', notes: '', statut: '' });

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cette vente ?')) {
      try {
        await deleteVente(id).unwrap();
        toast.success('Vente supprimée');
      } catch (err) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleConfirmer = async (id) => {
    try {
      await confirmerVente(id).unwrap();
      toast.success('Vente confirmée');
    } catch (err) {
      toast.error(err.data?.message || 'Erreur de confirmation');
    }
  };

  const handleOpenEdit = (vente) => {
    setSelectedVente(vente);
    setEditForm({
      montant_total: vente.montant_total,
      notes: vente.notes || '',
      statut: vente.statut
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateVente({ id: selectedVente.id, ...editForm }).unwrap();
      toast.success('Vente mise à jour');
      setIsEditModalOpen(false);
    } catch (err) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handlePrint = (vente) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Reçu de Vente - ${vente.reference}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #777; }
            .stamp { border: 3px solid #1a73e8; color: #1a73e8; padding: 10px; display: inline-block; transform: rotate(-5deg); font-weight: bold; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>KBS REAL ESTATE</h1>
            <p>Reçu de Vente Officiel</p>
          </div>
          <div class="row"><strong>Référence:</strong> <span>${vente.reference}</span></div>
          <div class="row"><strong>Date:</strong> <span>${format(new Date(vente.date_vente), 'dd MMMM yyyy', { locale: fr })}</span></div>
          <div class="row"><strong>Client:</strong> <span>${vente.nom_client}</span></div>
          <div class="row"><strong>Parcelle:</strong> <span>${vente.ref_parcelle} - ${vente.titre_parcelle}</span></div>
          <div class="row"><strong>Montant Total:</strong> <span>${formatCurrency(vente.montant_total)}</span></div>
          <div class="row"><strong>Statut:</strong> <span>${vente.statut}</span></div>
          <div style="text-align: right;">
            <div class="stamp">PAYÉ / VALIDÉ</div>
          </div>
          <div class="footer">
            <p>KITUMAINI BALEZI Serge - Goma, RDC</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Debug
  console.log('VentesListPage state:', { data, isLoading, isFetching, error });

  if (isLoading) {
    return <div className="p-6">Chargement...</div>;
  }

  if (error) {
    return <div className="p-6 text-error">Erreur: {error.message || 'Erreur de chargement'}</div>;
  }

  const ventes = data || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Gestion des Ventes</h1>
          <p className="text-on-surface-variant">Consultez et gérez les transactions de vente.</p>
        </div>
        <button 
          onClick={() => navigate('/admin/ventes/create')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary-container transition"
        >
          <Plus size={20} />
          Nouvelle Vente
        </button>
      </div>

      <div className="bg-surface-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {ventes.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant">
            <p className="font-inter text-body-md">Aucune vente trouvée.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Réf</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Client</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Parcelle</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Montant</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Statut</th>
                <th className="px-4 py-3 text-right text-label-sm font-semibold text-on-surface-variant uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ventes.map((vente) => (
                <tr key={vente.id} className="border-b border-outline-variant hover:bg-surface-low">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-primary">{vente.reference}</span>
                  </td>
                  <td className="px-4 py-3">{vente.nom_client}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs">{vente.titre_parcelle} ({vente.ref_parcelle})</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold">{formatCurrency(vente.montant_total)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
                      vente.statut === 'COMPLETE' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {vente.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => handlePrint(vente)}
                        className="p-2 text-on-surface-variant hover:bg-surface-low rounded"
                        title="Imprimer"
                      >
                        <Printer size={16} />
                      </button>
                      {vente.statut === 'EN_COURS' && (
                        <button 
                          onClick={() => handleConfirmer(vente.id)}
                          className="p-2 text-emerald-600 hover:bg-surface-low rounded"
                          title="Confirmer"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleOpenEdit(vente)}
                        className="p-2 text-blue-600 hover:bg-surface-low rounded"
                        title="Modifier"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(vente.id)}
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

      {/* Modal Edition */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl shadow-lg max-w-lg w-full mx-4">
            <div className="flex justify-between items-center p-6 border-b border-outline-variant">
              <h2 className="text-xl font-bold text-on-surface">Modifier la Vente</h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Montant Total</label>
                <input
                  type="number"
                  value={editForm.montant_total}
                  onChange={(e) => setEditForm({ ...editForm, montant_total: e.target.value })}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Notes</label>
                <textarea
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
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

export default VentesListPage;
