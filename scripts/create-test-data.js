// create-test-data.js
// Utility script to populate Supabase with test data for development

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Using service key for admin access
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestData() {
  console.log('Creating test data in Supabase...');
  
  try {
    // Create a test user if it doesn't exist
    const testEmail = 'test@example.com';
    const testPassword = 'Test123456!';
    
    console.log('Checking if test user exists...');
    const { data: existingUsers, error: userQueryError } = await supabase
      .from('auth.users')
      .select('*')
      .eq('email', testEmail)
      .maybeSingle();
      
    if (userQueryError) {
      console.log('Error checking for existing user:', userQueryError);
    }
    
    let userId;
    
    if (!existingUsers) {
      console.log('Creating test user...');
      // Create user through auth API
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true
      });
      
      if (createUserError) {
        console.error('Error creating test user:', createUserError);
        return;
      }
      
      userId = newUser.user.id;
      console.log('Created test user with ID:', userId);
      
      // Create profile record
      await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: 'Test User',
          email: testEmail,
          created_at: new Date().toISOString()
        });
    } else {
      userId = existingUsers.id;
      console.log('Test user already exists with ID:', userId);
    }
    
    // Create test quiz attempts
    console.log('Creating test quiz attempts...');
    for (let i = 1; i <= 5; i++) {
      const { error: quizError } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: userId,
          title: `Test Quiz ${i}`,
          document_name: `Test Document ${i}.pdf`,
          document_path: `documents/${userId}/test_document_${i}.pdf`,
          total_questions: 10,
          completed: i % 2 === 0, // Every other quiz is completed
          score: i % 2 === 0 ? Math.floor(Math.random() * 10) + 1 : null,
          created_at: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString() // Each quiz is 1 day older
        });
        
      if (quizError) {
        console.error(`Error creating quiz attempt ${i}:`, quizError);
      }
    }
    
    // Create test document uploads
    console.log('Creating test document uploads...');
    for (let i = 1; i <= 3; i++) {
      const { error: docError } = await supabase
        .from('document_uploads')
        .insert({
          user_id: userId,
          filename: `Test Document ${i}.pdf`,
          filepath: `documents/${userId}/test_document_${i}.pdf`,
          filesize: 1024 * 1024 * (i + 1), // Different file sizes
          filetype: 'application/pdf',
          created_at: new Date(Date.now() - (i * 48 * 60 * 60 * 1000)).toISOString() // Each doc is 2 days older
        });
        
      if (docError) {
        console.error(`Error creating document upload ${i}:`, docError);
      }
    }
    
    console.log('Test data creation complete!');
    console.log('');
    console.log('Test credentials:');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createTestData();
