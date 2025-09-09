#!/usr/bin/env tsx
/**
 * Environment Variable Verification Script
 * Checks for all required environment variables for Phase 1 Supabase implementation
 */

// Load environment variables from .env file
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

interface EnvCheck {
  variable: string;
  required: boolean;
  description: string;
  present: boolean;
  value?: string;
}

function checkEnvironmentVariables(): void {
  console.log('🔍 Environment Variable Check for Phase 1 Implementation\n');
  
  const requiredVars: EnvCheck[] = [
    {
      variable: 'SUPABASE_URL',
      required: true,
      description: 'Supabase project URL',
      present: !!process.env.SUPABASE_URL,
      value: process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.substring(0, 30)}...` : undefined
    },
    {
      variable: 'SUPABASE_ANON_KEY',
      required: true,
      description: 'Supabase anonymous key for client operations',
      present: !!process.env.SUPABASE_ANON_KEY,
      value: process.env.SUPABASE_ANON_KEY ? `${process.env.SUPABASE_ANON_KEY.substring(0, 20)}...` : undefined
    },
    {
      variable: 'SUPABASE_SERVICE_ROLE_KEY',
      required: true,
      description: 'Supabase service role key for admin operations',
      present: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      value: process.env.SUPABASE_SERVICE_ROLE_KEY ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...` : undefined
    },
    {
      variable: 'MASTER_ADMIN_EMAIL',
      required: true,
      description: 'Master admin email address',
      present: !!process.env.MASTER_ADMIN_EMAIL,
      value: process.env.MASTER_ADMIN_EMAIL
    },
    {
      variable: 'MASTER_ADMIN_PASSWORD',
      required: true,
      description: 'Master admin password',
      present: !!process.env.MASTER_ADMIN_PASSWORD,
      value: process.env.MASTER_ADMIN_PASSWORD ? '[HIDDEN - Length: ' + process.env.MASTER_ADMIN_PASSWORD.length + ']' : undefined
    },
    {
      variable: 'DATABASE_URL',
      required: false,
      description: 'Legacy PostgreSQL connection (will be replaced by Supabase)',
      present: !!process.env.DATABASE_URL,
      value: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 30)}...` : undefined
    }
  ];

  let allRequiredPresent = true;
  let criticalMissing: string[] = [];

  requiredVars.forEach(envVar => {
    const status = envVar.present ? '✅' : '❌';
    const required = envVar.required ? '[REQUIRED]' : '[OPTIONAL]';
    
    console.log(`${status} ${envVar.variable} ${required}`);
    console.log(`   ${envVar.description}`);
    
    if (envVar.present && envVar.value) {
      console.log(`   Value: ${envVar.value}`);
    } else if (!envVar.present && envVar.required) {
      console.log(`   ⚠️  MISSING - This variable must be set`);
      allRequiredPresent = false;
      criticalMissing.push(envVar.variable);
    } else if (!envVar.present) {
      console.log(`   ℹ️  Not set (optional)`);
    }
    
    console.log('');
  });

  // Summary
  console.log('📋 SUMMARY');
  console.log('=' .repeat(50));
  
  if (allRequiredPresent) {
    console.log('✅ All required environment variables are present!');
    console.log('🚀 Ready to proceed with Phase 1 implementation');
  } else {
    console.log('❌ Missing required environment variables:');
    criticalMissing.forEach(variable => {
      console.log(`   - ${variable}`);
    });
    console.log('');
    console.log('📝 Action Required:');
    console.log('1. Add missing variables to your .env file');
    console.log('2. Re-run this script to verify');
    console.log('3. Restart your development server');
  }

  // Additional guidance
  console.log('');
  console.log('💡 Environment Setup Guide:');
  console.log('');
  console.log('Add to your .env file:');
  console.log('SUPABASE_URL=your_supabase_project_url');
  console.log('SUPABASE_ANON_KEY=your_supabase_anon_key');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key');
  console.log('MASTER_ADMIN_EMAIL=admin@yourcompany.com');
  console.log('MASTER_ADMIN_PASSWORD=your_secure_master_password');
  console.log('');
  console.log('🔗 Get your Supabase keys from: https://app.supabase.com/project/[your-project]/settings/api');
}

// Run the check
try {
  checkEnvironmentVariables();
} catch (error) {
  console.error('❌ Error checking environment variables:', error);
  process.exit(1);
}