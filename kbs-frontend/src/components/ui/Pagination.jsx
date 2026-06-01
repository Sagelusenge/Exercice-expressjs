import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

/**
 * Pagination KBS
 * 5 parcelles par ligne, groupées par 10 (ou configurable)
 * Affiche : Showing X of Y | Page N of M | << < [pages] > >>
 */
const Pagination = ({
  pagination,
  onPageChange,
  showInfo = true,
  entityName = "éléments",
}) => {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, total, limit } = pagination;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  // Générer les numéros de pages à afficher
  const getPages = () => {
    const pages = [];
    const delta = 2;
    const left = Math.max(1, page - delta);
    const right = Math.min(totalPages, page + delta);

    if (left > 1) { pages.push(1); if (left > 2) pages.push("..."); }
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages) {
      if (right < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 pb-2">
      {showInfo && (
        <p className="text-label-md text-on-surface-variant font-inter">
          Affichage de{" "}
          <span className="font-semibold text-on-surface">{start}–{end}</span>
          {" "}sur{" "}
          <span className="font-semibold text-on-surface">{total}</span>
          {" "}{entityName}
        </p>
      )}

      <div className="flex items-center gap-1">
        {/* Précédent */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-2 rounded hover:bg-surface-low disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Page précédente"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Pages */}
        {getPages().map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-2 text-on-surface-variant text-label-md">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={clsx(
                "min-w-[36px] h-9 px-3 rounded text-label-md font-medium transition-all duration-150",
                p === page
                  ? "bg-primary text-on-primary"
                  : "text-on-surface hover:bg-surface-low"
              )}
            >
              {p}
            </button>
          )
        )}

        {/* Suivant */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-2 rounded hover:bg-surface-low disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Page suivante"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Info page */}
      <p className="text-label-sm text-on-surface-variant font-inter hidden sm:block">
        Page {page} sur {totalPages}
      </p>
    </div>
  );
};

export default Pagination;