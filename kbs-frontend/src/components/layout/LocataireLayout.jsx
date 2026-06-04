import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

const LOC_TITLES = {
  "/locataire": "Mon Espace KBS Buildings",
  "/locataire/factures": "Mes Factures",
  "/locataire/paiements": "Mes Paiements de Loyer",
  "/locataire/profil": "Mon Profil",
  "/locataire/chat": "Support KBS",
};

export default function LocataireLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const title = LOC_TITLES[location.pathname] || "Espace Locataire";

  useEffect(() => {
    const syncMobile = () => setCollapsed(window.innerWidth < 768);
    syncMobile();
    window.addEventListener("resize", syncMobile);
    return () => window.removeEventListener("resize", syncMobile);
  }, []);

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <Sidebar collapsed={collapsed} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar title={title} collapsed={collapsed} onToggleSidebar={() => setCollapsed(!collapsed)} />
        <main className="flex-1 overflow-y-auto kbs-scrollbar bg-surface">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
