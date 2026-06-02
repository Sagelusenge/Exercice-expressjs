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

const PORT = process.env.PORT || 3000;

// Créer le dossier logs s'il n'existe pas
if (!fs.existsSync("logs")) {
  fs.mkdirSync("logs");
}

async function checkTenants() {
  const tenants = await query("SELECT id, slug FROM tenants");
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