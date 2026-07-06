import clsx from "clsx";
import { resolveAssetUrl } from "../../utils/assets";

const COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-purple-100 text-purple-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
];

/**
 * Avatar KBS — initiales ou photo
 * Correspond à photo_url dans la table users
 */
const Avatar = ({ nom, prenom, photo_url, size = "md", className = "" }) => {
  const sizes = {
    xs: "w-7 h-7 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl",
  };

  const initiales = `${(nom || "?")[0]}${(prenom || "")[0] || ""}`.toUpperCase();
  const colorIndex = (nom?.charCodeAt(0) || 0) % COLORS.length;

  if (photo_url) {
    return (
      <img
        src={resolveAssetUrl(photo_url)}
        alt={`${nom} ${prenom}`}
        className={clsx("rounded-full object-cover flex-shrink-0", sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={clsx(
        "rounded-full flex items-center justify-center font-montserrat font-bold flex-shrink-0",
        COLORS[colorIndex],
        sizes[size],
        className
      )}
    >
      {initiales}
    </div>
  );
};

export default Avatar;
