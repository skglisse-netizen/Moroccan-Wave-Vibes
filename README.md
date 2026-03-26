# SurfSchool Manager

Système complet de gestion pour école de surf (Réservations, Clients, Stock, Revenus, Staff).

## Configuration Locale

**Prérequis :** Node.js v18+

1. **Installation des dépendances :**
   ```bash
   npm install
   ```

2. **Configuration :**
   Copiez `.env.example` vers `.env` (si ce n'est pas déjà fait) et vérifiez les paramètres.
   ```bash
   # .env
   PORT=3000
   SESSION_SECRET=votre-cle-secrete
   ```

3. **Lancement de l'application :**
   ```bash
   npm run dev
   ```

L'application utilise une base de données **SQLite** locale (`surf_school.db`).
