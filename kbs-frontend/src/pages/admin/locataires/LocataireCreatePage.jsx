import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Building2, User, Phone, Mail, Calendar, DollarSign } from 'lucide-react';
import { useCreateLocataireMutation } from '../../../store/api/locatairesApi';
import toast from 'react-hot-toast';

const LocataireCreatePage = () => {
  const navigate = useNavigate();
  const [createLocataire, { isLoading }] = useCreateLocataireMutation();

  const [formData, setFormData] = useState({
    categorie: 'ENTREPRISE',
    nom: '',
    prenom: '',
    date_naissance: '',
    telephone_personnel: '',
    adresse_personnelle: '',
    email: '',
    nom_entreprise: '',
    secteur_activite: '',
    numero_rccm: '',
    numero_nif: '',
    nom_representant: '',
    telephone_entreprise: '',
    email_entreprise: '',
    adresse_siege: '',
    numero_local: '',
    date_debut_loyer: '',
    date_fin_loyer: '',
    montant_mensuel_loyer: '',
    devise: 'USD',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const dataToSend = {
        ...formData,
        montant_mensuel_loyer: parseFloat(formData.montant_mensuel_loyer) || 0
      };
      console.log('Creating locataire with data:', dataToSend);
      const result = await createLocataire(dataToSend).unwrap();
      console.log('Locataire created successfully:', result);
      toast.success('Locataire créé avec succès');
      navigate('/admin/kbs/locataires');
    } catch (error) {
      console.error('Error creating locataire:', error);
      console.error('Error details:', error.data);
      toast.error(error.data?.message || 'Erreur lors de la création du locataire');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/kbs/locataires')}
          className="p-2 rounded-lg hover:bg-surface-low text-on-surface-variant transition"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Créer un Locataire</h1>
          <p className="text-on-surface-variant text-sm">Ajouter un nouveau locataire à KBS Buildings</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Catégorie */}
        <div className="bg-surface-lowest rounded-xl border border-outline-variant shadow-sm p-6">
          <h3 className="font-semibold text-on-surface mb-4 flex items-center gap-2">
            <Building2 size={18} className="text-primary" />
            Type de locataire
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">Catégorie</label>
              <select
                name="categorie"
                value={formData.categorie}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="SIMPLE">Simple</option>
                <option value="ENTREPRISE">Entreprise</option>
              </select>
            </div>
          </div>
        </div>

        {/* Informations entreprise */}
        {formData.categorie === 'ENTREPRISE' && (
          <div className="bg-surface-lowest rounded-xl border border-outline-variant shadow-sm p-6">
            <h3 className="font-semibold text-on-surface mb-4 flex items-center gap-2">
              <Building2 size={18} className="text-primary" />
              Informations Entreprise
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Nom de l'entreprise</label>
                <input
                  type="text"
                  name="nom_entreprise"
                  value={formData.nom_entreprise}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Secteur d'activité</label>
                <input
                  type="text"
                  name="secteur_activite"
                  value={formData.secteur_activite}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Numéro RCCM</label>
                <input
                  type="text"
                  name="numero_rccm"
                  value={formData.numero_rccm}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Numéro NIF</label>
                <input
                  type="text"
                  name="numero_nif"
                  value={formData.numero_nif}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Nom du représentant</label>
                <input
                  type="text"
                  name="nom_representant"
                  value={formData.nom_representant}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Téléphone entreprise</label>
                <input
                  type="text"
                  name="telephone_entreprise"
                  value={formData.telephone_entreprise}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Email entreprise</label>
                <input
                  type="email"
                  name="email_entreprise"
                  value={formData.email_entreprise}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Adresse du siège</label>
                <input
                  type="text"
                  name="adresse_siege"
                  value={formData.adresse_siege}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Numéro local</label>
                <input
                  type="text"
                  name="numero_local"
                  value={formData.numero_local}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* Informations personnelles */}
        {formData.categorie === 'SIMPLE' && (
          <div className="bg-surface-lowest rounded-xl border border-outline-variant shadow-sm p-6">
            <h3 className="font-semibold text-on-surface mb-4 flex items-center gap-2">
              <User size={18} className="text-primary" />
              Informations Personnelles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Nom</label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Prénom</label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Date de naissance</label>
                <input
                  type="date"
                  name="date_naissance"
                  value={formData.date_naissance}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Téléphone</label>
                <input
                  type="text"
                  name="telephone_personnel"
                  value={formData.telephone_personnel}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-on-surface mb-1">Adresse</label>
                <input
                  type="text"
                  name="adresse_personnelle"
                  value={formData.adresse_personnelle}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* Informations contrat */}
        <div className="bg-surface-lowest rounded-xl border border-outline-variant shadow-sm p-6">
          <h3 className="font-semibold text-on-surface mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-primary" />
            Informations Contrat
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">Date début loyer</label>
              <input
                type="date"
                name="date_debut_loyer"
                value={formData.date_debut_loyer}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">Date fin loyer</label>
              <input
                type="date"
                name="date_fin_loyer"
                value={formData.date_fin_loyer}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">Montant mensuel</label>
              <input
                type="number"
                name="montant_mensuel_loyer"
                value={formData.montant_mensuel_loyer}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">Devise</label>
              <select
                name="devise"
                value={formData.devise}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="USD">USD</option>
                <option value="CDF">CDF</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin/locataires')}
            className="px-6 py-2 border border-outline-variant rounded-lg hover:bg-surface-low transition"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary-container transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Création...' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LocataireCreatePage;
