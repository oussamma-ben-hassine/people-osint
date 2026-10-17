# People OSINT — Plateforme d'Enquête Multi-Sources & Graphe de Connaissances

Application intégrale et autonome pour `people.oussamma.tn`, intégrée à l'écosystème oussamma.tn (SSO Central OIDC PKCE, Passerelle IA LiteLLM, Docker et Coolify).

## 🚀 Fonctionnalités & Modules

- **Module A — People Search :** Moteur multi-sources asynchrone (SearXNG, GitHub, GitLab, ORCID, Crossref, OpenAlex). Annulation et suivi de progression en temps réel.
- **Module B — Research Library :** Bibliothèque des dossiers consolidés, conservation de snapshots horodatés et comparaison analytique de cibles.
- **Module C — Knowledge Base :** Modèle entités-relations relationnel et vectoriel (pgvector). Distinction stricte des homonymes et archivage des preuves documentaires.
- **Module D — Relationship Explorer :** Cartographie interactive dynamique basée sur Cytoscape.js avec différenciation visuelle (relations documentées, déclarées et incertaines).
- **Module E — AI Explorer :** Assistant conversationnel RAG connecté à LiteLLM (modes `KNOWLEDGE_ONLY` et `WEB_ENRICHED`) avec citations vérifiées et interdiction absolue de SQL arbitraire.
- **Module F — Exposure Monitor :** Surveillance des compromissions d'identifiants contrôlés (Have I Been Pwned) avec validation préalable de la preuve de propriété.
- **Module G — Administration :** Backoffice Super Administrateur pour la gestion des utilisateurs SSO, allowlist d'accès (statuts PENDING, ACTIVE), gouvernance des connecteurs et conformité RGPD (droit à l'oubli).

---

## 🔒 Sécurité & SSO (Exigence Prioritaire 3)

- **Authentification Centralisée :** Intégration stricte du SSO `https://sso-a.oussamma.tn/` via le flux OIDC Authorization Code Flow avec PKCE (S256).
- **Accès Initial Exclusivement SUPER_ADMIN :** Par défaut, tout nouvel utilisateur authentifié est en statut `PENDING` et se voit refuser l'accès (`403 Forbidden`).
- **Bootstrap Idempotent :** Seule l'identité configurée via `INITIAL_SUPERADMIN_SUB` et `INITIAL_SUPERADMIN_ISSUER` est promue automatiquement au rôle `SUPER_ADMIN`.
- **Protection Anti-SSRF :** Validation stricte des adresses IP lors des requêtes sortantes pour interdire tout accès aux réseaux privés, boucle locale ou métadonnées cloud.

---

## 🛠️ Stack Technique

- **Frontend :** Next.js 14, React 18, TypeScript, Tailwind CSS, Cytoscape.js, PWA Mobile-First
- **Backend :** Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2, Alembic, Celery
- **Bases de Données :** PostgreSQL 16 + pgvector, Redis 7
- **Moteur de Recherche Interne :** SearXNG
- **IA :** LiteLLM Gateway (`https://ai.oussamma.tn/v1`)
- **Déploiement :** Docker Compose, Coolify, HTTPS OVH

---

## 📦 Démarrage Rapide

### Développement Local
```bash
# 1. Cloner le dépôt
git clone https://github.com/oussamma-ben-hassine/people-osint.git
cd people-osint

# 2. Configurer les variables d'environnement
cp .env.example .env

# 3. Lancer les tests unitaires
cd backend
python -m venv .venv
source .venv/bin/activate  # ou .venv\Scripts\activate sous Windows
pip install -e ".[dev]"
pytest -v

# 4. Lancer avec Docker Compose Dev
cd ..
docker compose -f docker-compose.dev.yml up -d
```

---

## 📖 Documentation Détaillée
- [Architecture Technique](docs/architecture.md)
- [Intégration SSO & PKCE](docs/sso.md)
- [Passerelle IA LiteLLM](docs/litellm.md)
- [Moteur de Recherche](docs/search-engine.md)
- [Connecteurs](docs/connectors.md)
- [Base de Connaissances](docs/knowledge-base.md)
- [Graphe Cytoscape.js](docs/graph.md)
- [AI Explorer](docs/ai-explorer.md)
- [Exposure Monitor](docs/exposure-monitor.md)
- [Sécurité & Anti-SSRF](docs/security.md)
- [Conformité RGPD](docs/privacy.md)
- [Administration](docs/admin.md)
- [Déploiement Coolify](docs/deployment.md)
- [Référence API REST](docs/api.md)
