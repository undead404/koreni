# Nginx Deployment Contract

This document defines the operational deployment contract for Nginx reverse-proxy configuration in Koreni (`scripts/server/nginx.conf`).

## Architecture & Ownership

1. **Repository Ownership**: `scripts/server/nginx.conf` in the repository main branch is the single source of truth for Koreni's production site configuration (`/etc/nginx/sites-available/koreni.org.ua`).
2. **Certbot Coexistence**: Directives managed by Certbot (such as SSL certificates under `/etc/letsencrypt/` and standard redirect blocks) are externally maintained on the host. Repository updates must preserve compatibility with these directives.
3. **Execution Zone**: Automated Nginx updates are governed by `.github/workflows/main.yml` in a dedicated `deploy-nginx` job.

## Trigger & Scope

- **Selective Execution**: The `deploy-nginx` job executes only when files matching `scripts/server/nginx*` or Nginx deployment definitions change on the `main` branch.
- **Dependencies**: Nginx deployment runs after upstream lint, typecheck, unit test, and build validation tasks pass.

## Deployment Lifecycle

1. **Backup**: Before modifying live configuration, the existing active configuration at `/etc/nginx/sites-available/koreni.org.ua` is copied to `/etc/nginx/sites-available/koreni.org.ua.bak`.
2. **Staging & Validation**: The candidate configuration is copied to the host and syntax-checked using `sudo nginx -t`.
3. **Activation**: If syntax validation succeeds, the candidate configuration is atomically linked/placed into active position and reloaded gracefully via `sudo systemctl reload nginx`.
4. **Verification**: Post-deployment health checks verify all active routes and TLS behavior:
   - `GET /` (Frontend static serving)
   - `GET /api/` or `POST /api/` proxy route (Backend API)
   - `GET /t/` proxy route (Typesense)
   - `GET /comments/` proxy route (Comments service)
   - SSL/TLS certificate validity
5. **Rollback**: If syntax validation, system reload, or post-deployment route verification fails, the deployment automatically restores `/etc/nginx/sites-available/koreni.org.ua.bak`, reloads Nginx, and fails the CI job.
