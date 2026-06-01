import clsx from "clsx";

/**
 * Carte statistique KBS — pour les dashboards
 * Correspond aux données de sp_dashboard_admin et des vues dashboard
 */
const Stat = ({
  title,
  subtitle,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconBg = "bg-surface-high",
  iconColor = "text-on-surface-variant",
  loading = false,
  className = "",
}) => {
  if (loading) {
    return (
      <div className={clsx("kbs-card p-5 animate-pulse", className)}>
        <div className="h-4 bg-surface-high rounded w-3/4 mb-3" />
        <div className="h-8 bg-surface-high rounded w-1/2 mb-2" />
        <div className="h-3 bg-surface-high rounded w-2/3" />
      </div>
    );
  }

  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div className={clsx("kbs-card kbs-card-hover p-5", className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-label-md text-on-surface-variant font-inter uppercase tracking-wider">
            {title}
          </p>
          {subtitle && (
            <p className="text-label-sm text-on-surface-variant mt-0.5">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={clsx("p-2 rounded-lg", iconBg)}>
            <Icon size={20} className={iconColor} />
          </div>
        )}
      </div>

      <p className="font-montserrat font-bold text-headline-md text-on-surface">
        {value ?? "—"}
      </p>

      {(change !== undefined || changeLabel) && (
        <div className="flex items-center gap-1.5 mt-2">
          {change !== undefined && (
            <span
              className={clsx(
                "text-label-sm font-semibold",
                isPositive && "text-emerald-600",
                isNegative && "text-red-600",
                !isPositive && !isNegative && "text-on-surface-variant"
              )}
            >
              {isPositive ? "+" : ""}{change}%
            </span>
          )}
          {changeLabel && (
            <span className="text-label-sm text-on-surface-variant">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default Stat;