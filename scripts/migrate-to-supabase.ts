#!/usr/bin/env tsx
/**
 * Supabase Migration Script
 * Migrates existing data from Drizzle ORM to Supabase
 * This should be run after setting up the Supabase schema
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { supabaseAdmin, migrateUser } from '../server/utils/supabase-admin';
import { users as drizzleUsers, contactSubmissions as drizzleContactSubmissions, newsletterSubscriptions as drizzleNewsletterSubscriptions } from '../shared/schema';

interface MigrationStats {
  users: { success: number; skipped: number; failed: number };
  contacts: { success: number; skipped: number; failed: number };
  newsletters: { success: number; skipped: number; failed: number };
}

async function runMigration() {
  console.log('🔄 Starting Supabase Migration Process...\n');

  const stats: MigrationStats = {
    users: { success: 0, skipped: 0, failed: 0 },
    contacts: { success: 0, skipped: 0, failed: 0 },
    newsletters: { success: 0, skipped: 0, failed: 0 }
  };

  // Check if we have the legacy DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('ℹ️  No legacy DATABASE_URL found. Skipping migration.\n');
    return;
  }

  try {
    // Connect to legacy database
    console.log('1. Connecting to legacy database...');
    const client = postgres(databaseUrl);
    const db = drizzle(client);
    console.log('   ✅ Connected to legacy database\n');

    // Migrate Users
    console.log('2. Migrating users...');
    try {
      const existingUsers = await db.select().from(drizzleUsers);
      console.log(`   📊 Found ${existingUsers.length} users to migrate`);

      for (const user of existingUsers) {
        try {
          const { user: migratedUser, error, skipped } = await migrateUser({
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt.toISOString(),
          });

          if (error) {
            console.log(`   ❌ Failed to migrate user ${user.email}: ${error.message}`);
            stats.users.failed++;
          } else if (skipped) {
            console.log(`   ⏭️  Skipped user ${user.email} (already exists)`);
            stats.users.skipped++;
          } else {
            console.log(`   ✅ Migrated user ${user.email}`);
            stats.users.success++;
          }
        } catch (userError) {
          console.log(`   ❌ Error migrating user ${user.email}: ${userError}`);
          stats.users.failed++;
        }
      }
    } catch (usersError) {
      console.log(`   ⚠️  Could not retrieve users from legacy database: ${usersError}`);
    }

    console.log(`   📈 Users migration complete: ${stats.users.success} migrated, ${stats.users.skipped} skipped, ${stats.users.failed} failed\n`);

    // Migrate Contact Submissions
    console.log('3. Migrating contact submissions...');
    try {
      const existingContacts = await db.select().from(drizzleContactSubmissions);
      console.log(`   📊 Found ${existingContacts.length} contact submissions to migrate`);

      for (const contact of existingContacts) {
        try {
          const { error } = await supabaseAdmin
            .from('contact_submissions')
            .insert({
              id: contact.id,
              first_name: contact.firstName,
              last_name: contact.lastName,
              email: contact.email,
              company: contact.company,
              phone: contact.phone || undefined,
              company_size: contact.companySize || undefined,
              message: contact.message,
              privacy_consent: contact.privacyConsent === 'true',
              submitted_at: contact.submittedAt.toISOString(),
              created_at: contact.submittedAt.toISOString(),
            });

          if (error && error.code !== '23505') { // Ignore duplicate key errors
            console.log(`   ❌ Failed to migrate contact ${contact.email}: ${error.message}`);
            stats.contacts.failed++;
          } else if (error && error.code === '23505') {
            console.log(`   ⏭️  Skipped contact ${contact.email} (already exists)`);
            stats.contacts.skipped++;
          } else {
            console.log(`   ✅ Migrated contact ${contact.email}`);
            stats.contacts.success++;
          }
        } catch (contactError) {
          console.log(`   ❌ Error migrating contact ${contact.email}: ${contactError}`);
          stats.contacts.failed++;
        }
      }
    } catch (contactsError) {
      console.log(`   ⚠️  Could not retrieve contacts from legacy database: ${contactsError}`);
    }

    console.log(`   📈 Contacts migration complete: ${stats.contacts.success} migrated, ${stats.contacts.skipped} skipped, ${stats.contacts.failed} failed\n`);

    // Migrate Newsletter Subscriptions
    console.log('4. Migrating newsletter subscriptions...');
    try {
      const existingNewsletters = await db.select().from(drizzleNewsletterSubscriptions);
      console.log(`   📊 Found ${existingNewsletters.length} newsletter subscriptions to migrate`);

      for (const newsletter of existingNewsletters) {
        try {
          const { error } = await supabaseAdmin
            .from('newsletter_subscriptions')
            .insert({
              id: newsletter.id,
              email: newsletter.email,
              status: 'active',
              subscribed_at: newsletter.subscribedAt.toISOString(),
              created_at: newsletter.subscribedAt.toISOString(),
            });

          if (error && error.code !== '23505') { // Ignore duplicate key errors
            console.log(`   ❌ Failed to migrate newsletter ${newsletter.email}: ${error.message}`);
            stats.newsletters.failed++;
          } else if (error && error.code === '23505') {
            console.log(`   ⏭️  Skipped newsletter ${newsletter.email} (already exists)`);
            stats.newsletters.skipped++;
          } else {
            console.log(`   ✅ Migrated newsletter ${newsletter.email}`);
            stats.newsletters.success++;
          }
        } catch (newsletterError) {
          console.log(`   ❌ Error migrating newsletter ${newsletter.email}: ${newsletterError}`);
          stats.newsletters.failed++;
        }
      }
    } catch (newslettersError) {
      console.log(`   ⚠️  Could not retrieve newsletters from legacy database: ${newslettersError}`);
    }

    console.log(`   📈 Newsletters migration complete: ${stats.newsletters.success} migrated, ${stats.newsletters.skipped} skipped, ${stats.newsletters.failed} failed\n`);

    // Close legacy database connection
    await client.end();

    // Print final summary
    console.log('=' .repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('=' .repeat(60));
    console.log(`Users:           ${stats.users.success} ✅ | ${stats.users.skipped} ⏭️  | ${stats.users.failed} ❌`);
    console.log(`Contacts:        ${stats.contacts.success} ✅ | ${stats.contacts.skipped} ⏭️  | ${stats.contacts.failed} ❌`);
    console.log(`Newsletters:     ${stats.newsletters.success} ✅ | ${stats.newsletters.skipped} ⏭️  | ${stats.newsletters.failed} ❌`);
    console.log('=' .repeat(60));

    const totalSuccess = stats.users.success + stats.contacts.success + stats.newsletters.success;
    const totalFailed = stats.users.failed + stats.contacts.failed + stats.newsletters.failed;

    if (totalFailed === 0) {
      console.log('🎉 Migration completed successfully with no failures!');
    } else if (totalSuccess > totalFailed) {
      console.log(`✅ Migration mostly successful. ${totalFailed} items failed but can be manually reviewed.`);
    } else {
      console.log(`⚠️  Migration completed with some issues. Please review failed items.`);
    }

    console.log('\n🎯 Next Steps:');
    console.log('1. Review any failed migrations manually');
    console.log('2. Update your authentication system to use Supabase');
    console.log('3. Test login functionality with migrated users');
    console.log('4. Consider removing the legacy DATABASE_URL once testing is complete');

  } catch (error) {
    console.error('\n💥 Migration failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Enhanced command line interface
async function main() {
  try {
    console.log('=' .repeat(60));
    console.log('🔄 STRIVE TECH - SUPABASE MIGRATION');
    console.log('=' .repeat(60));
    console.log('This script will migrate your existing data to Supabase.');
    console.log('Make sure you have:');
    console.log('1. ✅ Set up your Supabase project');
    console.log('2. ✅ Run the schema migration (001_supabase_schema.sql)');
    console.log('3. ✅ Configured your environment variables');
    console.log('4. ✅ Initialized your master admin account\n');

    // Check if user wants to proceed
    if (process.argv.includes('--confirm')) {
      await runMigration();
    } else {
      console.log('💡 To run this migration, use: npm run supabase:migrate -- --confirm');
      console.log('⚠️  Make sure to backup your data before proceeding!\n');
    }

  } catch (error) {
    console.error('Error in migration process:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
// Run the script when executed directly (ES module compatible check)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runMigration, type MigrationStats };