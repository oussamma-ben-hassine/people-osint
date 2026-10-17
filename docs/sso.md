# Authentification SSO — People OSINT

L'application délègue intégralement l'authentification au serveur SSO central existant :
`https://sso-a.oussamma.tn/`

## Flux d'Authentification OpenID Connect (PKCE S256)

```mermaid
sequenceDiagram
    autonumber
    actor User as Utilisateur
    participant Web as People Web (Next.js)
    participant API as People API (FastAPI)
    participant SSO as SSO Central (sso-a.oussamma.tn)

    User->>Web: Clic "Connexion SSO"
    Web->>API: GET /auth/login
    API-->>Web: URL d'autorisation avec PKCE (code_challenge S256 + state)
    Web->>SSO: Redirection OIDC /oauth/authorize
    User->>SSO: Authentification (Email/Mot de passe ou Fournisseur Social)
    SSO-->>Web: Redirection /auth/callback?code=...&state=...
    Web->>API: GET /auth/callback?code=...&state=...
    API->>SSO: POST /oauth/token (code + code_verifier PKCE)
    SSO-->>API: Access Token + ID Token
    API->>SSO: GET /oauth/userinfo
    SSO-->>API: { sub, email, name, ... }
    
    alt Utilisateur = INITIAL_SUPERADMIN_SUB
        API->>API: Rôle = SUPER_ADMIN, Statut = ACTIVE
    else Nouvel Utilisateur Standard
        API->>API: Rôle = USER, Statut = PENDING (Accès bloqué 403)
    end

    API-->>Web: Cookie HttpOnly `people_session`
    Web-->>User: Redirection vers Dashboard ou /auth/forbidden
```

## Règles d'Accès Initiales (Exigence 3.1)
- **Deny-by-Default :** Aucun accès n'est accordé automatiquement.
- Tout compte nouvellement authentifié reçoit le statut `PENDING`.
- Les utilisateurs en statut `PENDING` reçoivent un code HTTP `403 Forbidden` sur l'ensemble des routes métier de l'API et sont redirigés vers `/auth/forbidden` sur le frontend.
- Seul le Super Administrateur peut promouvoir un compte au statut `ACTIVE` depuis le panneau d'administration `/admin`.

## Variables d'Environnement
```dotenv
OIDC_ISSUER=https://sso-a.oussamma.tn/
OIDC_CLIENT_ID=client_people_osint
OIDC_CLIENT_SECRET=sec_people_osint_platform_secret_2026
OIDC_REDIRECT_URI=https://people.oussamma.tn/auth/callback
INITIAL_SUPERADMIN_ISSUER=https://sso-a.oussamma.tn
INITIAL_SUPERADMIN_SUB=votre-sso-sub-unique
```
