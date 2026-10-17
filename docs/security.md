# Sécurité & Conformité Technique — People OSINT

## Mesures de Sécurité Appliquées

### 1. Protection Anti-SSRF (Server-Side Request Forgery)
Le composant `is_safe_external_url` résout le nom d'hôte via DNS avant toute requête sortante et vérifie que l'adresse IP n'appartient pas :
- Aux plages privées RFC 1918 (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
- À la boucle locale (127.0.0.0/8, ::1)
- Aux adresses link-local (169.254.0.0/16)
- Aux points d'accès de métadonnées cloud (169.254.169.254, metadata.google.internal)

### 2. Cookies de Session Sécurisés
- Attribut `HttpOnly` pour bloquer l'accès JavaScript aux tokens.
- Attribut `SameSite=Lax` pour la protection CSRF.
- Chiffrement AES-GCM 256 bits des identifiants et clés de connecteurs stockés.

### 3. Isolation Objet par Objet (Multi-Tenant)
Chaque requête vérifie que l'utilisateur connecté est bien le propriétaire de la ressource (`user_id == current_user.id`). Un utilisateur standard ne peut en aucun cas consulter, modifier ou supprimer les dossiers d'un tiers.

### 4. Protection Anti Prompt-Injection
Les données issues de collectes web sont isolées dans le rôle `user` du contexte LLM sous forme de blocs de données neutres et ne sont jamais injectées dans les instructions de haut niveau du rôle `system`.
