#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
# KidrooToys — MongoDB Backup Script
# ══════════════════════════════════════════════════════════════════════════════
#
# Creates a compressed backup of the kidroo database.
# Keeps the last 7 days of backups.
#
# Setup daily backup (run once):
#   chmod +x deploy/backup-mongodb.sh
#   crontab -e
#   # Add this line (runs daily at 3 AM):
#   0 3 * * * /opt/kidrootoys/deploy/backup-mongodb.sh >> /var/log/kidroo-backup.log 2>&1
#
# ══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

BACKUP_DIR="/opt/kidrootoys/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/kidroo_$TIMESTAMP.gz"

mkdir -p "$BACKUP_DIR"

echo "[$TIMESTAMP] Starting MongoDB backup..."

# Dump the kidroo database (update credentials as needed)
mongodump \
    --uri="mongodb://kidroo_app:YOUR_APP_PASSWORD@localhost:27017/kidroo" \
    --archive \
    --gzip > "$BACKUP_FILE"

echo "[$TIMESTAMP] ✅ Backup saved: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# Keep only last 7 days of backups
DELETED=$(find "$BACKUP_DIR" -name "kidroo_*.gz" -mtime +7 -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
    echo "[$TIMESTAMP] 🧹 Deleted $DELETED old backup(s)"
fi

echo "[$TIMESTAMP] Done."
