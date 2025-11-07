#!/usr/bin/env node

/**
 * Authentication Setup Verification Script
 * Run this to verify your authentication configuration is correct
 */

const writeLine = (message = '') => {
  process.stdout.write(`${message}\n`);
};

void (async () => {
  const pathModule = await import('node:path');
  const fsModule = await import('node:fs');

  const { join } = pathModule;
  const { existsSync, readFileSync, readdirSync } = fsModule;

  const errors = [];
  const warnings = [];
  const success = [];

  writeLine('🔍 Verifying TypeMaster Authentication Setup...\n');

  // Check Backend Configuration
  writeLine('📦 Checking Backend Configuration...');
  const backendEnvPath = join(__dirname, '../apps/backend/.env');

  if (!existsSync(backendEnvPath)) {
    errors.push('Backend .env file not found. Copy .env.example to .env');
  } else {
    const backendEnv = readFileSync(backendEnvPath, 'utf8');

    if (!backendEnv.includes('DATABASE_URL=')) {
      errors.push('DATABASE_URL not set in backend .env');
    } else {
      success.push('✅ Backend DATABASE_URL configured');
    }

    if (!backendEnv.includes('JWT_SECRET=') || backendEnv.includes('your-super-secret')) {
      errors.push('JWT_SECRET not properly set in backend .env (still using default)');
    } else {
      success.push('✅ JWT_SECRET configured');
    }

    if (!backendEnv.includes('JWT_REFRESH_SECRET=') || backendEnv.includes('your-super-secret')) {
      errors.push('JWT_REFRESH_SECRET not properly set in backend .env (still using default)');
    } else {
      success.push('✅ JWT_REFRESH_SECRET configured');
    }
  }

  // Check Frontend Configuration
  writeLine('\n🎨 Checking Frontend Configuration...');
  const frontendEnvPath = join(__dirname, '../apps/frontend/.env.local');

  if (!existsSync(frontendEnvPath)) {
    errors.push('Frontend .env.local file not found. Copy .env.example to .env.local');
  } else {
    const frontendEnv = readFileSync(frontendEnvPath, 'utf8');

    if (!frontendEnv.includes('DATABASE_URL=')) {
      errors.push('DATABASE_URL not set in frontend .env.local');
    } else {
      success.push('✅ Frontend DATABASE_URL configured');
    }

    if (
      !frontendEnv.includes('NEXTAUTH_SECRET=') ||
      frontendEnv.includes('replace-with-generated')
    ) {
      errors.push('NEXTAUTH_SECRET not properly set in frontend .env.local (still using default)');
    } else {
      success.push('✅ NEXTAUTH_SECRET configured');
    }

    if (!frontendEnv.includes('GOOGLE_CLIENT_ID=') || frontendEnv.includes('replace-with-google')) {
      warnings.push('⚠️  GOOGLE_CLIENT_ID not set (Google OAuth will not work)');
    } else {
      success.push('✅ GOOGLE_CLIENT_ID configured');
    }

    if (
      !frontendEnv.includes('GOOGLE_CLIENT_SECRET=') ||
      frontendEnv.includes('replace-with-google')
    ) {
      warnings.push('⚠️  GOOGLE_CLIENT_SECRET not set (Google OAuth will not work)');
    } else {
      success.push('✅ GOOGLE_CLIENT_SECRET configured');
    }

    if (!frontendEnv.includes('NEXT_PUBLIC_API_URL=')) {
      warnings.push('⚠️  NEXT_PUBLIC_API_URL not set (will default to http://localhost:5000)');
    } else {
      success.push('✅ NEXT_PUBLIC_API_URL configured');
    }
  }

  // Check Database URLs Match
  if (existsSync(backendEnvPath) && existsSync(frontendEnvPath)) {
    const backendEnv = readFileSync(backendEnvPath, 'utf8');
    const frontendEnv = readFileSync(frontendEnvPath, 'utf8');

    const backendDbMatch = backendEnv.match(/DATABASE_URL="?([^"\n]+)"?/);
    const frontendDbMatch = frontendEnv.match(/DATABASE_URL="?([^"\n]+)"?/);

    if (backendDbMatch && frontendDbMatch) {
      // Remove quotes and whitespace for comparison
      const backendDb = backendDbMatch[1].replace(/["'\s]/g, '');
      const frontendDb = frontendDbMatch[1].replace(/["'\s]/g, '');

      if (backendDb !== frontendDb) {
        errors.push('❌ DATABASE_URL mismatch! Backend and Frontend must use the SAME database.');
        writeLine(`\n   Backend:   ${backendDb}`);
        writeLine(`   Frontend:  ${frontendDb}`);
      } else {
        success.push('✅ Backend and Frontend use the same database');
      }
    }
  }

  // Check Prisma Files
  writeLine('\n🗄️  Checking Database Schema...');
  const prismaSchemaPath = join(__dirname, '../apps/backend/prisma/schema.prisma');

  if (!existsSync(prismaSchemaPath)) {
    errors.push('Prisma schema not found at apps/backend/prisma/schema.prisma');
  } else {
    const schema = readFileSync(prismaSchemaPath, 'utf8');

    const requiredModels = [
      'User',
      'Account',
      'Session',
      'Lesson',
      'UserLessonProgress',
      'Achievement',
    ];
    const missingModels = requiredModels.filter((model) => !schema.includes(`model ${model}`));

    if (missingModels.length > 0) {
      errors.push(`Missing database models: ${missingModels.join(', ')}`);
    } else {
      success.push('✅ All required database models present');
    }
  }

  // Check for migrations
  const migrationsPath = join(__dirname, '../apps/backend/prisma/migrations');
  if (!existsSync(migrationsPath)) {
    warnings.push('⚠️  No migrations found. Run: cd apps/backend && npx prisma migrate dev');
  } else {
    const migrations = readdirSync(migrationsPath).filter((f) => f !== 'migration_lock.toml');
    if (migrations.length === 0) {
      warnings.push('⚠️  No migrations found. Run: cd apps/backend && npx prisma migrate dev');
    } else {
      success.push(`✅ Found ${migrations.length} database migration(s)`);
    }
  }

  // Print Results
  writeLine(`\n${'='.repeat(60)}`);
  writeLine('📊 VERIFICATION RESULTS');
  writeLine(`${'='.repeat(60)}\n`);

  if (success.length > 0) {
    writeLine('✅ SUCCESS:\n');
    success.forEach((msg) => writeLine(`  ${msg}`));
    writeLine();
  }

  if (warnings.length > 0) {
    writeLine('⚠️  WARNINGS:\n');
    warnings.forEach((msg) => writeLine(`  ${msg}`));
    writeLine();
  }

  if (errors.length > 0) {
    writeLine('❌ ERRORS:\n');
    errors.forEach((msg) => writeLine(`  ${msg}`));
    writeLine();
  }

  // Final Status
  writeLine('='.repeat(60));
  if (errors.length === 0 && warnings.length === 0) {
    writeLine('🎉 All checks passed! Your authentication setup is ready.');
    writeLine('\nNext steps:');
    writeLine('  1. Start backend:  cd apps/backend && npm run dev');
    writeLine('  2. Start frontend: cd apps/frontend && npm run dev');
    writeLine('  3. Visit http://localhost:3000');
  } else if (errors.length === 0) {
    writeLine('⚠️  Setup is functional but has warnings.');
    writeLine('   Google OAuth will not work until you configure it.');
    writeLine('\nYou can start the app:');
    writeLine('  1. Start backend:  cd apps/backend && npm run dev');
    writeLine('  2. Start frontend: cd apps/frontend && npm run dev');
  } else {
    writeLine('❌ Setup incomplete. Please fix the errors above.');
    writeLine('\nSee docs/AUTH_SETUP_GUIDE.md for detailed instructions.');
    process.exitCode = 1;
  }
  writeLine(`${'='.repeat(60)}\n`);
})();
