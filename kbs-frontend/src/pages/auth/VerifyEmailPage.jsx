import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, AlertCircle, ShieldCheck } from "lucide-react";
import {
  useVerifyEmailMutation,
  useVerifyCodeMutation,
  useResendCodeMutation,
  useResetPasswordMutation,
} from "../../store/api/authApi";
import { useDispatch } from "react-redux";
import { setCredentials } from "../../store/slices/authSlice";
import toast from "react-hot-toast";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [verifyEmail, { isLoading: isVerifying }] = useVerifyEmailMutation();
  const [verifyCode, { isLoading: isCheckingCode }] = useVerifyCodeMutation();
  const [resendCode, { isLoading: isResending }] = useResendCodeMutation();
  const [resetPassword, { isLoading: isSettingPassword }] = useResetPasswordMutation();

  const [email, setEmail] = useState(location.state?.email || "");
  const [code, setCode] = useState(location.state?.verificationCode || "");
  const [fallbackCode, setFallbackCode] = useState(location.state?.verificationCode || "");
  const [step, setStep] = useState("code");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");

  const navigateByRole = (role) => {
    if (["SUPER_ADMIN", "BOSS", "GERANT"].includes(role)) navigate("/admin");
    else if (role === "CLIENT") navigate("/client");
    else if (role === "LOCATAIRE") navigate("/locataire");
    else navigate("/");
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const checked = await verifyCode({ email, code }).unwrap();
      if (checked.user?.role === "LOCATAIRE") {
        setStep("password");
        toast.success("Code verifie. Definissez votre mot de passe.");
        return;
      }

      const result = await verifyEmail({ email, code }).unwrap();
      dispatch(setCredentials({ user: result.user, token: result.token }));
      toast.success("Email verifie avec succes !");
      navigateByRole(result.user.role);
    } catch (err) {
      setError(err.data?.message || "Code de verification invalide");
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caracteres");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      await resetPassword({ email, code, nouveau_mot_de_passe: password }).unwrap();
      toast.success("Compte active. Connectez-vous avec votre mot de passe.");
      navigate("/login");
    } catch (err) {
      setError(err.data?.message || "Impossible de definir le mot de passe");
    }
  };

  const handleResend = async () => {
    try {
      const result = await resendCode({ email }).unwrap();
      if (result?.verification_code) {
        setFallbackCode(result.verification_code);
        setCode(result.verification_code);
      }
      toast.success("Un nouveau code a ete envoye");
    } catch (err) {
      toast.error(err.data?.message || "Erreur lors de l'envoi");
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 relative">
      <Link
        to="/login"
        className="absolute top-8 left-8 flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition font-medium text-label-md"
      >
        <ArrowLeft size={18} />
        Retour a la connexion
      </Link>

      <div className="w-full max-w-md bg-surface-lowest p-8 rounded-2xl border border-outline-variant shadow-modal">
        <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
          <ShieldCheck size={24} />
        </div>

        <h1 className="font-montserrat font-bold text-headline-sm text-on-surface mb-2">
          {step === "password" ? "Creez votre mot de passe" : "Verifiez votre email"}
        </h1>
        <p className="text-body-md text-on-surface-variant mb-8">
          {step === "password" ? (
            "Le code est correct. Choisissez maintenant votre mot de passe."
          ) : (
            <>
              Saisissez le code a 6 chiffres envoye a l'adresse <strong>{email}</strong>.
            </>
          )}
        </p>

        {error && (
          <div className="flex items-center gap-3 bg-error-container text-on-error-container rounded-lg px-4 py-3 mb-6 text-label-md">
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {fallbackCode && step === "code" && (
          <div className="rounded-lg border border-secondary/30 bg-secondary-container/50 px-4 py-3 mb-6 text-center">
            <p className="text-label-sm text-on-surface-variant mb-1">
              Code de verification temporaire
            </p>
            <p className="font-montserrat text-2xl font-bold tracking-[0.28em] text-on-surface">
              {fallbackCode}
            </p>
          </div>
        )}

        <form onSubmit={step === "password" ? handleSetPassword : handleVerify} className="space-y-6">
          {!location.state?.email && (
            <div>
              <label className="text-label-md font-medium text-on-surface block mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="kbs-input w-full"
                placeholder="votre@email.com"
              />
            </div>
          )}

          <div>
            <label className="text-label-md font-medium text-on-surface block mb-2 text-center">
              Code de verification
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={code}
              disabled={step === "password"}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-full text-center text-2xl font-bold tracking-[0.5em] py-3 bg-surface-low border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-70"
              placeholder="000000"
            />
          </div>

          {step === "password" && (
            <>
              <div>
                <label className="text-label-md font-medium text-on-surface block mb-2">Mot de passe</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="kbs-input w-full"
                  placeholder="Minimum 8 caracteres"
                />
              </div>
              <div>
                <label className="text-label-md font-medium text-on-surface block mb-2">Confirmer le mot de passe</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="kbs-input w-full"
                  placeholder="Retapez le mot de passe"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isVerifying || isCheckingCode || isSettingPassword}
            className="w-full py-3 bg-primary text-on-primary rounded-lg font-semibold text-body-md hover:bg-primary-container transition disabled:opacity-60"
          >
            {step === "password"
              ? (isSettingPassword ? "Enregistrement..." : "Enregistrer le mot de passe")
              : (isVerifying || isCheckingCode ? "Verification..." : "Verifier l'email")}
          </button>

          {step === "code" && (
            <div className="text-center">
              <p className="text-label-md text-on-surface-variant mb-2">Vous n'avez pas recu le code ?</p>
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="text-secondary font-semibold hover:underline disabled:opacity-50"
              >
                Renvoyer le code
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
