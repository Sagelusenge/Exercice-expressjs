import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, User, Mail, Phone, MapPin, Shield, Lock } from "lucide-react";
import { useCreateUserMutation } from "../../../store/api/usersApi";
import toast from "react-hot-toast";
import Button from "../../../components/ui/Button";
import { ROLE_LABELS } from "../../../design-system/tokens";

export default function UserCreatePage() {
  const navigate = useNavigate();
  const [createUser, { isLoading }] = useCreateUserMutation();

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    role: "CLIENT",
    mot_de_passe: "",
    adresse: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      console.log('Creating user with data:', formData);
      const result = await createUser(formData).unwrap();
      console.log('User created successfully:', result);
      toast.success("Utilisateur créé avec succès");
      navigate("/admin/users");
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.data?.message || error.message || "Erreur lors de la création de l'utilisateur");
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/admin/users")}
          className="p-2 rounded-lg hover:bg-surface-low text-on-surface-variant transition"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-montserrat font-bold text-headline-lg text-on-surface">
            Créer un Utilisateur
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Ajouter un nouvel utilisateur au système
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="kbs-card max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Informations personnelles */}
          <div>
            <h3 className="font-montserrat font-semibold text-title-lg text-on-surface mb-4 flex items-center gap-2">
              <User size={20} className="text-secondary" />
              Informations Personnelles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-label-sm font-medium text-on-surface mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                  className="kbs-input w-full"
                  placeholder="Dupont"
                />
              </div>
              <div>
                <label className="block text-label-sm font-medium text-on-surface mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  required
                  className="kbs-input w-full"
                  placeholder="Jean"
                />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-montserrat font-semibold text-title-lg text-on-surface mb-4 flex items-center gap-2">
              <Mail size={20} className="text-secondary" />
              Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-label-sm font-medium text-on-surface mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="kbs-input w-full pl-10"
                    placeholder="jean.dupont@email.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-label-sm font-medium text-on-surface mb-2">
                  Téléphone
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    type="tel"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleChange}
                    className="kbs-input w-full pl-10"
                    placeholder="+243 000 000 000"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Adresse */}
          <div>
            <h3 className="font-montserrat font-semibold text-title-lg text-on-surface mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-secondary" />
              Adresse
            </h3>
            <div>
              <label className="block text-label-sm font-medium text-on-surface mb-2">
                Adresse complète
              </label>
              <textarea
                name="adresse"
                value={formData.adresse}
                onChange={handleChange}
                rows={2}
                className="kbs-input w-full"
                placeholder="123 Rue de la République, Goma, RDC"
              />
            </div>
          </div>

          {/* Rôle et sécurité */}
          <div>
            <h3 className="font-montserrat font-semibold text-title-lg text-on-surface mb-4 flex items-center gap-2">
              <Shield size={20} className="text-secondary" />
              Rôle et Sécurité
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-label-sm font-medium text-on-surface mb-2">
                  Rôle *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  className="kbs-input w-full"
                >
                  {Object.entries(ROLE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-label-sm font-medium text-on-surface mb-2">
                  Mot de passe *
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    type="password"
                    name="mot_de_passe"
                    value={formData.mot_de_passe}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="kbs-input w-full pl-10"
                    placeholder="••••••••"
                  />
                </div>
                <p className="text-label-sm text-on-surface-variant mt-1">
                  Minimum 6 caractères
                </p>
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
              Créer l'Utilisateur
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => navigate("/admin/users")}
            >
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
