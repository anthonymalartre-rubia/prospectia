#!/bin/bash
# ----------------------------------------------------------------------------
# Backup manuel de la base Supabase Volia
# Projet : kqrarrrojdtxijkhejhg
#
# Usage :
#   export SUPABASE_DB_PASSWORD='xxxxx'
#   ./scripts/backup-supabase.sh
#
# Produit dans ~/volia-backups/ :
#   - volia-YYYY-MM-DD_HH-MM-SS.sql.dump   (custom format pour pg_restore)
#   - volia-YYYY-MM-DD_HH-MM-SS.sql.gz     (SQL plain gzippé)
#
# Conserve les 30 derniers backups, supprime les plus anciens.
# Voir docs/BACKUP.md pour la procédure complète.
# ----------------------------------------------------------------------------

set -euo pipefail

# --- Config ---
PROJECT_ID="kqrarrrojdtxijkhejhg"
DB_HOST="db.${PROJECT_ID}.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"
DB_PASSWORD_VAR="SUPABASE_DB_PASSWORD"
RETENTION_COUNT=30

# --- Vérifs ---
if [ -z "${!DB_PASSWORD_VAR:-}" ]; then
  echo "Erreur : variable d'env $DB_PASSWORD_VAR non definie."
  echo "         export $DB_PASSWORD_VAR='votre_mdp_postgres' avant de relancer."
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "Erreur : pg_dump introuvable."
  echo "         macOS : brew install postgresql@16"
  echo "         Linux : apt-get install postgresql-client"
  exit 1
fi

# --- Setup ---
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="${HOME}/volia-backups"
BACKUP_FILE="${BACKUP_DIR}/volia-${DATE}.sql"

mkdir -p "$BACKUP_DIR"

echo "Backup Volia DB en cours..."
echo "  Host    : $DB_HOST"
echo "  Dossier : $BACKUP_DIR"
echo ""

# --- Dump custom format (pour pg_restore) ---
echo "1/3 Dump custom format..."
PGPASSWORD="${!DB_PASSWORD_VAR}" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-owner --no-acl --clean \
  --exclude-schema=cron --exclude-schema=net --exclude-schema=vault \
  -F c \
  -f "${BACKUP_FILE}.dump"

# --- Dump SQL plain (pour inspection humaine) ---
echo "2/3 Dump SQL plain..."
PGPASSWORD="${!DB_PASSWORD_VAR}" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-owner --no-acl \
  --exclude-schema=cron --exclude-schema=net --exclude-schema=vault \
  -f "$BACKUP_FILE"

SIZE_DUMP=$(du -h "${BACKUP_FILE}.dump" | cut -f1)
SIZE_SQL=$(du -h "$BACKUP_FILE" | cut -f1)

# --- Compression du SQL plain ---
echo "3/3 Compression gzip..."
gzip -9 "$BACKUP_FILE"
SIZE_GZ=$(du -h "${BACKUP_FILE}.gz" | cut -f1)

echo ""
echo "Backup OK :"
echo "  Custom format : ${BACKUP_FILE}.dump  (${SIZE_DUMP})"
echo "  SQL gzippe    : ${BACKUP_FILE}.gz     (${SIZE_GZ}, decompresse: ${SIZE_SQL})"

# --- Upload off-site (optionnel) ---
# Decommenter et configurer si vous voulez pousser sur S3 / Backblaze B2 / Cloudflare R2.
#
# if command -v aws >/dev/null 2>&1 && [ -n "${AWS_S3_BUCKET:-}" ]; then
#   echo ""
#   echo "Upload S3 vers s3://${AWS_S3_BUCKET}/db/..."
#   aws s3 cp "${BACKUP_FILE}.dump" "s3://${AWS_S3_BUCKET}/db/$(basename "${BACKUP_FILE}.dump")" --storage-class STANDARD_IA
#   aws s3 cp "${BACKUP_FILE}.gz"   "s3://${AWS_S3_BUCKET}/db/$(basename "${BACKUP_FILE}.gz")"   --storage-class STANDARD_IA
#   echo "Upload S3 OK"
# fi

# --- Retention : garder les N derniers .sql.gz et .dump ---
echo ""
echo "Nettoyage : conservation des $RETENTION_COUNT derniers backups..."
ls -t "${BACKUP_DIR}"/*.sql.gz 2>/dev/null | tail -n +$((RETENTION_COUNT + 1)) | xargs -r rm -f
ls -t "${BACKUP_DIR}"/*.sql.dump 2>/dev/null | tail -n +$((RETENTION_COUNT + 1)) | xargs -r rm -f

REMAINING=$(ls -1 "${BACKUP_DIR}"/*.sql.gz 2>/dev/null | wc -l | tr -d ' ')
echo "Backups conserves localement : ${REMAINING}"
echo ""
echo "Termine. Dossier : ${BACKUP_DIR}"
