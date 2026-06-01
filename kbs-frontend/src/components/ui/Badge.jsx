import clsx from "clsx";
import { STATUS_COLORS } from "../../design-system/tokens";

/**
 * Badge statut KBS
 * Supporte tous les statuts de la BD : parcelles, réservations, ventes,
 * paiements, factures, locataires
 */
const Badge = ({ status, label, size = "md", showDot = true, className = "" }) => {
  // Mapper le statut BD au style
  const statusKey = status === "EN_ATTENTE" && label?.toLowerCase().includes("facture")
    ? "EN_ATTENTE_FAC"
    : status;

  const colors = STATUS_COLORS[statusKey] || {
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
  };

  const sizes = {
    sm: "text-[11px] px-2 py-0.5",
    md: "text-label-sm px-2.5 py-1",
    lg: "text-label-md px-3 py-1.5",
  };

  const displayLabel = label || status?.replace(/_/g, " ");

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 font-medium rounded-full border",
        colors.bg,
        colors.text,
        colors.border || "border-transparent",
        sizes[size],
        className
      )}
    >
      {showDot && (
        <span className={clsx("w-1.5 h-1.5 rounded-full flex-shrink-0", colors.dot)} />
      )}
      {displayLabel}
    </span>
  );
};

export default Badge;