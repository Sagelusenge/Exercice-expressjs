import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Search, Shield, MapPin, Users, ChevronRight,
  ArrowRight, Phone, Mail, Eye, Maximize2, Home
} from "lucide-react";
import { useGetParcellesPubliquesQuery } from "../../store/api/parcellesApi";
import { TYPE_PARCELLE_LABELS } from "../../design-system/tokens";
import toast from "react-hot-toast";

// Helper to get complete image URL
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `http://localhost:5000${url}`;
};

// ── Mini-composants internes ──────────────────────────────
const TypeBadge = ({ type }) => {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
      <Home size={10} />
      {TYPE_PARCELLE_LABELS[type] || type}
    </span>
  );
};

const FeaturedParcelleCard = ({ parcelle }) => {
  const completeImageUrl = getImageUrl(parcelle.image_principale || parcelle.photo_url);
  return (
  <Link
    to={`/parcelles/${parcelle.id}`}
    className="group kbs-card kbs-card-hover overflow-hidden block"
  >
    {/* Badge */}
    <div className="relative">
      <div className="aspect-[4/3] overflow-hidden bg-surface-high">
        {completeImageUrl ? (
          <img
            src={completeImageUrl}
            alt={parcelle.titre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-surface-container flex items-center justify-center">
            <MapPin size={32} className="text-on-surface-variant" />
          </div>
        )}
      </div>
      {parcelle.est_vedette === 1 && (
        <span className="absolute top-3 left-3 bg-secondary text-on-secondary text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
          Premium
        </span>
      )}
      {parcelle.statut === "VENDUE" && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <span className="bg-white text-on-surface font-bold px-4 py-2 rounded-full text-label-sm">
            VENDU {Math.floor(Math.random() * 30 + 60)}%
          </span>
        </div>
      )}
    </div>

    <div className="p-4">
      <p className="text-label-sm text-on-surface-variant font-mono mb-1">
        Ref: {parcelle.reference}
      </p>
      <h3 className="font-montserrat font-semibold text-body-md text-on-surface mb-1 line-clamp-1">
        {parcelle.titre}
      </h3>
      <p className="flex items-center gap-1 text-label-sm text-on-surface-variant mb-3">
        <MapPin size={11} />
        {parcelle.ville}, {parcelle.commune}
      </p>

      <div className="flex items-center gap-2 mb-4">
        <span className="flex items-center gap-1 text-label-sm text-on-surface-variant">
          <Maximize2 size={11} />
          {parcelle.superficie} m²
        </span>
        <TypeBadge type={parcelle.type_parcelle} />
        <span className="flex items-center gap-1 text-label-sm text-on-surface-variant ml-auto">
          <Eye size={11} />
          {parcelle.nombre_vues}
        </span>
      </div>

      <button className="w-full py-2.5 bg-secondary text-on-secondary text-label-md font-semibold rounded-lg hover:opacity-90 transition-all">
        Voir Détails
      </button>
    </div>
  </Link>
  );
};

// ── Page principale ───────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState({ ville: "", commune: "", superficie_min: "" });
  const [newsletterEmail, setNewsletterEmail] = useState("");

  const { data: featuredRes, isLoading } = useGetParcellesPubliquesQuery({
    page: 1, limit: 100,
  });

  const parcelles = featuredRes || [];

  const handleSearch = (e) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (search.ville) p.set("ville", search.ville);
    if (search.commune) p.set("commune", search.commune);
    if (search.superficie_min) p.set("superficie_min", search.superficie_min);
    navigate(`/parcelles?${p}`);
  };

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (!newsletterEmail) {
      toast.error("Veuillez saisir votre email");
      return;
    }
    toast.success("Merci pour votre inscription à la newsletter !");
    setNewsletterEmail("");
  };

  return (
    <div className="bg-surface">

      {/* ═══════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════ */}
      <section className="relative min-h-[88vh] flex items-end pb-20 overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            poster="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=80"
          >
            <source src="https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-seashore-1154-large.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
        </div>

        {/* Grid architectural */}
        <div
          className="absolute inset-0 opacity-5 z-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        <div className="kbs-container relative z-20 w-full">
          <div className="max-w-3xl">
            <p className="inline-block text-label-md text-secondary-container uppercase tracking-[0.2em] font-semibold mb-5">
              Kitumaini Balezi Serge — Goma, RDC
            </p>

            <h1 className="font-montserrat font-bold text-display-lg text-white leading-[1.1] mb-6 text-balance">
              Investissez dans votre avenir avec des parcelles premium
            </h1>

            <p className="text-body-lg text-white/75 mb-12 max-w-xl">
              Sécurisez votre héritage avec un patrimoine immobilier géré
              professionnellement dans les zones de développement les plus
              prometteuses de la région.
            </p>

            {/* Formulaire recherche */}
            <form
              onSubmit={handleSearch}
              className="bg-white rounded-xl p-4 shadow-modal flex flex-wrap gap-3 max-w-2xl"
            >
              <div className="flex-1 min-w-[110px]">
                <label className="text-label-sm text-on-surface-variant block mb-1 font-medium">
                  Ville
                </label>
                <select
                  value={search.ville}
                  onChange={(e) => setSearch({ ...search, ville: e.target.value })}
                  className="kbs-input w-full text-label-md"
                >
                  <option value="">Toutes</option>
                  {["Goma", "Kinshasa", "Bukavu", "Lubumbashi"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[110px]">
                <label className="text-label-sm text-on-surface-variant block mb-1 font-medium">
                  Commune
                </label>
                <select
                  value={search.commune}
                  onChange={(e) => setSearch({ ...search, commune: e.target.value })}
                  className="kbs-input w-full text-label-md"
                >
                  <option value="">Toutes</option>
                  {["Goma", "Karisimbi", "Himbi", "Gombe"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[110px]">
                <label className="text-label-sm font-medium text-on-surface-variant block mb-1">
                  Surface min (m²)
                </label>
                <input
                  type="number"
                  value={search.superficie_min}
                  onChange={(e) => setSearch({ ...search, superficie_min: e.target.value })}
                  placeholder="ex: 500"
                  className="kbs-input w-full text-label-md"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg font-semibold text-label-md hover:bg-primary-container transition-all"
                >
                  <Search size={16} />
                  Rechercher
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          POURQUOI KBS
      ═══════════════════════════════════════════════════ */}
      <section className="py-24 bg-surface-lowest">
        <div className="kbs-container">
          <div className="grid lg:grid-cols-2 gap-16 items-start mb-16">
            <div>
              <p className="text-label-sm text-on-surface-variant uppercase tracking-widest font-semibold mb-4">
                NOTRE STANDARD
              </p>
              <h2 className="font-montserrat font-bold text-headline-lg text-on-surface">
                Pourquoi KBS ?
              </h2>
            </div>
            <p className="text-body-lg text-on-surface-variant leading-relaxed pt-2">
              Nous créons un pont transparent entre la propriété foncière et la
              réalité juridique avec une documentation vérifiée et des
              emplacements stratégiques.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: "Sécurité Juridique",
                desc: "Chaque parcelle est pré-vérifiée par des experts juridiques pour garantir des titres propres et zéro litige.",
              },
              {
                icon: MapPin,
                title: "Emplacements Stratégiques",
                desc: "Nous sourceons des terrains dans les couloirs à forte croissance, garantissant que votre investissement s'apprécie dès le premier jour.",
              },
              {
                icon: Users,
                title: "Accompagnement Expert",
                desc: "Nos consultants fournissent un support de bout en bout, de la recherche initiale à l'enregistrement foncier final.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="kbs-card kbs-card-hover p-7 border border-outline-variant"
              >
                <div className="w-11 h-11 bg-secondary-container rounded-xl flex items-center justify-center mb-5">
                  <item.icon size={22} className="text-secondary" />
                </div>
                <h3 className="font-montserrat font-semibold text-title-lg text-on-surface mb-3">
                  {item.title}
                </h3>
                <p className="text-body-md text-on-surface-variant leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          PARCELLES EN VEDETTE — TOUTES LES PARCELLES
      ═══════════════════════════════════════════════════ */}
      <section className="py-24 bg-surface">
        <div className="kbs-container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="font-montserrat font-bold text-headline-lg text-on-surface">
                Parcelles en Vedette
              </h2>
              <p className="text-body-md text-on-surface-variant mt-2">
                Notre sélection premium actuellement disponible
              </p>
            </div>
            <Link
              to="/parcelles"
              className="flex items-center gap-1 text-label-md font-semibold text-on-surface hover:text-secondary transition group"
            >
              Voir tout le catalogue
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {isLoading
              ? [...Array(10)].map((_, i) => (
                  <div key={i} className="kbs-card animate-pulse overflow-hidden">
                    <div className="aspect-[4/3] bg-surface-high" />
                    <div className="p-4 space-y-3">
                      <div className="h-3 bg-surface-high rounded w-1/2" />
                      <div className="h-4 bg-surface-high rounded" />
                      <div className="h-9 bg-surface-high rounded mt-2" />
                    </div>
                  </div>
                ))
              : parcelles.map((p) => <FeaturedParcelleCard key={p.id} parcelle={p} />)}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          CHEMIN VERS LA PROPRIÉTÉ
      ═══════════════════════════════════════════════════ */}
      <section className="py-24 bg-surface-lowest">
        <div className="kbs-container">
          <h2 className="font-montserrat font-bold text-headline-lg text-on-surface text-center mb-20">
            Votre Chemin vers la Propriété
          </h2>

          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Ligne de connexion */}
            <div className="absolute top-8 left-[12.5%] right-[12.5%] h-px bg-outline-variant hidden md:block" />

            {[
              { num: "01", icon: Search, title: "Rechercher", desc: "Parcourez notre catalogue de parcelles vérifiées." },
              { num: "02", icon: Eye, title: "Visiter", desc: "Planifiez une visite guidée avec nos experts." },
              { num: "03", icon: Shield, title: "Réserver", desc: "Sécurisez votre choix avec un accord formel." },
              { num: "04", icon: Users, title: "Posséder", desc: "Finalisez le transfert et recevez vos titres." },
            ].map((step) => (
              <div key={step.num} className="text-center relative z-10">
                <div className="w-16 h-16 rounded-full border-2 border-outline-variant bg-surface-lowest flex items-center justify-center mx-auto mb-5 shadow-card">
                  <step.icon size={22} className="text-on-surface-variant" />
                </div>
                <h3 className="font-montserrat font-semibold text-title-lg text-on-surface mb-2">
                  {step.title}
                </h3>
                <p className="text-label-md text-on-surface-variant">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════ */}
      <footer className="bg-primary-container text-on-primary-container">
        <div className="kbs-container py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-secondary rounded flex items-center justify-center">
                  <span className="font-montserrat font-bold text-on-secondary text-sm">K</span>
                </div>
                <span className="font-montserrat font-bold text-lg">KBS Real Estate</span>
              </div>
              <p className="text-label-md text-on-primary-container/75 leading-relaxed">
                Élever les standards de propriété foncière en RDC avec transparence
                et professionnalisme.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-label-md mb-5 uppercase tracking-wider text-on-primary-container/90">
                Liens Rapides
              </h4>
              <ul className="space-y-3">
                {[
                  { label: "Accueil", path: "/" },
                  { label: "Parcelles", path: "/parcelles" },
                  { label: "À propos", path: "#" },
                  { label: "Contact", path: "#" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link to={link.path} className="text-label-md text-on-primary-container hover:text-secondary transition">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-label-md mb-5 uppercase tracking-wider text-on-primary-container/90">
                Légal
              </h4>
              <ul className="space-y-3">
                {["Politique de Confidentialité", "Conditions d'Utilisation"].map((l) => (
                  <li key={l}>
                    <Link to="#" className="text-label-md text-on-primary-container hover:text-secondary transition">
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-label-md mb-5 uppercase tracking-wider text-on-primary-container/90">
                Newsletter
              </h4>
              <p className="text-label-md text-on-primary-container/75 mb-4">
                Abonnez-vous pour recevoir les nouvelles annonces de parcelles.
              </p>
              <form onSubmit={handleNewsletter} className="flex gap-2">
                <input
                  type="email"
                  placeholder="Votre email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-on-primary-container placeholder:text-on-primary-container/50 text-label-md focus:outline-none focus:border-secondary"
                />
                <button type="submit" className="p-2 bg-secondary text-on-secondary rounded-lg hover:opacity-90 transition">
                  <ArrowRight size={16} />
                </button>
              </form>
            </div>
          </div>

          <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-label-sm text-on-primary-container/60">
              © {new Date().getFullYear()} KBS Real Estate Management. Tous droits réservés.
            </p>
            <div className="flex items-center gap-4 text-on-primary-container/70">
              <Mail size={16} />
              <Phone size={16} />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
