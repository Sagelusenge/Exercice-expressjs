
class EmailTemplates {
  /**
   * Génère un template HTML de base avec header/footer
   */
  static baseTemplate(content, subject = "") {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Montserrat', Arial, sans-serif;
        }
        body {
            background-color: #f8fafc;
            padding: 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            overflow: hidden;
        }
        .email-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px 20px;
            text-align: center;
        }
        .email-header h1 {
            color: white;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 5px;
        }
        .email-header p {
            color: rgba(255,255,255,0.9);
            font-size: 14px;
        }
        .email-body {
            padding: 30px;
            color: #1e293b;
            line-height: 1.6;
        }
        .email-body p {
            margin-bottom: 15px;
            font-size: 16px;
        }
        .email-body .greeting {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 20px;
        }
        .info-box {
            background: #f1f5f9;
            border-left: 4px solid #667eea;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .info-box p {
            margin: 5px 0;
            font-size: 15px;
        }
        .info-box strong {
            color: #667eea;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 14px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
        }
        .divider {
            height: 1px;
            background: #e2e8f0;
            margin: 30px 0;
        }
        .email-footer {
            background: #1e293b;
            padding: 25px 20px;
            text-align: center;
            color: #94a3b8;
            font-size: 14px;
        }
        .email-footer a {
            color: #667eea;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>KBS Real Estate</h1>
            <p>Investissez dans l'avenir</p>
        </div>
        <div class="email-body">
            ${content}
        </div>
        <div class="email-footer">
            <p>© 2026 KBS Real Estate. Tous droits réservés.</p>
            <p style="margin-top: 8px;">
                <a href="#">Contact</a> • 
                <a href="#">Politique de confidentialité</a> • 
                <a href="#">Conditions d'utilisation</a>
            </p>
        </div>
    </div>
</body>
</html>
    `;
  }

  /**
   * Email de bienvenue pour un nouveau locataire
   */
  static welcomeLocataire(locataire, tempPassword) {
    const content = `
      <p class="greeting">Cher(e) ${locataire.nom_affichage || locataire.nom || locataire.nom_representant},</p>
      <p>Nous sommes <strong>trop contents</strong> de vous avoir comme locataire ! 🎉</p>
      <p>Votre compte a été créé avec succès. Voici vos identifiants de connexion :</p>
      
      <div class="info-box">
          <p><strong>Email :</strong> ${locataire.email || locataire.email_entreprise}</p>
          <p><strong>Mot de passe temporaire :</strong> <span style="background: #e0e7ff; padding: 2px 8px; border-radius: 4px;">${tempPassword}</span></p>
          <p><strong>Code locataire :</strong> ${locataire.code_locataire || "-"}</p>
          ${locataire.montant_mensuel_loyer ? `<p><strong>Loyer mensuel :</strong> ${locataire.montant_mensuel_loyer} ${locataire.devise || "USD"}</p>` : ""}
          ${locataire.date_debut_loyer ? `<p><strong>Date de début de loyer :</strong> ${new Date(locataire.date_debut_loyer).toLocaleDateString('fr-FR')}</p>` : ""}
      </div>

      <p>Pour votre sécurité, veuillez modifier votre mot de passe lors de votre première connexion.</p>
      
      <center>
          <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/login" class="btn">
              Se connecter
          </a>
      </center>
      
      <div class="divider"></div>
      
      <p>Si vous avez des questions, n'hésitez pas à contacter notre équipe !</p>
      <p>Bien à vous,</p>
      <p><strong>L'équipe KBS Real Estate</strong></p>
    `;

    return this.baseTemplate(content, "Bienvenue chez KBS Real Estate !");
  }

  /**
   * Email de bienvenue pour un nouveau client
   */
  static welcomeClient(client, tempPassword) {
    const content = `
      <p class="greeting">Cher(e) ${client.nom} ${client.prenom},</p>
      <p>Nous vous souhaitons la bienvenue chez KBS Real Estate ! 🏡</p>
      <p>Votre compte a été créé avec succès. Voici vos identifiants de connexion :</p>
      
      <div class="info-box">
          <p><strong>Email :</strong> ${client.email}</p>
          <p><strong>Mot de passe temporaire :</strong> <span style="background: #e0e7ff; padding: 2px 8px; border-radius: 4px;">${tempPassword}</span></p>
          <p><strong>Code utilisateur :</strong> ${client.code_user || "-"}</p>
      </div>

      <p>Pour votre sécurité, veuillez modifier votre mot de passe lors de votre première connexion.</p>
      
      <center>
          <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/login" class="btn">
              Se connecter
          </a>
      </center>
      
      <div class="divider"></div>
      
      <p>Si vous avez des questions, n'hésitez pas à contacter notre équipe !</p>
      <p>Bien à vous,</p>
      <p><strong>L'équipe KBS Real Estate</strong></p>
    `;

    return this.baseTemplate(content, "Bienvenue chez KBS Real Estate !");
  }

  /**
   * Email de confirmation de réservation
   */
  static reservationConfirmed(reservation, parcelle, user) {
    const content = `
      <p class="greeting">Cher(e) ${user.nom} ${user.prenom},</p>
      <p>Merci beaucoup pour votre réservation ! ✅</p>
      <p>Votre réservation a été enregistrée avec succès.</p>
      
      <div class="info-box">
          <p><strong>Parcelle :</strong> ${parcelle.reference} - ${parcelle.titre}</p>
          <p><strong>Localisation :</strong> ${parcelle.ville}, ${parcelle.commune}</p>
          <p><strong>Superficie :</strong> ${parcelle.superficie} m²</p>
          <p><strong>Date de réservation :</strong> ${new Date(reservation.created_at).toLocaleDateString('fr-FR')}</p>
      </div>

      <p>Notre équipe vous contactera très prochainement pour confirmer et finaliser cette réservation.</p>
      
      <div class="divider"></div>
      
      <p>Si vous avez des questions, n'hésitez pas à contacter notre équipe !</p>
      <p>Bien à vous,</p>
      <p><strong>L'équipe KBS Real Estate</strong></p>
    `;

    return this.baseTemplate(content, "Confirmation de votre réservation");
  }

  /**
   * Email de demande de visite
   */
  static visiteRequested(visite, parcelle, user) {
    const content = `
      <p class="greeting">Cher(e) ${user.nom} ${user.prenom},</p>
      <p>Merci pour votre demande de visite ! 🏠</p>
      <p>Nous avons bien reçu votre demande :</p>
      
      <div class="info-box">
          <p><strong>Parcelle :</strong> ${parcelle.reference} - ${parcelle.titre}</p>
          <p><strong>Localisation :</strong> ${parcelle.ville}, ${parcelle.commune}</p>
          <p><strong>Date souhaitée :</strong> ${new Date(visite.date_souhaitee).toLocaleDateString('fr-FR')}</p>
          ${visite.heure_souhaitee ? `<p><strong>Heure souhaitée :</strong> ${visite.heure_souhaitee}</p>` : ""}
      </div>

      <p>Notre équipe vous contactera dans les prochaines heures pour confirmer ou proposer une autre date.</p>
      
      <div class="divider"></div>
      
      <p>Si vous avez des questions, n'hésitez pas à contacter notre équipe !</p>
      <p>Bien à vous,</p>
      <p><strong>L'équipe KBS Real Estate</strong></p>
    `;

    return this.baseTemplate(content, "Demande de visite enregistrée");
  }

  /**
   * Email de facture générée
   */
  static factureGeneree(facture, locataire) {
    const content = `
      <p class="greeting">Cher(e) ${locataire.nom_affichage || locataire.nom || locataire.nom_representant},</p>
      <p>Une nouvelle facture a été générée pour vous ! 📄</p>
      
      <div class="info-box">
          <p><strong>Numéro de facture :</strong> ${facture.numero_facture || "-"}</p>
          <p><strong>Montant total :</strong> ${facture.montant_total} ${facture.devise || "USD"}</p>
          <p><strong>Date d'émission :</strong> ${new Date(facture.date_emission).toLocaleDateString('fr-FR')}</p>
          <p><strong>Date d'échéance :</strong> ${new Date(facture.date_echeance).toLocaleDateString('fr-FR')}</p>
      </div>

      <p>Veuillez vous connecter à votre espace pour voir les détails et effectuer le paiement.</p>
      
      <center>
          <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/login" class="btn">
              Voir la facture
          </a>
      </center>
      
      <div class="divider"></div>
      
      <p>Si vous avez des questions, n'hésitez pas à contacter notre équipe !</p>
      <p>Bien à vous,</p>
      <p><strong>L'équipe KBS Real Estate</strong></p>
    `;

    return this.baseTemplate(content, "Nouvelle facture disponible");
  }

  /**
   * Email de confirmation de paiement
   */
  static paiementConfirme(paiement, facture, locataire) {
    const content = `
      <p class="greeting">Cher(e) ${locataire.nom_affichage || locataire.nom || locataire.nom_representant},</p>
      <p>Votre paiement a été reçu et confirmé ! 💳✅</p>
      
      <div class="info-box">
          <p><strong>Numéro de paiement :</strong> ${paiement.reference_paiement || "-"}</p>
          <p><strong>Montant payé :</strong> ${paiement.montant} ${paiement.devise || "USD"}</p>
          <p><strong>Mode de paiement :</strong> ${paiement.mode_paiement || "-"}</p>
          <p><strong>Date de paiement :</strong> ${new Date(paiement.date_paiement || paiement.created_at).toLocaleDateString('fr-FR')}</p>
      </div>

      <p>Merci pour votre paiement !</p>
      
      <div class="divider"></div>
      
      <p>Bien à vous,</p>
      <p><strong>L'équipe KBS Real Estate</strong></p>
    `;

    return this.baseTemplate(content, "Paiement confirmé");
  }

  /**
   * Email de réinitialisation de mot de passe
   */
  static resetPassword(token) {
    const content = `
      <p class="greeting">Bonjour,</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      
      <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
      
      <center>
          <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}" class="btn">
              Réinitialiser le mot de passe
          </a>
      </center>
      
      <p style="font-size: 14px; color: #64748b; margin-top: 20px;">
          Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.
      </p>
      
      <div class="divider"></div>
      
      <p>Bien à vous,</p>
      <p><strong>L'équipe KBS Real Estate</strong></p>
    `;

    return this.baseTemplate(content, "Réinitialisation de votre mot de passe");
  }
}

module.exports = EmailTemplates;
