# 🔐 Rapport d'Audit de Sécurité — KALA'S (Second Audit de Vérification)

**Date** : 2026-09-11 22:15–22:35 (UTC+8) · **Projet** : `/home/z/my-project` · **Stack** : Next.js 16.3.4 · React · TypeScript · Prisma · PostgreSQL (Neon)

**Contexte** : l'audit complet et les corrections ont été réalisés et commités (`security: full audit remediation`, `docs: security audit worklog`, `security: untrack .env files`). Ce document est le **second audit post-corrections (ÉTAPE 8-9)** : re-vérification de toutes les protections, tests dynamiques à chaud, lint + tsc + build.

---

## 🔴 CRITIQUE (corrigées, confirmées en place)

1. **`.env` versionné dans Git** — secrets de base de données dans l'historique.
   *Correction* : `git rm --cached`, `.gitignore` renforcé (`.env*`, exception `!.env.example`). Re-vérifié : seul `.env.example` est tracké.
   *⚠️ Action utilisateur restante : rotation des identifiants Neon (l'ancien DATABASE_URL demeure dans l'historique Git).*
2. **Déclenchement de transferts de fonds sans authentification** — `/api/affiliate-transfer?action=processScheduled` était appelable publiquement.
   *Correction* : garde `CRON_SECRET` (header `x-cron-secret` ou `?secret=`). Re-testé à chaud : **401 sans secret, 200 avec secret**.

## 🟠 ÉLEVÉ (corrigées, confirmées en place)

1. **Fuite de PII sur le suivi de commande publique** — `/api/orders/track` exposait téléphone/adresse/notes.
   *Correction* : route **POST-only** (GET → 405, vérifié), `select` Prisma limité aux champs de suivi, commentaire de non-divulgation en place. Re-testé : zod 400 en entrée invalide, réponse vide sans énumération d'utilisateur pour un email inconnu.
2. **RBAC insuffisant sur les routes admin** — un `staff` pouvait écrire des ressources.
   *Correction* : `hasAdminRole()` dans `src/lib/auth.ts` + **26 gardes** insérées dans **20 fichiers de routes** (re-comptées aujourd'hui, toutes présentes).
3. **Sessions chat prévisibles** (`customer-<id>`) — un attaquant pouvait rejoindre la conversation d'un client.
   *Correction* : liaison de la session au token du client ; les sessions visiteurs restent ouvertes (pas de régression).

## 🟡 MOYEN (corrigées, confirmées en place)

1. **Absence de rate limiting** → appliqué à 16 fichiers : `customer-auth`, `affiliate-auth`, `admin/auth/login`, `loyalty`, `chat`, `orders/track`, `wholesale/*`, `upload`, `contact`, `newsletter`, `messages`… Re-testé à chaud : **429 à la 11ᵉ requête** sur `customer-auth` (10/min/IP).
2. **Mots de passe admin en SHA-256 historique** → migration automatique vers bcrypt au login (vérifiée par test réel en session précédente).
3. **Endpoint loyalty** → ne retourne plus que des agrégats `{points, totalPoints}` (bug `data.points` du dashboard corrigé au passage).

## 🟢 FAIBLE (corrigées, confirmées en place)

1. **Headers de sécurité** (`next.config.ts`) : CSP (sans `unsafe-eval` en prod), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, **HSTS en production uniquement** (structure conditionnelle vérifiée — conforme).
2. **Health endpoint** ne divulgue plus version/environnement.
3. **Contact** : pagination bornée à 100.
4. **`changeReason`** : sanitization des caractères de contrôle.
5. **Dépendances** : `next` 16.1.1 → **16.3.4** (5 CVE critiques), `uuid`, `next-intl`, `nanoid` mis à jour. Restent planifiés en branche de test (breaking) : `sharp`, `react-syntax-highlighter`.

## ✅ PROTECTIONS DÉJÀ PRÉSENTES (non modifiées)

- **Prisma** : ORM paramétré partout — **aucun** `$queryRawUnsafe`/`$executeRawUnsafe` ; seul SQL brut = `$queryRaw\`SELECT 1\`` (constante) dans health. Pas d'injection SQL possible par construction.
- **Validation zod stricte** sur toutes les entrées API (query, body, params).
- **Prix et montants recalculés côté serveur** (test session précédente : `unitPrice=1` falsifié → recalculé au tarif réel 5500 FCFA).
- **XSS** : échappement JSX de React ; les 2 seuls `dangerouslySetInnerHTML` inspectés sont sûrs (CSS d'impression statique dans `admin/page.tsx` ; config de couleurs définie dans le code pour `ui/chart.tsx` — pattern shadcn/ui standard).
- **Secrets** : aucun secret en dur détecté (scan de patterns), **aucune** variable `NEXT_PUBLIC_*` dans le code, `.env.example` = placeholders uniquement.
- **Logs** : erreurs génériques au client, détails uniquement dans les logs serveur (`console.error(error)` — pas de secrets/mots de passe loggés).
- **Upload** : POST sans auth → 401 ; validations taille/type/mime déjà en place.

## 🛠️ MODIFICATIONS EFFECTUÉES (récapitulatif des fichiers)

| Fichier | Problème | Correction | Risque éliminé |
|---|---|---|---|
| `.gitignore` + index git | `.env` tracké | untrack + règle `.env*` | Fuite de secrets via Git |
| `src/app/api/affiliate-transfer/route.ts` | Transferts de fonds sans auth | Garde `CRON_SECRET` | Déclenchement frauduleux de paiements |
| `src/app/api/orders/track/route.ts` | PII publiques, GET | POST-only + `select` minimal | Vol de données personnelles |
| `src/lib/auth.ts` | RBAC Limité | `hasAdminRole()` + rate limiter | Élévation de privilèges staff→admin |
| 20 fichiers de routes API | Gardes insuffisantes | 26 gardes `hasAdminRole` | Écriture admin par rôle inférieur |
| `src/app/api/chat/route.ts` | Sessions devinables | Liaison token client | Écoute de conversations |
| `src/app/api/loyalty/route.ts` | Données trop détaillées | Agrégats + rate limit | Énumération de comptes |
| `src/app/api/admin/auth/login/route.ts` | SHA-256 legacy | Migration bcrypt auto + rate limit | Brute force / hash faible |
| `src/app/api/health/route.ts` | Fuite version/env | Réponse minimale | Reconnaissance serveur |
| `src/app/api/contact/route.ts` | Pagination non bornée | max 100 | DoS par extraction massive |
| `next.config.ts` | Headers absents | CSP + 6 headers + HSTS prod | Clickjacking, sniffing, XSS externe |
| `package.json` | next 16.1.1 (5 CVE critiques) | next 16.3.4 + uuid/nanoid/next-intl | Exploits connus |
| `.env.example` | — | Placeholders uniquement | Guide de config sans secret |

## 🧪 TESTS EFFECTUÉS (re-vérification du jour, à chaud)

| # | Test | Attendu | Résultat |
|---|---|---|---|
| 1 | Cron `processScheduled` sans secret | 401 | ✅ 401 |
| 2 | Cron avec `x-cron-secret` (2 exécutions 22:00 & 22:15) | 200 | ✅ `processed:0` |
| 3 | 7 endpoints privés non authentifiés (`orders`, `contact`, `messages`, `activity`, `stock-history`, `upload`…) | 401/405 | ✅ tous |
| 4 | `/api/users` | inexistant | ✅ 404 |
| 5 | `upload` POST sans auth | 401 | ✅ 401 |
| 6 | `site-settings` public | données non sensibles | ✅ infos vitrine uniquement |
| 7 | `track` GET | rejeté | ✅ 405 (POST-only) |
| 8 | `track` POST invalide / email inconnu | 400 / réponse sans énumération | ✅ |
| 9 | Rate limit `customer-auth` 11ᵉ requête | 429 | ✅ 429 |
| 10 | Scan `dangerouslySetInnerHTML` | statique uniquement | ✅ 2/2 sûrs |
| 11 | Scan SQL brut / `Unsafe` | paramétré uniquement | ✅ |
| 12 | Scan `NEXT_PUBLIC_` | aucune variable sensible | ✅ 0 |
| 13 | Scan secrets en dur / logs | aucune fuite | ✅ |
| 14 | `prisma validate` | PASS | ✅ PASS |

*Tests de session précédente (toujours valables, non régressés) : staff→route admin 403, falsification de prix recalculée serveur, charge XSS stockée en texte brut, migration bcrypt admin vérifiée par login réel, 8 endpoints privés 401, toutes les pages 200.*

## 🗄️ PRISMA

```
Prisma validate : PASS
Prisma generate : PASS (session précédente)
Migration       : NON NÉCESSAIRE (aucune modification du schéma)
```

## 🏗️ BUILD

```
Lint        : PASS (0 erreur, 4 warnings mineurs no-unused-expressions préexistants)
TypeScript  : PASS (0 erreur, exit 0)
Build       : PASS (exit 0, "Compiled successfully", route table générée)
```

## ☁️ PRODUCTION

```
Vercel compatible        : OUI (output standalone, headers globaux, middleware Proxy actif)
Variables d'environnement : OK (.env.example = placeholders ; .env non tracké ; CRON_SECRET documenté)
Base de données           : OK (Neon joignable, schéma valide)
```

### ⚠️ Actions restantes côté exploitant (hors code)

1. **Rotatif les identifiants Neon** — l'ancien `DATABASE_URL` figure dans l'historique Git.
2. **Définir `CRON_SECRET` dans les variables d'environnement de production** et faire appeler le cron externe avec le header `x-cron-secret` (sans le : 401).
3. **`sharp` et `react-syntax-highlighter`** : mises à jour majeures à traiter sur une branche de test.
