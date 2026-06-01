// Tokens de design centralisés — KBS Real Estate System

export const COLORS = {
  primary: "#000000",
  primaryContainer: "#131b2e",
  secondary: "#725a42",
  secondaryContainer: "#fedcbe",
  surface: "#f7f9fb",
  surfaceLowest: "#ffffff",
  onSurface: "#191c1e",
  onSurfaceVariant: "#45464d",
  outline: "#76777d",
  outlineVariant: "#c6c6cd",
  error: "#ba1a1a",
  errorContainer: "#ffdad6",
};

export const STATUS_COLORS = {
  // Parcelles
  DISPONIBLE: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  RESERVEE:   { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-500"   },
  VENDUE:     { bg: "bg-slate-100",  text: "text-slate-600",   border: "border-slate-200",   dot: "bg-slate-500"   },
  MAINTENANCE:{ bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200",  dot: "bg-orange-500"  },
  MASQUEE:    { bg: "bg-gray-50",    text: "text-gray-500",    border: "border-gray-200",    dot: "bg-gray-400"    },
  ARCHIVEE:   { bg: "bg-gray-100",   text: "text-gray-400",    border: "border-gray-200",    dot: "bg-gray-300"    },
  A_AMORCELLER: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },

  // Réservations
  EN_ATTENTE:          { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500"   },
  CONFIRMEE:           { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  EXPIREE:             { bg: "bg-gray-100",   text: "text-gray-500",    dot: "bg-gray-400"    },
  ANNULEE:             { bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-500"     },
  TRANSFORMEE_EN_VENTE:{ bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500"    },

  // Ventes
  EN_COURS: { bg: "bg-blue-50",    text: "text-blue-700",  dot: "bg-blue-500"  },
  COMPLETE: { bg: "bg-emerald-50", text: "text-emerald-700",dot:"bg-emerald-500"},

  // Paiements
  PAYE:     { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  ECHOUE:   { bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-500"     },
  REMBOURSE:{ bg: "bg-purple-50",  text: "text-purple-700",  dot: "bg-purple-500"  },
  PARTIEL:  { bg: "bg-orange-50",  text: "text-orange-700",  dot: "bg-orange-500"  },

  // Factures
  EN_ATTENTE_FAC: { bg: "bg-amber-50",  text: "text-amber-700",   dot: "bg-amber-500"  },
  VALIDEE:        { bg: "bg-emerald-50",text: "text-emerald-700", dot: "bg-emerald-500"},
  REJETEE:        { bg: "bg-red-50",    text: "text-red-600",     dot: "bg-red-500"    },

  // Locataires
  A_JOUR:    { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  EN_RETARD: { bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-500"     },

  // Alertes échéance
  EXPIRE: { bg: "bg-red-50",    text: "text-red-600",    dot: "bg-red-500"    },
  URGENT: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  BIENTOT:{ bg: "bg-amber-50",  text: "text-amber-600",  dot: "bg-amber-500"  },
  OK:     { bg: "bg-emerald-50",text: "text-emerald-700",dot: "bg-emerald-500"},
};

export const ROLE_LABELS = {
  SUPER_ADMIN: "Super Admin",
  BOSS: "Directeur",
  GERANT: "Gérant",
  CLIENT: "Client",
  LOCATAIRE: "Locataire",
};

export const TYPE_PARCELLE_LABELS = {
  RESIDENTIELLE: "Résidentielle",
  COMMERCIALE: "Commerciale",
  AGRICOLE: "Agricole",
  INDUSTRIELLE: "Industrielle",
  AUTRE: "Autre",
};

export const MODULE_LABELS = {
  PARCELLES: "Parcelles",
  KBS: "KBS Buildings",
  LES_DEUX: "Accès complet",
};