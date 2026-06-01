import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Search, Bell, Heart, LogIn, Menu, X } from "lucide-react";
import { useState } from "react";
import Button from "../ui/Button";
import Avatar from "../ui/Avatar";
import NotifBell from "../notifications/NotifBell";

const Navbar = () => {
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Rediriger vers l'espace approprié selon le rôle
  const getDashboardPath = () => {
    if (!user) return "/login";
    if (["SUPER_ADMIN", "BOSS", "GERANT"].includes(user.role)) return "/admin";
    if (user.role === "CLIENT") return "/client";
    if (user.role === "LOCATAIRE") return "/locataire";
    return "/";
  };

  return (
    <nav className="sticky top-0 z-50 bg-surface-lowest border-b border-outline-variant">
      <div className="kbs-container h-16 flex items-center gap-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <span className="font-montserrat font-bold text-on-primary text-sm">K</span>
          </div>
          <span className="font-montserrat font-bold text-title-lg text-on-surface hidden sm:block">
            KBS Real Estate
          </span>
        </Link>

        {/* Navigation principale */}
        <div className="hidden md:flex items-center gap-1 flex-1">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `px-4 py-2 text-label-md font-medium rounded transition-colors ${
                isActive
                  ? "text-primary border-b-2 border-primary"
                  : "text-on-surface-variant hover:text-on-surface"
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
                  ? "text-primary border-b-2 border-primary"
                  : "text-on-surface-variant hover:text-on-surface"
              }`
            }
          >
            Parcelles
          </NavLink>
        </div>

        {/* Barre de recherche */}
        <div className="hidden md:flex items-center gap-2 bg-surface-low rounded-full px-4 py-2 flex-1 max-w-xs border border-outline-variant focus-within:border-primary transition">
          <Search size={15} className="text-on-surface-variant flex-shrink-0" />
          <input
            type="text"
            placeholder="Rechercher des parcelles..."
            className="bg-transparent flex-1 text-label-md text-on-surface placeholder:text-on-surface-variant focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") navigate(`/parcelles?search=${e.target.value}`);
            }}
          />
        </div>

        {/* Actions droite */}
        <div className="flex items-center gap-2 ml-auto">
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
            className="md:hidden p-2 rounded hover:bg-surface-low"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-outline-variant bg-surface-lowest px-4 py-3 space-y-1 animate-slide-up">
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