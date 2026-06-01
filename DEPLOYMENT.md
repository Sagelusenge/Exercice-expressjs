# Deploiement KBS sur Render + Clever Cloud

## 1. Base MySQL Clever Cloud

1. Cree un add-on MySQL sur Clever Cloud.
2. Recupere les variables de connexion:
   - `MYSQL_ADDON_HOST`
   - `MYSQL_ADDON_PORT`
   - `MYSQL_ADDON_USER`
   - `MYSQL_ADDON_PASSWORD`
   - `MYSQL_ADDON_DB`
3. Importe le schema:
   - Ouvre phpMyAdmin / Adminer / MySQL Workbench.
   - Connecte-toi avec les identifiants Clever Cloud.
   - Si Clever Cloud refuse les triggers avec `#1419`, importe `Kbsbd-clever-basic.sql`.
   - Ce fichier est adapte au MySQL mutualise Clever Cloud: pas de `CREATE DATABASE`, pas de `USE ...`, pas de fonctions, pas de triggers, pas de procedures, pas d'events.

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
FRONTEND_URL=https://ton-frontend.onrender.com
CORS_ORIGIN=https://ton-frontend.onrender.com
DB_HOST=MYSQL_ADDON_HOST
DB_PORT=MYSQL_ADDON_PORT
DB_USER=MYSQL_ADDON_USER
DB_PASSWORD=MYSQL_ADDON_PASSWORD
DB_NAME=MYSQL_ADDON_DB
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ton_email
SMTP_PASS=ton_mot_de_passe_application
SMTP_FROM=KBS Buildings <ton_email>
```

Apres deploy, teste:

```txt
https://ton-backend.onrender.com/health
```

## 3. Frontend Render

Service Render:

- Type: `Static Site`
- Root Directory: `kbs-frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

Variables Render:

```txt
VITE_API_URL=https://ton-backend.onrender.com/api/v1
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
