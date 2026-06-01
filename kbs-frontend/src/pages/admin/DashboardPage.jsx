import { useState } from "react";
import {
  BarChart2, TrendingUp, Building2, Map, Users,
  ShoppingBag, CreditCard, Filter, Download,
  AlertTriangle, CheckCircle, Clock, ArrowUpRight
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  useGetDashboardAdminQuery,
  useGetActivitesRecentesQuery,
} from "../../store/api/dashboardApi";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Pagination from "../../components/ui/Pagination";
import { format } from "date-fns";
import { formatCurrency } from "../../utils/formatters";
import { fr } from "date-fns/locale";

// ── Carte KPI ─────────────────────────────────────────────
const KpiCard = ({ title, subtitle, value, icon: Icon, iconBg, accent, loading }) => {
  if (loading) return (
    <div className="kbs-card p-5 animate-pulse">
      <div className="h-4 bg-surface-high rounded w-3/4 mb-4" />
      <div className="h-8 bg-surface-high rounded w-1/2" />
    </div>
  );

  return (
    <div className="kbs-card kbs-card-hover p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">
            {title}
          </p>
          {subtitle && (
            <p className="text-label-sm text-on-surface-variant mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${iconBg || "bg-surface-high"}`}>
          {Icon && <Icon size={18} className={accent || "text-on-surface-variant"} />}
        </div>
      </div>
      <p className="font-montserrat font-bold text-3xl text-on-surface">{value ?? "—"}</p>
    </div>
  );
};

// ── Ligne activité ────────────────────────────────────────
const ActivityRow = ({ activity }) => {
  const actionColors = {
    RESERVATION_EFFECTUEE: "text-amber-600",
    PAIEMENT_VALIDE: "text-emerald-600",
    USER_CREE: "text-blue-600",
    VENTE_CONFIRMEE: "text-secondary",
  };

  const actionLabels = {
    RESERVATION_EFFECTUEE: "Nouvelle Réservation",
    PAIEMENT_VALIDE: "Paiement Reçu",
    USER_CREE: "Inscription Utilisateur",
    VENTE_CONFIRMEE: "Contrat Signé",
    LOCATAIRE_CREE: "Locataire Créé",
    PARCELLE_CREEE: "Parcelle Publiée",
  };

  const statusMap = {
    PARCELLES: { label: "ACTIF", cls: "bg-emerald-50 text-emerald-700" },
    KBS: { label: "KBS", cls: "bg-blue-50 text-blue-700" },
    USERS: { label: "EN ATTENTE", cls: "bg-amber-50 text-amber-700" },
    SYSTEME: { label: "SYSTÈME", cls: "bg-slate-100 text-slate-600" },
  };

  const nom = activity.acteur?.split(" ")[0] || "Système";
  const prenom = activity.acteur?.split(" ")[1] || "";
  const status = statusMap[activity.module] || { label: activity.module, cls: "bg-gray-100 text-gray-600" };

  return (
    <tr className="kbs-table-row">
      {/* Entité */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar nom={nom} prenom={prenom} size="sm" />
          <div>
            <p className="text-label-md font-semibold text-on-surface">{activity.acteur || "Système"}</p>
            <p className="text-label-sm text-on-surface-variant">
              {activity.entite_type} #{activity.entite_id}
            </p>
          </div>
        </div>
      </td>

      {/* Type */}
      <td className="px-5 py-4">
        <span className={`text-label-md font-medium ${actionColors[activity.action] || "text-on-surface-variant"}`}>
          {actionLabels[activity.action] || activity.action?.replace(/_/g, " ")}
        </span>
      </td>

      {/* Statut */}
      <td className="px-5 py-4">
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-sm uppercase tracking-wider ${status.cls}`}>
          {status.label}
        </span>
      </td>

      {/* Montant */}
      <td className="px-5 py-4">
        <span className="font-montserrat font-semibold text-on-surface text-label-md">
          {activity.montant
            ? `$${new Intl.NumberFormat("fr").format(activity.montant)}`
            : "—"}
        </span>
      </td>

      {/* Date */}
      <td className="px-5 py-4 text-right">
        <span className="text-label-sm text-on-surface-variant">
          {activity.created_at
            ? format(new Date(activity.created_at), "dd MMM, HH:mm", { locale: fr })
            : "—"}
        </span>
      </td>
    </tr>
  );
};

// ── Page ──────────────────────────────────────────────────
export default function DashboardPage() {
  const [activitiesPage, setActivitiesPage] = useState(1);
  const { data: dashRes, isLoading, error: dashboardError } = useGetDashboardAdminQuery();
  const { data: activitiesRes } = useGetActivitesRecentesQuery(10);

  const dash = dashRes || {};
  const parc = dash.parcelles || {};
  const usrs = dash.users || {};
  const vent = dash.ventes || {};
  const resa = dash.reservations || {};
  const kbs = dash.kbs_loyer || {};
  const ployer = dash.paiements_loyer || {};
  const revenusMensuels = dash.revenus_mensuels || [];

  const parcTotal = Number(parc.total || 0);
  const parcVendues = Number(parc.vendues || 0);
  const tauxVendu = parcTotal > 0 ? Math.round((parcVendues / parcTotal) * 100) : 0;

  // Données graphiques réelles
  const barData = [
    { name: "Disponible", value: Number(parc.disponibles || 0) },
    { name: "Vendu", value: Number(parc.vendues || 0) },
    { name: "Réservé", value: Number(parc.reservees || 0) },
    { name: "Maintenance", value: Number(parc.maintenance || 0) },
    { name: "Masqué", value: Number(parc.masquees || 0) },
    { name: "Amorceler", value: Number(parc.amorceller || 0) },
  ].filter((item) => item.value > 0 || parcTotal === 0);

  const donutData = [
    { name: "À Jour",    value: Number(kbs.a_jour || 0),    color: "#10b981" },
    { name: "En Retard", value: Number(kbs.en_retard || 0),   color: "#ef4444" },
  ];

  const monthLabels = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  const lineData = revenusMensuels.length
    ? revenusMensuels.map((item) => {
        const [, month] = String(item.mois).split("-");
        return {
          mois: monthLabels[Number(month) - 1] || item.mois,
          ventes: Number(item.ventes || 0),
          loyers: Number(item.loyers || 0),
        };
      })
    : monthLabels.slice(0, 6).map((mois) => ({ mois, ventes: 0, loyers: 0 }));

  const activities = activitiesRes || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {dashboardError && (
        <div className="kbs-card p-4 border border-error/30 bg-error/10 text-error text-label-md">
          Impossible de charger les statistiques du dashboard. Vérifiez que le backend est démarré et que la session est active.
        </div>
      )}

      {/* ── KPIs ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Inventaire Total"
          subtitle="Toutes parcelles"
          value={parc.total ?? 0}
          icon={Map}
          iconBg="bg-blue-50"
          accent="text-blue-600"
          loading={isLoading}
        />
        <KpiCard
          title="Clients Actifs"
          subtitle={`${usrs.en_attente ?? 0} en attente`}
          value={usrs.clients ?? 0}
          icon={Users}
          iconBg="bg-emerald-50"
          accent="text-emerald-600"
          loading={isLoading}
        />
        <KpiCard
          title="Revenu Total"
          subtitle={`${vent.ventes_completes ?? 0} ventes`}
          value={vent.revenu_total ? formatCurrency(vent.revenu_total) : formatCurrency(0)}
          icon={ShoppingBag}
          iconBg="bg-secondary-container"
          accent="text-secondary"
          loading={isLoading}
        />
        <KpiCard
          title="Locataires"
          subtitle={`${kbs.en_retard ?? 0} retards`}
          value={kbs.total_locataires ?? 0}
          icon={Building2}
          iconBg="bg-amber-50"
          accent="text-amber-600"
          loading={isLoading}
        />
        <KpiCard
          title="Locataires en dette"
          subtitle={formatCurrency(kbs.dette_totale || 0)}
          value={kbs.locataires_en_dette ?? 0}
          icon={AlertTriangle}
          iconBg="bg-red-50"
          accent="text-red-600"
          loading={isLoading}
        />
      </div>

      {/* ── 3 Graphiques ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* BarChart — Sales Performance */}
        <div className="kbs-card p-6">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="font-montserrat font-semibold text-title-lg text-on-surface">
                Sales Performance
              </h3>
              <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mt-0.5">
                PARCELLES VENDUES VS. DISPONIBLES
              </p>
            </div>
            <div className="p-2 bg-surface-low rounded-lg">
              <BarChart2 size={17} className="text-on-surface-variant" />
            </div>
          </div>

          <ResponsiveContainer width="100%" height={180} className="mt-4">
            <BarChart data={barData} barGap={2}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "Inter" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fontFamily: "Inter" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontFamily: "Inter", fontSize: 12, borderRadius: 8, border: "1px solid #e0e3e5" }}
                cursor={{ fill: "#f2f4f6" }}
              />
              <Bar dataKey="value" fill="#725a42" radius={[3, 3, 0, 0]} name="Nombre" />
            </BarChart>
          </ResponsiveContainer>

          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
              <span className="w-3 h-2 rounded-sm bg-secondary inline-block" /> Inventaire
            </span>
          </div>

          <div className="flex gap-6 mt-4 pt-4 border-t border-outline-variant">
            <div>
              <p className="text-label-sm text-on-surface-variant uppercase tracking-wide">INVENTAIRE</p>
              <p className="font-montserrat font-bold text-title-lg text-on-surface mt-0.5">
                {parcTotal}
              </p>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant uppercase tracking-wide">TAUX VENDU</p>
              <p className="font-montserrat font-bold text-title-lg text-secondary mt-0.5">
                {tauxVendu}%
              </p>
            </div>
          </div>
        </div>

        {/* LineChart — Revenue Trends */}
        <div className="kbs-card p-6">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="font-montserrat font-semibold text-title-lg text-on-surface">
                Revenue Trends
              </h3>
              <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mt-0.5">
                MONTHLY FINANCIAL PERFORMANCE
              </p>
            </div>
            <div className="p-2 bg-surface-low rounded-lg">
              <TrendingUp size={17} className="text-on-surface-variant" />
            </div>
          </div>

          <ResponsiveContainer width="100%" height={180} className="mt-4">
            <LineChart data={lineData}>
              <XAxis dataKey="mois" tick={{ fontSize: 11, fontFamily: "Inter" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fontFamily: "Inter" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip
                contentStyle={{ fontFamily: "Inter", fontSize: 12, borderRadius: 8, border: "1px solid #e0e3e5" }}
                formatter={(v) => [formatCurrency(v)]}
              />
              <Line
                type="monotone" dataKey="ventes" stroke="#725a42"
                strokeWidth={2} dot={{ r: 3, fill: "#725a42" }} name="Ventes Parcelles"
              />
              <Line
                type="monotone" dataKey="loyers" stroke="#131b2e"
                strokeWidth={2} dot={{ r: 3, fill: "#131b2e" }} name="Revenus Loyers"
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
              <span className="w-4 h-0.5 bg-secondary inline-block rounded" /> Land Sales
            </span>
            <span className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
              <span className="w-4 h-0.5 bg-primary-container inline-block rounded" /> Rental Income
            </span>
          </div>

          <div className="mt-4 pt-4 border-t border-outline-variant">
            <p className="text-label-sm text-on-surface-variant">
              Revenu Global:{" "}
              <span className="font-semibold text-on-surface">{formatCurrency(vent.revenu_total || 0)}</span>
            </p>
          </div>
        </div>

        {/* Donut — Tenant Status */}
        <div className="kbs-card p-6">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="font-montserrat font-semibold text-title-lg text-on-surface">
                Tenant Status
              </h3>
              <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mt-0.5">
                PAYMENT COMPLIANCE OVERVIEW
              </p>
            </div>
            <div className="p-2 bg-surface-low rounded-lg">
              <Building2 size={17} className="text-on-surface-variant" />
            </div>
          </div>

          <div className="flex justify-center my-4">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {donutData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ fontFamily: "Inter", fontSize: 12, borderRadius: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-8">
            {donutData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                <div>
                  <p className="font-montserrat font-bold text-title-lg text-on-surface leading-none">
                    {d.value}
                  </p>
                  <p className="text-label-sm text-on-surface-variant mt-0.5">{d.name}</p>
                </div>
              </div>
            ))}
          </div>

          {kbs.echeance_imminente > 0 && (
            <div className="mt-4 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2">
              <AlertTriangle size={14} />
              <span className="text-label-sm font-medium">
                {kbs.echeance_imminente} échéance(s) dans 7 jours
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Activités récentes ────────────────────────────── */}
      <div className="kbs-card overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-outline-variant">
          <div>
            <h3 className="font-montserrat font-semibold text-title-lg text-on-surface">
              Activités Récentes
            </h3>
            <p className="text-label-sm text-on-surface-variant mt-0.5">
              Suivi en temps réel des actions sur la plateforme
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant bg-surface">
                {["UTILISATEUR / ACTEUR", "ACTION", "MODULE", "VALEUR", "DATE & HEURE"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activities.length > 0 ? (
                activities.map((a, i) => <ActivityRow key={i} activity={a} />)
              ) : (
                <tr>
                  <td colSpan="5" className="px-5 py-8 text-center text-on-surface-variant italic">
                    Aucune activité récente enregistrée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
