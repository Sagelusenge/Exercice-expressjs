import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  SlidersHorizontal, LayoutGrid, List, X, ChevronDown,
  Search, MapPin, Maximize2, Home, Eye, Heart, Check, Calendar, Clock
} from "lucide-react";
import { useGetParcellesPubliquesQuery } from "../../store/api/parcellesApi";
import { useAddFavoriMutation, useDeleteFavoriMutation, useGetFavorisQuery } from "../../store/api/favorisApi";
import { useCreateReservationMutation } from "../../store/api/reservationsApi";
import { useCreateVisiteMutation } from "../../store/api/visitesApi";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import Pagination from "../../components/ui/Pagination";
import { TYPE_PARCELLE_LABELS } from "../../design-system/tokens";
import toast from "react-hot-toast";
import { resolveAssetUrl } from "../../utils/assets";

const LIMIT = 10; // 10 par page, 5 par ligne

const TYPE_OPTIONS = [
  { value: "", label: "Tous types" },
  { value: "RESIDENTIELLE", label: "Residentielle" },
  { value: "COMMERCIALE", label: "Commerciale" },
  { value: "INDUSTRIELLE", label: "Industrielle" },
];

// ── Carte parcelle catalogue ──────────────────────────────
const CatalogCard = ({ parcelle, viewMode, isFavorite, onFavorite, onReserve, onRequestVisit }) => {
  const isAvailable = parcelle.statut === "DISPONIBLE" || parcelle.statut === "A_AMORCELLER";
  const isAmorcellage = parcelle.statut === "A_AMORCELLER";
  const completeImageUrl = resolveAssetUrl(parcelle.image_principale || parcelle.photo_url);

  if (viewMode === "list") {
    return (
      <div className="kbs-card flex gap-0 overflow-hidden kbs-card-hover group">
        {/* Image */}
        <div className="w-48 flex-shrink-0 relative overflow-hidden">
          {completeImageUrl ? (
            <img
              src={completeImageUrl}
              alt={parcelle.titre}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full bg-surface-container flex items-center justify-center min-h-[140px]">
              <MapPin size={28} className="text-on-surface-variant" />
            </div>
          )}
          {parcelle.est_vedette === 1 && (
            <span className="absolute top-2 left-2 bg-secondary text-on-secondary text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
              Premium
            </span>
          )}
        </div>

        {/* Contenu */}
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="text-label-sm text-on-surface-variant font-mono">
                  {parcelle.reference}
                </p>
                <h3 className="font-montserrat font-semibold text-title-lg text-on-surface mt-0.5">
                  {parcelle.titre}
                </h3>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={`text-label-sm px-2.5 py-1 rounded-full font-medium ${
                    isAvailable
                      ? "bg-emerald-50 text-emerald-700"
                      : parcelle.statut === "RESERVEE"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {parcelle.statut}
                </span>
              </div>
            </div>

            <p className="flex items-center gap-1.5 text-label-md text-on-surface-variant mb-3">
              <MapPin size={13} />
              {parcelle.ville}, {parcelle.commune}
              {parcelle.quartier && `, ${parcelle.quartier}`}
            </p>

            <div className="flex items-center gap-4 text-label-sm text-on-surface-variant">
              <span className="flex items-center gap-1">
                <Maximize2 size={12} /> {parcelle.superficie} m²
              </span>
              <span className="flex items-center gap-1">
                <Home size={12} /> {TYPE_PARCELLE_LABELS[parcelle.type_parcelle]}
              </span>
              <span className="flex items-center gap-1">
                <Eye size={12} /> {parcelle.nombre_vues} vues
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Link
              to={`/parcelles/${parcelle.id}`}
              className="flex-1 py-2 bg-surface-low border border-outline-variant text-on-surface text-label-md font-semibold rounded-lg text-center hover:bg-surface-lowest transition"
            >
              Détails
            </Link>
            {isAvailable && (
              <>
                <button
                  onClick={() => onReserve(parcelle)}
                  className="flex-1 py-2 bg-secondary text-on-secondary text-label-md font-semibold rounded-lg text-center hover:opacity-90 transition"
                >
                  {isAmorcellage ? "Amorceller" : "Réserver"}
                </button>
                <button
                  onClick={() => onRequestVisit(parcelle)}
                  className="flex-1 py-2 bg-primary text-on-primary text-label-md font-semibold rounded-lg text-center hover:opacity-90 transition"
                >
                  Demander une visite
                </button>
              </>
            )}
            {onFavorite && (
              <button
                onClick={() => onFavorite(parcelle.id)}
                className="p-2 border border-outline-variant rounded-lg hover:bg-surface-low transition"
              >
                <Heart
                  size={16}
                  className={isFavorite ? "fill-red-500 text-red-500" : "text-on-surface-variant"}
                />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="kbs-card kbs-card-hover group overflow-hidden relative">
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        {parcelle.est_vedette === 1 && (
          <span className="bg-secondary text-on-secondary text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Premium
          </span>
        )}
        {parcelle.statut === "RESERVEE" && (
          <span className="bg-amber-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
            Réservée
          </span>
        )}
      </div>

      {/* Favori */}
      {onFavorite && (
        <button
          onClick={(e) => { e.preventDefault(); onFavorite(parcelle.id); }}
          className="absolute top-3 right-3 z-10 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:scale-110 transition-transform"
        >
          <Heart
            size={13}
            className={isFavorite ? "fill-red-500 text-red-500" : "text-on-surface-variant"}
          />
        </button>
      )}

      {/* Image */}
      <div className="aspect-[4/3] overflow-hidden bg-surface-high">
        {completeImageUrl ? (
          <img
            src={completeImageUrl}
            alt={parcelle.titre}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full bg-surface-container flex items-center justify-center">
            <Home size={28} className="text-on-surface-variant" />
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="text-[11px] text-on-surface-variant font-mono mb-1">
          Ref: {parcelle.reference}
        </p>
        <h3 className="font-montserrat font-semibold text-body-md text-on-surface line-clamp-1 mb-1">
          {parcelle.titre}
        </h3>
        <p className="flex items-center gap-1 text-label-sm text-on-surface-variant mb-3">
          <MapPin size={11} />
          {parcelle.ville}, {parcelle.commune}
        </p>

        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className="flex items-center gap-1 text-label-sm text-on-surface-variant">
            <Maximize2 size={11} /> {parcelle.superficie} m²
          </span>
          <span className="text-label-sm bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full">
            {TYPE_PARCELLE_LABELS[parcelle.type_parcelle]}
          </span>
          {isAmorcellage && (
            <span className="text-label-sm bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
              Plan disponible
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {isAvailable && (
            <>
              <button
                onClick={() => onReserve(parcelle)}
                className="w-full py-2 bg-secondary text-on-secondary text-label-md font-semibold rounded-lg text-center hover:opacity-90 transition"
              >
                {isAmorcellage ? "Amorceller" : "Réserver"}
              </button>
              <button
                onClick={() => onRequestVisit(parcelle)}
                className="w-full py-2 bg-primary text-on-primary text-label-md font-semibold rounded-lg text-center hover:opacity-90 transition"
              >
                Demander une visite
              </button>
            </>
          )}
          <Link
            to={`/parcelles/${parcelle.id}`}
            className="w-full py-2 bg-surface-low border border-outline-variant text-on-surface text-label-md font-semibold rounded-lg text-center hover:bg-surface-lowest transition"
          >
            Voir Détails
          </Link>
        </div>
      </div>
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────
export default function ParcelleCatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const [viewMode, setViewMode] = useState("grid");
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  
  // Reservation modal state
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [selectedParcelle, setSelectedParcelle] = useState(null);
  const [reserveForm, setReserveForm] = useState({
    montant_reservation: "",
    devise: "USD",
    notes_client: "",
  });

  // Visit request modal state
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [visitForm, setVisitForm] = useState({
    date_souhaitee: "",
    heure_souhaitee: "",
    notes_client: "",
  });

  const [filters, setFilters] = useState({
    ville: searchParams.get("ville") || "",
    commune: searchParams.get("commune") || "",
    superficie_min: searchParams.get("superficie_min") || "",
    superficie_max: "",
    type_parcelle: searchParams.get("type_parcelle") || "",
    search: searchParams.get("search") || "",
  });

  const [applied, setApplied] = useState(filters);

  // API — v_parcelles_publiques SANS prix
  const { data, isLoading, isFetching, refetch } = useGetParcellesPubliquesQuery({
    page,
    limit: LIMIT,
    ...applied,
  }, { refetchOnMountOrArgChange: true });

  // Favoris (si connecté CLIENT)
  const { data: favorisData } = useGetFavorisQuery(undefined, {
    skip: !isAuthenticated || user?.role !== "CLIENT",
  });
  const [addFavori] = useAddFavoriMutation();
  const [deleteFavori] = useDeleteFavoriMutation();
  const [createReservation, { isLoading: isReserving }] = useCreateReservationMutation();
  const [createVisite, { isLoading: isRequestingVisit }] = useCreateVisiteMutation();

  const favorisIds = favorisData?.map((f) => f.id) || [];

  const parcelles = data?.data || [];
  const pagination = data?.pagination;

  const applyFilters = () => {
    setPage(1);
    setApplied({ ...filters });
    setFilterOpen(false);
  };

  const resetFilters = () => {
    const empty = { ville: "", commune: "", superficie_min: "", superficie_max: "", type_parcelle: "", search: "" };
    setFilters(empty);
    setApplied(empty);
    setPage(1);
  };

  const handleFavorite = async (parcelleId) => {
    if (!isAuthenticated) return;
    if (favorisIds.includes(parcelleId)) {
      await deleteFavori(parcelleId);
    } else {
      await addFavori({ parcelle_id: parcelleId });
    }
  };

  const handleReserve = (parcelle) => {
    if (!isAuthenticated) {
      toast.error("Veuillez vous connecter pour réserver");
      return;
    }
    setSelectedParcelle(parcelle);
    setReserveForm({
      montant_reservation: "",
      devise: "USD",
      notes_client: "",
    });
    setIsReserveModalOpen(true);
  };

  const handleSubmitReservation = async (e) => {
    e.preventDefault();
    if (!selectedParcelle) return;
    try {
      await createReservation({
        parcelle_id: selectedParcelle.id,
        montant_reservation: parseFloat(reserveForm.montant_reservation) || 0,
        devise: reserveForm.devise,
        notes_client: reserveForm.notes_client,
      }).unwrap();
      toast.success("Réservation effectuée avec succès !");
      setIsReserveModalOpen(false);
      setSelectedParcelle(null);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Erreur lors de la réservation");
    }
  };

  const handleRequestVisit = (parcelle) => {
    if (!isAuthenticated) {
      toast.error("Veuillez vous connecter pour demander une visite");
      return;
    }
    setSelectedParcelle(parcelle);
    setVisitForm({
      date_souhaitee: "",
      heure_souhaitee: "",
      notes_client: "",
    });
    setIsVisitModalOpen(true);
  };

  const handleSubmitVisit = async (e) => {
    e.preventDefault();
    if (!selectedParcelle) return;
    try {
      await createVisite({
        parcelle_id: selectedParcelle.id,
        date_souhaitee: visitForm.date_souhaitee,
        heure_souhaitee: visitForm.heure_souhaitee,
        notes_client: visitForm.notes_client,
      }).unwrap();
      toast.success("Demande de visite envoyée avec succès !");
      setIsVisitModalOpen(false);
      setSelectedParcelle(null);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Erreur lors de la demande de visite");
    }
  };

  const activeFiltersCount = Object.values(applied).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Header page ─────────────────────────────────── */}
      <div className="bg-surface-lowest border-b border-outline-variant py-8">
        <div className="kbs-container">
          <h1 className="font-montserrat font-bold text-headline-lg text-on-surface">
            Catalogue de Parcelles
          </h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Découvrez notre sélection de terrains disponibles à travers la RDC
          </p>
        </div>
      </div>

      <div className="kbs-container py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Sidebar filtres (desktop) ──────────────── */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="kbs-card p-5 sticky top-24">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-montserrat font-semibold text-title-lg text-on-surface">
                  Filtres
                </h3>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="text-label-sm text-secondary hover:underline flex items-center gap-1"
                  >
                    <X size={12} /> Effacer
                  </button>
                )}
              </div>

              <div className="space-y-5">
                {/* Recherche texte */}
                <div>
                  <label className="text-label-sm font-medium text-on-surface block mb-2">
                    Recherche
                  </label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      placeholder="Titre, quartier..."
                      className="kbs-input w-full pl-9 text-label-md"
                    />
                  </div>
                </div>

                {/* Ville */}
                <div>
                  <label className="text-label-sm font-medium text-on-surface block mb-2">
                    Ville
                  </label>
                  <select
                    value={filters.ville}
                    onChange={(e) => setFilters({ ...filters, ville: e.target.value })}
                    className="kbs-input w-full text-label-md"
                  >
                    <option value="">Toutes les villes</option>
                    {["Goma", "Kinshasa", "Bukavu", "Lubumbashi"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </div>

                {/* Commune */}
                <div>
                  <label className="text-label-sm font-medium text-on-surface block mb-2">
                    Commune
                  </label>
                  <input
                    value={filters.commune}
                    onChange={(e) => setFilters({ ...filters, commune: e.target.value })}
                    placeholder="Karisimbi, Himbi..."
                    className="kbs-input w-full text-label-md"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="text-label-sm font-medium text-on-surface block mb-2">
                    Type de parcelle
                  </label>
                  {TYPE_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2.5 mb-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="type"
                        value={opt.value}
                        checked={filters.type_parcelle === opt.value}
                        onChange={() => setFilters({ ...filters, type_parcelle: opt.value })}
                        className="w-4 h-4 accent-secondary"
                      />
                      <span className="text-label-md text-on-surface group-hover:text-secondary transition">
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Superficie */}
                <div>
                  <label className="text-label-sm font-medium text-on-surface block mb-2">
                    Superficie (m²)
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={filters.superficie_min}
                      onChange={(e) => setFilters({ ...filters, superficie_min: e.target.value })}
                      placeholder="Min"
                      type="number"
                      className="kbs-input w-20 text-label-md"
                    />
                    <input
                      value={filters.superficie_max}
                      onChange={(e) => setFilters({ ...filters, superficie_max: e.target.value })}
                      placeholder="Max"
                      type="number"
                      className="kbs-input w-20 text-label-md"
                    />
                  </div>
                </div>

                <button
                  onClick={applyFilters}
                  className="w-full py-2.5 bg-primary text-on-primary rounded-lg font-semibold text-label-md hover:bg-primary-container transition"
                >
                  Appliquer les filtres
                  {activeFiltersCount > 0 && (
                    <span className="ml-2 bg-secondary text-on-secondary text-[10px] px-1.5 py-0.5 rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </aside>

          {/* ── Contenu principal ──────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Barre d'outils */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-label-md text-on-surface-variant">
                {isFetching ? (
                  <span className="animate-pulse">Chargement...</span>
                ) : (
                  <>
                    <span className="font-semibold text-on-surface">{pagination?.total || 0}</span>
                    {" "}parcelle{(pagination?.total || 0) > 1 ? "s" : ""} trouvé{(pagination?.total || 0) > 1 ? "s" : ""}
                  </>
                )}
              </p>

              {/* Toggle vue */}
              <div className="flex items-center gap-1 bg-surface-low rounded-lg p-1 border border-outline-variant">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition ${
                    viewMode === "grid"
                      ? "bg-surface-lowest shadow-card text-on-surface"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition ${
                    viewMode === "list"
                      ? "bg-surface-lowest shadow-card text-on-surface"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>

            {/* Grille — 5 colonnes, 10 par page */}
            {isLoading ? (
              <div className={viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
                : "space-y-4"
              }>
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="kbs-card animate-pulse overflow-hidden">
                    <div className="aspect-[4/3] bg-surface-high" />
                    <div className="p-4 space-y-3">
                      <div className="h-3 bg-surface-high rounded w-1/2" />
                      <div className="h-4 bg-surface-high rounded" />
                      <div className="h-9 bg-surface-high rounded mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : parcelles.length === 0 ? (
              <div className="text-center py-24 kbs-card">
                <MapPin size={40} className="text-on-surface-variant mx-auto mb-4" />
                <h3 className="font-montserrat font-semibold text-title-lg text-on-surface mb-2">
                  Aucune parcelle trouvée
                </h3>
                <p className="text-body-md text-on-surface-variant">
                  Modifiez vos critères de recherche
                </p>
                <button
                  onClick={resetFilters}
                  className="mt-6 px-5 py-2.5 bg-primary text-on-primary rounded-lg text-label-md font-semibold hover:bg-primary-container transition"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
                  : "space-y-4"
              }>
                {parcelles.map((p) => (
                  <CatalogCard
                    key={p.id}
                    parcelle={p}
                    viewMode={viewMode}
                    isFavorite={favorisIds.includes(p.id)}
                    onFavorite={isAuthenticated && user?.role === "CLIENT" ? handleFavorite : null}
                    onReserve={handleReserve}
                    onRequestVisit={handleRequestVisit}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && (
              <div className="mt-8 kbs-card p-4">
                <Pagination
                  pagination={pagination}
                  onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  entityName="parcelles"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reservation Modal */}
      {isReserveModalOpen && selectedParcelle && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
              <h2 className="text-lg font-bold text-on-surface">
                Réserver {selectedParcelle.reference}
              </h2>
              <button
                onClick={() => setIsReserveModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmitReservation} className="p-5 space-y-4 overflow-y-auto flex-grow">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  {selectedParcelle.titre}
                </label>
                <p className="text-label-sm text-on-surface-variant">
                  {selectedParcelle.ville}, {selectedParcelle.commune} • {selectedParcelle.superficie} m²
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Notes (optionnel)
                </label>
                <textarea
                  value={reserveForm.notes_client}
                  onChange={(e) => setReserveForm({ ...reserveForm, notes_client: e.target.value })}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                  placeholder="Ajouter une note..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsReserveModalOpen(false)}
                  className="px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-low transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isReserving}
                  className="px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary-container transition disabled:opacity-60 flex items-center gap-2"
                >
                  {isReserving ? (
                    "Réservation en cours..."
                  ) : (
                    <>
                      <Check size={16} />
                      Confirmer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Visit Request Modal */}
      {isVisitModalOpen && selectedParcelle && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
              <h2 className="text-lg font-bold text-on-surface">
                Demander une visite pour {selectedParcelle.reference}
              </h2>
              <button
                onClick={() => setIsVisitModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmitVisit} className="p-5 space-y-4 overflow-y-auto flex-grow">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  {selectedParcelle.titre}
                </label>
                <p className="text-label-sm text-on-surface-variant">
                  {selectedParcelle.ville}, {selectedParcelle.commune} • {selectedParcelle.superficie} m²
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1 flex items-center gap-2">
                  <Calendar size={16} /> Date souhaitée
                </label>
                <input
                  type="date"
                  value={visitForm.date_souhaitee}
                  onChange={(e) => setVisitForm({ ...visitForm, date_souhaitee: e.target.value })}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1 flex items-center gap-2">
                  <Clock size={16} /> Heure souhaitée
                </label>
                <input
                  type="time"
                  value={visitForm.heure_souhaitee}
                  onChange={(e) => setVisitForm({ ...visitForm, heure_souhaitee: e.target.value })}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Notes (optionnel)
                </label>
                <textarea
                  value={visitForm.notes_client}
                  onChange={(e) => setVisitForm({ ...visitForm, notes_client: e.target.value })}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                  placeholder="Ajouter une note..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsVisitModalOpen(false)}
                  className="px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-low transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isRequestingVisit}
                  className="px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary-container transition disabled:opacity-60 flex items-center gap-2"
                >
                  {isRequestingVisit ? (
                    "Envoi en cours..."
                  ) : (
                    <>
                      <Check size={16} />
                      Envoyer la demande
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
