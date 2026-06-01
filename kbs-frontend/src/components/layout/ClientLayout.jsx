import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useLocation } from "react-router-dom";

const CLIENT_TITLES = {
  "/client": "Mon Tableau de Bord",
  "/client/favoris": "Mes Favoris",
  "/client/reservations": "Mes Réservations",
  "/client/achats": "Mes Achats",
  "/client/paiements": "Mes Paiements",
  "/client/visites": "Mes Visites",
  "/client/chat": "Support",
  "/client/profil": "Mon Profil",
};

export default function ClientLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const title = CLIENT_TITLES[location.pathname] || "Espace Client";

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <Sidebar collapsed={collapsed} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar title={title} collapsed={collapsed} onToggleSidebar={() => setCollapsed(!collapsed)} />
        <main className="flex-1 overflow-y-auto kbs-scrollbar bg-surface">
          <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}