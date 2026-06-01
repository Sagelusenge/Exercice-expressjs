import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Save, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { useUpdateUserMutation } from "../../store/api/usersApi";
import { useChangePasswordMutation } from "../../store/api/authApi";
import { setCredentials } from "../../store/slices/authSlice";

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const [updateUser, { isLoading: isSaving }] = useUpdateUserMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
  const [profile, setProfile] = useState({
    nom: user?.nom || "",
    prenom: user?.prenom || "",
    telephone: user?.telephone || "",
    adresse: user?.adresse || "",
  });
  const [passwords, setPasswords] = useState({
    ancien_mot_de_passe: "",
    nouveau_mot_de_passe: "",
    confirm: "",
  });

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const updated = await updateUser({ id: user.id, ...profile }).unwrap();
      dispatch(setCredentials({ token, user: { ...user, ...(updated.data || updated) } }));
      toast.success("Profil mis a jour");
    } catch (err) {
      toast.error(err.data?.message || "Erreur lors de la mise a jour");
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (passwords.nouveau_mot_de_passe.length < 8) {
      toast.error("Le nouveau mot de passe doit contenir au moins 8 caracteres");
      return;
    }
    if (passwords.nouveau_mot_de_passe !== passwords.confirm) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      await changePassword({
        ancien_mot_de_passe: passwords.ancien_mot_de_passe,
        nouveau_mot_de_passe: passwords.nouveau_mot_de_passe,
      }).unwrap();
      setPasswords({ ancien_mot_de_passe: "", nouveau_mot_de_passe: "", confirm: "" });
      toast.success("Mot de passe modifie");
    } catch (err) {
      toast.error(err.data?.message || "Erreur lors du changement de mot de passe");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-on-surface">Mon Profil</h1>
        <p className="text-on-surface-variant mt-1">Parametres du compte et securite.</p>
      </div>

      <form onSubmit={saveProfile} className="kbs-card p-6 space-y-4 max-w-3xl">
        <h2 className="text-xl font-semibold text-on-surface flex items-center gap-2">
          <Save size={20} /> Informations personnelles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="kbs-input" placeholder="Nom" value={profile.nom} onChange={(e) => setProfile({ ...profile, nom: e.target.value })} />
          <input className="kbs-input" placeholder="Prenom" value={profile.prenom} onChange={(e) => setProfile({ ...profile, prenom: e.target.value })} />
          <input className="kbs-input" placeholder="Telephone" value={profile.telephone} onChange={(e) => setProfile({ ...profile, telephone: e.target.value })} />
          <input className="kbs-input" placeholder="Adresse" value={profile.adresse} onChange={(e) => setProfile({ ...profile, adresse: e.target.value })} />
        </div>
        <button disabled={isSaving} className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold disabled:opacity-60">
          {isSaving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>

      <form onSubmit={savePassword} className="kbs-card p-6 space-y-4 max-w-3xl">
        <h2 className="text-xl font-semibold text-on-surface flex items-center gap-2">
          <Shield size={20} /> Mot de passe
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input type="password" className="kbs-input" placeholder="Ancien mot de passe" value={passwords.ancien_mot_de_passe} onChange={(e) => setPasswords({ ...passwords, ancien_mot_de_passe: e.target.value })} />
          <input type="password" className="kbs-input" placeholder="Nouveau mot de passe" value={passwords.nouveau_mot_de_passe} onChange={(e) => setPasswords({ ...passwords, nouveau_mot_de_passe: e.target.value })} />
          <input type="password" className="kbs-input" placeholder="Confirmer" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
        </div>
        <button disabled={isChangingPassword} className="px-4 py-2 rounded-lg bg-secondary text-on-secondary font-semibold disabled:opacity-60">
          {isChangingPassword ? "Modification..." : "Changer le mot de passe"}
        </button>
      </form>
    </div>
  );
}
