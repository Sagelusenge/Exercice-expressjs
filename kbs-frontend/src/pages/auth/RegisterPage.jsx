import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserPlus, AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useDispatch } from "react-redux";
import { useRegisterMutation } from "../../store/api/authApi";
import { setCredentials } from "../../store/slices/authSlice";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [register, { isLoading }] = useRegisterMutation();

  const [form, setForm] = useState({ 
    nom: "", 
    prenom: "", 
    email: "", 
    telephone: "",
    mot_de_passe: "",
    confirm_password: "",
    role: "CLIENT" // Fixé à CLIENT selon la demande
  });

  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.mot_de_passe !== form.confirm_password) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      const { confirm_password, ...registerData } = form;
      const result = await register(registerData).unwrap();
      toast.success("Compte créé ! Veuillez vérifier votre email.");
      navigate("/verify-email", {
        state: {
          email: form.email,
          verificationCode: result?.verification_code || "",
        },
      });
    } catch (err) {
      console.error("Register error:", err);
      setError(err.data?.message || "Une erreur est survenue lors de l'inscription");
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Panneau gauche — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/3 bg-primary-container p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
            <span className="font-montserrat font-bold text-on-secondary text-lg">K</span>
          </div>
          <span className="font-montserrat font-bold text-xl text-on-primary-container">
            KBS Real Estate
          </span>
        </div>

        <div>
          <h2 className="text-2xl font-montserrat font-bold text-on-primary-container mb-6">
            Pourquoi créer un compte ?
          </h2>
          <ul className="space-y-4">
            {[
              "Sauvegardez vos parcelles favorites",
              "Suivez vos réservations en temps réel",
              "Accédez à vos documents de vente",
              "Échangez directement avec nos experts"
            ].map((text, i) => (
              <li key={i} className="flex items-center gap-3 text-on-primary-container/80">
                <CheckCircle2 size={18} className="text-secondary" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-label-sm text-on-primary-container/40">
          © 2024 KITUMAINI BALEZI Serge — Goma, RDC
        </p>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-y-auto">
        {/* Bouton Retour */}
        <Link 
          to="/" 
          className="absolute top-8 left-8 flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition font-medium text-label-md"
        >
          <ArrowLeft size={18} />
          Retour à l'accueil
        </Link>

        <div className="w-full max-w-md py-12">
          <h1 className="font-montserrat font-bold text-headline-md text-on-surface mb-2">
            Créer un compte
          </h1>
          <p className="text-body-md text-on-surface-variant mb-8">
            Rejoignez Kitumaini Balezi Serge pour vos projets immobiliers.
          </p>

          {/* Erreur */}
          {error && (
            <div className="flex items-center gap-3 bg-error-container text-on-error-container rounded-lg px-4 py-3 mb-6 text-label-md">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-label-md font-medium text-on-surface block mb-1.5">Nom</label>
                <input
                  type="text"
                  required
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  className="kbs-input w-full"
                  placeholder="Ex: Doe"
                />
              </div>
              <div>
                <label className="text-label-md font-medium text-on-surface block mb-1.5">Prénom</label>
                <input
                  type="text"
                  required
                  value={form.prenom}
                  onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                  className="kbs-input w-full"
                  placeholder="Ex: John"
                />
              </div>
            </div>

            <div>
              <label className="text-label-md font-medium text-on-surface block mb-1.5">Adresse email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="kbs-input w-full"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="text-label-md font-medium text-on-surface block mb-1.5">Téléphone</label>
              <input
                type="tel"
                required
                value={form.telephone}
                onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                className="kbs-input w-full"
                placeholder="+243 ..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-label-md font-medium text-on-surface block mb-1.5">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    value={form.mot_de_passe}
                    onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })}
                    className="kbs-input w-full pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-label-md font-medium text-on-surface block mb-1.5">Confirmation</label>
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={form.confirm_password}
                  onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                  className="kbs-input w-full"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-on-primary rounded-lg font-semibold text-body-md hover:bg-primary-container transition disabled:opacity-60 mt-4"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <UserPlus size={18} />
              )}
              {isLoading ? "Création en cours..." : "Créer mon compte"}
            </button>
          </form>

          <p className="text-center text-label-md text-on-surface-variant mt-6">
            Déjà un compte ?{" "}
            <Link to="/login" className="text-secondary font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
