import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  useGetNotificationsCountQuery,
  useMarkAllReadMutation,
} from "../../store/api/notificationsApi";

export default function NotifBell() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { data: countRes } = useGetNotificationsCountQuery(undefined, { pollingInterval: 15000 });
  const [markAll] = useMarkAllReadMutation();

  const count = countRes?.count || 0;

  const getChatPath = () => {
    if (["SUPER_ADMIN", "ADMIN", "BOSS", "GERANT"].includes(user?.role)) return "/admin/chat";
    if (user?.role === "LOCATAIRE") return "/locataire/chat";
    return "/client/chat";
  };

  const openChat = async () => {
    try {
      if (count > 0) await markAll().unwrap();
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
    }
    navigate(getChatPath());
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={openChat}
        className="relative p-2 rounded-full hover:bg-surface-low text-on-surface-variant transition"
        title="Ouvrir les discussions"
      >
        <Bell size={20} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 bg-error text-on-error text-[10px] font-bold rounded-full flex items-center justify-center">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>
    </div>
  );
}
