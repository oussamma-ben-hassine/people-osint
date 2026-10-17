# Intégration LiteLLM — People OSINT

People OSINT réutilise la passerelle IA centralisée existante de l'écosystème :
`https://ai.oussamma.tn/v1`

## Fonctions de l'AIProvider
1. **Extraction Structurée des Entités et Relations :**
   À partir des extraits collectés lors des recherches, le LLM identifie :
   - Les candidats distincts (gestion des homonymes)
   - Les faits vérifiés
   - Les relations documentées (`WORKED_AT`, `CONTRIBUTED_TO`, `COAUTHORED_WITH`, `MEMBER_OF`, `PARTICIPATED_IN`, `AFFILIATED_WITH`, `DECLARED_CONNECTION`)
   - Les extraits textuels exacts justifiant chaque relation (preuves)
2. **Génération d'Embeddings :**
   Indexation vectorielle des fragments documentaires via `text-embedding-3-small` avec repli déterministe automatique si l'API est indisponible.
3. **AI Explorer & Synthèses RAG :**
   Modes `KNOWLEDGE_ONLY` (aucune recherche externe autorisée) et `WEB_ENRICHED` (signalement explicite des sources externes).
4. **Sécurité Anti Prompt-Injection :**
   Séparation stricte des instructions système et des données web non fiables.

## Configuration Coolify
```dotenv
LITELLM_BASE_URL=https://ai.oussamma.tn/v1
LITELLM_API_KEY=sk-oussamma-master-gateway-2026
LITELLM_CHAT_MODEL=gemini/gemini-3.1-flash-lite-preview
LITELLM_EMBEDDING_MODEL=text-embedding-3-small
LITELLM_TIMEOUT=45
AI_ENABLED=true
```
