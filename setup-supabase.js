// Script to set up Supabase database schema
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // This should be your service_role key, not the anon key

// Validate configuration
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or service key missing. Please check your .env file.');
  process.exit(1);
}

// Create Supabase client with service role key (admin privileges)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Read the SQL schema file
const schemaFilePath = path.join(__dirname, 'supabase-schema.sql');
const schemaSql = fs.readFileSync(schemaFilePath, 'utf8');

// Split the SQL into individual statements
const sqlStatements = schemaSql
  .split(';')
  .map(statement => statement.trim())
  .filter(statement => statement.length > 0);

// Execute each SQL statement
async function setupDatabase() {
  console.log('Starting Supabase database setup...');
  
  try {
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i];
      console.log(`Executing statement ${i + 1}/${sqlStatements.length}...`);
      
      const { error } = await supabase
        .from('_sql')
        .select('*')
        .csv(`${statement};`);
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error.message);
        console.error('SQL Statement:', statement);
      }
    }
    
    console.log('Setting up storage bucket...');
    // Create documents storage bucket
    const { data: bucketData, error: bucketError } = await supabase
      .storage
      .createBucket('documents', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
      });
    
    if (bucketError) {
      console.error('Error creating storage bucket:', bucketError.message);
    } else {
      console.log('Storage bucket created successfully');
      
      // Add storage policies
      console.log('Setting up storage policies...');
      
      // Read policy
      const { error: readPolicyError } = await supabase
        .storage
        .from('documents')
        .createPolicy('Users can view their own documents', {
          definition: "auth.uid() = (SELECT user_id FROM public.documents WHERE storage.objects.name LIKE '%' || id || '%')",
          type: 'SELECT'
        });
      
      if (readPolicyError) {
        console.error('Error creating read policy:', readPolicyError.message);
      }
      
      // Insert policy
      const { error: insertPolicyError } = await supabase
        .storage
        .from('documents')
        .createPolicy('Users can upload their own documents', {
          definition: "auth.uid() IS NOT NULL",
          type: 'INSERT'
        });
      
      if (insertPolicyError) {
        console.error('Error creating insert policy:', insertPolicyError.message);
      }
    }
    
    console.log('Supabase database setup completed!');
  } catch (error) {
    console.error('Unexpected error during setup:', error.message);
  }
}

setupDatabase();
