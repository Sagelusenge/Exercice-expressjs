import clsx from "clsx";
import ParcelleCard from "./ParcelleCard";
import Pagination from "../ui/Pagination";
import { LayoutGrid, List } from "lucide-react";
import { useState } from "react";

/**
 * Grille de parcelles KBS
 * - 5 colonnes sur desktop (xl:grid-cols-5)
 * - 10 par page (limit=10)
 * - Pagination avec Next/Prev
 * - Toggle List/Grid
 */
const ParcelleGrid = ({
  parcelles = [],
  pagination,
  onPageChange,
  loading = false,
  showPrice = false,
  isAdmin = false,
  favorisIds = [],
  onFavorite,
}) => {
  const [viewMode, setViewMode] = useState("grid");

  if (loading) {
    return (
      <div>
        <div className={clsx(
          "grid gap-4",
          "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        )}>
          {[...Array(10)].map((_, i) => (
            <div key={i} className="kbs-card animate-pulse">
              <div className="aspect-[4/3] bg-surface-high rounded-t-lg" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-surface-high rounded w-1/3" />
                <div className="h-4 bg-surface-high rounded w-3/4" />
                <div className="h-3 bg-surface-high rounded w-1/2" />
                <div className="h-9 bg-surface-high rounded mt-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!parcelles.length) {
    return (
      <div className="text-center py-20">
        <p className="font-montserrat font-semibold text-headline-md text-on-surface-variant">
          Aucune parcelle trouvée
        </p>
        <p className="text-body-md text-on-surface-variant mt-2">
          Modifiez vos critères de recherche
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header grille */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-label-md text-on-surface-variant font-inter">
          <span className="font-semibold text-on-surface">{pagination?.total || parcelles.length}</span>
          {" "}parcelle{(pagination?.total || parcelles.length) > 1 ? "s" : ""} trouvée{(pagination?.total || parcelles.length) > 1 ? "s" : ""}
        </p>

        {/* Toggle vue */}
        <div className="flex items-center gap-1 bg-surface-low rounded-lg p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={clsx(
              "p-1.5 rounded-md transition",
              viewMode === "grid" ? "bg-surface-lowest shadow-card text-on-surface" : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={clsx(
              "p-1.5 rounded-md transition",
              viewMode === "list" ? "bg-surface-lowest shadow-card text-on-surface" : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Grille : 5 colonnes desktop, 10 par page */}
      {viewMode === "grid" ? (
        <div className={clsx(
          "grid gap-4",
          "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        )}>
          {parcelles.map((p) => (
            <ParcelleCard
              key={p.id}
              parcelle={p}
              showPrice={showPrice}
              isAdmin={isAdmin}
              isFavorite={favorisIds.includes(p.id)}
              onFavorite={onFavorite}
              viewMode="grid"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {parcelles.map((p) => (
            <ParcelleCard
              key={p.id}
              parcelle={p}
              showPrice={showPrice}
              isAdmin={isAdmin}
              isFavorite={favorisIds.includes(p.id)}
              onFavorite={onFavorite}
              viewMode="list"
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && (
        <div className="mt-6">
          <Pagination
            pagination={pagination}
            onPageChange={onPageChange}
            entityName="parcelles"
          />
        </div>
      )}
    </div>
  );
};

export default ParcelleGrid;