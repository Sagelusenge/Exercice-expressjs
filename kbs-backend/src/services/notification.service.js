const { query } = require("../config/database");
const { logger } = require("../utils/logger.util");
const emailService = require("./email.service");
const EmailTemplates = require("./email.templates");

const generateEmailTemplate = (title, content, buttonText, buttonUrl) => {
  // Fallback pour la compatibilité, on utilise nos nouveaux templates
  const wrappedContent = `
    <p class="greeting">Bonjour,</p>
    ${content}
    ${buttonUrl ? `<center><a href="${buttonUrl}" class="btn">${buttonText}</a></center>` : ''}
  `;
  return EmailTemplates.baseTemplate(wrappedContent, title);
};

const createNotification = async (tenantId, userId, data) => {
  const { titre, message, module, type, canal, donnees_supplementaires } = data;
  try {
    // Envoi réel de l'email si canal est EMAIL
    if (canal === "EMAIL") {
      const users = await query("SELECT email FROM users WHERE id = ?", [userId]);
      if (users.length) {
        await emailService.sendEmail(
          users[0].email,
          titre,
          `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #1a73e8;">${titre}</h2>
            <p>${message}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #777;">Ceci est un email automatique de KBS Real Estate.</p>
          </div>`
        );
      }
    }
    await query(
      `INSERT INTO notifications
       (tenant_id, user_id, titre, message, module, type, canal, donnees_supplementaires)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId,
        userId,
        titre,
        message,
        module,
        type,
        canal,
        donnees_supplementaires ? JSON.stringify(donnees_supplementaires) : null,
      ]
    );
  } catch (err) {
    logger.error("Erreur création notification:", err.message);
  }
};

const logEmail = async (
  tenantId,
  userId,
  destinataire,
  sujet,
  template,
  statut = "EN_ATTENTE"
) => {
  try {
    await query(
      `INSERT INTO email_logs
       (tenant_id, user_id, destinataire_email, sujet, template_utilise, statut, date_envoi)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [tenantId, userId, destinataire, sujet, template, statut]
    );
  } catch (err) {
    logger.error("Erreur log email:", err.message);
  }
};

const sendEmailVerification = async (tenantId, user, code) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const verifyLink = `${frontendUrl}/verify-email`;

  const emailContent = `
    <p>Bonjour ${user.prenom || user.nom},</p>
    <p>Merci de vous être inscrit ! Veuillez utiliser le code de vérification suivant pour activer votre compte :</p>
    <p style="font-size: 24px; font-weight: 700; text-align: center; padding: 16px; background-color: #f3f4f6; border-radius: 8px;">
      ${code}
    </p>
    <p>Ce code est valable 30 minutes.</p>
  `;

  const htmlBody = generateEmailTemplate(
    "Code de vérification KBS",
    emailContent,
    "Vérifier mon email",
    verifyLink
  );

  let sent = false;
  try {
    logger.info(`📧 Tentative d'envoi du code de verification a ${user.email}...`);
    if (!process.env.SMTP_HOST) {
      logger.error("❌ ERREUR: SMTP_HOST non configuré - Email NON envoyé");
      throw new Error("SMTP non configuré");
    }
    
    sent = await emailService.sendEmail(user.email, "Code de vérification KBS", htmlBody);
    
    if (!sent) {
      logger.error(`❌ L'envoi d'email a échoué pour ${user.email}`);
      throw new Error("Envoi d'email échoué");
    }
    
    logger.info(`✅ Code vérification envoyé avec succès à ${user.email}: ${code}`);
  } catch (err) {
    logger.error("❌ Erreur lors de l'envoi de l'email de vérification:", {
      email: user.email,
      message: err.message,
      stack: err.stack
    });
  }

  await logEmail(
    tenantId,
    user.id,
    user.email,
    `Code de vérification KBS : ${code}`,
    "EMAIL_CODE_VERIFICATION",
    sent ? "ENVOYE" : "ECHOUE"
  );

  // Also create the notification in DB
  await createNotification(tenantId, user.id, {
    titre: "Code de vérification KBS",
    message: `Votre code de vérification est : ${code}. Valable 30 minutes.`,
    module: "SYSTEME",
    type: "EMAIL_CODE_VERIFICATION",
    canal: "APP",
    donnees_supplementaires: { code, expire_dans: "30 minutes" },
  });
};

const sendWelcome = async (tenantId, user) => {
  const emailContent = `
    <p>Bonjour ${user.prenom || user.nom},</p>
    <p>Félicitations ! Votre compte KBS Buildings est maintenant activé.</p>
    <p>Nous vous souhaitons la bienvenue !</p>
  `;

  const htmlBody = generateEmailTemplate(
    "Bienvenue chez KBS Buildings !",
    emailContent,
    null,
    null
  );

  let sent = false;
  try {
    logger.info(`📧 Tentative d'envoi du mail de bienvenue a ${user.email}...`);
    if (!process.env.SMTP_HOST) {
      logger.error("❌ ERREUR: SMTP_HOST non configuré - Email NON envoyé");
      throw new Error("SMTP non configuré");
    }
    
    sent = await emailService.sendEmail(user.email, "Bienvenue chez KBS Buildings !", htmlBody);
    
    if (!sent) {
      logger.error(`❌ L'envoi d'email a échoué pour ${user.email}`);
      throw new Error("Envoi d'email échoué");
    }
    
    logger.info(`✅ Email de bienvenue envoyé à ${user.email}`);
  } catch (err) {
    logger.error("❌ Erreur lors de l'envoi de l'email de bienvenue:", {
      email: user.email,
      message: err.message,
      stack: err.stack
    });
  }

  await logEmail(
    tenantId,
    user.id,
    user.email,
    "Bienvenue chez KBS Buildings",
    "EMAIL_BIENVENUE",
    sent ? "ENVOYE" : "ECHOUE"
  );

  await createNotification(tenantId, user.id, {
    titre: "Bienvenue chez KBS Buildings !",
    message: `Bienvenue ${user.nom} ${user.prenom} ! Votre compte est activé.`,
    module: "SYSTEME",
    type: "EMAIL_BIENVENUE",
    canal: "APP",
  });
};

const notifyUser = async (tenantId, userId, type, data) => {
  const templates = {
    PAIEMENT_RECU: {
      titre: "Paiement reçu",
      message: `Votre paiement de ${data.montant} ${data.devise} a été reçu.`,
      module: "PARCELLES",
      canal: "APP",
    },
    VENTE_CONFIRMEE: {
      titre: "Vente confirmée !",
      message: `Félicitations ! Votre achat de la parcelle ${data.parcelle} est confirmé.`,
      module: "PARCELLES",
      canal: "APP",
    },
    COMPTE_LOCATAIRE_CREE: {
      titre: "Compte locataire créé",
      message: "Votre espace locataire KBS Buildings a été créé.",
      module: "KBS",
      canal: "APP",
    },
  };

  const tpl = templates[type];
  if (!tpl) return;

  await createNotification(tenantId, userId, {
    ...tpl,
    type,
    donnees_supplementaires: data,
  });
};

const sendActionNotification = async (tenantId, userId, data) => {
  if (!userId) return;
  const {
    titre,
    message,
    module = "SYSTEME",
    type = "ALERTE_SYSTEME",
    emailSubject = titre,
    emailTemplate = type,
    donnees_supplementaires,
  } = data;

  const users = await query(
    "SELECT id, email, nom, prenom FROM users WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL",
    [userId, tenantId]
  );
  if (!users.length) return;
  const user = users[0];

  await createNotification(tenantId, userId, {
    titre,
    message,
    module,
    type,
    canal: "APP",
    donnees_supplementaires,
  });

  const htmlBody = generateEmailTemplate(
    emailSubject,
    `<p>Bonjour ${user.prenom || user.nom},</p><p>${message}</p>`,
    null,
    null
  );

  try {
    let sent = false;
    if (process.env.SMTP_HOST) {
      sent = await emailService.sendEmail(user.email, emailSubject, htmlBody);
    }
    await logEmail(tenantId, userId, user.email, emailSubject, emailTemplate, sent ? "ENVOYE" : "ECHOUE");
  } catch (err) {
    logger.error("Erreur notification email action:", err.message);
    await logEmail(tenantId, userId, user.email, emailSubject, emailTemplate, "ECHOUE");
  }
};

const sendLocataireCreationEmail = async (tenantId, user, verificationCode) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetLink = `${frontendUrl}/forgot-password?email=${encodeURIComponent(user.email)}`;

  const emailContent = `
    <p>Bonjour ${user.prenom || user.nom},</p>
    <p>Votre compte locataire KBS Buildings a été créé avec succès !</p>
    <p>Pour activer votre compte et définir votre mot de passe, veuillez utiliser le code de vérification suivant :</p>
    <p style="font-size: 24px; font-weight: 700; text-align: center; padding: 16px; background-color: #f3f4f6; border-radius: 8px;">
      ${verificationCode}
    </p>
    <p>Ce code est valable 30 minutes.</p>
  `;

  const htmlBody = generateEmailTemplate(
    "Bienvenue chez KBS Buildings",
    emailContent,
    "Réinitialiser mon mot de passe",
    resetLink
  );

  let sent = false;
  try {
    const users = await query("SELECT email FROM users WHERE id = ?", [user.id]);
    if (users.length && process.env.SMTP_HOST) {
      sent = await emailService.sendEmail(users[0].email, "Bienvenue chez KBS Buildings - Activer votre compte", htmlBody);
      logger.info(`Email de création de compte locataire envoyé à ${users[0].email}`);
    }
  } catch (err) {
    logger.error("Erreur lors de l'envoi de l'email de création de locataire:", err.message);
  }

  // Also log the email
  await logEmail(tenantId, user.id, user.email, "Bienvenue chez KBS Buildings - Activer votre compte", "LOCATAIRE_CREATION", sent ? "ENVOYE" : "ECHOUE");
};

const sendPasswordResetEmail = async (tenantId, user, code) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetLink = `${frontendUrl}/forgot-password?email=${encodeURIComponent(user.email)}`;

  const emailContent = `
    <p>Bonjour ${user.prenom || user.nom},</p>
    <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
    <p>Veuillez utiliser le code de vérification suivant pour procéder :</p>
    <p style="font-size: 24px; font-weight: 700; text-align: center; padding: 16px; background-color: #f3f4f6; border-radius: 8px;">
      ${code}
    </p>
    <p>Ce code est valable 30 minutes.</p>
  `;

  const htmlBody = generateEmailTemplate(
    "Réinitialisation de mot de passe",
    emailContent,
    "Réinitialiser mon mot de passe",
    resetLink
  );

  let sent = false;
  try {
    logger.info(`📧 Tentative d'envoi du code de reinitialisation a ${user.email}...`);
    if (!process.env.SMTP_HOST) {
      logger.error("❌ ERREUR: SMTP_HOST non configuré - Email NON envoyé");
      throw new Error("SMTP non configuré");
    }
    
    sent = await emailService.sendEmail(user.email, "Réinitialisation de mot de passe KBS", htmlBody);
    
    if (!sent) {
      logger.error(`❌ L'envoi d'email a échoué pour ${user.email}`);
      throw new Error("Envoi d'email échoué");
    }
    
    logger.info(`✅ Email de réinitialisation envoyé à ${user.email}`);
  } catch (err) {
    logger.error("❌ Erreur lors de l'envoi de l'email de réinitialisation:", {
      email: user.email,
      message: err.message,
      stack: err.stack
    });
  }

  await logEmail(tenantId, user.id, user.email, "Réinitialisation de mot de passe KBS", "PASSWORD_RESET", sent ? "ENVOYE" : "ECHOUE");
};

module.exports = {
  notificationService: {
    sendEmailVerification,
    sendWelcome,
    notifyUser,
    sendActionNotification,
    createNotification,
    logEmail,
    sendLocataireCreationEmail,
    sendPasswordResetEmail,
  },
};
