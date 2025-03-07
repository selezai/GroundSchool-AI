-- GroundSchool-AI Database Schema

-- Users Table (handled by Supabase Auth)
-- Note: Supabase Auth automatically creates and manages the auth.users table

-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create profiles table for additional user data
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for profiles (users can only read/update their own profile)
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

-- Documents Table (for uploaded study materials)
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create policy for documents (users can only access their own documents)
CREATE POLICY "Users can view their own documents" 
  ON public.documents 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" 
  ON public.documents 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Questions Table (for generated MCQs)
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL,
  category TEXT,
  difficulty TEXT,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on questions
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Create policy for questions (users can only access questions from their documents)
CREATE POLICY "Users can view questions from their documents" 
  ON public.questions 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = questions.document_id 
      AND documents.user_id = auth.uid()
    )
  );

-- Quizzes Table (for quiz sessions)
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  document_id UUID REFERENCES public.documents(id),
  title TEXT NOT NULL,
  total_questions INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed'
  score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security on quizzes
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Create policy for quizzes (users can only access their own quizzes)
CREATE POLICY "Users can view their own quizzes" 
  ON public.quizzes 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quizzes" 
  ON public.quizzes 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quizzes" 
  ON public.quizzes 
  FOR UPDATE USING (auth.uid() = user_id);

-- Quiz Questions Table (links quizzes to questions)
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  user_answer INTEGER,
  is_correct BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on quiz_questions
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- Create policy for quiz_questions (users can only access questions from their quizzes)
CREATE POLICY "Users can view questions from their quizzes" 
  ON public.quiz_questions 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE quizzes.id = quiz_questions.quiz_id 
      AND quizzes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update answers for their quizzes" 
  ON public.quiz_questions 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE quizzes.id = quiz_questions.quiz_id 
      AND quizzes.user_id = auth.uid()
    )
  );

-- Activity Table (for tracking user activity)
CREATE TABLE public.activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  action_type TEXT NOT NULL, -- 'upload', 'quiz_start', 'quiz_complete', etc.
  resource_id UUID, -- document_id or quiz_id
  resource_type TEXT, -- 'document', 'quiz', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on activity
ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;

-- Create policy for activity (users can only view their own activity)
CREATE POLICY "Users can view their own activity" 
  ON public.activity 
  FOR SELECT USING (auth.uid() = user_id);

-- Create trigger to automatically delete old activity records (30-day retention)
CREATE OR REPLACE FUNCTION delete_old_activity() RETURNS trigger AS $$
BEGIN
  DELETE FROM public.activity
  WHERE created_at < NOW() - INTERVAL '30 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_old_activity
AFTER INSERT ON public.activity
EXECUTE PROCEDURE delete_old_activity();

-- Create trigger to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_questions_document_id ON public.questions(document_id);
CREATE INDEX idx_quizzes_user_id ON public.quizzes(user_id);
CREATE INDEX idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX idx_activity_user_id ON public.activity(user_id);
CREATE INDEX idx_activity_created_at ON public.activity(created_at);
