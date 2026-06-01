import clsx from "clsx";

/**
 * Bouton KBS — 4 variantes alignées avec le design system
 * primary | secondary | outline | ghost | danger
 */
const Button = ({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  className = "",
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center gap-2 font-inter font-medium rounded transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const variants = {
    primary:
      "bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container active:scale-[0.98]",
    secondary:
      "bg-secondary text-on-secondary hover:opacity-90 active:scale-[0.98]",
    outline:
      "border border-outline-variant bg-transparent text-on-surface hover:bg-surface-low active:scale-[0.98]",
    ghost:
      "bg-transparent text-on-surface-variant hover:bg-surface-low hover:text-on-surface active:scale-[0.98]",
    danger:
      "bg-error text-on-error hover:opacity-90 active:scale-[0.98]",
    "outline-primary":
      "border border-primary bg-transparent text-primary hover:bg-primary hover:text-on-primary active:scale-[0.98]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-label-sm",
    md: "px-4 py-2 text-label-md",
    lg: "px-6 py-3 text-body-md",
    xl: "px-8 py-4 text-body-lg",
    icon: "p-2",
  };

  return (
    <button
      className={clsx(
        base,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        Icon && <Icon size={size === "sm" ? 14 : size === "lg" ? 18 : 16} />
      )}
      {children}
      {iconRight && !loading && <iconRight size={16} />}
    </button>
  );
};

export default Button;