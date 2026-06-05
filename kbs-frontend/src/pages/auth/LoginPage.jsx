import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, AlertCircle, ArrowLeft } from "lucide-react";
import { useDispatch } from "react-redux";
import { useLoginMutation } from "../../store/api/authApi";
import { setCredentials } from "../../store/slices/authSlice";
import toast from "react-hot-toast";
import KbsLoader from "../../components/ui/KbsLoader";

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const [form, setForm] = useState({ email: "", mot_de_passe: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await login(form).unwrap();
      dispatch(setCredentials(res));
      toast.success("Heureux de vous revoir !");
      
      const role = res.user.role;
      if (role === "SUPER_ADMIN" || role === "ADMIN" || role === "BOSS" || role === "GERANT") navigate("/admin");
      else if (role === "LOCATAIRE") navigate("/locataire");
      else navigate("/client");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.data?.message || "Identifiants incorrects ou problème de connexion");
    }
  };

  if (showSplash) {
    return (
      <div className="grid min-h-screen place-items-center bg-primary-container">
        <KbsLoader label="Ouverture de KBS Building..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Panneau gauche — branding */}
      <div className="login-showcase relative hidden w-1/2 overflow-hidden bg-primary-container p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="login-aurora" />
        <span className="login-line login-line-a" />
        <span className="login-line login-line-b" />
        <span className="login-line login-line-c" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="login-logo-orbit">
            <span className="login-logo-ring login-logo-ring-a" />
            <span className="login-logo-ring login-logo-ring-b" />
            <img src="/kbs-logo.png" alt="KBS Building" className="login-logo-img" />
          </div>
          <span className="font-montserrat text-2xl font-bold text-white">
            KBS Building
          </span>
        </div>

        <div className="relative z-10">
          <div className="login-floating-card login-floating-card-a">
            <span className="text-label-sm text-white/60">Parcelles</span>
            <strong className="font-montserrat text-2xl text-white">Verifiees</strong>
          </div>
          <div className="login-floating-card login-floating-card-b">
            <span className="text-label-sm text-white/60">Suivi</span>
            <strong className="font-montserrat text-2xl text-white">Rapide</strong>
          </div>
          <blockquote className="max-w-xl text-4xl font-montserrat font-bold leading-tight text-white mb-6">
            "Investissez dans la terre, investissez dans l'avenir."
          </blockquote>
          <p className="max-w-md text-body-lg leading-relaxed text-white/68">
            La plateforme de référence pour la gestion immobilière en RDC.
          </p>
        </div>

        <p className="relative z-10 text-label-sm text-white/45">
          © 2024 KITUMAINI BALEZI Serge — Goma, RDC
        </p>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {/* Bouton Retour */}
        <Link 
          to="/" 
          className="absolute top-8 left-8 flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition font-medium text-label-md"
        >
          <ArrowLeft size={18} />
          Retour à l'accueil
        </Link>

        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <img src="/kbs-logo.png" alt="KBS Building" className="h-10 w-10 rounded-full bg-black object-contain p-0.5" />
            <span className="font-montserrat font-bold text-lg text-on-surface">KBS Building</span>
          </div>

          <h1 className="font-montserrat font-bold text-headline-md text-on-surface mb-2">
            Connexion
          </h1>
          <p className="text-body-md text-on-surface-variant mb-8">
            Accédez à votre espace KBS
          </p>

          {/* Erreur */}
          {error && (
            <div className="flex items-center gap-3 bg-error-container text-on-error-container rounded-lg px-4 py-3 mb-6 text-label-md">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="text-label-md font-medium text-on-surface block mb-2">
                Adresse email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="votre@email.com"
                required
                className="kbs-input w-full"
                autoComplete="email"
              />
            </div>

            {/* Mot de passe */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-label-md font-medium text-on-surface">
                  Mot de passe
                </label>
                <Link to="/forgot-password" className="text-secondary text-label-sm font-semibold hover:underline">
                  Oublié ?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={form.mot_de_passe}
                  onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="kbs-input w-full pr-10"
                  autoComplete="current-password"
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

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-on-primary rounded-lg font-semibold text-body-md hover:bg-primary-container transition disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn size={18} />
              )}
              {isLoading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          {/* Inscription */}
          <p className="text-center text-label-md text-on-surface-variant mt-6">
            Pas encore de compte ?{" "}
            <Link to="/register" className="text-secondary font-semibold hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
