#!/usr/bin/env node

/**
 * Supabase Database Setup Script
 * 
 * This script helps set up and verify the Supabase database connection
 * for the Cafeteria Management System.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logStep(message) {
  log(`\n${colors.bright}${message}${colors.reset}`, 'cyan');
}

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function checkEnvironmentVariables() {
  logStep('Checking Environment Variables');
  
  const envPath = path.join(process.cwd(), '.env.local');
  const envExists = fs.existsSync(envPath);
  
  if (!envExists) {
    logError('.env.local file not found');
    logInfo('Please create a .env.local file with your Supabase credentials');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL');
  const hasSupabaseKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  if (!hasSupabaseUrl || !hasSupabaseKey) {
    logError('Missing required Supabase environment variables');
    logInfo('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
    return false;
  }
  
  logSuccess('Environment variables found');
  return true;
}

function checkDependencies() {
  logStep('Checking Dependencies');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    logError('package.json not found');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = [
    '@supabase/supabase-js',
    '@supabase/auth-helpers-nextjs',
    '@supabase/auth-helpers-react'
  ];
  
  const missingDeps = requiredDeps.filter(dep => !dependencies[dep]);
  
  if (missingDeps.length > 0) {
    logError(`Missing dependencies: ${missingDeps.join(', ')}`);
    logInfo('Run: npm install @supabase/supabase-js @supabase/auth-helpers-nextjs @supabase/auth-helpers-react');
    return false;
  }
  
  logSuccess('All required dependencies are installed');
  return true;
}

function checkDatabaseSchema() {
  logStep('Checking Database Schema');
  
  const schemaPath = path.join(process.cwd(), 'database', 'supabase-schema.sql');
  if (!fs.existsSync(schemaPath)) {
    logError('Database schema file not found');
    logInfo('Please ensure database/supabase-schema.sql exists');
    return false;
  }
  
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const requiredTables = [
    'suppliers',
    'categories',
    'units',
    'ingredients',
    'purchase_orders',
    'purchase_order_items',
    'kitchen_storage',
    'recipes',
    'recipe_ingredients',
    'batches',
    'batch_ingredients',
    'system_logs'
  ];
  
  const missingTables = requiredTables.filter(table => 
    !schemaContent.includes(`CREATE TABLE ${table}`)
  );
  
  if (missingTables.length > 0) {
    logError(`Missing table definitions: ${missingTables.join(', ')}`);
    return false;
  }
  
  logSuccess('Database schema file is complete');
  return true;
}

function checkTypeScriptTypes() {
  logStep('Checking TypeScript Types');
  
  const typesPath = path.join(process.cwd(), 'types', 'database.ts');
  if (!fs.existsSync(typesPath)) {
    logError('Database types file not found');
    logInfo('Please ensure types/database.ts exists');
    return false;
  }
  
  logSuccess('TypeScript types file found');
  return true;
}

function checkLibFiles() {
  logStep('Checking Library Files');
  
  const libFiles = [
    'lib/supabase.ts',
    'lib/database.ts'
  ];
  
  const missingFiles = libFiles.filter(file => 
    !fs.existsSync(path.join(process.cwd(), file))
  );
  
  if (missingFiles.length > 0) {
    logError(`Missing library files: ${missingFiles.join(', ')}`);
    return false;
  }
  
  logSuccess('All library files are present');
  return true;
}

function generateTestFile() {
  logStep('Generating Test File');
  
  const testContent = `import { supabase } from '@/lib/supabase'

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...')
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      return false
    }
    
    console.log('✅ Connection successful!')
    console.log('📊 Sample data:', data)
    
    // Test all tables
    const tables = [
      'suppliers',
      'categories', 
      'units',
      'ingredients',
      'kitchen_storage',
      'recipes',
      'batches',
      'system_logs'
    ]
    
    for (const table of tables) {
      try {
        const { error: tableError } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (tableError) {
          console.error(\`❌ Table \${table} error:\`, tableError.message)
        } else {
          console.log(\`✅ Table \${table} accessible\`)
        }
      } catch (err) {
        console.error(\`❌ Table \${table} failed:\`, err.message)
      }
    }
    
    return true
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return false
  }
}

// Run the test
testSupabaseConnection()
  .then(success => {
    if (success) {
      console.log('\\n🎉 All tests passed! Your Supabase setup is ready.')
    } else {
      console.log('\\n💥 Some tests failed. Please check your setup.')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error)
    process.exit(1)
  })
`;

  const testPath = path.join(process.cwd(), 'test-supabase.js');
  fs.writeFileSync(testPath, testContent);
  
  logSuccess('Test file generated: test-supabase.js');
  logInfo('Run: node test-supabase.js to test your connection');
}

function generateSetupInstructions() {
  logStep('Generating Setup Instructions');
  
  const instructions = `# Supabase Setup Instructions

## 1. Create Supabase Project
- Go to https://supabase.com
- Create a new project
- Note your project URL and anon key

## 2. Configure Environment Variables
Create a .env.local file with:
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
\`\`\`

## 3. Run Database Schema
- Go to your Supabase dashboard
- Navigate to SQL Editor
- Copy and paste the content from database/supabase-schema.sql
- Click "Run"

## 4. Test Connection
Run: node test-supabase.js

## 5. Verify Tables
Check that all tables were created in the Table Editor:
- suppliers
- categories
- units
- ingredients
- purchase_orders
- purchase_order_items
- kitchen_storage
- recipes
- recipe_ingredients
- batches
- batch_ingredients
- system_logs

## 6. Next Steps
- Update your application code to use Supabase
- Implement authentication
- Add real-time features
- Deploy your application

For detailed instructions, see: docs/supabase-setup.md
`;

  const instructionsPath = path.join(process.cwd(), 'SUPABASE_SETUP.md');
  fs.writeFileSync(instructionsPath, instructions);
  
  logSuccess('Setup instructions generated: SUPABASE_SETUP.md');
}

async function main() {
  log(`${colors.bright}🚀 Supabase Database Setup Script${colors.reset}`, 'magenta');
  log('This script will help you verify your Supabase setup.\n');
  
  const checks = [
    { name: 'Environment Variables', fn: checkEnvironmentVariables },
    { name: 'Dependencies', fn: checkDependencies },
    { name: 'Database Schema', fn: checkDatabaseSchema },
    { name: 'TypeScript Types', fn: checkTypeScriptTypes },
    { name: 'Library Files', fn: checkLibFiles }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    const passed = check.fn();
    if (!passed) {
      allPassed = false;
    }
  }
  
  if (allPassed) {
    logSuccess('All checks passed!');
    
    const generateTest = await question('\nGenerate test file? (y/n): ');
    if (generateTest.toLowerCase() === 'y') {
      generateTestFile();
    }
    
    const generateInstructions = await question('\nGenerate setup instructions? (y/n): ');
    if (generateInstructions.toLowerCase() === 'y') {
      generateSetupInstructions();
    }
    
    log('\n🎉 Setup verification complete!');
    logInfo('Next steps:');
    logInfo('1. Create your Supabase project');
    logInfo('2. Configure environment variables');
    logInfo('3. Run the database schema');
    logInfo('4. Test the connection');
    logInfo('5. Update your application code');
    
  } else {
    logError('Some checks failed. Please fix the issues above before proceeding.');
    process.exit(1);
  }
  
  rl.close();
}

// Handle script termination
process.on('SIGINT', () => {
  log('\n\n👋 Setup script terminated');
  rl.close();
  process.exit(0);
});

// Run the script
main().catch(error => {
  logError(`Script failed: ${error.message}`);
  rl.close();
  process.exit(1);
}); 