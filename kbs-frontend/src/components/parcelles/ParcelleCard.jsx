import { Link } from "react-router-dom";
import { MapPin, Maximize2, Home, Heart, Eye } from "lucide-react";
import clsx from "clsx";
import Badge from "../ui/Badge";
import { TYPE_PARCELLE_LABELS } from "../../design-system/tokens";

// Helper to get complete image URL
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `http://localhost:5000${url}`;
};

/**
 * Carte parcelle KBS
 * - Site public : SANS prix (v_parcelles_publiques)
 * - Admin : AVEC prix (v_parcelles_admin)
 * - 5 par ligne sur desktop, grille de 10 avec pagination
 */
const ParcelleCard = ({
  parcelle,
  showPrice = false,  // false en public, true en admin
  isAdmin = false,
  onFavorite,
  isFavorite = false,
  viewMode = "grid",
}) => {
  const {
    id, reference, titre, ville, commune, quartier,
    superficie, type_parcelle, statut, nombre_vues,
    est_vedette, image_principale,
    // Admin seulement
    prix_vente, montant_paye, montant_restant, devise,
  } = parcelle;

  const completeImageUrl = getImageUrl(image_principale);
  const isAvailable = statut === "DISPONIBLE";
  const detailPath = isAdmin
    ? `/admin/parcelles/${id}`
    : `/parcelles/${id}`;

  if (viewMode === "list") {
    return (
      <div className="kbs-card flex gap-4 p-4 kbs-card-hover group">
        {/* Image */}
        <div className="w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-surface-high">
          {completeImageUrl ? (
            <img src={completeImageUrl} alt={titre} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
              <Home size={24} />
            </div>
          )}
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-label-sm text-on-surface-variant font-mono">{reference}</p>
              <h3 className="font-montserrat font-semibold text-title-lg text-on-surface truncate">
                {titre}
              </h3>
            </div>
            <Badge status={statut} />
          </div>

          <div className="flex items-center gap-4 mt-2 text-label-md text-on-surface-variant">
            <span className="flex items-center gap-1"><MapPin size={13} />{ville}, {commune}</span>
            <span className="flex items-center gap-1"><Maximize2 size={13} />{superficie} m²</span>
            <span>{TYPE_PARCELLE_LABELS[type_parcelle]}</span>
          </div>

          {showPrice && prix_vente && (
            <p className="font-montserrat font-bold text-body-lg text-on-surface mt-1">
              {new Intl.NumberFormat("fr-CD").format(prix_vente)} {devise}
            </p>
          )}
        </div>

        <Link
          to={detailPath}
          className="self-center flex-shrink-0 px-4 py-2 bg-secondary text-on-secondary rounded-lg text-label-md font-medium hover:opacity-90 transition"
        >
          Voir détails
        </Link>
      </div>
    );
  }

  // Vue grille (défaut)
  return (
    <div className={clsx(
      "kbs-card kbs-card-hover group relative overflow-hidden",
      !isAvailable && "opacity-80"
    )}>
      {/* Badges overlay */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        {est_vedette === 1 && (
          <span className="bg-secondary text-on-secondary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Premium
          </span>
        )}
        {statut === "VENDUE" && (
          <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Vendue
          </span>
        )}
        {statut === "RESERVEE" && (
          <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Réservée
          </span>
        )}
      </div>

      {/* Bouton favori */}
      {onFavorite && (
        <button
          onClick={(e) => { e.preventDefault(); onFavorite(id); }}
          className="absolute top-3 right-3 z-10 p-1.5 bg-white/90 backdrop-blur rounded-full shadow-sm hover:scale-110 transition-transform"
        >
          <Heart
            size={14}
            className={isFavorite ? "fill-red-500 text-red-500" : "text-on-surface-variant"}
          />
        </button>
      )}

      {/* Image */}
      <div className="aspect-[4/3] overflow-hidden bg-surface-high">
        {completeImageUrl ? (
          <img
            src={completeImageUrl}
            alt={titre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant bg-surface-container">
            <Home size={32} />
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="p-4">
        {/* Référence */}
        <p className="text-label-sm text-on-surface-variant font-mono mb-1">
          Ref: {reference}
        </p>

        {/* Titre */}
        <h3 className="font-montserrat font-semibold text-body-md text-on-surface leading-snug mb-2 line-clamp-2">
          {titre}
        </h3>

        {/* Localisation */}
        <div className="flex items-center gap-1 text-label-sm text-on-surface-variant mb-2">
          <MapPin size={12} />
          <span className="truncate">{ville}, {commune}{quartier && `, ${quartier}`}</span>
        </div>

        {/* Métadonnées */}
        <div className="flex items-center gap-3 text-label-sm text-on-surface-variant border-t border-outline-variant pt-2 mb-3">
          <span className="flex items-center gap-1">
            <Maximize2 size={12} />{superficie} m²
          </span>
          <span className="flex items-center gap-1">
            <Home size={12} />{TYPE_PARCELLE_LABELS[type_parcelle]}
          </span>
          {!isAdmin && (
            <span className="flex items-center gap-1 ml-auto">
              <Eye size={12} />{nombre_vues}
            </span>
          )}
        </div>

        {/* Prix admin uniquement */}
        {showPrice && prix_vente && (
          <div className="mb-3 p-2 bg-surface-low rounded-lg">
            <p className="font-montserrat font-bold text-body-md text-on-surface">
              {new Intl.NumberFormat("fr-CD").format(prix_vente)} {devise}
            </p>
            {montant_restant > 0 && (
              <p className="text-label-sm text-on-surface-variant">
                Reste: {new Intl.NumberFormat("fr-CD").format(montant_restant)} {devise}
              </p>
            )}
          </div>
        )}

        {/* CTA */}
        <Link to={detailPath} className="block">
          <button className="w-full py-2.5 bg-secondary text-on-secondary text-label-md font-semibold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all duration-150">
            Voir Détails
          </button>
        </Link>
      </div>
    </div>
  );
};

export default ParcelleCard;
