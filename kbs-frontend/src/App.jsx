import { useEffect, useState } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "./store";
import AppRoutes from "./routes";
import { Toaster } from "react-hot-toast";
import { useGetMeQuery } from "./store/api/authApi";
import { logout } from "./store/slices/authSlice";
import KbsLoader from "./components/ui/KbsLoader";
import GlobalActivityOverlay from "./components/ui/GlobalActivityOverlay";

/**
 * Composant interne pour gérer l'initialisation de l'auth au démarrage
 */
function AuthInitializer({ children }) {
  const dispatch = useDispatch();
  const { token, isAuthenticated } = useSelector((s) => s.auth);
  const [isReady, setIsReady] = useState(!token); // Prêt tout de suite si pas de token

  // On tente de récupérer les infos de l'utilisateur si on a un token
  const { error, isSuccess, isLoading } = useGetMeQuery(undefined, {
    skip: !token || !isAuthenticated,
  });

  useEffect(() => {
    // Si pas de token, on est prêt tout de suite
    if (!token) {
      setIsReady(true);
      return;
    }

    // Si l'API retourne une erreur (token expiré par ex), on déconnecte
    if (error) {
      console.warn("Session expirée ou invalide");
      dispatch(logout());
      setIsReady(true);
    }

    // Si succès ou fin de chargement
    if (isSuccess || !isLoading) {
      setIsReady(true);
    }
  }, [error, isSuccess, isLoading, token, dispatch]);

  if (!isReady) {
    const currentHash = window.location.hash || "#/";
    const isHomePage = currentHash === "#/" || currentHash === "";

    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        {!isHomePage && <KbsLoader label="Chargement de votre espace..." />}
      </div>
    );
  }

  return children;
}

export default function App() {
  return (
    <Provider store={store}>
      <AuthInitializer>
        <AppRoutes />
        <GlobalActivityOverlay />
        {/* Toaster global unique pour toute l'application */}
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'Inter, sans-serif',
              borderRadius: '8px',
              fontSize: '14px',
            }
          }}
        />
      </AuthInitializer>
    </Provider>
  );
}
