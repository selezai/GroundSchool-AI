// populate-supabase.js - Create test data directly in Supabase tables
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase with direct API keys
const supabase = createClient(
  'https://jqkzgtytsaphudyidcxk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impxa3pndHl0c2FwaHVkeWlkY3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNjIyNTcsImV4cCI6MjA1NjkzODI1N30.dr2SAy2P4JqPdQ8WpOexz57kIYS-B2eYO2mApzelcio'
);

// Sample data
const testDate = new Date().toISOString();
const userId = 'test-user-id';

async function createTestData() {
  try {
    console.log('Creating test data in Supabase...');
    
    // Sign up a test user first
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'test@aviation-quiz.com',
      password: 'TestPassword123!'
    });
    
    if (authError) {
      console.error('Error creating test user:', authError);
      // Continue anyway, might be using existing user
    }
    
    const realUserId = authData?.user?.id || userId;
    console.log('Using user ID:', realUserId);
    
    // Create quiz attempts
    const quizData = [
      {
        user_id: realUserId,
        title: 'Navigation Quiz',
        document_name: 'Navigation Handbook.pdf',
        total_questions: 10,
        completed: true,
        score: 8,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
      },
      {
        user_id: realUserId,
        title: 'Principles of Flight',
        document_name: 'Aerodynamics.pdf',
        total_questions: 15,
        completed: true,
        score: 12,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
      },
      {
        user_id: realUserId,
        title: 'Weather Systems',
        document_name: 'Meteorology.pdf',
        total_questions: 8,
        completed: false,
        progress: 0.5,
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      }
    ];
    
    // Insert quiz attempts
    for (const quiz of quizData) {
      const { error } = await supabase.from('quiz_attempts').insert(quiz);
      
      if (error) {
        console.error(`Error creating quiz '${quiz.title}':`, error);
      } else {
        console.log(`Created quiz '${quiz.title}'`);
      }
    }
    
    // Create document uploads
    const documentData = [
      {
        user_id: realUserId,
        filename: 'Navigation Handbook.pdf',
        filepath: `documents/${realUserId}/nav_handbook.pdf`,
        filesize: 2 * 1024 * 1024, // 2MB
        filetype: 'application/pdf',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString()
      },
      {
        user_id: realUserId,
        filename: 'Aerodynamics.pdf',
        filepath: `documents/${realUserId}/aerodynamics.pdf`,
        filesize: 3.5 * 1024 * 1024, // 3.5MB
        filetype: 'application/pdf',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString()
      }
    ];
    
    // Insert document uploads
    for (const doc of documentData) {
      const { error } = await supabase.from('document_uploads').insert(doc);
      
      if (error) {
        console.error(`Error creating document '${doc.filename}':`, error);
      } else {
        console.log(`Created document '${doc.filename}'`);
      }
    }
    
    console.log('Test data creation complete!');
    console.log('Login with test@aviation-quiz.com / TestPassword123!');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createTestData();
