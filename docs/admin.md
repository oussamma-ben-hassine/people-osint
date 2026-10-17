# Guide d'Administration Backoffice — People OSINT

Accessible aux utilisateurs disposant du rôle `SUPER_ADMIN` ou `ADMIN` sur `/admin`.

## Gestion des Utilisateurs et Accès
- **Liste des Utilisateurs SSO :** Visualisation de tous les comptes ayant initié une connexion OIDC.
- **Validation d'un Compte :** Passer le statut de `PENDING` à `ACTIVE`.
- **Rôles Applicatifs :**
  - `SUPER_ADMIN` : Gestion des accès, des connecteurs, des quotas et de la plateforme.
  - `ADMIN` : Supervision technique et consultation d'audit.
  - `USER` : Utilisation des modules de recherche et de base de connaissances.
  - `DISABLED` : Révocation complète des privilèges.

## Gestion des Connecteurs & Quotas
- Activation / Désactivation à chaud de chaque connecteur.
- Ajustement des plafonds de requêtes par minute et par jour.
- Activation granulaire des droits : recherche, extraction, stockage, export.

## Audit & Rétention
- Journal d'audit chronologique traçant chaque modification de rôle, lancement d'enquête et demande RGPD.
