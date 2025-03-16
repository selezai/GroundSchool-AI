// fallbackData.js
// Provides fallback mock data when Supabase connections fail

const generateMockData = () => {
  // Current timestamp for reference
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000; // milliseconds in a day

  // Mock quiz attempts that will display in RecentActivityScreen
  const quizAttempts = [
    {
      id: 'quiz-1',
      user_id: 'mock-user-id',
      title: 'Navigation Systems',
      document_name: 'FAA Navigation Guide.pdf',
      total_questions: 10,
      completed: true,
      score: 8,
      created_at: new Date(now - 1 * day).toISOString(),
    },
    {
      id: 'quiz-2',
      user_id: 'mock-user-id',
      title: 'Aircraft Systems',
      document_name: 'Aircraft Maintenance Manual.pdf',
      total_questions: 15,
      completed: true,
      score: 12,
      created_at: new Date(now - 3 * day).toISOString(),
    },
    {
      id: 'quiz-3',
      user_id: 'mock-user-id',
      title: 'Weather Patterns',
      document_name: 'Meteorology Handbook.pdf',
      total_questions: 8,
      completed: false,
      progress: 0.5,
      created_at: new Date(now - 0.5 * day).toISOString(),
    }
  ];

  // Mock document uploads
  const documentUploads = [
    {
      id: 'doc-1',
      user_id: 'mock-user-id',
      filename: 'FAA Navigation Guide.pdf',
      filepath: 'documents/mock-user-id/nav-guide.pdf',
      filesize: 2.4 * 1024 * 1024, // 2.4MB
      filetype: 'application/pdf',
      created_at: new Date(now - 2 * day).toISOString(),
    },
    {
      id: 'doc-2',
      user_id: 'mock-user-id',
      filename: 'Aircraft Maintenance Manual.pdf',
      filepath: 'documents/mock-user-id/maintenance.pdf',
      filesize: 3.7 * 1024 * 1024, // 3.7MB
      filetype: 'application/pdf',
      created_at: new Date(now - 4 * day).toISOString(),
    }
  ];

  // Mock user profile data
  const userProfile = {
    id: 'mock-user-id',
    full_name: 'Test Pilot',
    email: 'test@aviation-quiz.com',
    created_at: new Date(now - 10 * day).toISOString(),
    statistics: {
      total_quizzes: 12,
      completed_quizzes: 9,
      average_score: 82
    }
  };

  return {
    quizAttempts,
    documentUploads,
    userProfile
  };
};

export default generateMockData;
