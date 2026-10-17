# Conformité RGPD & Vie Privée — People OSINT

People OSINT traite des données à caractère personnel publiques dans le respect du RGPD et des principes de *Privacy by Design*.

## Principes Appliqués
1. **Minimisation :** Seules les informations publiquement documentées nécessaires à l'enquête sont extraites.
2. **Gestion des Homonymes :** L'algorithme ne fusionne jamais automatiquement deux personnes sur la simple base d'un nom partagé sans preuve documentaire concordante.
3. **Absence de Surveillance Continue :** L'application ne réalise pas de surveillance continue d'individus ou d'espionnage de la vie privée.
4. **Droit à l'Oubli & Effacement :**
   Un endpoint dédié `POST /api/v1/admin/gdpr/erasure/{user_id}` permet la suppression en cascade et irréversible de l'ensemble des données d'un individu ou d'un utilisateur.
5. **Politique de Rétention Automatique :**
   Une tâche de fond quotidienne Celery Beat purge automatiquement les données et relations ayant dépassé `KNOWLEDGE_RETENTION_DAYS` (par défaut 30 jours).
