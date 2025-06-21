#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Supplier Management System...\n');

// Check if the API routes exist
const apiRoutes = [
  'app/api/suppliers/route.ts',
  'app/api/suppliers/[id]/route.ts'
];

console.log('📁 Checking API routes...');
apiRoutes.forEach(route => {
  if (fs.existsSync(route)) {
    console.log(`✅ ${route} exists`);
  } else {
    console.log(`❌ ${route} missing`);
  }
});

// Check if components exist
const components = [
  'components/suppliers/supplier-manager.tsx',
  'components/suppliers/supplier-selector.tsx',
  'hooks/use-suppliers.ts'
];

console.log('\n📁 Checking components...');
components.forEach(component => {
  if (fs.existsSync(component)) {
    console.log(`✅ ${component} exists`);
  } else {
    console.log(`❌ ${component} missing`);
  }
});

// Check if pages exist
const pages = [
  'app/suppliers/page.tsx'
];

console.log('\n📁 Checking pages...');
pages.forEach(page => {
  if (fs.existsSync(page)) {
    console.log(`✅ ${page} exists`);
  } else {
    console.log(`❌ ${page} missing`);
  }
});

// Check if database service has supplier methods
console.log('\n🔍 Checking database service...');
try {
  const dbServicePath = 'lib/database.ts';
  if (fs.existsSync(dbServicePath)) {
    const content = fs.readFileSync(dbServicePath, 'utf8');
    const hasSuppliersService = content.includes('suppliersService');
    const hasSupplierMethods = content.includes('getAll') && content.includes('create') && content.includes('update') && content.includes('delete');
    
    if (hasSuppliersService) {
      console.log('✅ suppliersService exists in database.ts');
    } else {
      console.log('❌ suppliersService missing in database.ts');
    }
    
    if (hasSupplierMethods) {
      console.log('✅ Supplier CRUD methods exist');
    } else {
      console.log('❌ Supplier CRUD methods missing');
    }
  } else {
    console.log('❌ lib/database.ts missing');
  }
} catch (error) {
  console.log('❌ Error checking database service:', error.message);
}

// Check package.json for required dependencies
console.log('\n📦 Checking dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = ['@supabase/supabase-js'];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
      console.log(`✅ ${dep} is installed`);
    } else {
      console.log(`❌ ${dep} is missing`);
    }
  });
} catch (error) {
  console.log('❌ Error checking package.json:', error.message);
}

console.log('\n🎯 Supplier Management System Test Complete!');
console.log('\n📋 Next Steps:');
console.log('1. Start your development server: npm run dev');
console.log('2. Navigate to /suppliers to test the supplier management');
console.log('3. Try adding a new supplier');
console.log('4. Test the supplier selector in the inventory manager');
console.log('5. Verify that suppliers are properly linked to ingredients');

console.log('\n🔧 If you encounter issues:');
console.log('- Check that Supabase is properly configured');
console.log('- Verify your environment variables are set');
console.log('- Check the browser console for any errors');
console.log('- Ensure the database schema includes the suppliers table'); 