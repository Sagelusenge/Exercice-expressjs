const router = require("express").Router();
const bcrypt = require("bcryptjs");
const { query, withTransaction } = require("../../config/database");
const R = require("../../utils/response.util");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireRole, requireModule } = require("../../middleware/role.middleware");
const { enforceTenant } = require("../../middleware/tenant.middleware");
const { logActivity } = require("../../middleware/activityLog.middleware");
const { paginate, buildPagination } = require("../../utils/pagination.util");
const { notificationService } = require("../../services/notification.service");
const emailService = require("../../services/email.service");
const EmailTemplates = require("../../services/email.templates");
const { logger } = require("../../utils/logger.util");
const sequenceService = require("../../services/sequence.service");

const normalizeDate = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value;
};

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

router.get(
  "/dashboard",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  enforceTenant,
  async (req, res) => {
    const data = await query(
      "SELECT * FROM v_dashboard_kbs WHERE tenant_id = ?", [req.tenantId]
    );
    return R.success(res, data[0]);
  }
);

router.get("/mon-profil", authenticate, requireRole("LOCATAIRE"), enforceTenant, async (req, res) => {
  const rows = await query(
    "SELECT * FROM v_locataires_kbs WHERE user_id = ? AND tenant_id = ?",
    [req.user.id, req.tenantId]
  );
  if (!rows.length) return R.notFound(res, "Profil locataire introuvable");
  return R.success(res, rows[0]);
});

router.get(
  "/",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  enforceTenant,
  async (req, res) => {
    const { categorie, statut_paiement, search, page = 1, limit = 20 } = req.query;
    const { offset, limit: l } = paginate(page, limit);

    let where = "WHERE tenant_id = ?";
    const params = [req.tenantId];
    if (categorie)       { where += " AND categorie = ?";        params.push(categorie); }
    if (statut_paiement) { where += " AND statut_paiement = ?";  params.push(statut_paiement); }
    if (search) {
      where += " AND (nom_affichage LIKE ? OR code_locataire LIKE ? OR telephone LIKE ?)";
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const [{ total }] = await query(
      `SELECT COUNT(*) AS total FROM v_locataires_kbs ${where}`, params
    );
    const locataires = await query(
      `SELECT * FROM v_locataires_kbs ${where}
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, l, offset]
    );
    return R.paginated(res, locataires, buildPagination(total, page, l));
  }
);

router.post(
  "/",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  enforceTenant,
  logActivity("KBS", "LOCATAIRE_CREE"),
  async (req, res) => {
    try {
      const data = req.body;
      const motDePasseTemp = `Kbs${Math.floor(1000 + Math.random() * 9000)}@`;
      const hash = await bcrypt.hash(motDePasseTemp, 12);

      const emailUser =
        data.categorie === "SIMPLE"
          ? data.email || `loc.${Date.now()}@kbs.local`
          : data.email_entreprise;

      const code = generateVerificationCode();
      const expireAt = new Date(Date.now() + 30 * 60 * 1000);
      const nomUser = data.categorie === "SIMPLE" ? data.nom : (data.nom_representant || "Representant");
      const prenomUser = data.categorie === "SIMPLE" ? (data.prenom || "") : "";
      const codeUser = await sequenceService.codeUser({ tenantId: req.tenantId, nom: nomUser, prenom: prenomUser, role: "LOCATAIRE" });
      const codeLocataire = await sequenceService.codeLocataire({ tenantId: req.tenantId, categorie: data.categorie });

      const result = await withTransaction(async (conn) => {
        const [userResult] = await conn.execute(
          `INSERT INTO users
           (tenant_id, code_user, module_accessible, nom, prenom, email, telephone, mot_de_passe,
            role, statut, email_verifie, code_verification_email, code_verification_expire_at, cree_par)
           VALUES (?, ?, 'KBS', ?, ?, ?, ?, ?, 'LOCATAIRE', 'EN_ATTENTE_VERIFICATION', 0, ?, ?, ?)`,
          [
            req.tenantId,
            codeUser,
            data.categorie === "SIMPLE" ? data.nom : (data.nom_representant || "Représentant"),
            data.categorie === "SIMPLE" ? (data.prenom || "") : "",
            emailUser,
            data.categorie === "SIMPLE" ? data.telephone_personnel : data.telephone_entreprise,
            hash,
            code,
            expireAt,
            req.user.id,
          ]
        );
        const userId = userResult.insertId;

        const [locResult] = await conn.execute(
          `INSERT INTO kbs_locataires
           (code_locataire, tenant_id, user_id, categorie,
            nom, prenom, date_naissance, telephone_personnel, adresse_personnelle,
            type_piece_identite, photo_identite_url, photo_piece_identite_url,
            nom_entreprise, secteur_activite, numero_rccm, numero_nif,
            nom_representant, telephone_entreprise, email_entreprise,
            adresse_siege, numero_local, logo_entreprise_url,
            date_debut_loyer, date_fin_loyer, montant_mensuel_loyer, devise, cree_par)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            codeLocataire, req.tenantId, userId, data.categorie,
            data.nom || null, data.prenom || null,
            normalizeDate(data.date_naissance), data.telephone_personnel || null,
            data.adresse_personnelle || null, data.type_piece_identite || null,
            data.photo_identite_url || null, data.photo_piece_identite_url || null,
            data.nom_entreprise || null, data.secteur_activite || null,
            data.numero_rccm || null, data.numero_nif || null,
            data.nom_representant || null, data.telephone_entreprise || null,
            data.email_entreprise || null, data.adresse_siege || null,
            data.numero_local || null, data.logo_entreprise_url || null,
            normalizeDate(data.date_debut_loyer), normalizeDate(data.date_fin_loyer),
            data.montant_mensuel_loyer, data.devise || "USD",
            req.user.id,
          ]
        );
        return { locataireId: locResult.insertId, userId };
      });

      const [locataire] = await query(
        "SELECT * FROM v_locataires_kbs WHERE id = ?", [result.locataireId]
      );

      // Send beautiful welcome email to locataire
      const [user] = await query(
        "SELECT id, nom, prenom, email FROM users WHERE id = ?", [result.userId]
      );

      if (user && user.email && !user.email.includes('@kbs.local')) {
        try {
          const htmlBody = EmailTemplates.welcomeLocataire(locataire, motDePasseTemp);
          await emailService.sendEmail(user.email, "Bienvenue chez KBS Real Estate !", htmlBody);
          logger.info(`📧 Email de bienvenue locataire envoyé à ${user.email}`);
        } catch (emailError) {
          logger.error('Erreur lors de l\'envoi de l\'email de bienvenue locataire:', emailError);
        }
      }

      return R.created(
        res,
        { locataire, mot_de_passe_temp: motDePasseTemp },
        "Locataire créé avec succès"
      );
    } catch (error) {
      logger.error("Erreur creation locataire:", error.message);
      return R.error(res, "Erreur lors de la création du locataire", 500, error.message);
    }
  }
);

router.get("/:id", authenticate, requireRole("SUPER_ADMIN", "BOSS", "GERANT"), enforceTenant, async (req, res) => {
  const rows = await query(
    "SELECT * FROM v_locataires_kbs WHERE id = ? AND tenant_id = ?",
    [req.params.id, req.tenantId]
  );
  if (!rows.length) return R.notFound(res, "Locataire introuvable");
  return R.success(res, rows[0]);
});

router.put("/:id", authenticate, requireRole("SUPER_ADMIN", "BOSS", "GERANT"), enforceTenant, logActivity("KBS", "LOCATAIRE_MODIFIE"), async (req, res) => {
  const fields = [
    "nom", "prenom", "telephone_personnel", "adresse_personnelle",
    "date_debut_loyer", "date_fin_loyer", "montant_mensuel_loyer",
    "nom_entreprise", "telephone_entreprise", "email_entreprise", "nom_representant",
  ];
  const sets = fields.filter((f) => req.body[f] !== undefined).map((f) => `${f} = ?`);
  const values = fields
    .filter((f) => req.body[f] !== undefined)
    .map((f) => f.includes("date_") ? normalizeDate(req.body[f]) : req.body[f]);

  if (!sets.length) return R.badRequest(res, "Aucun champ à mettre à jour");

  await query(
    `UPDATE kbs_locataires SET ${sets.join(", ")}
     WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL`,
    [...values, req.params.id, req.tenantId]
  );

  const [locataire] = await query(
    "SELECT * FROM v_locataires_kbs WHERE id = ?", [req.params.id]
  );
  return R.success(res, locataire, "Locataire mis à jour");
});

router.delete(
  "/:id",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS"),
  enforceTenant,
  logActivity("KBS", "LOCATAIRE_SUPPRIME"),
  async (req, res) => {
    // First, get the user_id of the locataire
    const locataires = await query(
      "SELECT user_id FROM kbs_locataires WHERE id = ? AND tenant_id = ?",
      [req.params.id, req.tenantId]
    );
    
    // Delete the locataire record
    await query(
      "DELETE FROM kbs_locataires WHERE id = ? AND tenant_id = ?",
      [req.params.id, req.tenantId]
    );
    
    // Also delete the corresponding user
    if (locataires.length && locataires[0].user_id) {
      await query(
        "DELETE FROM users WHERE id = ? AND tenant_id = ?",
        [locataires[0].user_id, req.tenantId]
      );
    }
    
    return R.success(res, null, "Locataire supprimé");
  }
);

module.exports = router;
