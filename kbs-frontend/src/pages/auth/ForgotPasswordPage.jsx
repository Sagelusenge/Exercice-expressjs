import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, ArrowLeft, AlertCircle, CheckCircle2, KeyRound } from "lucide-react";
import { useForgotPasswordMutation, useResetPasswordMutation } from "../../store/api/authApi";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1); // 1: Email, 2: Code & Nouveau MDP
  const [email, setEmail] = useState("");

  useEffect(() => {
    const emailFromQuery = searchParams.get("email");
    if (emailFromQuery) {
      setEmail(emailFromQuery);
      setStep(2); // Auto-advance to step 2 when email is in URL
    }
  }, [searchParams]);
  const [form, setForm] = useState({ code: "", mot_de_passe: "", confirm_password: "" });
  const [error, setError] = useState("");

  const [forgotPassword, { isLoading: isRequesting }] = useForgotPasswordMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation();

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await forgotPassword({ email }).unwrap();
      toast.success("Code de réinitialisation envoyé par email");
      setStep(2);
    } catch (err) {
      setError(err.data?.message || "Erreur lors de l'envoi du code");
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");

    if (form.mot_de_passe !== form.confirm_password) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      await resetPassword({ 
        email, 
        code: form.code, 
        nouveau_mot_de_passe: form.mot_de_passe 
      }).unwrap();
      toast.success("Mot de passe réinitialisé avec succès !");
      navigate("/login");
    } catch (err) {
      setError(err.data?.message || "Code invalide ou expiré");
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 relative">
      {/* Bouton Retour */}
      <Link 
        to="/login" 
        className="absolute top-8 left-8 flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition font-medium text-label-md"
      >
        <ArrowLeft size={18} />
        Retour à la connexion
      </Link>

      <div className="w-full max-w-md bg-surface-lowest p-8 rounded-2xl border border-outline-variant shadow-modal">
        <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center mb-6">
          <KeyRound size={24} />
        </div>

        <h1 className="font-montserrat font-bold text-headline-sm text-on-surface mb-2">
          {step === 1 ? "Mot de passe oublié ?" : "Réinitialisation"}
        </h1>
        <p className="text-body-md text-on-surface-variant mb-8">
          {step === 1 
            ? "Entrez votre email pour recevoir un code de réinitialisation à 6 chiffres."
            : `Nous avons envoyé un code à l'adresse ${email}`}
        </p>

        {error && (
          <div className="flex items-center gap-3 bg-error-container text-on-error-container rounded-lg px-4 py-3 mb-6 text-label-md">
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestCode} className="space-y-6">
            <div>
              <label className="text-label-md font-medium text-on-surface block mb-2">
                Adresse email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="kbs-input w-full pl-10"
                  placeholder="votre@email.com"
                />
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isRequesting}
              className="w-full py-3 bg-primary text-on-primary rounded-lg font-semibold text-body-md hover:bg-primary-container transition disabled:opacity-60"
            >
              {isRequesting ? "Envoi en cours..." : "Envoyer le code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label className="text-label-md font-medium text-on-surface block mb-2 text-center">
                Code à 6 chiffres
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\D/g, "") })}
                className="w-full text-center text-2xl font-bold tracking-[0.5em] py-3 bg-surface-low border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="000000"
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-label-md font-medium text-on-surface block mb-1.5">Nouveau mot de passe</label>
                <input
                  type="password"
                  required
                  value={form.mot_de_passe}
                  onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })}
                  className="kbs-input w-full"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="text-label-md font-medium text-on-surface block mb-1.5">Confirmation</label>
                <input
                  type="password"
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
              disabled={isResetting}
              className="w-full py-3 bg-primary text-on-primary rounded-lg font-semibold text-body-md hover:bg-primary-container transition disabled:opacity-60"
            >
              {isResetting ? "Réinitialisation..." : "Changer le mot de passe"}
            </button>
            
            <button 
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-center text-label-md text-on-surface-variant hover:text-on-surface"
            >
              Renvoyer le code
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
