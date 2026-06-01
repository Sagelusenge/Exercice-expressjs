import React, { useState, useEffect } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { TYPE_PARCELLE_LABELS } from '../../design-system/tokens';

const ParcelleForm = ({ initialData, onSubmit, isLoading, onCancel }) => {
  const [formData, setFormData] = useState({
    code_parcelle: '',
    nom: '',
    localisation: '',
    type_parcelle: 'RESIDENTIELLE',
    prix_vente: '',
    surface: '',
    description: '',
    statut: 'DISPONIBLE',
    documents: [], // Pour l'admin
    ...initialData
  });

  const [newDoc, setNewDoc] = useState({ nom: '', url: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addDocument = () => {
    if (newDoc.nom && newDoc.url) {
      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, { ...newDoc, id: Date.now() }]
      }));
      setNewDoc({ nom: '', url: '' });
    }
  };

  const removeDocument = (id) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter(doc => doc.id !== id)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert numbers
    const dataToSubmit = {
      ...formData,
      prix_vente: formData.prix_vente ? parseFloat(formData.prix_vente) : null,
      surface: formData.surface ? parseFloat(formData.surface) : null,
    };
    onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Code Parcelle"
          name="code_parcelle"
          value={formData.code_parcelle}
          onChange={handleChange}
          required
          placeholder="ex: P-001"
        />
        <Input
          label="Nom"
          name="nom"
          value={formData.nom}
          onChange={handleChange}
          required
          placeholder="ex: Lotissement Alpha"
        />
      </div>

      <Input
        label="Localisation"
        name="localisation"
        value={formData.localisation}
        onChange={handleChange}
        required
        placeholder="ex: Abidjan, Cocody"
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Type"
          value={formData.type_parcelle}
          onChange={(val) => handleSelectChange('type_parcelle', val)}
          options={Object.entries(TYPE_PARCELLE_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <Select
          label="Statut"
          value={formData.statut}
          onChange={(val) => handleSelectChange('statut', val)}
          options={[
            { value: 'DISPONIBLE', label: 'Disponible' },
            { value: 'RESERVEE', label: 'Réservée' },
            { value: 'VENDUE', label: 'Vendue' },
            { value: 'MAINTENANCE', label: 'Maintenance' },
            { value: 'A_AMORCELLER', label: 'À amorceller' },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Prix de vente"
          name="prix_vente"
          type="number"
          value={formData.prix_vente}
          onChange={handleChange}
          placeholder="0.00"
        />
        <Input
          label="Surface (m²)"
          name="surface"
          type="number"
          value={formData.surface}
          onChange={handleChange}
          placeholder="0"
        />
      </div>

      <div className="flex flex-col space-y-1">
        <label className="text-sm font-medium text-on-surface">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-outline rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px]"
          placeholder="Détails supplémentaires..."
        />
      </div>

      {/* Section Documents (Admin) */}
      <div className="border-t border-outline-variant pt-4 space-y-3">
        <div className="flex items-center gap-2 text-on-surface font-medium mb-2">
          <FileText size={18} />
          <span>Documents de la parcelle</span>
        </div>
        
        <div className="flex gap-2 items-end bg-surface-low p-3 rounded-lg border border-outline-variant">
          <div className="flex-1">
            <Input
              label="Nom du document"
              value={newDoc.nom}
              onChange={(e) => setNewDoc(prev => ({ ...prev, nom: e.target.value }))}
              placeholder="Ex: Titre foncier"
            />
          </div>
          <div className="flex-1">
            <Input
              label="URL du document"
              value={newDoc.url}
              onChange={(e) => setNewDoc(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addDocument} icon={<Plus size={16} />}>
            Ajouter
          </Button>
        </div>

        <div className="space-y-2">
          {formData.documents.map((doc) => (
            <div key={doc.id} className="flex justify-between items-center p-2 bg-surface-lowest border border-outline-variant rounded-lg text-sm">
              <span className="truncate flex-1">{doc.nom}</span>
              <div className="flex items-center gap-2">
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">Voir</a>
                <button type="button" onClick={() => removeDocument(doc.id)} className="text-error hover:bg-error/10 p-1 rounded">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {formData.documents.length === 0 && (
            <p className="text-xs text-on-surface-variant italic">Aucun document ajouté.</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" variant="primary" loading={isLoading}>
          {initialData ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
};

export default ParcelleForm;
