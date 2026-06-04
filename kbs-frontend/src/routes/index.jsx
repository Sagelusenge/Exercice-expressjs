import { HashRouter as BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

// Layouts
import PublicLayout from "../components/layout/PublicLayout";
import AdminLayout from "../components/layout/AdminLayout";
import ClientLayout from "../components/layout/ClientLayout";
import LocataireLayout from "../components/layout/LocataireLayout";

// Pages publiques
import HomePage from "../pages/public/HomePage";
import ParcelleCatalogPage from "../pages/public/ParcelleCatalogPage";
import ParcelleDetailPage from "../pages/public/ParcelleDetailPage";

// Auth
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";

// Admin
import DashboardPage from "../pages/admin/DashboardPage";
import UsersListPage from "../pages/admin/users/UsersListPage";
import UserCreatePage from "../pages/admin/users/UserCreatePage";
import {
  ParcellesAdminPage,
  VentesListPage,
  ReservationsListPage,
  PaiementsListPage,
  VisitesListPage,
  LocatairesListPage,
  LocataireCreatePage,
  FacturesListPage,
  PaiementsLoyerPage,
  RapportsPage,
  ChatAdminPage,
  ActivityLogsPage,
  ParametresPage,
} from "../pages/admin";
import ParcelleCreatePage from "../pages/admin/parcelles/ParcelleCreatePage";
import VenteCreatePage from "../pages/admin/ventes/VenteCreatePage";

// Client
import ClientDashboardPage from "../pages/client/ClientDashboardPage";
import {
  ChatClientPage,
  MesFavorisPage,
  MesReservationsPage,
  MesAchatsPage,
  MesPaiementsPage,
  MesVisitesPage,
  ProfilPage,
} from "../pages/client";

// Locataire
import LocataireDashboardPage from "../pages/locataire/LocataireDashboardPage";
import {
  ChatLocatairePage,
  MesFacturesPage,
  MesPaiementsLoyerPage,
} from "../pages/locataire";

/**
 * Guard d'authentification par rôle
 */
const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, isAuthenticated } = useSelector((s) => s.auth);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles.length && !roles.includes(user?.role)) {
    // Rediriger vers l'espace approprié
    if (["SUPER_ADMIN", "BOSS", "GERANT"].includes(user?.role)) return <Navigate to="/admin" replace />;
    if (user?.role === "CLIENT") return <Navigate to="/client" replace />;
    if (user?.role === "LOCATAIRE") return <Navigate to="/locataire" replace />;
  }

  return children;
};

const ADMIN_ROLES = ["SUPER_ADMIN", "BOSS", "GERANT"];

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Routes publiques ────────────────────────────── */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/parcelles" element={<ParcelleCatalogPage />} />
          <Route path="/parcelles/:id" element={<ParcelleDetailPage />} />
        </Route>

        {/* ── Auth ────────────────────────────────────────── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* ── Admin ───────────────────────────────────────── */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={ADMIN_ROLES}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersListPage />} />
          <Route path="users/create" element={<UserCreatePage />} />
          <Route path="parcelles" element={<ParcellesAdminPage />} />
          <Route path="parcelles/create" element={<ParcelleCreatePage />} />
          <Route path="ventes" element={<VentesListPage />} />
          <Route path="ventes/create" element={<VenteCreatePage />} />
          <Route path="reservations" element={<ReservationsListPage />} />
          <Route path="paiements" element={<PaiementsListPage />} />
          <Route path="visites" element={<VisitesListPage />} />
          <Route path="kbs/locataires" element={<LocatairesListPage />} />
          <Route path="kbs/locataires/create" element={<LocataireCreatePage />} />
          <Route path="kbs/factures" element={<FacturesListPage />} />
          <Route path="kbs/paiements-loyer" element={<PaiementsLoyerPage />} />
          <Route path="kbs/rapports" element={<RapportsPage />} />
          <Route path="chat" element={<ChatAdminPage />} />
          <Route path="activity" element={<ActivityLogsPage />} />
          <Route path="parametres" element={<ParametresPage />} />
        </Route>

        {/* ── Client ──────────────────────────────────────── */}
        <Route
          path="/client"
          element={
            <ProtectedRoute roles={["CLIENT"]}>
              <ClientLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ClientDashboardPage />} />
          <Route path="favoris" element={<MesFavorisPage />} />
          <Route path="reservations" element={<MesReservationsPage />} />
          <Route path="achats" element={<MesAchatsPage />} />
          <Route path="paiements" element={<MesPaiementsPage />} />
          <Route path="visites" element={<MesVisitesPage />} />
          <Route path="chat" element={<ChatClientPage />} />
          <Route path="profil" element={<ProfilPage />} />
        </Route>

        {/* ── Locataire ───────────────────────────────────── */}
        <Route
          path="/locataire"
          element={
            <ProtectedRoute roles={["LOCATAIRE"]}>
              <LocataireLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<LocataireDashboardPage />} />
          <Route path="factures" element={<MesFacturesPage />} />
          <Route path="paiements" element={<MesPaiementsLoyerPage />} />
          <Route path="chat" element={<ChatLocatairePage />} />
        </Route>

        {/* ── Fallback ─────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
