import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Calendar,
  Check,
  Eye,
  Home,
  MapPin,
  Maximize2,
} from "lucide-react";
import { useGetParcellePublicQuery } from "../../store/api/parcellesApi";
import { useCreateReservationMutation } from "../../store/api/reservationsApi";
import { TYPE_PARCELLE_LABELS } from "../../design-system/tokens";

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const apiRoot = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const baseUrl = apiRoot.replace(/\/api\/v1\/?$/, "");
  const imagePath = url.startsWith("/") ? url : `/${url}`;
  return `${baseUrl}${imagePath}`;
};

const getImages = (parcelle) => {
  const rawImages = [
    parcelle?.image_principale,
    parcelle?.photo_url,
    ...(Array.isArray(parcelle?.images)
      ? parcelle.images
      : String(parcelle?.images || "")
          .split(",")
          .map((item) => item.trim())),
  ];

  return [...new Set(rawImages.map(getImageUrl).filter(Boolean))];
};

const DetailItem = ({ icon: Icon, label, value }) => (
  <div className="rounded-xl border border-outline-variant bg-surface-lowest p-4">
    <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
      <Icon size={15} />
      {label}
    </div>
    <p className="mt-2 break-words font-montserrat text-title-md font-semibold text-on-surface">
      {value || "Non renseigne"}
    </p>
  </div>
);

export default function ParcelleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const { data: parcelle, isLoading, error } = useGetParcellePublicQuery(id);
  const [createReservation, { isLoading: isReserving }] = useCreateReservationMutation();

  const images = getImages(parcelle);
  const mainImage = images[0];
  const isAvailable = parcelle?.statut === "DISPONIBLE" || parcelle?.statut === "A_AMORCELLER";

  const handleReserve = async () => {
    if (!isAuthenticated) {
      toast.error("Connectez-vous pour reserver cette parcelle.");
      navigate("/login");
      return;
    }

    try {
      await createReservation({
        parcelle_id: parcelle.id,
        notes_client: `Reservation demandee depuis la page detail (${parcelle.reference}).`,
      }).unwrap();
      toast.success("Reservation envoyee avec succes.");
    } catch (err) {
      toast.error(err?.data?.message || "Impossible d'envoyer la reservation.");
    }
  };

  if (isLoading) {
    return (
      <div className="kbs-container min-h-[60vh] pt-28">
        <div className="kbs-card animate-pulse overflow-hidden">
          <div className="h-80 bg-surface-high" />
          <div className="space-y-3 p-6">
            <div className="h-6 w-2/3 rounded bg-surface-high" />
            <div className="h-4 w-1/2 rounded bg-surface-high" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !parcelle) {
    return (
      <div className="kbs-container min-h-[60vh] pt-28">
        <div className="kbs-card p-8 text-center">
          <h1 className="font-montserrat text-headline-sm font-bold text-on-surface">
            Parcelle introuvable
          </h1>
          <p className="mt-2 text-on-surface-variant">
            Cette parcelle n'est plus disponible ou le lien est incorrect.
          </p>
          <Link to="/parcelles" className="mt-5 inline-flex rounded-lg bg-primary px-5 py-2.5 text-on-primary">
            Retour aux parcelles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-surface-low pt-24 pb-16">
      <div className="kbs-container">
        <Link
          to="/parcelles"
          className="mb-5 inline-flex items-center gap-2 text-label-md font-semibold text-primary hover:underline"
        >
          <ArrowLeft size={17} />
          Retour aux parcelles
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="kbs-card overflow-hidden">
            <div className="aspect-[16/11] bg-surface-container">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={parcelle.titre}
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Home size={44} className="text-on-surface-variant" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 p-3">
                {images.slice(1, 5).map((image) => (
                  <img
                    key={image}
                    src={image}
                    alt=""
                    className="aspect-[4/3] rounded-lg object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-5">
            <div className="kbs-card p-6">
              <p className="font-mono text-label-sm text-on-surface-variant">
                Ref: {parcelle.reference}
              </p>
              <h1 className="mt-2 font-montserrat text-headline-md font-bold text-on-surface">
                {parcelle.titre}
              </h1>
              <p className="mt-3 flex items-center gap-2 text-on-surface-variant">
                <MapPin size={17} />
                {[parcelle.ville, parcelle.commune, parcelle.quartier].filter(Boolean).join(", ")}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-label-sm font-semibold text-emerald-700">
                  {parcelle.statut || "Disponible"}
                </span>
                {parcelle.est_vedette === 1 && (
                  <span className="rounded-full bg-secondary-container px-3 py-1 text-label-sm font-semibold text-secondary">
                    Premium
                  </span>
                )}
              </div>

              <p className="mt-5 text-body-md leading-7 text-on-surface-variant">
                {parcelle.description || "Aucune description detaillee n'a encore ete ajoutee pour cette parcelle."}
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleReserve}
                  disabled={!isAvailable || isReserving}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-secondary px-5 py-3 font-semibold text-on-secondary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Check size={18} />
                  {parcelle.statut === "A_AMORCELLER" ? "Amorceller" : "Reserver"}
                </button>
                <Link
                  to="/contact"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-outline-variant px-5 py-3 font-semibold text-on-surface transition hover:bg-surface-low"
                >
                  <Calendar size={18} />
                  Demander une visite
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailItem icon={Maximize2} label="Superficie" value={parcelle.superficie ? `${parcelle.superficie} m2` : null} />
              <DetailItem icon={Home} label="Type" value={TYPE_PARCELLE_LABELS[parcelle.type_parcelle] || parcelle.type_parcelle} />
              <DetailItem icon={Eye} label="Vues" value={parcelle.nombre_vues ?? 0} />
              <DetailItem icon={MapPin} label="Localisation" value={parcelle.localisation || parcelle.commune} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
