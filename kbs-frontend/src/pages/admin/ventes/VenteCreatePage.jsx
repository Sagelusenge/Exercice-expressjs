import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, ShoppingCart, User, MapPin, DollarSign, FileText } from "lucide-react";
import { useCreateVenteMutation } from "../../../store/api/ventesApi";
import { useGetUsersQuery } from "../../../store/api/usersApi";
import { useGetParcellesAdminQuery } from "../../../store/api/parcellesApi";
import toast from "react-hot-toast";
import Button from "../../../components/ui/Button";

export default function VenteCreatePage() {
  const navigate = useNavigate();
  const [createVente, { isLoading }] = useCreateVenteMutation();
  const { data: usersData } = useGetUsersQuery({ role: "CLIENT" });
  const { data: parcellesData } = useGetParcellesAdminQuery({});

  const clients = usersData || [];
  const parcelles = (parcellesData?.data || []).filter((p) => !["VENDUE", "ARCHIVEE"].includes(p.statut));

  const [formData, setFormData] = useState({
    user_id: "",
    parcelle_id: "",
    reservation_id: "",
    montant_total: "",
    montant_paye_initial: "",
    mode_paiement: "CASH",
    reference_transaction: "",
    devise: "USD",
    notes: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await createVente({
        ...formData,
        montant_total: parseFloat(formData.montant_total),
        montant_paye_initial: parseFloat(formData.montant_paye_initial || 0),
        reservation_id: null,
      }).unwrap();
      toast.success("Vente créée avec succès");
      navigate("/admin/ventes");
    } catch (error) {
      toast.error(error.data?.message || "Erreur lors de la création de la vente");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "parcelle_id") {
      const selectedParcelle = parcelles.find(p => p.id === parseInt(value));
      if (selectedParcelle) {
        setFormData({
          ...formData,
          parcelle_id: value,
          montant_total: selectedParcelle.prix || "",
          devise: selectedParcelle.devise || "USD",
        });
        return;
      }
    }
    
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/admin/ventes")}
          className="p-2 rounded-lg hover:bg-surface-low text-on-surface-variant transition"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-montserrat font-bold text-headline-lg text-on-surface">
            Créer une Vente
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Enregistrer une nouvelle vente de parcelle
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="kbs-card w-full">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Client et Parcelle */}
          <div>
            <h3 className="font-montserrat font-semibold text-title-lg text-on-surface mb-4 flex items-center gap-2">
              <ShoppingCart size={20} className="text-secondary" />
              Sélection
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-label-sm font-medium text-on-surface mb-2">
                  Client *
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <select
                    name="user_id"
                    value={formData.user_id}
                    onChange={handleChange}
                    required
                    className="kbs-input w-full pl-10"
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.nom} {client.prenom} - {client.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-label-sm font-medium text-on-surface mb-2">
                  Parcelle *
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <select
                    name="parcelle_id"
                    value={formData.parcelle_id}
                    onChange={handleChange}
                    required
                    className="kbs-input w-full pl-10"
                  >
                    <option value="">Sélectionner une parcelle</option>
                    {parcelles.map((parcelle) => (
                      <option key={parcelle.id} value={parcelle.id}>
                        {parcelle.reference} - {parcelle.titre} ({parcelle.ville}) - {parcelle.statut}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Montant */}
          <div>
            <h3 className="font-montserrat font-semibold text-title-lg text-on-surface mb-4 flex items-center gap-2">
              <DollarSign size={20} className="text-secondary" />
              Montant
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-label-sm font-medium text-on-surface mb-2">
                  Montant total du *
                </label>
                <input
                  type="number"
                  name="montant_total"
                  value={formData.montant_total}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="kbs-input w-full"
                  placeholder="15000.00"
                />
              </div>
              <div>
                <label className="block text-label-sm font-medium text-on-surface mb-2">
                  Devise
                </label>
                <select
                  name="devise"
                  value={formData.devise}
                  onChange={handleChange}
                  className="kbs-input w-full"
                >
                  <option value="USD">$</option>
                  <option value="CDF">Fc</option>
                </select>
              </div>
              <div>
                <label className="block text-label-sm font-medium text-on-surface mb-2">
                  Tranche payee maintenant
                </label>
                <input
                  type="number"
                  name="montant_paye_initial"
                  value={formData.montant_paye_initial}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="kbs-input w-full"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-label-sm font-medium text-on-surface mb-2">
                  Mode de paiement
                </label>
                <select
                  name="mode_paiement"
                  value={formData.mode_paiement}
                  onChange={handleChange}
                  className="kbs-input w-full"
                >
                  <option value="CASH">Cash</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="VIREMENT">Virement</option>
                  <option value="CARTE">Carte</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-label-sm font-medium text-on-surface mb-2">
                  Reference transaction
                </label>
                <input
                  type="text"
                  name="reference_transaction"
                  value={formData.reference_transaction}
                  onChange={handleChange}
                  className="kbs-input w-full"
                  placeholder="Reference, numero ou note de paiement"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="font-montserrat font-semibold text-title-lg text-on-surface mb-4 flex items-center gap-2">
              <FileText size={20} className="text-secondary" />
              Notes
            </h3>
            <div>
              <label className="block text-label-sm font-medium text-on-surface mb-2">
                Notes additionnelles
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="kbs-input w-full"
                placeholder="Notes concernant cette vente..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-outline-variant">
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={Save}
              loading={isLoading}
            >
              Créer la Vente
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => navigate("/admin/ventes")}
            >
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
