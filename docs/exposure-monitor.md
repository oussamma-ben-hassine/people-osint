# Exposure Monitor — Détection d'Exposition de Données

Le module Exposure Monitor surveille les compromissions d'identifiants contrôlés par l'utilisateur ou son organisation.

## Règles Éthiques et Juridiques
- **Preuve de Propriété Obligatoire :**
  L'analyse d'une adresse email personnelle appartenant au compte SSO est immédiate.
  Tout autre email ou nom de domaine nécessite la validation d'un jeton de preuve de contrôle (DNS TXT ou jeton sécurisé).
- **Interdiction des Mots de Passe Volés :**
  L'application n'affiche et ne stocke jamais de mots de passe en clair ou de hashes volés.
- **Interdiction des Dépôts Bruts :**
  Aucun fichier de fuite de données brute n'est hébergé, téléchargé ou distribué.
- **Rapports de Remédiation :**
  Fourniture de recommandations de sécurité concrètes (MFA, rotation des identifiants, SPF/DMARC).
