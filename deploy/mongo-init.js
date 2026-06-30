// ══════════════════════════════════════════════════════════════════════════════
// KidrooToys — MongoDB Initialization Script
// ══════════════════════════════════════════════════════════════════════════════
//
// Run this ONCE after installing MongoDB:
//   sudo mongosh < deploy/mongo-init.js
//
// This script:
//   1. Creates an admin user for MongoDB
//   2. Creates the 'kidroo' database
//   3. Creates an app-specific user with readWrite access
//
// IMPORTANT: Change the passwords below before running!
//
// ══════════════════════════════════════════════════════════════════════════════

// ── 1. Switch to admin database and create root user ───────────────────────
db = db.getSiblingDB('admin');

db.createUser({
  user: 'kidroo_admin',
  pwd: 'CHANGE_THIS_ADMIN_PASSWORD',    // ← CHANGE THIS! (20+ chars, random)
  roles: [
    { role: 'userAdminAnyDatabase', db: 'admin' },
    { role: 'readWriteAnyDatabase', db: 'admin' },
    { role: 'dbAdminAnyDatabase', db: 'admin' }
  ]
});

print('✅ Admin user "kidroo_admin" created');

// ── 2. Switch to kidroo database and create app user ───────────────────────
db = db.getSiblingDB('kidroo');

db.createUser({
  user: 'kidroo_app',
  pwd: 'CHANGE_THIS_APP_PASSWORD',      // ← CHANGE THIS! (different from admin!)
  roles: [
    { role: 'readWrite', db: 'kidroo' }
  ]
});

print('✅ App user "kidroo_app" created with readWrite access to "kidroo" database');
print('');
print('📝 Next steps:');
print('   1. Enable MongoDB authentication:');
print('      sudo nano /etc/mongod.conf');
print('      Add under "security:":');
print('        authorization: enabled');
print('   2. Restart MongoDB:');
print('      sudo systemctl restart mongod');
print('   3. Update your .env file with the connection string:');
print('      DB_URL=mongodb://kidroo_app:YOUR_APP_PASSWORD@localhost:27017/kidroo');
print('');
