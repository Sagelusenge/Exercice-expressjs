import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Calendar, ShoppingBag, CreditCard, ArrowRight, MapPin, Maximize2, Eye, Clock } from "lucide-react";
import { useGetReservationsMesReservationsQuery } from "../../store/api/reservationsApi";
import { useGetMesAchatsQuery } from "../../store/api/ventesApi";
import { useGetPaiementsMesPaiementsQuery } from "../../store/api/paiementsApi";
import Badge from "../../components/ui/Badge";
import Avatar from "../../components/ui/Avatar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const QuickCard = ({ icon: Icon, title, count, to, color }) => (
  <Link to={to} className="kbs-card kbs-card-hover p-5 group flex items-center gap-4">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={22} className="text-on-secondary" />
    </div>
    <div className="flex-1">
      <p className="font-montserrat font-bold text-2xl text-on-surface">{count ?? 0}</p>
      <p className="text-label-md text-on-surface-variant">{title}</p>
    </div>
    <ArrowRight size={16} className="text-on-surface-variant group-hover:translate-x-1 transition-transform" />
  </Link>
);

export default function ClientDashboardPage() {
  const { user } = useSelector((s) => s.auth);
  const { data: reservRes } = useGetReservationsMesReservationsQuery();
  const { data: achatsRes } = useGetMesAchatsQuery();
  const { data: paiementsRes } = useGetPaiementsMesPaiementsQuery();

  const reservations = reservRes || [];
  const achats = achatsRes || [];
  const paiements = paiementsRes || [];

  const activeReservations = reservations.filter((r) =>
    ["EN_ATTENTE", "EN_COURS", "CONFIRMEE"].includes(r.statut)
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Bienvenue ────────────────────────────────────── */}
      <div className="flex flex-col items-start gap-4 kbs-card p-5 bg-primary-container text-white sm:flex-row sm:items-center sm:p-6">
        <Avatar nom={user?.nom} prenom={user?.prenom} photo_url={user?.photo_url} size="xl" />
        <div>
          <p className="text-label-md text-white/75 mb-1">Bienvenue de retour</p>
          <h2 className="font-montserrat font-bold text-headline-md">
            {user?.nom} {user?.prenom}
          </h2>
          <p className="text-label-sm text-white/75 mt-1 font-mono">
            {user?.code_user}
          </p>
        </div>
      </div>

      {/* ── Statistiques rapides ──────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickCard icon={Calendar}    title="Réservations"     count={activeReservations.length}  to="/client/reservations" color="bg-amber-500" />
        <QuickCard icon={ShoppingBag} title="Mes Achats"       count={achats.length}              to="/client/achats"       color="bg-secondary" />
        <QuickCard icon={CreditCard}  title="Paiements"        count={paiements.length}            to="/client/paiements"    color="bg-emerald-500" />
      </div>

      {/* ── Réservations actives ──────────────────────────── */}
      {activeReservations.length > 0 && (
        <div className="kbs-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
            <h3 className="font-montserrat font-semibold text-title-lg text-on-surface">
              Réservations Actives
            </h3>
            <Link to="/client/reservations" className="text-label-md text-secondary hover:underline font-medium">
              Voir tout
            </Link>
          </div>
          <div className="divide-y divide-outline-variant">
            {activeReservations.slice(0, 3).map((r) => (
              <div key={r.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-12 h-12 bg-surface-high rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin size={18} className="text-on-surface-variant" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-label-md font-semibold text-on-surface truncate">
                    {r.titre_parcelle}
                  </p>
                  <p className="text-label-sm text-on-surface-variant">
                    {r.reference} • {r.ville}, {r.commune}
                  </p>
                </div>
                <div className="text-right">
                  <Badge status={r.statut} size="sm" />
                  {r.jours_restants > 0 && (
                    <p className="text-label-sm text-on-surface-variant mt-1 flex items-center gap-1 justify-end">
                      <Clock size={11} />
                      {r.jours_restants}j restants
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CTA si pas de données ─────────────────────────── */}
      {activeReservations.length === 0 && (
        <div className="kbs-card p-12 text-center">
          <div className="w-16 h-16 bg-secondary-container rounded-full flex items-center justify-center mx-auto mb-5">
            <MapPin size={28} className="text-secondary" />
          </div>
          <h3 className="font-montserrat font-semibold text-title-lg text-on-surface mb-2">
            Commencez votre recherche
          </h3>
          <p className="text-body-md text-on-surface-variant mb-6 max-w-sm mx-auto">
            Explorez notre catalogue de parcelles et trouvez l'investissement idéal pour vous.
          </p>
          <Link
            to="/parcelles"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-lg font-semibold text-label-md hover:bg-primary-container transition"
          >
            Parcourir les parcelles
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
