# Référence de l'API REST — People OSINT

Documentation OpenAPI interactive disponible sur `/docs` et `/redoc`.

## Endpoints Principaux

### Authentification & Sessions
- `GET /auth/login` : Initialise l'échange OIDC et retourne l'URL PKCE
- `GET /auth/callback` : Échange le code d'autorisation contre les tokens de session
- `GET /auth/me` : Retourne le profil et le statut de l'utilisateur connecté
- `POST /auth/logout` : Supprime le cookie de session

### Module A — People Search
- `POST /api/v1/searches` : Crée et lance une enquête asynchrone multi-sources
- `GET /api/v1/searches` : Liste les enquêtes de l'utilisateur
- `GET /api/v1/searches/{id}` : Récupère la progression (pourcentage et étape)
- `GET /api/v1/searches/{id}/results` : Retourne la liste des résultats dédupliqués
- `POST /api/v1/searches/{id}/refresh` : Relance l'actualisation
- `POST /api/v1/searches/{id}/cancel` : Annule l'enquête en cours
- `DELETE /api/v1/searches/{id}` : Supprime l'enquête

### Module B — Research Library
- `GET /api/v1/research-cases` : Liste les dossiers archivés
- `GET /api/v1/research-cases/{id}` : Détails d'un dossier
- `GET /api/v1/research-cases/{id}/snapshots` : Snapshots horodatés
- `POST /api/v1/research-cases/compare` : Compare plusieurs dossiers
- `DELETE /api/v1/research-cases/{id}` : Supprime un dossier

### Module C — Knowledge Base
- `GET /api/v1/knowledge/entities` : Liste et filtre les entités
- `GET /api/v1/knowledge/relations` : Liste les relations avec preuves
- `POST /api/v1/knowledge/query` : Recherche hybride (mot-clé et sémantique)

### Module D — Relationship Explorer
- `GET /api/v1/graph` : Graphe complet formaté Cytoscape.js
- `GET /api/v1/graph/entities/{id}` : Sous-graphe à 1 saut autour d'une entité

### Module E — AI Explorer
- `POST /api/v1/ai/conversations` : Crée une session de discussion
- `GET /api/v1/ai/conversations` : Liste les sessions actives
- `POST /api/v1/ai/conversations/{id}/messages` : Envoie une question (RAG + citations)

### Module F — Exposure Monitor
- `POST /api/v1/exposure/checks` : Crée une demande d'audit
- `POST /api/v1/exposure/checks/{id}/verify` : Valide la preuve de propriété
- `GET /api/v1/exposure/checks` : Historique des contrôles d'exposition

### Module G — Administration
- `GET /api/v1/admin/users` : Liste des comptes SSO
- `PATCH /api/v1/admin/users/{id}/access` : Modification rôle et statut (ACTIVE/PENDING)
- `GET /api/v1/admin/connectors` : Configuration des connecteurs
- `PATCH /api/v1/admin/connectors/{id}` : Mise à jour des quotas
- `GET /api/v1/admin/stats` : Statistiques globales
- `POST /api/v1/admin/gdpr/erasure/{id}` : Effacement intégral RGPD
