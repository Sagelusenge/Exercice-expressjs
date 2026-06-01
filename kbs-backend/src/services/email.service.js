const nodemailer = require("nodemailer");
const { logger } = require("../utils/logger.util");

class EmailService {
  constructor() {
    this.transporter = null;
  }

  isConfigured() {
    return Boolean(
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    );
  }

  getTransporter() {
    if (this.transporter) return this.transporter;

    const port = Number(process.env.SMTP_PORT || 587);
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE === "true" || port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    return this.transporter;
  }

  async sendEmail(to, subject, body) {
    if (!this.isConfigured()) {
      logger.warn(`SMTP non configure. Email pour ${to} non envoye : ${subject}`);
      return false;
    }

    try {
      await this.getTransporter().sendMail({
        from:
          process.env.SMTP_FROM ||
          `"${process.env.APP_NAME || "KBS Real Estate"}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html: body,
      });

      logger.info(`Email envoye avec succes a ${to}`);
      return true;
    } catch (error) {
      logger.error(`Erreur d'envoi d'email a ${to}:`, {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
      });
      return false;
    }
  }
}

module.exports = new EmailService();
