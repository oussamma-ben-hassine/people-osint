# Connecteurs Multi-Sources — People OSINT

Chaque connecteur implémente l'interface abstraite `SearchConnector` et se soumet au `SourcePolicyEngine` (principe du *deny by default*).

## Connecteurs Intégrés
1. **SearXNG (`searxng`) :** Métamoteur de recherche respectueux de la vie privée agrégeant Google, Bing, DuckDuckGo, Wikipédia.
2. **GitHub API (`github`) :** Profils de développeurs publics, organisations, contributions open source et dépôts.
3. **GitLab API (`gitlab`) :** Profils et activités publiques sur GitLab.com.
4. **ORCID (`orcid`) :** Registre international public des chercheurs et universitaires.
5. **Crossref (`crossref`) :** Métadonnées officielles de publications scientifiques, articles avec DOI et co-auteurs.
6. **OpenAlex (`openalex`) :** Graphe académique mondial des auteurs, affiliations institutionnelles et indicateurs de citation.
7. **Exposure Threat Intel (`hibp`) :** Détection d'expositions historiques sur des adresses ou domaines légitimement contrôlés.

## Matrice des Politiques (SourcePolicyEngine)
| Connecteur | Recherche | Extraction | Stockage | Export | Quota / min |
| :--- | :---: | :---: | :---: | :---: | :---: |
| SearXNG | Oui | Oui | Oui | Oui | 60 |
| GitHub | Oui | Oui | Oui | Oui | 30 |
| GitLab | Oui | Oui | Oui | Oui | 30 |
| ORCID | Oui | Oui | Oui | Oui | 60 |
| Crossref | Oui | Oui | Oui | Oui | 60 |
| OpenAlex | Oui | Oui | Oui | Oui | 60 |
| HIBP | Vérifié | Non brut | Oui | Oui | 10 |
