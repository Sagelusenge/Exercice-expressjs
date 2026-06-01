import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import clsx from "clsx";
import {
  LayoutDashboard, Users, Map, ShoppingBag, Calendar,
  Building2, FileText, BarChart2, Settings, LogOut,
  FileCheck, CreditCard, MessageSquare, Activity,
  Heart, Home, Receipt, Wallet
} from "lucide-react";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import toast from "react-hot-toast";
import { logout } from "../../store/slices/authSlice";

/**
 * Sidebar KBS — s'adapte selon le rôle
 * ADMIN : navigation complète
 * CLIENT : navigation parcelles/favoris/réservations/achats
 * LOCATAIRE : navigation KBS loyer
 */

const ADMIN_NAV = [
  {
    group: "Principal",
    items: [
      { label: "Dashboard", to: "/admin", icon: LayoutDashboard, end: true },
      { label: "Utilisateurs", to: "/admin/users", icon: Users },
      { label: "Parcelles", to: "/admin/parcelles", icon: Map },
      { label: "Ventes", to: "/admin/ventes", icon: ShoppingBag },
      { label: "Réservations", to: "/admin/reservations", icon: Calendar },
      { label: "Paiements", to: "/admin/paiements", icon: CreditCard },
      { label: "Visites", to: "/admin/visites", icon: Calendar },
    ],
  },
  {
    group: "KBS Buildings",
    items: [
      { label: "Locataires", to: "/admin/kbs/locataires", icon: Building2 },
      { label: "Factures", to: "/admin/kbs/factures", icon: FileText },
      { label: "Paiements Loyer", to: "/admin/kbs/paiements-loyer", icon: Wallet },
    ],
  },
  {
    group: "Système",
    items: [
      { label: "Chat", to: "/admin/chat", icon: MessageSquare },
    ],
  },
];

const CLIENT_NAV = [
  {
    group: "Mon espace",
    items: [
      { label: "Dashboard", to: "/client", icon: LayoutDashboard, end: true },
      { label: "Parcelles", to: "/", icon: Map },
      { label: "Mes Réservations", to: "/client/reservations", icon: Calendar },
      { label: "Mes Achats", to: "/client/achats", icon: ShoppingBag },
      { label: "Mes Paiements", to: "/client/paiements", icon: CreditCard },
      { label: "Mes Visites", to: "/client/visites", icon: Calendar },
      { label: "Support Chat", to: "/client/chat", icon: MessageSquare },
    ],
  },
];

const LOCATAIRE_NAV = [
  {
    group: "Mon espace KBS",
    items: [
      { label: "Dashboard", to: "/locataire", icon: LayoutDashboard, end: true },
      { label: "Mes Factures", to: "/locataire/factures", icon: FileCheck },
      { label: "Mes Paiements", to: "/locataire/paiements", icon: Wallet },
      { label: "Mon Profil", to: "/locataire/profil", icon: Home },
      { label: "Support Chat", to: "/locataire/chat", icon: MessageSquare },
    ],
  },
];

const NAV_MAP = {
  SUPER_ADMIN: ADMIN_NAV,
  BOSS: ADMIN_NAV,
  GERANT: ADMIN_NAV,
  CLIENT: CLIENT_NAV,
  LOCATAIRE: LOCATAIRE_NAV,
};

const Sidebar = ({ collapsed = false, onCollapse }) => {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const navGroups = NAV_MAP[user?.role] || CLIENT_NAV;

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Vous avez été déconnecté");
    navigate("/login");
  };

  return (
    <aside
      className={clsx(
        "flex flex-col h-full bg-primary-container text-on-primary-container",
        "transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-8 h-8 bg-secondary rounded flex items-center justify-center flex-shrink-0">
          <span className="font-montserrat font-bold text-on-secondary text-sm">K</span>
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <p className="font-montserrat font-bold text-sm text-on-primary-container leading-tight">
              KBS Admin
            </p>
            <p className="text-[11px] text-on-primary-container/60 font-inter">
              {user?.role === "CLIENT" ? "Espace Client" :
               user?.role === "LOCATAIRE" ? "Espace Locataire" :
               "System Controller"}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto kbs-scrollbar">
        {navGroups.map((group) => (
          <div key={group.group} className="mb-4">
            {!collapsed && (
              <p className="px-4 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-on-primary-container/40 font-inter">
                {group.group}
              </p>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg mb-0.5",
                    "transition-all duration-150 text-label-md font-inter",
                    isActive
                      ? "bg-secondary text-on-secondary"
                      : "text-on-primary-container/70 hover:bg-white/10 hover:text-on-primary-container"
                  )
                }
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={18} className="flex-shrink-0" />
                {!collapsed && (
                  <span className="animate-fade-in truncate">{item.label}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-white/10 p-3 space-y-1">
        {/* Generate Report (admin uniquement) */}
        {["SUPER_ADMIN", "BOSS", "GERANT"].includes(user?.role) && !collapsed && (
          <button 
            onClick={() => navigate("/admin/kbs/rapports")}
            className="w-full flex items-center gap-2 px-3 py-2.5 bg-white/10 text-on-primary-container rounded-lg text-label-md font-medium hover:bg-white/20 transition"
          >
            <BarChart2 size={16} />
            Générer Rapport
          </button>
        )}

        {/* Support */}
        <NavLink
          to={user?.role === "LOCATAIRE" ? "/locataire/chat" : user?.role === "CLIENT" ? "/client/chat" : "/admin/chat"}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-on-primary-container/60 hover:text-on-primary-container hover:bg-white/10 transition text-label-md"
        >
          <MessageSquare size={16} />
          {!collapsed && "Support"}
        </NavLink>

        {/* Déconnexion */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition text-label-md"
        >
          <LogOut size={16} />
          {!collapsed && "Déconnexion"}
        </button>

        {/* User info */}
        {!collapsed && (
          <div className="flex items-center gap-2 px-3 py-2 mt-2 border-t border-white/10">
            <Avatar nom={user?.nom} prenom={user?.prenom} photo_url={user?.photo_url} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-label-sm text-on-primary-container truncate font-medium">
                {user?.nom} {user?.prenom}
              </p>
              <p className="text-[10px] text-on-primary-container/50 truncate">
                {user?.code_user}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;