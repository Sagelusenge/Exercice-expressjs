require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./src/app");
const { testConnection, query } = require("./src/config/database");
const { initChatSocket } = require("./src/modules/chat/chat.socket");
const { startExpirerReservationsJob } = require("./src/jobs/expirer-reservations.job");
const { startVerifierRetardsJob } = require("./src/jobs/verifier-retards-loyer.job");
const { startRappelEcheanceJob } = require("./src/jobs/rappel-echeance.job");
const { logger } = require("./src/utils/logger.util");
const fs = require("fs");
const emailService = require("./src/services/email.service");

const PORT = process.env.PORT || 3000;

// Créer le dossier logs s'il n'existe pas
if (!fs.existsSync("logs")) {
  fs.mkdirSync("logs");
}

async function checkTenants() {
  let tenants;
  try {
    tenants = await query("SELECT id, slug FROM tenants");
  } catch (error) {
    if (error.code === "ER_NO_SUCH_TABLE") {
      logger.error(
        "Schema MySQL absent: importez Kbsbd-aiven-full.sql dans la base configuree avant de redeployer Render."
      );
    }
    throw error;
  }

  if (tenants.length === 0) {
    console.log("⚠️ Aucun tenant trouvé. Création du tenant par défaut...");
    await query(
      `INSERT INTO tenants (nom_organisation, slug, email_organisation, telephone, adresse)
       VALUES ('KBS Real Estate', 'kbs-immobilier', 'contact@kbs.com', '+243000000', 'Goma, RDC')`
    );
  }
}

async function bootstrap() {
  try {
    await testConnection();
    await checkTenants();

    // ── Vérification SMTP ──────────────────────────────────────
    logger.info("🔍 Vérification de la configuration SMTP...");
    if (!emailService.isConfigured()) {
      logger.warn("⚠️  SMTP NON CONFIGURÉ - Les emails ne seront PAS envoyés!");
      logger.warn("   Vérifiez les variables d'environnement:");
      logger.warn(`   - SMTP_HOST: ${process.env.SMTP_HOST || "❌ NON DÉFINI"}`);
      logger.warn(`   - SMTP_PORT: ${process.env.SMTP_PORT || "❌ NON DÉFINI"}`);
      logger.warn(`   - SMTP_USER: ${process.env.SMTP_USER || "❌ NON DÉFINI"}`);
      logger.warn(`   - SMTP_PASS: ${process.env.SMTP_PASS ? "✅ DÉFINI" : "❌ NON DÉFINI"}`);
    } else {
      logger.info("✅ SMTP est configuré correctement");
      try {
        await emailService.getTransporter().verify();
        logger.info("✅ Connexion SMTP vérifiée avec succès!");
      } catch (smtpError) {
        logger.error("❌ ERREUR SMTP - Impossible de se connecter au serveur de mail:");
        logger.error(`   Message: ${smtpError.message}`);
        logger.error(`   Code: ${smtpError.code}`);
        logger.error(`   Response: ${smtpError.response}`);
        logger.warn("   Les emails ne seront PAS envoyés. Vérifiez:");
        logger.warn("   1. Les identifiants Gmail (email + mot de passe d'application)");
        logger.warn("   2. Que 2FA est activé sur votre compte Gmail");
        logger.warn("   3. Que le mot de passe d'application est au bon format");
      }
    }

    const server = http.createServer(app);
    
    // Initialisation correcte de Socket.io
    const io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"],
    });

    // Passer l'instance io à la fonction d'initialisation du chat
    initChatSocket(io);
    app.set("io", io);

    // Jobs
    startExpirerReservationsJob();
    startVerifierRetardsJob();
    startRappelEcheanceJob();

    server.listen(PORT, () => {
      console.log(`
  ╔═══════════════════════════════════════════════╗
  ║     KBS BACKEND — KITUMAINI BALEZI Serge      ║
  ║     Version : 1.0.0                           ║
  ║     Port    : ${PORT}                             ║
  ║     Base    : ${process.env.DB_NAME} (MySQL)                    ║
  ║     Status  : ✅ ACTIF                        ║
  ╚═══════════════════════════════════════════════╝
      `);
    });

    const shutdown = () => {
      logger.info("Arrêt du serveur KBS...");
      server.close(() => process.exit(0));
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    console.error("❌ Erreur CRITIQUE pendant le bootstrap:", error);
    throw error;
  }
}

bootstrap().catch((err) => {
  console.error("❌ Erreur au démarrage du serveur:", err);
  process.exit(1);
});
