# Deploiement KBS sur Render + Clever Cloud

## 1. Base MySQL

1. Cree une base MySQL qui accepte les triggers, procedures et events.
   - Recommande: Aiven MySQL ou un MySQL/VPS avec droits suffisants.
   - Clever Cloud mutualise peut refuser les triggers/functions avec `#1419`.
2. Recupere les variables de connexion:
   - `MYSQL_ADDON_HOST`
   - `MYSQL_ADDON_PORT`
   - `MYSQL_ADDON_USER`
   - `MYSQL_ADDON_PASSWORD`
   - `MYSQL_ADDON_DB`
3. Importe le schema:
   - Ouvre phpMyAdmin / Adminer / MySQL Workbench.
   - Connecte-toi avec les identifiants de ta base.
   - Importe `Kbsbd-aiven-full.sql` pour retrouver l'ancien fonctionnement avec triggers, procedures et events dans la BD.
   - Ce fichier garde la logique BD complete, mais retire `CREATE DATABASE` et `USE` pour fonctionner dans une base deja creee comme `defaultdb`.
   - Apres l'import du schema, execute `Kbsbd-clever-seed-admin.sql` pour creer/rehabiliter le super admin initial.
   - Connexion admin initiale: `serge.balezi@kbs-immobilier.com` / `KbsAdmin@2026`.

## 2. Backend Render

Service Render:

- Type: `Web Service`
- Root Directory: `kbs-backend`
- Build Command: `npm install`
- Start Command: `npm start`

Variables Render:

```txt
NODE_ENV=production
JWT_SECRET=une_valeur_longue_et_secrete
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://exercice-expressjs.onrender.com
CORS_ORIGIN=https://exercice-expressjs.onrender.com
DB_HOST=MYSQL_ADDON_HOST
DB_PORT=MYSQL_ADDON_PORT
DB_USER=MYSQL_ADDON_USER
DB_PASSWORD=MYSQL_ADDON_PASSWORD
DB_NAME=MYSQL_ADDON_DB
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=ton_email
SMTP_PASS=ton_mot_de_passe_application_gmail
SMTP_FROM=KBS Buildings <ton_email>
```

Pour Gmail, `SMTP_PASS` doit etre un mot de passe d'application Google:

1. Active la validation en deux etapes sur le compte Gmail.
2. Va dans `Compte Google > Securite > Mots de passe des applications`.
3. Cree un mot de passe pour `Mail`.
4. Mets ce code de 16 caracteres dans `SMTP_PASS` sur Render, sans guillemets.
5. Redeploie le backend apres modification des variables.

Apres deploy, teste:

```txt
https://backend-dx5f.onrender.com/health
```

## 3. Frontend Render

Service Render:

- Type: `Static Site`
- Root Directory: `kbs-frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

Variables Render:

```txt
VITE_API_URL=https://backend-dx5f.onrender.com/api/v1
VITE_TENANT_SLUG=kbs-immobilier
```

## 4. GitHub

Depuis le dossier racine du projet:

```bash
git init
git add .
git commit -m "Prepare KBS deployment"
git branch -M main
git remote add origin https://github.com/Sagelusenge/Exercice-expressjs.git
git push -u origin main
```

Important: ne pousse jamais les vrais fichiers `.env`.
