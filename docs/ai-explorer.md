# AI Explorer — Assistant d'Enquête & RAG Sécurisé

Le module AI Explorer permet d'interroger la base d'investigation en langage naturel via LiteLLM.

## Modes de Fonctionnement
1. **KNOWLEDGE_ONLY :**
   Interrogation stricte des informations préalablement enregistrées dans la base de données de l'utilisateur. Aucun appel vers Internet n'est autorisé.
2. **WEB_ENRICHED :**
   Interrogation de la base interne, complétée si nécessaire par des connecteurs autorisés avec notification explicite à l'utilisateur.

## Sécurité des Outils (Zéro SQL Arbitraire)
Le modèle n'exécute jamais de requêtes SQL brutes. Il s'appuie sur une suite d'outils backend typés et limités au périmètre de l'utilisateur connecté :
- `search_documents(query, limit)`
- `search_entities(query, limit)`
- `search_research_cases(query, limit)`
- `get_entity_facts(entity_name)`
- `get_entity_relations(entity_name)`
- `compare_research_cases(case_ids)`
- `get_source_evidence(relation_id)`
- `query_knowledge_graph(case_id)`

Chaque réponse inclut la liste vérifiée des citations et les éventuels avertissements d'incertitude.
