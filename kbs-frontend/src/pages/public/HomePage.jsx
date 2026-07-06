import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  Eye,
  Home,
  Landmark,
  Mail,
  MessageCircle,
  MapPin,
  Maximize2,
  Phone,
  Search,
  Shield,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { TYPE_PARCELLE_LABELS } from "../../design-system/tokens";
import { useGetParcellesPubliquesQuery } from "../../store/api/parcellesApi";
import { useGetPublicStatsQuery } from "../../store/api/dashboardApi";
import Pagination from "../../components/ui/Pagination";
import { resolveAssetUrl } from "../../utils/assets";

const Reveal = ({ children, className = "", delay = 0, direction = "up" }) => {
  const { ref, inView } = useInView({ threshold: 0.16, triggerOnce: true });

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal-motion reveal-${direction} ${inView ? "is-visible" : ""} ${className}`}
    >
      {children}
    </div>
  );
};

const TypeBadge = ({ type }) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-semibold text-on-surface shadow-sm backdrop-blur">
    <Home size={10} />
    {TYPE_PARCELLE_LABELS[type] || type}
  </span>
);

const FeaturedParcelleCard = ({ parcelle, index }) => {
  const hasImage = parcelle.image_principale || parcelle.photo_url;
  const completeImageUrl = hasImage
    ? resolveAssetUrl(parcelle.image_principale || parcelle.photo_url)
    : null;

  return (
    <Reveal delay={index * 70}>
      <Link
        to={`/parcelles/${parcelle.id}`}
        className="group block overflow-hidden rounded-lg border border-white/70 bg-white shadow-[0_18px_50px_rgba(19,27,46,0.08)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_28px_70px_rgba(19,27,46,0.18)]"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-high">
          {completeImageUrl ? (
            <img
              src={completeImageUrl}
              alt={parcelle.titre}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          ) : (
            <div className="h-full w-full bg-[linear-gradient(135deg,#1a365d,#2a4d72_45%,#c5a059)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-80" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {parcelle.est_vedette === 1 && (
              <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-on-secondary shadow-lg">
                Premium
              </span>
            )}
            <TypeBadge type={parcelle.type_parcelle} />
          </div>
          {parcelle.statut === "VENDUE" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45">
              <span className="rounded-full bg-white px-4 py-2 text-label-sm font-bold text-on-surface">
                Vendu
              </span>
            </div>
          )}
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3 text-white">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75">
                Ref: {parcelle.reference}
              </p>
              <h3 className="line-clamp-1 font-montserrat text-title-lg font-bold text-white">
                {parcelle.titre}
              </h3>
            </div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/18 backdrop-blur transition-transform duration-500 group-hover:translate-x-1">
              <ArrowRight size={18} />
            </span>
          </div>
        </div>

        <div className="space-y-4 p-4">
          <p className="flex items-center gap-1 text-label-sm text-on-surface-variant">
            <MapPin size={12} />
            {parcelle.ville}, {parcelle.commune}
          </p>
          <div className="flex items-center gap-3 text-label-sm text-on-surface-variant">
            <span className="flex items-center gap-1">
              <Maximize2 size={12} />
              {parcelle.superficie} m2
            </span>
            <span className="ml-auto flex items-center gap-1">
              <Eye size={12} />
              {parcelle.nombre_vues}
            </span>
          </div>
          <button className="w-full rounded-lg bg-primary px-4 py-2.5 text-label-md font-semibold text-on-primary transition-all duration-300 group-hover:bg-secondary">
            Voir Details
          </button>
        </div>
      </Link>
    </Reveal>
  );
};

const trustItems = [
  {
    icon: Shield,
    title: "Securite juridique",
    desc: "Titres verifies, dossiers controles et suivi transparent avant chaque reservation.",
  },
  {
    icon: MapPin,
    title: "Zones strategiques",
    desc: "Des emplacements choisis dans les axes de croissance a Goma et dans les grandes villes.",
  },
  {
    icon: Users,
    title: "Accompagnement expert",
    desc: "Une equipe disponible du premier contact jusqu'a la remise des documents fonciers.",
  },
];

const statsFallback = [
  { label: "Parcelles suivies", value: "120+" },
  { label: "Clients accompagnes", value: "450+" },
  { label: "Dossiers verifies", value: "98%" },
  { label: "Zones couvertes", value: "12" },
];

const services = [
  {
    icon: Building2,
    title: "Gestion immobiliere",
    desc: "Centralisez vos parcelles, reservations, ventes et documents dans une experience claire.",
  },
  {
    icon: Landmark,
    title: "Expertise fonciere",
    desc: "Controle des informations, suivi administratif et meilleure lecture du statut de chaque bien.",
  },
  {
    icon: MessageCircle,
    title: "Conseil & accompagnement",
    desc: "Un parcours humain pour guider les clients de la recherche jusqu'a la finalisation.",
  },
];

const testimonials = [
  {
    name: "Jean-Pierre Kalala",
    role: "Acheteur",
    text: "La reservation et le suivi de ma parcelle ont ete simples. L'equipe KBS m'a accompagne a chaque etape.",
  },
  {
    name: "Marie-Louise Mwamba",
    role: "Investisseuse",
    text: "J'ai pu comparer les opportunites rapidement et comprendre les documents avant de m'engager.",
  },
  {
    name: "David Tshimanga",
    role: "Client",
    text: "Le site rend les informations lisibles et donne une vraie impression de confiance.",
  },
];

const steps = [
  { num: "01", icon: Search, title: "Rechercher", desc: "Filtrez les parcelles selon la ville, la commune et la superficie." },
  { num: "02", icon: Eye, title: "Visiter", desc: "Planifiez une visite guidee et confirmez le potentiel du terrain." },
  { num: "03", icon: Shield, title: "Reserver", desc: "Bloquez la parcelle choisie avec un accord clair et suivi." },
  { num: "04", icon: CheckCircle2, title: "Posseder", desc: "Finalisez le paiement et recevez vos documents de propriete." },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState({ ville: "", commune: "", superficie_min: "" });
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: featuredRes, isLoading } = useGetParcellesPubliquesQuery({
    page: currentPage,
    limit: itemsPerPage,
  });
  const { data: publicStats } = useGetPublicStatsQuery();

  const allParcelles = Array.isArray(featuredRes?.data) ? featuredRes.data : [];
  const pagination = featuredRes?.pagination || null;
  const stats = publicStats
    ? [
        { label: "Parcelles suivies", value: `${publicStats.parcelles_suivies || 0}+` },
        { label: "Clients accompagnes", value: `${publicStats.clients_accompagnes || 0}+` },
        { label: "Dossiers verifies", value: `${publicStats.dossiers_verifies || 0}%` },
        { label: "Zones couvertes", value: publicStats.zones_couvertes || 0 },
      ]
    : statsFallback;
  
  // Filter only parcelles en vedette
  const parcelles = allParcelles.filter(p => p.est_vedette === 1 || p.est_vedette === true);

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
    toast.success("Merci pour votre inscription a la newsletter !");
    setNewsletterEmail("");
  };

  return (
    <div className="overflow-hidden bg-[#f4f7f9] text-on-surface">
      <section className="relative min-h-[92vh] overflow-hidden bg-[#1a365d] pb-10 pt-24 text-white">
        <div className="absolute inset-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            poster="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1800&q=80"
            className="hero-video h-full w-full object-cover opacity-35"
          >
            <source src="https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-seashore-1154-large.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,14,22,0.96),rgba(26,54,93,0.72),rgba(9,14,22,0.42))]" />
          <div className="absolute inset-0 shadow-[inset_0_-180px_180px_rgba(0,0,0,0.72),inset_0_120px_160px_rgba(0,0,0,0.45)]" />
          <div className="hero-grid absolute inset-0 opacity-35" />
          <div className="parcel-lines absolute inset-0">
            <span className="parcel-line parcel-line-a" />
            <span className="parcel-line parcel-line-b" />
            <span className="parcel-line parcel-line-c" />
            <span className="parcel-line parcel-line-d" />
          </div>
          <div className="absolute -right-48 -top-48 h-96 w-96 rounded-full bg-[#c5a059]/20 blur-3xl" />
          <div className="absolute -bottom-48 -left-48 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="hero-scanline absolute inset-x-0 top-0 h-px bg-[#c5a059]/70" />
        </div>

        <div className="kbs-container relative z-10 grid min-h-[calc(92vh-6rem)] items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl">
            <h1
              style={{ animationDelay: "0.12s" }}
              className="animate-hero-rise mt-6 max-w-3xl font-montserrat text-[36px] font-bold leading-[1.08] text-white md:text-[56px] lg:text-[68px]"
            >
              Des parcelles verifiees,<br className="hidden sm:block" /> une experience<br className="hidden sm:block" /> plus fluide.
            </h1>

            <p
              style={{ animationDelay: "0.24s" }}
              className="animate-hero-rise mt-6 max-w-2xl text-body-lg text-white/78"
            >
              Trouvez, visitez et reservez votre terrain avec un parcours clair,
              moderne et accompagne par une equipe locale.
            </p>

            <form
              onSubmit={handleSearch}
              style={{ animationDelay: "0.36s" }}
              className="animate-hero-rise mt-10 grid gap-3 rounded-lg border border-white/20 bg-white/95 p-3 shadow-modal backdrop-blur md:grid-cols-[1fr_1fr_1fr_auto]"
            >
              <label className="block">
                <span className="mb-1 block text-label-sm font-semibold text-on-surface-variant">Ville</span>
                <select
                  value={search.ville}
                  onChange={(e) => setSearch({ ...search, ville: e.target.value })}
                  className="kbs-input w-full rounded-lg text-label-md"
                >
                  <option value="">Toutes</option>
                  {["Goma", "Kinshasa", "Bukavu", "Lubumbashi"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-label-sm font-semibold text-on-surface-variant">Commune</span>
                <select
                  value={search.commune}
                  onChange={(e) => setSearch({ ...search, commune: e.target.value })}
                  className="kbs-input w-full rounded-lg text-label-md"
                >
                  <option value="">Toutes</option>
                  {["Goma", "Karisimbi", "Himbi", "Gombe"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-label-sm font-semibold text-on-surface-variant">Surface min</span>
                <input
                  type="number"
                  value={search.superficie_min}
                  onChange={(e) => setSearch({ ...search, superficie_min: e.target.value })}
                  placeholder="ex: 500"
                  className="kbs-input w-full rounded-lg text-label-md"
                />
              </label>

              <button
                type="submit"
                className="mt-auto inline-flex h-[44px] items-center justify-center gap-2 rounded-lg bg-[#c5a059] px-5 text-label-md font-bold text-[#1a365d] shadow-lg shadow-[#c5a059]/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white"
              >
                <Search size={17} />
                Rechercher
              </button>
            </form>
          </div>

          <div className="relative hidden min-h-[560px] lg:block">
            <div className="floating-card absolute right-8 top-12 w-72 rounded-lg border border-white/20 bg-white/12 p-4 text-white shadow-modal backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#c5a059] text-[#1a365d]">
                  <Building2 size={22} />
                </div>
                <div>
                  <p className="text-label-sm uppercase tracking-[0.14em] text-white/60">Catalogue actif</p>
                  <p className="font-montserrat text-2xl font-bold">+120 biens</p>
                </div>
              </div>
            </div>

            <div className="floating-card-slow absolute bottom-20 right-0 w-80 overflow-hidden rounded-lg border border-white/20 bg-white shadow-modal">
              <div className="h-44 w-full bg-[linear-gradient(135deg,#1a365d,#42617f_48%,#c5a059)]" />
              <div className="p-4 text-on-surface">
                <p className="text-label-sm font-semibold uppercase tracking-[0.14em] text-[#c5a059]">En vedette</p>
                <h2 className="mt-1 font-montserrat text-title-lg">Terrain residentiel premium</h2>
                <p className="mt-2 flex items-center gap-1 text-label-md text-on-surface-variant">
                  <MapPin size={14} />
                  Karisimbi, Goma
                </p>
              </div>
            </div>

            <div className="floating-orbit absolute left-12 top-1/2 h-52 w-52 -translate-y-1/2 rounded-full border border-white/25">
              <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c5a059]" />
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-white py-20">
        <div className="kbs-container">
          <Reveal className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end" direction="left">
            <div>
              <p className="text-label-sm font-bold uppercase tracking-[0.18em] text-[#c5a059]">Notre standard</p>
              <h2 className="mt-3 font-montserrat text-headline-lg text-[#1a365d]">Pourquoi KBS ?</h2>
            </div>
            <p className="max-w-2xl text-body-lg leading-relaxed text-on-surface-variant">
              Nous combinons verification fonciere, catalogue lisible et accompagnement humain pour rendre l'achat plus simple et plus fiable.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {trustItems.map((item, index) => (
              <Reveal key={item.title} delay={index * 110}>
                <div className="group h-full rounded-lg border border-outline-variant bg-[#fbfaf7] p-7 shadow-card transition-all duration-500 hover:-translate-y-2 hover:border-secondary/40 hover:shadow-card-hover">
                  <div className="mb-6 grid h-12 w-12 place-items-center rounded-lg bg-[#1a365d]/5 text-[#1a365d] transition-all duration-500 group-hover:rotate-3 group-hover:scale-110 group-hover:bg-[#1a365d] group-hover:text-white">
                    <item.icon size={23} />
                  </div>
                  <h3 className="font-montserrat text-title-lg">{item.title}</h3>
                  <p className="mt-3 text-body-md leading-relaxed text-on-surface-variant">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {false && (
      <section className="bg-[#f4f7f9] py-20">
        <div className="kbs-container">
          <Reveal className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-label-sm font-bold uppercase tracking-[0.18em] text-[#c5a059]">Selection premium</p>
              <h2 className="mt-3 font-montserrat text-headline-lg text-[#1a365d]">Parcelles en vedette</h2>
              <p className="mt-2 text-body-md text-on-surface-variant">Les opportunites les plus interessantes du moment.</p>
            </div>
            <Link
              to="/parcelles"
              className="inline-flex items-center gap-1 text-label-md font-bold text-on-surface transition hover:text-secondary"
            >
              Voir tout le catalogue
              <ChevronRight size={17} />
            </Link>
          </Reveal>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {isLoading
              ? [...Array(10)].map((_, i) => (
                  <div key={i} className="rounded-lg border border-white/70 bg-white shadow-card">
                    <div className="aspect-[4/3] animate-pulse bg-surface-high" />
                    <div className="space-y-3 p-4">
                      <div className="h-3 w-1/2 animate-pulse rounded bg-surface-high" />
                      <div className="h-4 animate-pulse rounded bg-surface-high" />
                      <div className="h-10 animate-pulse rounded bg-surface-high" />
                    </div>
                  </div>
                ))
              : parcelles.map((p, index) => <FeaturedParcelleCard key={p.id} parcelle={p} index={index} />)}
          </div>
          
          {pagination && (
            <div className="mt-8 bg-white rounded-lg p-4 shadow-card">
              <Pagination
                pagination={pagination}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                entityName="parcelles en vedette"
              />
            </div>
          )}
        </div>
      </section>
      )}

      <section className="relative overflow-hidden bg-[#1a365d] py-20 text-white">
        <div className="absolute -right-48 -top-48 h-96 w-96 rounded-full bg-[#c5a059]/10 blur-3xl" />
        <div className="absolute -bottom-48 -left-48 h-96 w-96 rounded-full bg-[#c5a059]/5 blur-3xl" />
        <div className="kbs-container relative z-10 grid grid-cols-2 gap-10 md:grid-cols-4">
          {stats.map((item, index) => (
            <Reveal key={item.label} delay={index * 100} direction="scale">
              <div className="text-center">
                <div className="mb-2 font-montserrat text-4xl font-extrabold text-[#c5a059] md:text-5xl">
                  {item.value}
                </div>
                <div className="text-label-sm font-semibold uppercase tracking-wider text-slate-300">
                  {item.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="kbs-container">
          <Reveal className="mx-auto mb-14 max-w-3xl text-center">
            <p className="text-label-sm font-bold uppercase tracking-[0.18em] text-[#c5a059]">Ce que nous offrons</p>
            <h2 className="mt-3 font-montserrat text-headline-lg text-[#1a365d]">Nos services d'expertise</h2>
            <p className="mt-4 text-body-md text-on-surface-variant">
              Une experience immobiliere complete pour mieux vendre, acheter, louer et suivre vos biens.
            </p>
          </Reveal>

          <div className="grid gap-8 md:grid-cols-3">
            {services.map((service, index) => (
              <Reveal key={service.title} delay={index * 140} direction="up">
                <div className="group h-full rounded-lg border border-[#e2e8f0] bg-[#f4f7f9] p-8 transition-all duration-500 hover:-translate-y-2 hover:bg-white hover:shadow-[0_10px_25px_-5px_rgba(26,54,93,0.15)]">
                  <div className="mb-8 grid h-16 w-16 place-items-center rounded-lg bg-[#1a365d]/5 text-[#1a365d] transition-all duration-500 group-hover:bg-[#1a365d] group-hover:text-white">
                    <service.icon size={30} />
                  </div>
                  <h3 className="mb-4 font-montserrat text-2xl font-bold text-slate-900">{service.title}</h3>
                  <p className="text-body-md leading-relaxed text-slate-500">{service.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="kbs-container">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-label-sm font-bold uppercase tracking-[0.18em] text-[#c5a059]">Parcours client</p>
            <h2 className="mt-3 font-montserrat text-headline-lg text-[#1a365d]">Votre chemin vers la propriete</h2>
          </Reveal>

          <div className="relative mt-14 grid gap-6 md:grid-cols-4">
            <div className="absolute left-[12.5%] right-[12.5%] top-8 hidden h-px bg-outline-variant md:block" />
            {steps.map((step, index) => (
              <Reveal key={step.num} delay={index * 100}>
                <div className="relative z-10 text-center">
                  <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#1a365d] text-2xl font-bold text-[#c5a059] shadow-xl shadow-[#1a365d]/20 transition-all duration-500 hover:-translate-y-1 hover:shadow-card-hover">
                    {step.num}
                  </div>
                  <step.icon size={22} className="mx-auto mt-5 text-[#c5a059]" />
                  <h3 className="mt-2 font-montserrat text-title-lg">{step.title}</h3>
                  <p className="mt-2 text-label-md text-on-surface-variant">{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-[#1a365d]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(197,160,89,0.28),transparent_55%)] opacity-80" />
        <div className="kbs-container relative z-10 text-center">
          <Reveal direction="up">
            <h2 className="mx-auto max-w-3xl font-montserrat text-4xl font-extrabold text-white md:text-5xl">
              Pret a realiser votre <span className="text-[#c5a059]">projet immobilier</span> ?
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-body-lg text-slate-300">
              Nos experts peuvent vous guider vers une parcelle fiable, documentee et adaptee a votre budget.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                to="/parcelles"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#c5a059] px-8 py-4 font-montserrat text-label-md font-bold uppercase text-[#1a365d] shadow-md transition-all hover:bg-white"
              >
                Explorer les parcelles
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-lg border border-[#c5a059] px-8 py-4 font-montserrat text-label-md font-bold uppercase text-white transition-all hover:bg-[#c5a059]/10"
              >
                Creer un compte
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer du site supprimé ici: utiliser uniquement le composant <Footer /> dans PublicLayout */}
      {false && (
      <footer className="bg-primary-container text-on-primary-container">
        <div className="kbs-container py-16">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-on-secondary">
                  <span className="font-montserrat font-bold">K</span>
                </div>
                <span className="font-montserrat text-lg font-bold text-white">KBS Real Estate</span>
              </div>
              <p className="text-label-md leading-relaxed text-on-primary-container/75">
                Des standards immobiliers plus clairs, plus rapides et plus fiables en RDC.
              </p>
            </div>

            <div>
              <h4 className="mb-5 text-label-md font-semibold uppercase tracking-wider text-white/90">Liens rapides</h4>
              <ul className="space-y-3">
                {[
                  { label: "Accueil", path: "/" },
                  { label: "Parcelles", path: "/parcelles" },
                  { label: "A propos", path: "#" },
                  { label: "Contact", path: "#" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link to={link.path} className="text-label-md text-on-primary-container transition hover:text-secondary-container">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-5 text-label-md font-semibold uppercase tracking-wider text-white/90">Legal</h4>
              <ul className="space-y-3">
                {["Politique de confidentialite", "Conditions d'utilisation"].map((label) => (
                  <li key={label}>
                    <Link to="#" className="text-label-md text-on-primary-container transition hover:text-secondary-container">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-5 text-label-md font-semibold uppercase tracking-wider text-white/90">Newsletter</h4>
              <p className="mb-4 text-label-md text-on-primary-container/75">
                Recevez les nouvelles annonces de parcelles.
              </p>
              <form onSubmit={handleNewsletter} className="flex gap-2">
                <input
                  type="email"
                  placeholder="Votre email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-label-md text-white outline-none placeholder:text-white/45 focus:border-secondary-container"
                />
                <button type="submit" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-secondary text-on-secondary transition hover:bg-secondary-container hover:text-on-secondary-container">
                  <ArrowRight size={17} />
                </button>
              </form>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
            <p className="text-label-sm text-on-primary-container/60">
              Copyright {new Date().getFullYear()} KBS Real Estate Management. Tous droits reserves.
            </p>
            <div className="flex items-center gap-4 text-on-primary-container/70">
              <Mail size={16} />
              <Phone size={16} />
            </div>
          </div>
        </div>
      </footer>
      )}

      <a
        href="tel:+243810000000"
        className="group fixed bottom-20 right-6 z-40 flex h-11 w-11 items-center justify-center gap-2 overflow-hidden rounded-full bg-[#c5a059] text-[#1a365d] shadow-2xl shadow-[#c5a059]/40 transition-all duration-500 hover:w-40 hover:scale-105 sm:right-6"
        aria-label="Nous appeler"
      >
        <Phone size={18} />
        <span className="max-w-0 overflow-hidden whitespace-nowrap font-bold transition-all duration-500 group-hover:max-w-xs">
          Nous appeler
        </span>
      </a>
    </div>
  );
}
