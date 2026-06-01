import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  useGetNotificationsCountQuery,
  useGetNotificationsNonLuesQuery,
  useMarkAllReadMutation,
  useMarkReadMutation,
} from "../../store/api/notificationsApi";

const TYPE_LABELS = {
  RESERVATION_CONFIRMEE: "Reservation",
  RESERVATION_ANNULEE: "Reservation",
  PAIEMENT_VALIDE: "Paiement",
  PAIEMENT_REJETE: "Paiement",
  VENTE_CONFIRMEE: "Vente",
  VENTE_CREEE: "Vente",
  FACTURE_VALIDEE: "Facture",
  FACTURE_REJETEE: "Facture",
  ALERTE_SYSTEME: "Systeme",
};

export default function NotifBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { data: countRes } = useGetNotificationsCountQuery(undefined, { pollingInterval: 15000 });
  const { data: notifRes } = useGetNotificationsNonLuesQuery(undefined, { skip: !open, pollingInterval: 15000 });
  const [markAll] = useMarkAllReadMutation();
  const [markRead] = useMarkReadMutation();

  const count = countRes?.count || 0;
  const notifs = notifRes || [];

  const handleNotificationClick = async (notif) => {
    try {
      await markRead(notif.id).unwrap();
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
    setOpen(false);

    // Determine where to navigate based on notification type/module
    if (notif.module === "RESERVATIONS" || notif.type?.startsWith("RESERVATION")) {
      if (user?.role === "CLIENT") {
        navigate("/client");
      } else {
        navigate("/admin/reservations");
      }
    } else if (notif.module === "VENTES" || notif.type?.startsWith("VENTE")) {
      if (user?.role === "CLIENT") {
        navigate("/client");
      } else {
        navigate("/admin/ventes");
      }
    } else if (notif.module === "FACTURES" || notif.type?.startsWith("FACTURE")) {
      if (user?.role === "LOCATAIRE") {
        navigate("/locataire/factures");
      } else {
        navigate("/admin/factures");
      }
    } else if (notif.module === "CHAT" || notif.type?.includes("MESSAGE")) {
      if (user?.role === "CLIENT" || user?.role === "LOCATAIRE") {
        navigate("/client/chat");
      } else {
        navigate("/admin/chat");
      }
    } else {
      // Default: go to dashboard
      if (user?.role === "CLIENT") {
        navigate("/client");
      } else if (user?.role === "LOCATAIRE") {
        navigate("/locataire");
      } else {
        navigate("/admin");
      }
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative p-2 rounded-full hover:bg-surface-low text-on-surface-variant transition"
        title="Notifications"
      >
        <Bell size={20} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 bg-error text-on-error text-[10px] font-bold rounded-full flex items-center justify-center">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-surface-lowest rounded-xl shadow-modal border border-outline-variant z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
            <div>
              <h4 className="font-semibold text-on-surface">Notifications</h4>
              <p className="text-xs text-on-surface-variant">{count} non lue(s)</p>
            </div>
            <div className="flex items-center gap-1">
              {count > 0 && (
                <button
                  type="button"
                  onClick={() => markAll()}
                  className="p-2 rounded-lg hover:bg-surface-low text-on-surface-variant"
                  title="Tout marquer comme lu"
                >
                  <CheckCheck size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-surface-low text-on-surface-variant"
                title="Fermer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="px-4 py-10 text-center text-on-surface-variant">
                Aucune notification non lue.
              </div>
            ) : (
              notifs.map((notif) => (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => handleNotificationClick(notif)}
                  className="w-full text-left px-4 py-3 border-b border-outline-variant last:border-0 hover:bg-surface-low transition cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wide text-primary font-semibold">
                        {TYPE_LABELS[notif.type] || notif.module || "Notification"}
                      </p>
                      <p className="text-sm font-semibold text-on-surface mt-1">{notif.titre}</p>
                      <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">{notif.message}</p>
                    </div>
                    <span className="w-2 h-2 mt-2 rounded-full bg-error flex-shrink-0" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
