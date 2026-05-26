# Stratégie de backup Volia (Supabase)

Ce document décrit la stratégie complète de sauvegarde et de restauration de la base de données Volia (projet Supabase `kqrarrrojdtxijkhejhg`).

Objectifs :
- RPO (Recovery Point Objective) cible : **24 h** (perte de données max acceptable)
- RTO (Recovery Time Objective) cible : **< 4 h** (temps de remise en service)
- Rétention long terme : **30 jours** locale, **90 jours** off-site (optionnel S3/B2)

---

## 1. Backups automatiques Supabase (couche de base)

Supabase fournit nativement des backups sur les plans payants. Cette couche est **toujours active** et constitue le filet de sécurité principal.

### Ce qui est inclus selon le plan
| Plan | Backups quotidiens | Rétention | PITR (Point-in-Time Recovery) |
|---|---|---|---|
| Free | Non | — | Non |
| **Pro** | Oui | **7 jours** | Oui (7 j, granularité seconde) |
| Team / Enterprise | Oui | 14 j / 30 j | Oui (14 j / 30 j) |

> Action requise : Anthony doit vérifier que le projet `kqrarrrojdtxijkhejhg` est bien sur le **plan Pro** (ou supérieur). Dashboard → Settings → Billing → Plan.

### Accéder aux backups Supabase
1. Aller sur https://supabase.com/dashboard/project/kqrarrrojdtxijkhejhg
2. Settings → Database → **Backups** (ou onglet "Backups" selon UI)
3. Liste des snapshots quotidiens + slider PITR

### Lancer un restore PITR
1. Settings → Backups → onglet **Point-in-Time Recovery**
2. Choisir la date et l'heure cible (précision à la seconde)
3. Cliquer "Restore" → Supabase **crée un nouveau projet** restauré à cet instant
4. Une fois le nouveau projet prêt :
   - Récupérer la nouvelle URL Supabase et les nouvelles clés (anon / service role)
   - Mettre à jour les env vars sur Vercel (Production + Preview)
   - Redéployer
   - (Optionnel) Renommer / archiver l'ancien projet pour audit

⚠️ Le restore PITR ne réécrit **pas** le projet existant : c'est toujours un nouveau projet. Prévoir 5–10 min de downtime côté Vercel pendant la bascule des env vars.

---

## 2. Backups manuels long terme (couche complémentaire)

Au-delà des 7 jours de rétention Supabase Pro, il faut conserver des dumps maison. Deux options : script local lancé par cron, ou GitHub Actions (recommandé).

### Outils utilisés
- `pg_dump` (PostgreSQL client) — génère un dump custom format (`-F c`) restaurable avec `pg_restore`
- `gzip` — compression du SQL plain pour stockage
- (optionnel) `aws s3 cp` ou `rclone` — upload off-site

### Récupérer les credentials DB
- Supabase Dashboard → Settings → Database → **Connection string** (mode "Session pooler" ou "Direct connection")
- Mot de passe : **Settings → Database → Reset database password** (si inconnu). Sauvegarder dans 1Password / Bitwarden.

Variables à conserver :
```
SUPABASE_DB_PASSWORD=<le mot de passe postgres>
# Host = db.kqrarrrojdtxijkhejhg.supabase.co (direct) ou aws-0-eu-west-3.pooler.supabase.com (pooler)
```

---

## 3. Script manuel `scripts/backup-supabase.sh`

Fichier : `scripts/backup-supabase.sh` (déjà créé dans ce repo, exécutable).

### Pré-requis
- `pg_dump` installé : `brew install postgresql@16` sur macOS (utilisera `pg_dump` v16)
- Variable d'env `SUPABASE_DB_PASSWORD` exportée :
  ```bash
  export SUPABASE_DB_PASSWORD='xxxxxx'
  ```
  (à ajouter dans `~/.zshrc` pour persistance, ou utiliser un gestionnaire de secrets type `direnv` / `1password CLI`).

### Lancement manuel
```bash
cd ~/scraping-dom-ezdrive
./scripts/backup-supabase.sh
```

### Ce que fait le script
1. Génère deux dumps dans `~/volia-backups/` :
   - `volia-YYYY-MM-DD_HH-MM-SS.sql.dump` — custom format binaire (pour `pg_restore`)
   - `volia-YYYY-MM-DD_HH-MM-SS.sql.gz` — SQL plain gzippé (inspection facile)
2. Exclut les schémas système Supabase (`cron`, `net`, `vault`) qui ne sont pas restaurables sur un autre projet.
3. Conserve les **30 derniers** dumps (`.sql.gz`) localement, supprime les plus anciens.
4. (Section commentée) Upload S3 / Backblaze pour off-site.

---

## 4. Setup cron local (option A — simple mais fragile)

Sur la machine d'Anthony :
```bash
crontab -e
```
Ajouter :
```cron
# Backup Volia DB tous les jours à 3h du matin
0 3 * * * /Users/anthonymalartre/Desktop/Claude\ AM/Anthony\ Malartre\ Privé/scraping-dom-ezdrive/scripts/backup-supabase.sh >> ~/volia-backups/backup.log 2>&1
```

⚠️ **Limites du cron local** : ne tourne que si la machine est allumée et déverrouillée. Pour une vraie résilience, préférer l'option B.

---

## 5. GitHub Actions backup workflow (option B — recommandé)

Fichier : `.github/workflows/backup-supabase.yml` (déjà créé dans ce repo, désactivé par défaut — voir `workflow_dispatch`).

### Activer
1. Ajouter les **GitHub Secrets** (Repo → Settings → Secrets and variables → Actions) :
   - `SUPABASE_DB_HOST` = `db.kqrarrrojdtxijkhejhg.supabase.co`
   - `SUPABASE_DB_PASSWORD` = mot de passe postgres
   - (Si upload S3) `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`
2. Décommenter la section `schedule:` dans le YAML pour activer le cron quotidien (3h UTC).
3. Tester manuellement via Actions → "Backup Supabase DB" → **Run workflow**.

### Stockage des dumps
- Par défaut : **artifact GitHub Actions** (rétention 90 j, gratuit jusqu'à 500 Mo).
- Option recommandée : upload S3 / Backblaze B2 (off-site, indépendant de GitHub).

### Options de stockage off-site
| Provider | Coût ~30 Go/mois | Setup |
|---|---|---|
| AWS S3 (Standard) | ~0,75 $ | IAM user + bucket privé |
| AWS S3 Glacier | ~0,12 $ | Idem + lifecycle policy |
| Backblaze B2 | ~0,18 $ | Compte + bucket + clé app |
| Cloudflare R2 | gratuit (10 Go) | Idem S3 |

---

## 6. Procédure de restore

### A. Restore PITR Supabase (filet de sécurité court terme)
Voir section 1. Idéal pour rollback rapide (< 7 j).

### B. Restore depuis backup manuel (dump pg_dump)

Cas d'usage : sinistre majeur, corruption détectée tard, conformité (besoin d'un snapshot daté).

#### Étape 1 — Préparer la cible
Option 1 : créer un **nouveau projet Supabase** (recommandé pour ne pas écraser la prod).
Option 2 : utiliser le projet existant après truncate (dangereux — uniquement en test).

#### Étape 2 — Récupérer le dump
```bash
# Depuis S3
aws s3 cp s3://volia-backups/db/volia-2026-05-26.dump.gz .
gunzip volia-2026-05-26.dump.gz

# OU depuis backup local
cp ~/volia-backups/volia-2026-05-26_03-00-00.sql.dump ./
```

#### Étape 3 — Restaurer
```bash
export NEW_DB_HOST="db.<new-project-id>.supabase.co"
export NEW_DB_PASSWORD="<nouveau mdp>"

PGPASSWORD="$NEW_DB_PASSWORD" pg_restore \
  -h "$NEW_DB_HOST" \
  -p 5432 \
  -U postgres \
  -d postgres \
  --clean --if-exists \
  --no-owner --no-acl \
  -v \
  volia-2026-05-26.dump
```

#### Étape 4 — Vérifier l'intégrité
Se connecter via psql ou Supabase SQL editor :
```sql
SELECT COUNT(*) FROM user_profiles;
SELECT COUNT(*) FROM prospects;
SELECT COUNT(*) FROM search_sessions;
SELECT COUNT(*) FROM usage_tracking;
SELECT COUNT(*) FROM opt_out_list;
SELECT MAX(created_at) FROM prospects;  -- doit correspondre à la date du dump
```

Comparer avec un baseline (cf. section 7 ci-dessous).

#### Étape 5 — Basculer la prod (si restore définitif)
1. Vercel → env vars → mettre à jour `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` avec les valeurs du nouveau projet
2. Redeploy
3. Tester `/login`, `/dashboard`, une recherche, un export CSV
4. Reconfigurer Stripe webhooks si l'URL change (généralement non, car même domaine Vercel)
5. Archiver l'ancien projet Supabase (pas le supprimer avant 30 j de monitoring)

---

## 7. Test de restore documenté (drill trimestriel)

**Cadence cible : 1× par trimestre minimum.** Un backup non testé n'est pas un backup.

### Procédure de drill
1. **Créer un projet Supabase "staging"** (plan Free suffit) — à conserver dédié aux drills
2. **Récupérer le dump le plus récent** depuis GitHub Actions artifact ou S3
3. **Restaurer** sur le projet staging (cf. section 6 étape 3)
4. **Checklist de vérification** :
   - [ ] Tables `prospects`, `user_profiles`, `search_sessions`, `usage_tracking`, `opt_out_list` présentes
   - [ ] Row counts cohérents (à ±1% près du baseline)
   - [ ] Foreign keys OK : `SELECT COUNT(*) FROM prospects p LEFT JOIN search_sessions s ON p.search_session_id = s.id WHERE s.id IS NULL;` → doit être 0
   - [ ] Index présents : `\d prospects` → vérifier `prospects_place_id_key` (UNIQUE)
   - [ ] RLS policies actives : Supabase Dashboard → Authentication → Policies
   - [ ] Un échantillon de prospects affiche email, téléphone, departement non corrompus
5. **Mesurer la durée totale** (export → restore → vérif) → doit rester < RTO (4 h)
6. **Logger le résultat** dans un tableur ou Notion :
   - Date du drill
   - Date du dump testé
   - Durée totale
   - Anomalies détectées
   - Action items

### Template log (à copier dans Notion)
```
| Date drill   | Dump date    | Durée  | OK ? | Notes                          |
|--------------|--------------|--------|------|--------------------------------|
| 2026-06-01   | 2026-05-31   | 22 min | ✅   | Premier drill — tout OK        |
```

---

## 8. Variables d'environnement nécessaires (récap)

### Localement (script manuel)
| Variable | Où la trouver |
|---|---|
| `SUPABASE_DB_PASSWORD` | Supabase Dashboard → Settings → Database → Reset password |

### GitHub Actions (workflow)
| Secret | Valeur |
|---|---|
| `SUPABASE_DB_HOST` | `db.kqrarrrojdtxijkhejhg.supabase.co` |
| `SUPABASE_DB_PASSWORD` | idem ci-dessus |
| `AWS_ACCESS_KEY_ID` (opt) | IAM user dédié, droits S3 PutObject sur bucket |
| `AWS_SECRET_ACCESS_KEY` (opt) | idem |
| `AWS_S3_BUCKET` (opt) | ex. `volia-backups` |

---

## 9. Roadmap d'activation (30 min pour Anthony)

État actuel : **rien n'est lancé automatiquement**. Tous les artefacts (script + workflow) sont prêts mais désactivés.

Pour activer la stratégie minimale viable :
1. [ ] Vérifier que Supabase est sur plan Pro (filet PITR 7 j actif)
2. [ ] Récupérer le mot de passe DB Supabase, le stocker dans 1Password
3. [ ] Ajouter les 2 GitHub Secrets (`SUPABASE_DB_HOST`, `SUPABASE_DB_PASSWORD`)
4. [ ] Décommenter le bloc `schedule:` dans `.github/workflows/backup-supabase.yml`
5. [ ] Lancer un run manuel pour valider (`workflow_dispatch`)
6. [ ] Télécharger l'artifact et inspecter le `.dump` localement
7. [ ] Planifier un drill de restore dans 90 j (rappel calendrier)

Pour la version premium (off-site) :
8. [ ] Créer un bucket S3 / B2 / R2 privé
9. [ ] Ajouter les 3 GitHub Secrets AWS
10. [ ] Décommenter la section upload S3 dans le workflow

---

## 10. Contacts et docs externes
- Supabase backups : https://supabase.com/docs/guides/platform/backups
- Supabase PITR : https://supabase.com/docs/guides/platform/backups#point-in-time-recovery
- pg_dump docs : https://www.postgresql.org/docs/current/app-pgdump.html
- pg_restore docs : https://www.postgresql.org/docs/current/app-pgrestore.html
