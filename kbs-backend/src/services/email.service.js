const nodemailer = require("nodemailer");
const { logger } = require("../utils/logger.util");

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(to, subject, body) {
    try {
      if (!process.env.SMTP_HOST) {
        logger.warn(`SMTP non configuré. Email pour ${to} non envoyé : ${subject}`);
        return;
      }

      await this.transporter.sendMail({
        from: `"${process.env.APP_NAME || "KBS Real Estate"}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html: body,
      });

      logger.info(`Email envoyé avec succès à ${to}`);
    } catch (error) {
      logger.error(`Erreur d'envoi d'email à ${to}:`, error.message);
      // On ne bloque pas le flux principal pour une erreur d'email
    }
  }
}

module.exports = new EmailService();
