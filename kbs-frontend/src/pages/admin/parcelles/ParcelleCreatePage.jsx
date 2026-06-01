import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Map, Home, DollarSign, MapPin, Star, Image as ImageIcon } from "lucide-react";
import { useCreateParcelleMutation } from "../../../store/api/parcellesApi";
import toast from "react-hot-toast";
import Button from "../../../components/ui/Button";
import { TYPE_PARCELLE_LABELS } from "../../../design-system/tokens";

export default function ParcelleCreatePage() {
  const navigate = useNavigate();
  const [createParcelle, { isLoading }] = useCreateParcelleMutation();

  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    localisation: "",
    ville: "",
    commune: "",
    quartier: "",
    superficie: "",
    type_parcelle: "RESIDENTIELLE",
    prix_vente: "",
    statut: "DISPONIBLE",
    est_vedette: false,
    photo: null,
  });

  const [photoPreview, setPhotoPreview] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('titre', formData.titre);
      if (formData.description) formDataToSend.append('description', formData.description);
      if (formData.localisation) formDataToSend.append('localisation', formData.localisation);
      formDataToSend.append('ville', formData.ville);
      formDataToSend.append('commune', formData.commune);
      if (formData.quartier) formDataToSend.append('quartier', formData.quartier);
      formDataToSend.append('superficie', parseFloat(formData.superficie));
      formDataToSend.append('type_parcelle', formData.type_parcelle);
      formDataToSend.append('prix_vente', parseFloat(formData.prix_vente));
      formDataToSend.append('statut', formData.statut);
      formDataToSend.append('est_vedette', formData.est_vedette ? 1 : 0);
      if (formData.photo) {
        formDataToSend.append('photo', formData.photo);
      }

      console.log('Sending parcelle data with FormData');
      await createParcelle(formDataToSend).unwrap();
      toast.success("Parcelle créée avec succès");
      navigate("/admin/parcelles");
    } catch (error) {
      console.error('Error creating parcelle:', error);
      toast.error(error.data?.message || "Erreur lors de la création de la parcelle");
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, photo: file });
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/admin/parcelles")}
          className="p-2 rounded-lg hover:bg-surface-low text-on-surface-variant transition"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-montserrat font-bold text-headline-lg text-on-surface">
            Créer une Parcelle
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Ajouter une nouvelle parcelle au catalogue
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="kbs-card max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
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
                  value={formData.titre}
                  onChange={handleChange}
                  required
                  className="kbs-input w-full"
                  placeholder="Terrain résidentiel à Karisimbi"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-label-sm font-medium text-on-surface mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="kbs-input w-full"
                placeholder="Description détaillée de la parcelle..."
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
                  value={formData.ville}
                  onChange={handleChange}
                  required
                  className="kbs-input w-full"
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
                  value={formData.commune}
                  onChange={handleChange}
                  required
                  className="kbs-input w-full"
                  placeholder="Karisimbi"
                />
              </div>
              <div>
                <label className="block text-label-sm font-medium text-on-surface mb-2">
                  Quartier
                </label>
                <input
                  type="text"
                  name="quartier"
                  value={formData.quartier}
                  onChange={handleChange}
                  className="kbs-input w-full"
                  placeholder="Volcan"
                />
              </div>
              <div>
                <label className="block text-label-sm font-medium text-on-surface mb-2">
                  Localisation précise
                </label>
                <input
                  type="text"
                  name="localisation"
                  value={formData.localisation}
                  onChange={handleChange}
                  className="kbs-input w-full"
                  placeholder=" Avenue de la Paix, n°45"
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
                className="kbs-input w-full"
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
                  value={formData.superficie}
                  onChange={handleChange}
                  required
                  min="1"
                  step="0.01"
                  className="kbs-input w-full"
                  placeholder="500"
                />
              </div>
              <div>
                <label className="block text-label-sm font-medium text-on-surface mb-2">
                  Type de parcelle *
                </label>
                <select
                  name="type_parcelle"
                  value={formData.type_parcelle}
                  onChange={handleChange}
                  required
                  className="kbs-input w-full"
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
                  value={formData.statut}
                  onChange={handleChange}
                  required
                  className="kbs-input w-full"
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
                  value={formData.prix_vente}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="kbs-input w-full"
                  placeholder="15000"
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  name="est_vedette"
                  id="est_vedette"
                  checked={formData.est_vedette}
                  onChange={handleChange}
                  className="w-5 h-5 accent-secondary"
                />
                <label htmlFor="est_vedette" className="flex items-center gap-2 text-label-md text-on-surface cursor-pointer">
                  <Star size={16} className="text-secondary" />
                  Marquer comme vedette
                </label>
              </div>
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
              Créer la Parcelle
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => navigate("/admin/parcelles")}
            >
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
