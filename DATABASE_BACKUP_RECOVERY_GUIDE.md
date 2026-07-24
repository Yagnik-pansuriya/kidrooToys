# 🛡️ Kidroo Toys — Automated Database Backup & Disaster Recovery Guide

This guide provides step-by-step instructions for:
1. **Daily Midnight (12:00 AM) Automated Backups** on your Hostinger VPS.
2. **Instant Manual Backups** whenever you make major database changes.
3. **Step-by-Step Full Disaster Recovery** to restore all database collections if data loss or corruption occurs.

---

## 📅 Part 1: Setting Up Daily 12:00 AM Automated Backup Cron Job

To make your VPS automatically dump and save a full database backup every night at **12:00 AM (Midnight)**:

### Step 1: Open Server Crontab
Log into your Hostinger VPS via SSH and open root crontab:

```bash
crontab -e
```

### Step 2: Add Midnight 12:00 AM Cron Job Entry
Paste the following line at the end of the file:

```cron
0 0 * * * cd /var/www/kidrooToys/kidrooBackend && /usr/bin/npm run db:backup >> /var/log/kidroo_backup.log 2>&1
```

* **`0 0 * * *`**: Runs precisely at 12:00 AM midnight every single day.
* **`>> /var/log/kidroo_backup.log`**: Logs the output so you can inspect backup logs anytime (`cat /var/log/kidroo_backup.log`).

---

## 📦 Part 2: Instant Manual Backup Command

If you are about to perform a server migration, admin operation, or code deployment, you can trigger a backup instantly from your terminal:

```bash
cd /var/www/kidrooToys/kidrooBackend
npm run db:backup
```

### Where are backups saved?
All backups are saved under:
```text
/var/www/kidrooToys/backups/backup_YYYY-MM-DD_HH-mm-ss/
```

Inside each backup folder, you will find:
* `metadata.json` — Summary of backed up collections & document counts.
* `users.json`, `products.json`, `categories.json`, `orders.json`, `coupons.json`, `customers.json`, `offers.json`, `reviews.json`, `sitesettings.json`, `smscampaigns.json`, `inventorytransactions.json`, `variants.json` — Complete JSON exports of every collection.

*Note: The system automatically retains the last 14 days of backups and cleans up older folders automatically to conserve disk space.*

---

## 🔄 Part 3: Step-by-Step Disaster Recovery (Restoration)

If something breaks, or data gets corrupted, follow these steps to recover your database state.

### Option A: Restore Latest Backup Automatically (Easiest)

Run this single command to wipe broken/corrupted data and restore from the **most recent 12:00 AM backup**:

```bash
cd /var/www/kidrooToys/kidrooBackend
npm run db:restore
```

---

### Option B: Restore From a Specific Date Backup

1. List available backup folders:
   ```bash
   ls -l /var/www/kidrooToys/backups/
   ```
   *Example Output:*
   ```text
   backup_2026-07-24_00-00-00
   backup_2026-07-23_00-00-00
   backup_2026-07-22_00-00-00
   ```

2. Specify the exact folder name to restore:
   ```bash
   cd /var/www/kidrooToys/kidrooBackend
   npm run db:restore backup_2026-07-24_00-00-00
   ```

---

## 🚨 Part 4: Native Mongodump / Mongorestore Commands (Alternative)

If you prefer using native MongoDB tools on your server:

### Instant Native Backup:
```bash
mongodump --uri="mongodb://localhost:27017/kidroo" --out=/var/www/kidrooToys/backups/mongodump_$(date +%F)
```

### Instant Native Restore:
```bash
mongorestore --uri="mongodb://localhost:27017/kidroo" --drop /var/www/kidrooToys/backups/mongodump_2026-07-24/kidroo
```

---

## 📊 Summary of Commands Reference

| Action | Command |
| :--- | :--- |
| **Run Daily Backup** | `npm run db:backup` |
| **Restore Latest Backup** | `npm run db:restore` |
| **Restore Specific Date** | `npm run db:restore <backup_folder_name>` |
| **Check Backup Logs** | `cat /var/log/kidroo_backup.log` |
| **List Saved Backups** | `ls -la /var/www/kidrooToys/backups/` |
