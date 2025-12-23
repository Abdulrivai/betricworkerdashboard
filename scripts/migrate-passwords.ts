import { createClient } from '@supabase/supabase-js';
import { hashPassword } from '../lib/password';
import * as readline from 'readline';
import * as fs from 'fs';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ensure environment variables are loaded
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

interface User {
  id: string;
  email: string;
  password: string;
  full_name: string;
}

interface MigrationBackup {
  id: string;
  old_password: string;
}

async function confirmAction(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function migratePasswords() {
  console.log('🔐 Password Migration Script');
  console.log('============================\n');

  // Step 1: Fetch all users
  console.log('📊 Fetching all users...');
  const { data: users, error: fetchError } = await supabase
    .from('users')
    .select('id, email, password, full_name');

  if (fetchError || !users) {
    console.error('❌ Failed to fetch users:', fetchError);
    rl.close();
    process.exit(1);
  }

  console.log(`✅ Found ${users.length} users\n`);

  // Step 2: Identify which passwords need hashing
  const usersToMigrate: User[] = [];
  const alreadyHashed: User[] = [];

  for (const user of users) {
    // bcrypt hashes start with $2a$, $2b$, or $2y$
    if (user.password?.startsWith('$2')) {
      alreadyHashed.push(user as User);
    } else {
      usersToMigrate.push(user as User);
    }
  }

  console.log(`📋 Migration Status:`);
  console.log(`   - Already hashed: ${alreadyHashed.length}`);
  console.log(`   - Need migration: ${usersToMigrate.length}\n`);

  if (usersToMigrate.length === 0) {
    console.log('✅ All passwords are already hashed. No migration needed.');
    rl.close();
    process.exit(0);
  }

  // Step 3: Show preview
  console.log('👥 Users to migrate:');
  usersToMigrate.forEach(u => {
    console.log(`   - ${u.email} (${u.full_name})`);
  });
  console.log('');

  // Step 4: Confirm
  const confirmed = await confirmAction(
    `⚠️  This will hash ${usersToMigrate.length} passwords. Continue? (y/n): `
  );

  if (!confirmed) {
    console.log('❌ Migration cancelled.');
    rl.close();
    process.exit(0);
  }

  // Step 5: Create backup
  console.log('\n💾 Creating backup...');
  const backup: MigrationBackup[] = usersToMigrate.map(u => ({
    id: u.id,
    old_password: u.password
  }));

  const backupFile = `./password-backup-${Date.now()}.json`;
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
  console.log(`✅ Backup saved to: ${backupFile}\n`);

  // Step 6: Migrate
  console.log('🔄 Starting migration...\n');
  let successCount = 0;
  let failCount = 0;

  for (const user of usersToMigrate) {
    try {
      process.stdout.write(`   Hashing password for: ${user.email}...`);
      const hashedPassword = await hashPassword(user.password);

      const { error: updateError } = await supabase
        .from('users')
        .update({ password: hashedPassword })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      successCount++;
      console.log(` ✅`);
    } catch (error) {
      failCount++;
      console.log(` ❌`);
      console.error(`      Error:`, error);
    }
  }

  // Step 7: Summary
  console.log('\n============================');
  console.log('📊 Migration Summary:');
  console.log(`   - Success: ${successCount}`);
  console.log(`   - Failed: ${failCount}`);
  console.log(`   - Backup: ${backupFile}`);

  if (failCount > 0) {
    console.log('\n⚠️  Some migrations failed. Check errors above.');
    console.log('💡 You can restore using the backup file if needed.');
  } else {
    console.log('\n✅ All passwords migrated successfully!');
    console.log('🔒 Your system is now secure with hashed passwords.');
  }

  rl.close();
}

// Run migration
migratePasswords().catch(error => {
  console.error('💥 Migration failed:', error);
  rl.close();
  process.exit(1);
});
