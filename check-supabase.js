const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase configuration from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Create Supabase admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSupabaseSetup() {
  console.log('Checking Supabase setup with service role key...\n');
  
  // Use a better approach to check tables by attempting to count rows
  console.log('==== DATABASE TABLES ====');
  const expectedTables = [
    'profiles', 
    'documents', 
    'quizzes', 
    'questions', 
    'quiz_results',
    'quiz_answers'
  ];
  
  const tablesStatus = {};
  
  for (const table of expectedTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        if (error.code === '42P01') { // relation does not exist
          tablesStatus[table] = 'missing';
        } else {
          tablesStatus[table] = `error: ${error.message}`;
        }
      } else {
        tablesStatus[table] = 'exists';
      }
    } catch (error) {
      tablesStatus[table] = `error: ${error.message}`;
    }
  }
  
  // Display table check results
  console.log('Table status:');
  for (const [table, status] of Object.entries(tablesStatus)) {
    const icon = status === 'exists' ? '✅' : status === 'missing' ? '❌' : '⚠️';
    console.log(` ${icon} ${table}: ${status}`);
  }
  
  // Check for any missing tables
  const missingTables = Object.entries(tablesStatus)
    .filter(([_, status]) => status === 'missing')
    .map(([table, _]) => table);
  
  if (missingTables.length > 0) {
    console.log('\n⚠️ Missing tables:', missingTables.join(', '));
    console.log('Make sure you run the SQL setup script in the Supabase SQL Editor.');
  }
  
  // Check storage buckets
  console.log('\n==== STORAGE BUCKETS ====');
  try {
    const { data: buckets, error: bucketError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketError) {
      console.error('Error fetching storage buckets:', bucketError);
    } else {
      console.log(`Found ${buckets.length} storage buckets:`);
      buckets.forEach(bucket => {
        console.log(` - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });
      
      // Check if required bucket exists
      const documentsExists = buckets.some(bucket => bucket.name === 'documents');
      if (!documentsExists) {
        console.log('\n⚠️ Required bucket "documents" is missing!');
        console.log('Create it in the Supabase dashboard under Storage.');
      }
    }
  } catch (error) {
    console.error('Error during bucket check:', error);
  }
  
  // Check if RLS policies are enabled
  console.log('\n==== ROW LEVEL SECURITY POLICIES ====');
  console.log('Checking if RLS is enabled for tables...');
  
  // We can check some common tables that should have RLS enabled
  const tablesToCheckRLS = ['profiles', 'documents', 'quizzes'];
  
  // Check tables with sample queries to see if they work with anonymous access
  for (const table of tablesToCheckRLS) {
    // Skip tables that don't exist
    if (tablesStatus[table] === 'missing') {
      console.log(` - Table '${table}': Skipped (table doesn't exist)`);
      continue;
    }
    
    try {
      // Try to insert a record as an anonymous user to see if RLS blocks it
      // First create a client with anon key
      const anonClient = createClient(supabaseUrl, process.env.SUPABASE_KEY);
      
      // Try inserting a test record
      const { error } = await anonClient
        .from(table)
        .insert({ test_column: 'test' })
        .select();
      
      if (error) {
        if (error.code === '42703') { // column "test_column" doesn't exist
          console.log(` - Table '${table}': Could not check RLS (test column doesn't exist)`);
        } else if (error.code === '42501' || error.message.includes('permission denied')) {
          console.log(` ✅ Table '${table}': RLS is active and blocking unauthorized access`);
        } else {
          console.log(` - Table '${table}': Error: ${error.message}`);
        }
      } else {
        console.log(` ⚠️ Table '${table}': WARNING - Anonymous insert allowed, RLS may not be properly configured`);
        
        // Clean up test data
        await supabase.from(table).delete().eq('test_column', 'test');
      }
    } catch (error) {
      console.log(` - Table '${table}': Error checking RLS: ${error.message}`);
    }
  }
  
  // Check row count in main tables
  console.log('\n==== TABLE ROW COUNTS ====');
  const mainTables = ['profiles', 'documents', 'quizzes', 'questions', 'quiz_results'];
  
  for (const table of mainTables) {
    // Skip tables that don't exist
    if (tablesStatus[table] === 'missing') {
      console.log(` - Table '${table}': Skipped (table doesn't exist)`);
      continue;
    }
    
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(` - Table '${table}': Error: ${error.message}`);
      } else {
        console.log(` - Table '${table}': ${count || 0} rows`);
      }
    } catch (error) {
      console.log(` - Table '${table}': Error checking count: ${error.message}`);
    }
  }
}

// Run the check
checkSupabaseSetup().catch(error => {
  console.error('Error:', error);
});
