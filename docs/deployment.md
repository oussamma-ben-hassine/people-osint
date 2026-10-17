# Guide de Déploiement Coolify & Docker — People OSINT

People OSINT se déploie via Docker Compose sur Coolify sur VPS OVH sous le domaine `https://people.oussamma.tn`.

## Architecture des Conteneurs
- `people-web` : Interface Next.js (port 3000 exposé sur le réseau coolify)
- `people-api` : Backend FastAPI (port 8000 sur le réseau interne)
- `people-worker` : Worker asynchrone Celery (tâches de recherche multi-sources)
- `people-beat` : Ordonnanceur Celery Beat (purge quotidienne RGPD)
- `people-postgres` : PostgreSQL 16 avec extension pgvector
- `people-redis` : Cache Redis 7 et broker de messages
- `people-searxng` : Métamoteur SearXNG interne isolé

## Procédure de Déploiement sur Coolify
1. **Création de l'application dans Coolify :**
   - Type : Docker Compose
   - Dépôt Git : `https://github.com/oussamma-ben-hassine/people-osint`
   - Branche : `main`
2. **Configuration du Domaine :**
   - FQDN : `https://people.oussamma.tn`
   - Redirection SSL / Let's Encrypt automatique gérée par Coolify / Traefik.
3. **Variables d'Environnement Obligatoires :**
   - Définir dans Coolify l'ensemble des clés listées dans `.env.example`.
   - Spécifier en particulier `INITIAL_SUPERADMIN_SUB` pour garantir l'accès du Super Administrateur dès la première connexion.
4. **Sauvegarde et Restauration PostgreSQL :**
   - **Sauvegarde :**
     `docker exec -t people-postgres pg_dumpall -U people_user > backup_people_$(date +%F).sql`
   - **Restauration :**
     `cat backup_people.sql | docker exec -i people-postgres psql -U people_user -d people_db`
