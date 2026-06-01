import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, AlertCircle, ArrowLeft } from "lucide-react";
import { useDispatch } from "react-redux";
import { useLoginMutation } from "../../store/api/authApi";
import { setCredentials } from "../../store/slices/authSlice";
import toast from "react-hot-toast";

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const [form, setForm] = useState({ email: "", mot_de_passe: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await login(form).unwrap();
      dispatch(setCredentials(res.data));
      toast.success("Heureux de vous revoir !");
      
      const role = res.data.user.role;
      if (role === "SUPER_ADMIN" || role === "ADMIN" || role === "BOSS" || role === "GERANT") navigate("/admin");
      else if (role === "LOCATAIRE") navigate("/locataire");
      else navigate("/client");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.data?.message || "Identifiants incorrects ou problème de connexion");
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Panneau gauche — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-primary-container p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
            <span className="font-montserrat font-bold text-on-secondary text-lg">K</span>
          </div>
          <span className="font-montserrat font-bold text-xl text-on-primary-container">
            KBS Real Estate
          </span>
        </div>

        <div>
          <blockquote className="text-3xl font-montserrat font-bold text-on-primary-container leading-tight mb-6">
            "Investissez dans la terre, investissez dans l'avenir."
          </blockquote>
          <p className="text-on-primary-container/60 text-body-md">
            La plateforme de référence pour la gestion immobilière en RDC.
          </p>
        </div>

        <p className="text-label-sm text-on-primary-container/40">
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
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="font-montserrat font-bold text-on-primary text-sm">K</span>
            </div>
            <span className="font-montserrat font-bold text-lg text-on-surface">KBS Real Estate</span>
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