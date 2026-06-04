import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ChevronDown, Globe2, LogIn, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import Button from "../ui/Button";
import Avatar from "../ui/Avatar";
import NotifBell from "../notifications/NotifBell";

const Navbar = () => {
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [langSearch, setLangSearch] = useState("");
  const [language, setLanguage] = useState("fr");
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const languages = [
    { code: "fr", label: "Français" },
    { code: "en", label: "English" },
    { code: "sw", label: "Kiswahili" },
    { code: "ln", label: "Lingala" },
  ].filter((lang) => lang.label.toLowerCase().includes(langSearch.toLowerCase()));

  // Rediriger vers l'espace approprié selon le rôle
  const getDashboardPath = () => {
    if (!user) return "/login";
    if (["SUPER_ADMIN", "BOSS", "GERANT"].includes(user.role)) return "/admin";
    if (user.role === "CLIENT") return "/client";
    if (user.role === "LOCATAIRE") return "/locataire";
    return "/";
  };

  return (
    <nav className={`${isHome ? "fixed inset-x-0 top-0" : "sticky top-0"} z-50 transition-colors ${isHome ? "bg-primary-container/20 text-white backdrop-blur-md border-b border-white/10" : "bg-surface-lowest border-b border-outline-variant"}`}>
      <div className="kbs-container h-16 flex items-center gap-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <img src="/kbs-logo.png" alt="KBS Building" className="h-10 w-10 rounded-full bg-black object-contain p-0.5" />
          <span className={`font-montserrat font-bold text-title-lg hidden sm:block ${isHome ? "text-white" : "text-on-surface"}`}>
            KBS Building
          </span>
        </Link>

        {/* Navigation principale */}
        <div className="hidden md:flex items-center gap-1 flex-1">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `px-4 py-2 text-label-md font-medium rounded transition-colors ${
                isActive
                  ? isHome ? "text-white border-b-2 border-white" : "text-primary border-b-2 border-primary"
                  : isHome ? "text-white/80 hover:text-white" : "text-on-surface-variant hover:text-on-surface"
              }`
            }
          >
            Accueil
          </NavLink>
          <NavLink
            to="/parcelles"
            className={({ isActive }) =>
              `px-4 py-2 text-label-md font-medium rounded transition-colors ${
                isActive
                  ? isHome ? "text-white border-b-2 border-white" : "text-primary border-b-2 border-primary"
                  : isHome ? "text-white/80 hover:text-white" : "text-on-surface-variant hover:text-on-surface"
              }`
            }
          >
            Parcelles
          </NavLink>
        </div>

        {/* Actions droite */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setLangOpen((open) => !open)}
              className={`flex items-center gap-2 rounded-full border px-3 py-2 text-label-sm font-semibold transition ${isHome ? "border-white/20 bg-white/10 text-white hover:bg-white/15" : "border-outline-variant bg-surface-low text-on-surface hover:bg-surface-container"}`}
            >
              <Globe2 size={15} />
              {language.toUpperCase()}
              <ChevronDown size={14} />
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg border border-outline-variant bg-surface-lowest p-2 text-on-surface shadow-modal">
                <div className="mb-2 flex items-center gap-2 rounded border border-outline-variant px-2 py-1.5">
                  <Search size={14} className="text-on-surface-variant" />
                  <input
                    value={langSearch}
                    onChange={(e) => setLangSearch(e.target.value)}
                    placeholder="Rechercher une langue"
                    className="min-w-0 flex-1 bg-transparent text-label-sm outline-none"
                  />
                </div>
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => { setLanguage(lang.code); setLangOpen(false); }}
                    className="block w-full rounded px-3 py-2 text-left text-label-sm hover:bg-surface-low"
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <NotifBell />

              {/* Dashboard */}
              <Link to={getDashboardPath()}>
                <Avatar
                  nom={user?.nom}
                  prenom={user?.prenom}
                  photo_url={user?.photo_url}
                  size="sm"
                  className="cursor-pointer ring-2 ring-transparent hover:ring-primary transition"
                />
              </Link>
            </>
          ) : (
            <>
              <Button
                variant="primary"
                size="md"
                icon={LogIn}
                onClick={() => navigate("/login")}
              >
                Connexion
              </Button>
            </>
          )}

          {/* Mobile menu */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`md:hidden p-2 rounded ${isHome ? "text-white hover:bg-white/10" : "hover:bg-surface-low"}`}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-outline-variant bg-surface-lowest px-4 py-3 space-y-1 animate-slide-up text-on-surface">
          <Link to="/" className="block px-3 py-2 text-label-md hover:bg-surface-low rounded">Accueil</Link>
          <Link to="/parcelles" className="block px-3 py-2 text-label-md hover:bg-surface-low rounded">Parcelles</Link>
          <Link to="/about" className="block px-3 py-2 text-label-md hover:bg-surface-low rounded">À propos</Link>
          <Link to="/contact" className="block px-3 py-2 text-label-md hover:bg-surface-low rounded">Contact</Link>
          {!isAuthenticated && (
            <Link to="/login" className="block px-3 py-2 text-label-md font-medium text-primary">Connexion</Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
