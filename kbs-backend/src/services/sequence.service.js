const { query } = require("../config/database");

const pad = (value, size = 3) => String(value).padStart(size, "0");

const nextReference = async (tableCible, tenantId, prefix, size = 3) => {
  await query(
    `INSERT INTO sequences_references (table_cible, tenant_id, prefix, derniere_valeur)
     VALUES (?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE derniere_valeur = derniere_valeur + 1`,
    [tableCible, tenantId || 0, prefix]
  );

  const [row] = await query(
    "SELECT derniere_valeur FROM sequences_references WHERE table_cible = ? AND tenant_id = ?",
    [tableCible, tenantId || 0]
  );

  return `${prefix}${pad(row?.derniere_valeur || 1, size)}`;
};

const roleAbbr = (role) => ({
  SUPER_ADMIN: "SADM",
  BOSS: "BOSS",
  GERANT: "GER",
  CLIENT: "CLT",
  LOCATAIRE: "LOC",
}[role] || "USR");

const initials = (nom = "", prenom = "") =>
  `${String(nom).trim().charAt(0)}${String(prenom).trim().charAt(0)}`.toUpperCase() || "XX";

const parcelleTypeAbbr = (type = "") => ({
  RESIDENTIELLE: "RES",
  COMMERCIALE: "COM",
  AGRICOLE: "AGR",
  INDUSTRIELLE: "IND",
}[type] || "AUT");

const locataireCatAbbr = (categorie = "") => ({
  SIMPLE: "SMP",
  ENTREPRISE: "ENT",
}[categorie] || "LOC");

module.exports = {
  nextReference,
  codeTenant: () => nextReference("tenants", 0, "KBS-ORG-"),
  codeUser: ({ tenantId, nom, prenom, role }) =>
    nextReference(`users_${role}_${tenantId}`, tenantId, `KBS-${initials(nom, prenom)}-${roleAbbr(role)}-`),
  referenceParcelle: ({ tenantId, typeParcelle }) =>
    nextReference(`parcelles_${typeParcelle}_${tenantId}`, tenantId, `KBS-PARC-${parcelleTypeAbbr(typeParcelle)}-`),
  referenceParcelleImage: (tenantId) => nextReference("parcelle_images", tenantId, "KBS-IMG-"),
  referenceParcelleDocument: (tenantId) => nextReference("parcelle_documents", tenantId, "KBS-PDOC-"),
  referenceReservation: (tenantId) => nextReference("reservations", tenantId, "KBS-RES-"),
  referenceVente: (tenantId) => nextReference("ventes", tenantId, "KBS-VTE-"),
  referencePaiement: (tenantId) => nextReference("paiements", tenantId, "KBS-PAY-"),
  referenceVenteDocument: (tenantId) => nextReference("vente_documents", tenantId, "KBS-VDOC-"),
  referenceVisite: (tenantId) => nextReference("visites", tenantId, "KBS-VIS-"),
  codeLocataire: ({ tenantId, categorie }) =>
    nextReference(`kbs_locataires_${categorie}_${tenantId}`, tenantId, `KBS-LOC-${locataireCatAbbr(categorie)}-`),
  referenceFacture: (tenantId) => nextReference(`kbs_factures_${new Date().getFullYear()}_${tenantId}`, tenantId, `KBS-FAC-${new Date().getFullYear()}-`),
  referencePaiementLoyer: (tenantId) => nextReference("kbs_paiements_loyer", tenantId, "KBS-PLOYER-"),
  referenceNotification: (tenantId) => nextReference("notifications", tenantId, "KBS-NOTIF-"),
  referenceEmail: (tenantId) => nextReference("email_logs", tenantId, "KBS-MAIL-"),
  referenceConversation: (tenantId) => nextReference("chat_conversations", tenantId, "KBS-CONV-"),
  referenceMessage: (tenantId) => nextReference("chat_messages", tenantId, "KBS-MSG-"),
  referenceActivity: (tenantId) => nextReference("activity_logs", tenantId, "KBS-LOG-"),
  referenceRapport: (tenantId) => nextReference("kbs_rapports", tenantId, "KBS-RAP-"),
};
