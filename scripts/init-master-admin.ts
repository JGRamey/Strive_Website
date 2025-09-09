#!/usr/bin/env tsx
/**
 * Master Admin Initialization Script
 * Creates the initial master admin account from environment variables
 * This should be run once after setting up the Supabase database
 */

import { createUser, masterAdminExists, testDatabaseConnection, logActivity } from '../server/utils/supabase-admin';
import { supabaseAdmin } from '../server/utils/supabase-admin';

interface InitResult {
  success: boolean;
  message: string;
  user?: any;
  error?: any;
}

async function initializeMasterAdmin(): Promise<InitResult> {
  console.log('🚀 Initializing Master Admin Account...\n');

  // Step 1: Check environment variables
  console.log('1. Checking environment variables...');
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'MASTER_ADMIN_EMAIL',
    'MASTER_ADMIN_PASSWORD'
  ];

  const missingVars: string[] = [];
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    return {
      success: false,
      message: `❌ Missing required environment variables: ${missingVars.join(', ')}`
    };
  }

  const email = process.env.MASTER_ADMIN_EMAIL!;
  const password = process.env.MASTER_ADMIN_PASSWORD!;

  console.log(`   ✅ Environment variables found`);
  console.log(`   📧 Master Admin Email: ${email}`);
  console.log(`   🔐 Password: ${'*'.repeat(password.length)}\n`);

  // Step 2: Test database connection
  console.log('2. Testing database connection...');
  const { connected, error: connectionError } = await testDatabaseConnection();

  if (!connected) {
    return {
      success: false,
      message: `❌ Database connection failed: ${connectionError?.message || 'Unknown error'}`,
      error: connectionError
    };
  }

  console.log('   ✅ Database connection successful\n');

  // Step 3: Check if master admin already exists
  console.log('3. Checking for existing master admin...');
  const { exists, error: existsError } = await masterAdminExists();

  if (existsError) {
    return {
      success: false,
      message: `❌ Error checking for existing master admin: ${existsError.message}`,
      error: existsError
    };
  }

  if (exists) {
    console.log('   ⚠️  Master admin already exists. Skipping creation.\n');
    
    // Check if it's the same email as in env vars
    const { user: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('role', 'master_admin')
      .single();

    if (existingUser?.email === email) {
      return {
        success: true,
        message: '✅ Master admin already exists with the configured email address',
        user: existingUser
      };
    } else {
      return {
        success: false,
        message: `⚠️  Master admin exists but with different email (${existingUser?.email}). Please check your configuration.`
      };
    }
  }

  console.log('   ✅ No existing master admin found. Proceeding with creation.\n');

  // Step 4: Create master admin account
  console.log('4. Creating master admin account...');
  
  // Generate username from email
  const username = email.split('@')[0] + '_admin';
  
  // Extract first and last name (fallback to email parts)
  const emailParts = email.split('@')[0].split('.');
  const firstName = emailParts[0]?.charAt(0).toUpperCase() + emailParts[0]?.slice(1) || 'Master';
  const lastName = emailParts[1]?.charAt(0).toUpperCase() + emailParts[1]?.slice(1) || 'Admin';

  const { user, error: createError } = await createUser({
    email,
    password,
    username,
    first_name: firstName,
    last_name: lastName,
    role: 'master_admin',
  });

  if (createError) {
    return {
      success: false,
      message: `❌ Failed to create master admin: ${createError.message}`,
      error: createError
    };
  }

  console.log('   ✅ Master admin account created successfully!');
  console.log(`   👤 User ID: ${user?.id}`);
  console.log(`   📧 Email: ${user?.email}`);
  console.log(`   👑 Role: ${user?.role}\n`);

  // Step 5: Log the initialization activity
  console.log('5. Logging initialization activity...');
  if (user?.id) {
    await logActivity(
      user.id,
      'master_admin_initialized',
      'users',
      user.id,
      {
        initialization_method: 'environment_variables',
        created_via: 'init_script'
      }
    );
    console.log('   ✅ Activity logged successfully\n');
  }

  // Step 6: Test master admin login (optional verification)
  console.log('6. Verifying master admin authentication...');
  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(user!.id);
    
    if (authError) {
      console.log(`   ⚠️  Auth verification warning: ${authError.message}`);
    } else {
      console.log('   ✅ Authentication verification successful\n');
    }
  } catch (error) {
    console.log('   ⚠️  Could not verify authentication (this may be normal)\n');
  }

  return {
    success: true,
    message: '🎉 Master admin initialization completed successfully!',
    user
  };
}

// Enhanced error handling and reporting
async function runInitialization() {
  try {
    console.log('=' .repeat(60));
    console.log('🏗️  STRIVE TECH - MASTER ADMIN INITIALIZATION');
    console.log('=' .repeat(60));
    console.log('This script will create your master admin account');
    console.log('using credentials from environment variables.\n');

    const result = await initializeMasterAdmin();

    console.log('=' .repeat(60));
    if (result.success) {
      console.log('✅ INITIALIZATION SUCCESSFUL');
      console.log('=' .repeat(60));
      console.log(result.message);
      
      if (result.user) {
        console.log('\n📋 Master Admin Details:');
        console.log(`   ID: ${result.user.id}`);
        console.log(`   Email: ${result.user.email}`);
        console.log(`   Username: ${result.user.username}`);
        console.log(`   Name: ${result.user.first_name} ${result.user.last_name}`);
        console.log(`   Role: ${result.user.role}`);
        console.log(`   Created: ${new Date(result.user.created_at).toLocaleString()}`);
      }

      console.log('\n🎯 Next Steps:');
      console.log('1. Start your development server: npm run dev');
      console.log('2. Navigate to /login in your application');
      console.log(`3. Login with: ${process.env.MASTER_ADMIN_EMAIL}`);
      console.log('4. Access the admin dashboard to manage your system');
      
      console.log('\n⚡ You can now proceed with Phase 1 implementation!');
    } else {
      console.log('❌ INITIALIZATION FAILED');
      console.log('=' .repeat(60));
      console.log(result.message);
      
      if (result.error) {
        console.log('\n🔍 Error Details:');
        console.log(JSON.stringify(result.error, null, 2));
      }

      console.log('\n🛠️  Troubleshooting:');
      console.log('1. Verify your .env file has all required variables');
      console.log('2. Check that your Supabase project is active');
      console.log('3. Ensure your service role key has admin privileges');
      console.log('4. Run `tsx scripts/check-env.ts` to validate environment');
      
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 UNEXPECTED ERROR DURING INITIALIZATION:');
    console.error('=' .repeat(60));
    console.error(error);
    console.error('\nPlease check your configuration and try again.');
    process.exit(1);
  }
}

// Run the initialization
if (require.main === module) {
  runInitialization();
}

export { initializeMasterAdmin, runInitialization };