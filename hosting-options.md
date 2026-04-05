# hosting-options.md

L'application **SurfSchool Manager v2** est une application Node.js moderne avec un frontend React (Vite). Elle peut être hébergée sur plusieurs types d'hébergeurs "normaux". Voici les options principales :

## 1. Hébergement Mutualisé (Node.js)
Certains hébergeurs français comme **O2Switch (Offre Unique)**, **Hostinger** ou **Infomaniak** proposent du support pour Node.js sur leurs offres mutualisées.

> [!TIP]
> C'est l'option la moins chère et la plus simple si vous voulez un hébergeur "classique" avec un support client.

### Comment faire ?
1. **Node.js Selector** : Utiliser l'outil "Node.js Selector" dans le panneau de contrôle (cPanel/hPanel).
2. **Build** : Il faudra générer le dossier `dist` localement avec `npm run build` avant d'envoyer les fichiers, ou le faire sur le serveur via SSH.
3. **Fichier de démarrage** : Configurer le serveur pour pointer vers `server.js` (il faudra probablement compiler `server.ts` en `server.js` ou utiliser un lanceur comme `tsx`).
4. **Base de données** : Utiliser **Neon.tech** (PostgreSQL) comme actuellement, ce qui évite de gérer la base de données sur l'hébergeur.

---

## 2. VPS (Serveur Privé Virtuel)
Des hébergeurs comme **OVHcloud**, **Scaleway** ou **DigitalOcean** proposent des serveurs entiers.

> [!IMPORTANT]
> Vous avez un contrôle total, mais vous devez gérer le serveur vous-même (sécurité, mises à jour). C'est pour les utilisateurs plus avancés.

### Comment faire ?
1. Installer Node.js et Git.
2. Cloner le projet.
3. Installer **PM2** pour garder l'application lancée en permanence.
4. Utiliser **Nginx** comme "Reverse Proxy" pour diriger le trafic vers le port 3000.

---

## 3. Plateformes Cloud (PaaS) - Recommandé
Bien que ce ne soit pas un "hébergeur traditionnel" comme OVH, des plateformes comme **Railway.app**, **Render.com** ou **Vercel** sont beaucoup plus adaptées aux applications modernes comme celle-ci.

### Pourquoi ?
- **Automatique** : Chaque fois que vous poussez du code sur GitHub, l'application est mise à jour.
- **SSL gratuit** : Le HTTPS est géré automatiquement.
- **Base de données** : Intégration facile avec PostgreSQL.

## 4. AWS Cloud (Amazon Web Services)
AWS est l'un des leaders du cloud. C'est puissant mais peut être plus complexe à configurer.

### AWS App Runner (Le plus simple)
- **Fonctionnement** : Vous connectez votre repo GitHub, et AWS déploie l'application automatiquement dans un "container".
- **Avantages** : Pas de serveur à gérer, mise à l'échelle automatique.
- **Inconvénients** : Coût un peu plus élevé que le mutualisé.

### AWS RDS (La base de données sur AWS)
Si vous voulez que votre base de données soit aussi sur AWS (au lieu de Neon) :
- **Service** : **Amazon RDS for PostgreSQL**.
- **Avantage** : Tout est au même endroit, latence minimale si l'app (App Runner) et la DB sont dans la même région.
- **Attention** : L'offre gratuite d'AWS (Free Tier) pour RDS expire après 12 mois. Après cela, le coût minimum est d'environ 15-20$/mois.

### AWS Amplify Hosting
Attention : Amplify est génial pour le frontend, mais comme votre application a un **backend Express**, Amplify seul ne suffira pas. Il faudra utiliser **AWS App Runner** ou **Elastic Beanstalk**.

### AWS Lightsail (Le plus économique sur AWS)
- **Fonctionnement** : C'est l'équivalent d'un VPS (comme OVH) mais chez Amazon.
- **Avantages** : Prix fixe et prévisible (à partir de ~5$/mois).
- **Inconvénients** : Vous devez tout installer (Node.js, Nginx, etc.).

---

## Recommandation pour AWS
Si vous tenez à rester chez AWS : **AWS App Runner** est le choix le plus moderne et facile pour une application Express + React. Si vous cherchez le moins cher chez eux, regardez **AWS Lightsail**.

Souhaitez-vous que je vous guide dans la création d'un fichier `Dockerfile` ? C'est souvent la méthode recommandée pour déployer sur AWS App Runner.
