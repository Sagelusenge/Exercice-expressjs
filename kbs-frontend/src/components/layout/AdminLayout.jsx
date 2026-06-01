import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

// Mapping route → titre de page
const PAGE_TITLES = {
  "/admin": "System Overview",
  "/admin/users": "Gestion des Utilisateurs",
  "/admin/parcelles": "Inventaire Parcelles",
  "/admin/ventes": "Suivi des Ventes",
  "/admin/reservations": "Réservations",
  "/admin/paiements": "Paiements",
  "/admin/visites": "Demandes de Visite",
  "/admin/kbs/locataires": "Gestion Locataires",
  "/admin/kbs/factures": "Factures KBS",
  "/admin/kbs/paiements-loyer": "Paiements de Loyer",
  "/admin/kbs/rapports": "Rapports",
  "/admin/chat": "Messagerie",
  "/admin/activity": "Journal d'Activités",
  "/admin/parametres": "Paramètres Système",
};

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const title =
    Object.entries(PAGE_TITLES)
      .reverse()
      .find(([path]) => location.pathname.startsWith(path))?.[1] ||
    "KBS Admin";

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onCollapse={() => setCollapsed(!collapsed)}
      />

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar
          title={title}
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed(!collapsed)}
        />

        {/* Content */}
        <main className="flex-1 overflow-y-auto kbs-scrollbar bg-surface">
          {location.pathname === "/admin/chat" ? (
            <Outlet />
          ) : (
            <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;