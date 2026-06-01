import { useParams } from "react-router-dom";
import ParcelleCatalogPage from "./ParcelleCatalogPage";

/**
 * Page temporaire pour le détail d'une parcelle.
 * Comme l'écran est encore en construction, on réutilise le catalogue
 * pour éviter le crash au démarrage (import manquant côté routes).
 */
export default function ParcelleDetailPage() {
  // On garde le paramètre pour qu'on puisse brancher le vrai detail ensuite.
  const { id } = useParams();

  // À remplacer plus tard par un composant de détails.
  return (
    <div>
      <div className="px-4 py-3 text-sm text-gray-600">
        Détail parcelle (id: {id})
      </div>
      <ParcelleCatalogPage />
    </div>
  );
}
