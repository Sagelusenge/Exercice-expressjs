import { MessageCircle, PanelLeftClose, PanelLeftOpen, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import Avatar from "../ui/Avatar";
import NotifBell from "../notifications/NotifBell";

/**
 * TopBar KBS — correspond à l'image de référence
 * Affiche : titre page | search | notif | chat | user info
 */
const TopBar = ({ title, collapsed, onToggleSidebar }) => {
  const { user } = useSelector((s) => s.auth);
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();

  const getChatPath = () => {
    if (["SUPER_ADMIN", "ADMIN", "BOSS", "GERANT"].includes(user?.role)) return "/admin/chat";
    if (user?.role === "LOCATAIRE") return "/locataire/chat";
    return "/client/chat";
  };

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("kbs-theme");
    if (savedTheme === "dark") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Update theme when isDark changes
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("kbs-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("kbs-theme", "light");
    }
  }, [isDark]);

  return (
    <header className="h-16 bg-surface-lowest border-b border-outline-variant flex items-center px-3 sm:px-6 gap-2 sm:gap-4 flex-shrink-0">
      {/* Toggle sidebar */}
      <button
        onClick={onToggleSidebar}
        className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-low px-3 py-2 text-label-md font-semibold text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface"
        title={collapsed ? "Ouvrir la navigation" : "Reduire la navigation"}
      >
        {collapsed
          ? <PanelLeftOpen size={18} />
          : <PanelLeftClose size={18} />
        }
        <span className="hidden sm:inline">{collapsed ? "Menu" : "Navigation"}</span>
      </button>

      {/* Titre page */}
      <h1 className="font-montserrat font-bold text-title-lg text-on-surface flex-1 truncate">
        {title}
      </h1>

      {/* Actions droite */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Theme Toggle */}
        <button
          onClick={() => setIsDark(!isDark)}
          className="p-2 rounded-full hover:bg-surface-low text-on-surface-variant transition"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications — v_notifications_non_lues */}
        <NotifBell />

        {/* Chat — v_chat_actif */}
        <button
          type="button"
          onClick={() => navigate(getChatPath())}
          className="relative p-2 rounded-full hover:bg-surface-low text-on-surface-variant transition"
          title="Ouvrir la discussion"
        >
          <MessageCircle size={20} />
        </button>

        {/* Profil utilisateur */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-outline-variant ml-1">
          <div className="text-right hidden sm:block">
            <p className="text-label-md font-semibold text-on-surface leading-tight">
              {user?.nom} {user?.prenom}
            </p>
            <p className="text-label-sm text-on-surface-variant">
              {user?.code_user}
            </p>
          </div>
          <Avatar
            nom={user?.nom}
            prenom={user?.prenom}
            photo_url={user?.photo_url}
            size="md"
          />
        </div>
      </div>
    </header>
  );
};

export default TopBar;
