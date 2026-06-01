import { useState, useRef, useEffect } from "react";
import { Bell, X, Check, CheckCheck } from "lucide-react";
import { useGetNotificationsCountQuery, useGetNotificationsNonLuesQuery, useMarkAllReadMutation } from "../../store/api/notificationsApi";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const TYPE_ICONS = {
  RESERVATION_EFFECTUEE: "📋",
  PAIEMENT_VALIDE: "✅",
  VENTE_CONFIRMEE: "🏡",
  FACTURE_VALIDEE: "📄",
  FACTURE_REJETEE: "❌",
  ECHEANCE_LOYER_J7: "⏰",
  LOCATAIRE_EN_RETARD: "⚠️",
  EMAIL_BIENVENUE: "👋",
  COMPTE_CREE: "🎉",
};

export default function NotifBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const { data: countRes } = useGetNotificationsCountQuery(undefined, { pollingInterval: 30000 });
  const { data: notifRes } = useGetNotificationsNonLuesQuery(undefined, { skip: !open });
  const [markAll] = useMarkAllReadMutation();

  const count = countRes?.count || 0;
  const notifs = notifRes || [];

  // Fermer au clic extérieur
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-surface-low text-on-surface-variant transition"
      >
        <Bell size={20} />
        {count > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-error text-on-error text-[9px] font-bold rounded-full flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-surface-lowest rounded-xl shadow-modal border border-outline-variant z-50 overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
            <h4 className="font-montserrat font-semibold text-on-surface">
              Notifications {count > 0 && <span className="text-secondary">({count})</span>}
            </h4>
            <div className="flex items-center gap-1">
              {count > 0 && (
                <button
                  onClick={() => markAll()}
                  className="p-1.5 text-on-surface-variant hover:text-secondary transition"
                  title="Tout marquer comme lu"
                >
                  <CheckCheck size={16} />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1.5 text-on-surface-variant hover:text-on-surface transition">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Liste */}
          <div className="max-h-80 overflow-y-auto kbs-scrollbar">
            {notifs.length === 0 ? (
              <div className="text-center py-10 text-on-surface-variant">
                <Bell size={28} className="mx-auto mb-3 opacity-40" />
                <p className="text-label-md">Aucune notification</p>
              </div>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id}
                  className="flex gap-3 px-4 py-3 hover:bg-surface-low transition border-b border-outline-variant last:border-0"
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">
                    {TYPE_ICONS[n.type] || "🔔"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-label-md font-semibold text-on-surface">{n.titre}</p>
                    <p className="text-label-sm text-on-surface-variant mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[11px] text-on-surface-variant mt-1">
                      {n.created_at ? format(new Date(n.created_at), "dd MMM, HH:mm", { locale: fr }) : ""}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}