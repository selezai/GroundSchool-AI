// apiClient import removed as it was unused
// import apiClient from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';
import { Platform } from 'react-native';
import Logger from '../utils/Logger';
import * as Sentry from '@sentry/node';

// Define UUID regex pattern as a constant for better performance
// Modified to support variable-length last segments (at least 12 chars)
const UUID_REGEX = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12,})/i;

/**
 * Sanitizes a quiz ID by removing any non-UUID characters
 * @param {string} quizId - The quiz ID to sanitize
 * @returns {string} - The sanitized quiz ID
 */
const sanitizeQuizId = (quizId) => {
  if (!quizId) return quizId;
  
  Logger.debug(`Original quizId: '${quizId}'`);
  
  // Handle undefined or null as strings
  if (quizId === 'undefined' || quizId === 'null') {
    console.warn('⚠️ Invalid quizId (undefined/null string), returning as is');
    return quizId;
  }
  
  // Keep original for comparison
  const trimmedOriginal = quizId.trim();
  
  // First, try direct suffix removal
  let cleanId = trimmedOriginal.replace(/(-quiz|_quiz|quiz)$/i, '');
  if (cleanId !== trimmedOriginal) {
    Logger.debug(`Removed suffix, new ID: '${cleanId}'`);
  }
  
  // Extract UUID if present anywhere in the string
  const match = cleanId.match(UUID_REGEX);
  if (match && match[1]) {
    const extractedUuid = match[1];
    if (extractedUuid !== cleanId) {
      Logger.debug(`Extracted UUID: '${extractedUuid}'`);
      cleanId = extractedUuid;
    }
  } else if (cleanId.includes('-')) {
    // Alternative manual extraction for specific format (e.g., '10000000-1000-4000-8000-1741529977931-quiz')
    const segments = cleanId.split('-');
    
    // If we have at least 5 segments, try to reconstruct the UUID
    if (segments.length >= 5) {
      const lastSegmentRaw = segments[4];
      // Remove any non-alphanumeric characters from the last segment
      const lastSegment = lastSegmentRaw.replace(/[^0-9a-f]/gi, '');
      
      // Reconstruct the UUID with the cleaned last segment
      const reconstructedUuid = `${segments[0]}-${segments[1]}-${segments[2]}-${segments[3]}-${lastSegment}`;
      
      // Check if it passes our modified UUID pattern
      if (UUID_REGEX.test(reconstructedUuid)) {
        Logger.debug(`Manually reconstructed UUID: '${reconstructedUuid}'`);
        cleanId = reconstructedUuid;
      }
    }
  }
  
  // Validate the final ID - if it's not a valid UUID, log an error
  // but don't throw an error to maintain backward compatibility
  if (cleanId && !UUID_REGEX.test(cleanId)) {
    Logger.warn(`Sanitized ID is not a valid UUID: '${cleanId}'`);
    // We'll return it anyway but log the warning
  }
  
  return cleanId;
};

/**
 * Quiz Service for handling quiz generation and management
 */
class QuizService {
  /**
   * Generate quiz questions from an uploaded document
   * @param {Object} file - File object with uri, name, and type
   * @param {Object} options - Quiz generation options
   * @returns {Promise<Object>} - Generated quiz data
   */
  async generateQuiz(file, options = {}) {
    const transaction = Sentry.startTransaction({
      name: 'generateQuiz',
      op: 'quiz.generation'
    });
    Sentry.setContext('generateQuiz', {
      file: file ? file.name : 'undefined',
      options
    });
    try {
      Logger.info(`Starting quiz generation with file: ${file ? file.name : 'undefined'}`);
      
      // Validate input parameters to prevent crashes
      if (!file || !file.uri) {
        const error = new Error('Invalid file: File object is required');
        Sentry.captureException(error);
        Logger.error('Invalid file object provided', error);
        throw error;
      }
      
      // Ensure file has all required properties with fallbacks
      const safeFile = {
        uri: file.uri,
        name: file.name || `unknown_file_${Date.now()}`,
        type: file.type || 'application/octet-stream',
        size: file.size || 0
      };
      
      // Set default options
      const quizOptions = {
        questionCount: 10,
        difficulty: 'mixed',
        ...options
      };
      
      // If the document ID is provided in the options, we don't need to upload the file again
      let documentId = options.documentId;
      
      // If no document ID was provided, we need to create a document record first
      if (!documentId) {
        Logger.info('No document ID provided, creating new document');
        
        // Handle filenames with multiple dots properly
        const nameParts = safeFile.name.split('.');
        const fileExt = nameParts.length > 1 ? nameParts.pop() : 'file';
        
        // Create a sanitized, unique filename
        const sanitizedName = safeFile.name.replace(/[^a-zA-Z0-9-_.]/g, '_');
        let fileName = `${Date.now()}_${sanitizedName}`;
        
        let uploadSuccess = false;
        let maxRetries = 3;
        let retryCount = 0;
        
        while (!uploadSuccess && retryCount < maxRetries) {
          try {
            // Attempt to get blob with timeout and error handling
            let blob;
            try {
              Logger.info(`Fetching file data from URI: ${safeFile.uri.substring(0, 50)}...`);
              const fetchPromise = fetch(safeFile.uri);
              
              // Use a safer timeout pattern with clear cleanup
              let timeoutId;
              const timeoutPromise = new Promise((_, reject) => {
                timeoutId = global.setTimeout(() => {
                  reject(new Error('File fetch timed out after 30 seconds'));
                }, 30000);
              });
              
              const response = await Promise.race([fetchPromise, timeoutPromise]);
              // Clear the timeout to prevent memory leaks
              if (timeoutId) global.clearTimeout(timeoutId);
              
              if (!response.ok) {
                const error = new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
                Logger.error('File fetch failed with HTTP error', error);
                throw error;
              }
              
              blob = await response.blob();
              Logger.info(`Successfully fetched file blob, size: ${blob.size} bytes`);
            } catch (fetchError) {
              Logger.error('Error fetching file blob', fetchError);
              throw new Error(`Failed to access file: ${fetchError.message}`);
            }
            
            // Generate a unique filename for this retry attempt
            const retryFileName = retryCount > 0 ? 
              `${Date.now()}_retry${retryCount}_${sanitizedName}` : 
              fileName;
              
            Logger.info(`Uploading file to Supabase: ${retryFileName}`);
            
            // Upload to storage bucket with better error handling
            const { /* data: storageData, */ error: storageError } = await supabase.storage
              .from('documents')
              .upload(retryFileName, blob, {
                contentType: safeFile.type,
                cacheControl: '3600',
                upsert: true // Overwrite if file exists with same name
              });
            
            if (storageError) {
              Logger.error(`Storage upload error (attempt ${retryCount + 1})`, storageError);
              retryCount++;
              
              // If it's not a duplicate error or we're out of retries, throw it
              if (!storageError.message?.includes('duplicate') && retryCount >= maxRetries) {
                throw storageError;
              }
              
              // Wait before retrying with exponential backoff and jitter
              const baseDelay = 1000; // 1 second base
              const maxDelay = 10000; // 10 seconds max
              const exponentialDelay = Math.min(
                maxDelay,
                baseDelay * Math.pow(2, retryCount - 1)
              );
              // Add jitter to prevent thundering herd problem
              const jitter = Math.random() * 0.3 * exponentialDelay;
              const delay = exponentialDelay + jitter;
              
              Logger.info(`Retrying upload in ${Math.round(delay/1000)} seconds...`);
              await new Promise(resolve => global.setTimeout(resolve, delay));
            } else {
              // Success!
              fileName = retryFileName;
              uploadSuccess = true;
              Logger.info(`File uploaded successfully: ${fileName}`);
            }
          } catch (uploadError) {
            retryCount++;
            Logger.error(`File upload attempt ${retryCount} failed`, uploadError);
            
            if (retryCount >= maxRetries) {
              Logger.error('Maximum upload retries reached, failing');
              throw new Error(`File upload failed after ${maxRetries} attempts: ${uploadError.message}`);
            }
            
            // Wait before retrying with exponential backoff
            const baseDelay = 1000; // 1 second base
            const maxDelay = 10000; // 10 seconds max
            const exponentialDelay = Math.min(
              maxDelay,
              baseDelay * Math.pow(2, retryCount - 1)
            );
            // Add jitter to prevent thundering herd problem
            const jitter = Math.random() * 0.3 * exponentialDelay;
            const delay = exponentialDelay + jitter;
            
            Logger.info(`Retrying upload in ${Math.round(delay/1000)} seconds...`);
            await new Promise(resolve => global.setTimeout(resolve, delay));
          }
        }
        
        // Safe document creation with retries
        try {
          Logger.info('Creating document record in database');
          
          // Get user ID safely
          let userId;
          try {
            const userResponse = await supabase.auth.getUser();
            userId = userResponse?.data?.user?.id;
            
            if (!userId) {
              Logger.warn('Unable to get user ID, using placeholder');
              userId = 'anonymous'; // Fallback if we can't get user ID
            }
          } catch (userError) {
            Logger.error('Error getting user ID', userError);
            userId = 'anonymous'; // Fallback
          }
          
          // Create document record in database
          const documentData = {
            title: safeFile.name.replace(`.${fileExt}`, '').substring(0, 100), // Limit title length
            file_path: fileName,
            file_type: safeFile.type,
            file_size: safeFile.size,
            status: 'completed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: userId
          };
          
          const { data: documentRecord, error: documentError } = await supabase
            .from('documents')
            .insert(documentData)
            .select();
            
          if (documentError) {
            Logger.error('Document record error', documentError);
            throw new Error(`Failed to create document record: ${documentError.message}`);
          }
          
          if (!documentRecord || documentRecord.length === 0) {
            const error = new Error('Document record creation failed: No record returned');
            Logger.error('Document creation returned empty result', error);
            throw error;
          }
          
          // Use the new document ID
          documentId = documentRecord[0].id;
          Logger.info(`Document record created successfully, ID: ${documentId}`);
        } catch (docError) {
          Logger.error('Error creating document record', docError);
          throw new Error(`Document creation failed: ${docError.message}`);
        }
      }
      
      // Create quiz record in database with better title handling
      Logger.info(`Creating quiz record for document ID: ${documentId}`);
      
      // Handle potential edge cases with file names
      const nameParts = file?.name ? file.name.split('.') : ['Unknown_File'];
      const baseName = nameParts.length > 1 ? nameParts.slice(0, -1).join('.') : nameParts[0];
      const safeTitle = baseName.length > 50 ? `${baseName.substring(0, 47)}...` : baseName;
      
      // Get the current user ID safely with fallback
      let userId;
      try {
        const userResponse = await supabase.auth.getUser();
        userId = userResponse?.data?.user?.id;
        
        if (!userId) {
          Logger.warn('User not authenticated, using anonymous user');
          userId = 'anonymous'; // Fallback if we can't get user ID
        }
      } catch (userError) {
        Logger.error('Error getting user ID for quiz creation', userError);
        userId = 'anonymous'; // Fallback
      }
      
      try {
        Logger.info('Preparing quiz data for insertion');
        const quizData = {
          title: `Quiz on ${safeTitle}`,
          document_id: documentId,  // Use the document ID reference
          total_questions: quizOptions.questionCount,
          status: 'in_progress',
          created_at: new Date().toISOString(),
          user_id: userId
        };
        
        Logger.info('Inserting quiz record');
        const { data: quizRecord, error: quizError } = await supabase
          .from('quizzes')
          .insert(quizData)
          .select();
          
        if (quizError) {
          Logger.error('Quiz insertion error', quizError);
          throw new Error(`Failed to insert quiz: ${quizError.message}`);
        }
        
        if (!quizRecord || quizRecord.length === 0) {
          const error = new Error('Quiz record creation failed: No record returned');
          Logger.error('Quiz creation returned empty result', error);
          throw error;
        }
        
        Logger.info(`Quiz record created successfully, ID: ${quizRecord[0].id}`);
      
        // Generate questions using DeepSeek AI
        Logger.info(`Generating questions using DeepSeek AI for document: ${documentId}`);
        
        let response;
        try {
          // Import the AI processing module
          const { generateQuestions } = require('../../lib/aiProcessing');
          
          // Generate questions based on the uploaded document
          // Use the document ID as a fallback if fileName is not available
          const generatedQuestions = await generateQuestions(documentId, {
            questionCount: quizOptions.questionCount,
            difficulty: quizOptions.difficulty
          });
          
          Logger.info(`Successfully generated ${generatedQuestions.length} questions with AI`);
          
          // Save questions to the database
          if (generatedQuestions && generatedQuestions.length > 0) {
            Logger.info('Saving generated questions to database');
            
            // Insert questions into the questions table
            for (const question of generatedQuestions) {
              try {
                // Insert question
                const { data: questionData, error: questionError } = await supabase
                  .from('questions')
                  .insert({
                    text: question.text,
                    explanation: question.explanation,
                    difficulty: quizOptions.difficulty,
                    created_at: new Date().toISOString(),
                    user_id: userId
                  })
                  .select();
                  
                if (questionError) {
                  Logger.error('Error inserting question', questionError);
                  continue;
                }
                
                if (!questionData || questionData.length === 0) {
                  Logger.warn('Question insert returned no data, skipping options');
                  continue;
                }
                
                const questionId = questionData[0].id;
                
                // Insert options
                for (const option of question.options) {
                  const { error: optionError } = await supabase
                    .from('question_options')
                    .insert({
                      question_id: questionId,
                      text: option.text,
                      is_correct: option.id === question.correctOptionId,
                      option_identifier: option.id // A, B, C, or D
                    });
                    
                  if (optionError) {
                    Logger.error('Error inserting option', optionError);
                  }
                }
                
                // Link question to quiz
                const { error: linkError } = await supabase
                  .from('quiz_questions')
                  .insert({
                    quiz_id: quizRecord[0].id,
                    question_id: questionId,
                    position: generatedQuestions.indexOf(question) + 1
                  });
                  
                if (linkError) {
                  Logger.error('Error linking question to quiz', linkError);
                }
              } catch (questionInsertError) {
                Logger.error('Error processing question', questionInsertError);
                // Continue with other questions
              }
            }
          }
          
          // Prepare the response with the generated questions
          response = {
            quiz: {
              id: quizRecord[0].id,
              title: quizRecord[0].title,
              documentId: documentId,
              createdAt: quizRecord[0].created_at,
              questions: generatedQuestions
            }
          };
        } catch (aiError) {
          Logger.error('AI question generation error', aiError);
          
          // Update quiz status to reflect the error
          try {
            await supabase
              .from('quizzes')
              .update({ status: 'error' })
              .eq('id', quizRecord[0].id);
            Logger.info(`Updated quiz status to 'error' for quiz ID: ${quizRecord[0].id}`);
          } catch (statusUpdateError) {
            Logger.error('Failed to update quiz status after AI error', statusUpdateError);
          }
          
          // Fallback to returning an empty quiz if AI generation fails
          response = {
            quiz: {
              id: quizRecord[0].id,
              title: quizRecord[0].title,
              documentId: documentId,
              createdAt: quizRecord[0].created_at,
              questions: [], // Empty questions array as fallback
              error: aiError.message || 'Failed to generate questions'
            }
          };
        }
        
        // Store quiz in local storage for offline access
        try {
          Logger.info('Saving quiz to local storage');
          if (response.quiz && response.quiz.id) {
            await this.saveQuizToStorage(response.quiz);
          }
        } catch (storageError) {
          Logger.warn('Failed to save quiz to local storage', storageError);
          // Continue even if local storage fails
        }
        
        // Update quiz status to completed if we have questions
        if (response.quiz && response.quiz.questions && response.quiz.questions.length > 0) {
          try {
            await supabase
              .from('quizzes')
              .update({ status: 'completed' })
              .eq('id', quizRecord[0].id);
            Logger.info(`Updated quiz status to 'completed' for quiz ID: ${quizRecord[0].id}`);
          } catch (statusUpdateError) {
            Logger.error('Failed to update quiz status to completed', statusUpdateError);
          }
        }
        
        Logger.info('Quiz generation complete, returning response');
        return response;
      } catch (quizCreationError) {
        Logger.error('Quiz creation error', quizCreationError);
        throw quizCreationError;
      }
    } catch (error) {
      Sentry.captureException(error);
      Logger.error('Quiz generation error', error);
      throw error;
    } finally {
      transaction.finish();
    }
  }
  
  /**
   * Get quiz by ID
   * @param {string} quizId - Quiz ID
   * @returns {Promise<Object>} - Quiz data
   */
  async getQuiz(quizId) {
    const transaction = Sentry.startTransaction({
      name: 'getQuiz',
      op: 'quiz.retrieval'
    });
    Sentry.setContext('getQuiz', { quizId });
    try {
      if (!quizId) {
        const error = new Error('Quiz ID is required');
        Sentry.captureException(error);
        Logger.error('getQuiz called with invalid quizId', { quizId, error });
        throw error;
      }
      
      // Sanitize the quiz ID to ensure it's a valid UUID for Supabase
      const sanitizedQuizId = sanitizeQuizId(quizId);
      Logger.info(`Getting quiz with ID: ${quizId} (sanitized to: ${sanitizedQuizId})`);
      
      // Add validation for sanitized ID
      if (!sanitizedQuizId) {
        const error = new Error('Failed to sanitize Quiz ID');
        Sentry.captureException(error);
        Logger.error('Quiz ID sanitization failed', { quizId, error });
        throw error;
      }
      
      // Store the original ID for local storage lookups
      const originalQuizId = quizId;
      
      try {
        // Try to get from local storage first as a fallback
        let localQuiz = null;
        try {
          localQuiz = await this.getQuizFromStorage(quizId);
          if (localQuiz) {
            Logger.info('Found quiz in local storage');
          }
        } catch (storageError) {
          Logger.warn('Error checking local storage', storageError);
          // Continue even if local storage fails
        }
        
        // Try to get from Supabase
        try {
          Logger.info(`Fetching quiz from Supabase with sanitized ID: ${sanitizedQuizId}`);
          // First get basic quiz information
          const { data, error } = await supabase
            .from('quizzes')
            .select('*')
            .eq('id', sanitizedQuizId)
            .single();
          
          if (error) {
            Logger.error('Error fetching quiz from Supabase', error);
            // If we have a local version, use that instead
            if (localQuiz) {
              Logger.info('Using local quiz data as fallback');
              return localQuiz;
            }
            throw error;
          }
          
          // Now fetch the questions through the quiz_questions junction table
          const { data: quizQuestionsData, error: questionsError } = await supabase
            .from('quiz_questions')
            .select(`
              id,
              user_answer,
              is_correct,
              question:question_id(*)
            `)
            .eq('quiz_id', sanitizedQuizId);
            
          if (questionsError) {
            Logger.error('Error fetching quiz questions', questionsError);
            // Continue with available data
          }
          
          // Transform the junction table data into the expected questions format
          const questions = [];
          if (quizQuestionsData && Array.isArray(quizQuestionsData)) {
            quizQuestionsData.forEach(item => {
              if (item.question) {
                questions.push({
                  id: item.question.id,
                  questionText: item.question.question_text,
                  questionNumber: item.question.question_number,
                  options: item.question.options || [],
                  correctAnswer: item.question.correct_answer,
                  category: item.question.category,
                  difficulty: item.question.difficulty,
                  explanation: item.question.explanation,
                  userAnswer: item.user_answer,
                  isCorrect: item.is_correct
                });
              }
            });
          }
          
          Logger.info('Quiz data retrieved successfully');
          
          // Transform to expected format
          // Get document info if available
          let documentUrl = null;
          if (data.document_id) {
            Logger.info(`Fetching document information for document ID: ${data.document_id}`);
            try {
              const { data: document } = await supabase
                .from('documents')
                .select('file_path')
                .eq('id', data.document_id)
                .single();
              
              if (document?.file_path) {
                try {
                  const { data: publicUrlData } = supabase.storage
                    .from('documents')
                    .getPublicUrl(document.file_path);
                  documentUrl = publicUrlData?.publicUrl;
                  console.log('Retrieved document URL:', documentUrl ? 'success' : 'null');
                } catch (urlError) {
                  console.error('Error getting document URL:', urlError);
                  // Continue without document URL
                }
              }
            } catch (docError) {
              console.error('Error fetching document information:', docError);
              // Continue without document information
            }
          }
          
          const quiz = {
            id: data.id,
            title: data.title,
            documentId: data.document_id,
            documentUrl: documentUrl,
            createdAt: data.created_at,
            status: data.status,
            score: data.score,
            questions: questions || []
          };
          
          return quiz;
        } catch (_apiError) {
          console.log('Could not fetch quiz from API, trying local storage');
          
          // Fall back to local storage if API fails - try both sanitized and original IDs
          let quiz = await this.getQuizFromStorage(sanitizedQuizId);
          if (!quiz && originalQuizId !== sanitizedQuizId) {
            quiz = await this.getQuizFromStorage(originalQuizId);
          }
          if (!quiz) {
            throw new Error('Quiz not found');
          }
          return quiz;
        }
      } catch (error) {
        Sentry.captureException(error);
        console.error('Get quiz error:', error);
        throw error;
      } finally {
        transaction.finish();
      }
    } catch (outerError) {
      // Add this missing catch block for the outer try
      Sentry.captureException(outerError);
      Logger.error('Outer getQuiz error:', outerError);
      throw outerError;
    }
  }
  
  /**
   * Submit quiz answers
   * @param {string} quizId - Quiz ID
   * @param {Object} answers - User's answers (questionId -> selectedOptionIndex)
   * @returns {Promise<Object>} - Quiz results
   */
  async submitQuiz(quizId, answers) {
    console.log("🔍 DEBUG: Original quizId before submission:", quizId);
    console.log("DEBUG: Number of answers:", Object.keys(answers).length);
    
    // Check for valid quizId
    if (!quizId || quizId === "undefined") {
      console.error("🚨 Error: quizId is missing or invalid:", quizId);
      
      // For Expo Go: Generate a temporary UUID for testing
      // This is just for local testing and won't affect production builds
      if (Platform.constants?.ExpoGoConstants?.appVersion) {
        // We're in Expo Go, use a valid UUID format that PostgreSQL will accept
        console.log("Using fallback test UUID for Expo Go");
        // Generate a proper RFC4122 v4 UUID (random) that PostgreSQL will accept
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
        quizId = uuid;
        console.log(`Generated valid UUID format: ${quizId}`);
      } else {
        // In production build, we should fail properly
        throw new Error("Quiz ID is required for submission");
      }
    }
    
    // Sanitize the quiz ID to ensure it's a valid UUID for Supabase
    const sanitizedQuizId = sanitizeQuizId(quizId);
    console.log("🔄 DEBUG: Sanitized quizId for submission:", sanitizedQuizId);
    
    // Store the original ID for fallback attempts and local storage lookups
    const originalQuizId = quizId;
    
    // Validate the sanitized ID - if it's not a valid UUID, try additional sanitization methods
    if (sanitizedQuizId && !UUID_REGEX.test(sanitizedQuizId)) {
      console.warn(`⚠️ Sanitized ID '${sanitizedQuizId}' is not a valid UUID, attempting additional methods`);
      
      // Try manual segment extraction for edge cases (e.g. Expo Go fallback IDs)
      if (sanitizedQuizId.includes('-')) {
        const segments = sanitizedQuizId.split('-');
        if (segments.length >= 5) {
          const reconstructedUuid = segments.slice(0, 5).join('-');
          // Verify it looks like a UUID
          if (reconstructedUuid.length >= 36) {
            console.log(`💭 Reconstructed UUID for submission: ${reconstructedUuid}`);
            // Use this reconstructed ID instead
            quizId = reconstructedUuid;
            // Update sanitized ID too
            sanitizedQuizId = reconstructedUuid;
          }
        }
      }
      
      // Try to extract a UUID if present anywhere in the string
      const match = sanitizedQuizId.match(UUID_REGEX);
      
      if (match && match[1]) {
        console.log(`🔧 Extracted pure UUID: '${match[1]}' from '${sanitizedQuizId}'`);
        quizId = sanitizedQuizId; // Keep original for reference
        sanitizedQuizId = match[1]; // Use extracted UUID
      } else {
        console.error(`❌ Failed to extract a valid UUID from '${sanitizedQuizId}'`);
        // If we're not in Expo Go, this is a critical error
        if (!Platform.constants?.ExpoGoConstants?.appVersion) {
          throw new Error(`Invalid quiz ID format: ${sanitizedQuizId}`);
        }
      }
    }
    
    // originalQuizId was already declared above, no need to redeclare
    
    try {
      // Get the quiz basic info first
      const { /* data: quiz, */ error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', sanitizedQuizId)
        .single();
        
      if (quizError) {
        console.error("Quiz fetch error:", quizError);
        // In Expo Go, continue even if we can't fetch quiz
        if (!(Platform.constants?.ExpoGoConstants?.appVersion)) {
          throw quizError;
        }
      }
      
      // If we're in Expo Go and had an error fetching the quiz, skip this part
      let quizQuestions = [];
      let questionsError = null;
      
      // Always try to fetch questions since we're now using proper UUID format
      try {
        // Now get the questions for this quiz through the quiz_questions junction table
        const response = await supabase
          .from('quiz_questions')
          .select(`
            id,
            question_id,
            questions:question_id(*)
          `)
          .eq('quiz_id', sanitizedQuizId);
          
        quizQuestions = response.data || [];
        questionsError = response.error;
        
        if (questionsError) {
          console.error("Questions fetch error:", questionsError);
          // In Expo Go, continue even with errors
          if (!(Platform.constants?.ExpoGoConstants?.appVersion)) {
            throw questionsError;
          }
        }
      } catch (err) {
        console.warn("Error fetching quiz questions:", err);
        // In Expo Go, continue even with errors
        if (!(Platform.constants?.ExpoGoConstants?.appVersion)) {
          throw err;
        }
      }
      
      // Calculate score
      let correctAnswers = 0;
      let totalQuestions = quizQuestions?.length || 0;
      
      // In Expo Go, create simulated answers and score
      if (Platform.constants?.ExpoGoConstants?.appVersion) {
        console.log("🛢️ Creating simulated score for Expo Go");
        totalQuestions = Object.keys(answers).length || 5; // Use answer count or default to 5
        correctAnswers = Math.floor(totalQuestions * 0.6); // 60% correct for testing
      } else if (quizQuestions && quizQuestions.length > 0) {
        quizQuestions.forEach(item => {
          const question = item.questions;
          if (question && answers[question.id] === question.correct_answer) {
            correctAnswers++;
          }
        });
      }
      
      const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
      
      // Only update in Supabase if not in Expo Go
      if (!(Platform.constants?.ExpoGoConstants?.appVersion)) {
        try {
          // Update quiz status and score
          const { error: updateError } = await supabase
            .from('quizzes')
            .update({
              status: 'completed',
              score: score,
              completed_at: new Date().toISOString()
            })
            .eq('id', sanitizedQuizId);
            
          if (updateError) {
            console.warn("Error updating quiz status:", updateError);
            // In Expo Go, continue even with errors
            if (!(Platform.constants?.ExpoGoConstants?.appVersion)) {
              throw updateError;
            }
          }
            
          // Save user answers to quiz_questions table
          for (const questionId in answers) {
            try {
              const { error: answerError } = await supabase
                .from('quiz_questions')
                .update({
                  user_answer: answers[questionId],
                  is_correct: quizQuestions.find(q => q.question_id.toString() === questionId)?.questions?.correct_answer === answers[questionId]
                })
                .eq('quiz_id', sanitizedQuizId)
                .eq('question_id', questionId);
                
              if (answerError) console.warn(`Error saving answer for question ${questionId}:`, answerError);
            } catch (answerErr) {
              console.warn(`Error processing answer for question ${questionId}:`, answerErr);
              // Continue with other questions
            }
          }
        } catch (err) {
          console.warn("Error during quiz update:", err);
          // In Expo Go, continue even with errors
          if (!(Platform.constants?.ExpoGoConstants?.appVersion)) {
            throw err;
          }
        }
      } else {
        console.log("🛢️ SIMULATING SUCCESSFUL QUIZ UPDATE: No DB updates performed in Expo Go");
      }
      
      // Format response to match expected structure
      const response = {
        results: {
          quizId: originalQuizId, // Return the original ID to the client
          sanitizedQuizId: sanitizedQuizId, // Also include the sanitized ID for reference
          score: score,
          totalQuestions: totalQuestions,
          correctAnswers: correctAnswers,
          answers: answers,
          completedAt: new Date().toISOString()
        }
      };
      
      // Store results in local storage - store with both original and sanitized IDs
      if (response.results) {
        await this.saveResultsToStorage(originalQuizId, response.results);
        if (originalQuizId !== sanitizedQuizId) {
          await this.saveResultsToStorage(sanitizedQuizId, response.results);
        }
      }
      
      return response;
    } catch (error) {
      Sentry.captureException(error);
      console.error('Submit quiz error:', error);
      
      // If API fails, calculate results locally
      try {
        console.log('Attempting to calculate results locally from storage');
        // Try both sanitized and original IDs
        let quiz = await this.getQuizFromStorage(sanitizedQuizId);
        if (!quiz && originalQuizId !== sanitizedQuizId) {
          quiz = await this.getQuizFromStorage(originalQuizId);
        }
        if (!quiz) {
          console.warn('Quiz not found in storage, creating minimal fallback');
          // Return minimal valid response instead of throwing
          return {
            results: {
              quizId: originalQuizId, // Return the original ID to the client
              sanitizedQuizId: sanitizedQuizId, // Also include the sanitized ID for reference
              score: 0,
              totalQuestions: 0,
              correctAnswers: 0,
              answers: answers || {},
              completedAt: new Date().toISOString()
            }
          };
        }
        
        // Calculate results
        let correctAnswers = 0;
        quiz.questions.forEach(question => {
          if (answers[question.id] === question.correctAnswer) {
            correctAnswers++;
          }
        });
        
        const score = (correctAnswers / quiz.questions.length) * 100;
        const results = {
          quizId,
          score,
          totalQuestions: quiz.questions.length,
          correctAnswers,
          answers,
          completedAt: new Date().toISOString()
        };
        
        // Save results locally
        await this.saveResultsToStorage(quizId, results);
        
        return { results };
      } catch (localError) {
        console.error('Local results calculation error:', localError);
        throw error; // Throw original API error
      }
    }
  }
  
  /**
   * Get user's quiz history
   * @param {number} page - Page number for pagination
   * @param {number} limit - Number of items per page
   * @returns {Promise<Object>} - Quiz history data
   */
  async getQuizHistory(page = 1, limit = 10) {
    try {
      // Get user ID
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      // Calculate pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      // Fetch quiz history
      const { data, error, count } = await supabase
        .from('quiz_results')
        .select('*, quiz:quizzes(*)', { count: 'exact' })
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .range(from, to);
        
      if (error) throw error;
      
      // Transform to expected format
      const quizzes = await Promise.all(data.map(async result => {
        // If the quiz has a document_id, get the file URL
        let documentUrl = null;
        if (result.quiz?.document_id) {
          try {
            const { data: document } = await supabase
              .from('documents')
              .select('file_path')
              .eq('id', result.quiz.document_id)
              .single();
              
            if (document?.file_path) {
              try {
                const { data: publicUrlData } = supabase.storage
                  .from('documents')
                  .getPublicUrl(document.file_path);
                documentUrl = publicUrlData?.publicUrl;
                console.log('Retrieved document URL:', documentUrl ? 'success' : 'null');
              } catch (urlError) {
                console.error('Error getting document URL:', urlError);
                // Continue without document URL
              }
            }
          } catch (docError) {
            console.error('Error fetching quiz document information:', docError);
            // Continue without document information
          }
        }
        
        return {
          id: result.quiz_id,
          title: result.quiz?.title || 'Unknown Quiz',
          score: result.score,
          completedAt: result.completed_at,
          documentId: result.quiz?.document_id,
          documentUrl: documentUrl
        };
      }));
      
      return {
        quizzes,
        total: count || 0,
        page,
        limit
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error('Get quiz history error:', error);
      
      // Fall back to local storage if API fails
      try {
        const historyString = await AsyncStorage.getItem('quizHistory');
        if (!historyString) {
          return { quizzes: [] };
        }
        
        const history = JSON.parse(historyString);
        
        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedHistory = history.slice(startIndex, endIndex);
        
        return {
          quizzes: paginatedHistory,
          total: history.length,
          page,
          limit
        };
      } catch (localError) {
        console.error('Local history retrieval error:', localError);
        throw error; // Throw original API error
      }
    }
  }
  
  /**
   * Save quiz to local storage
   * @param {Object} quiz - Quiz data
   * @returns {Promise<void>}
   */
  async saveQuizToStorage(quiz) {
    try {
      if (!quiz || !quiz.id) {
        console.warn('Invalid quiz object provided to saveQuizToStorage');
        return;
      }
      
      console.log(`Saving quiz ${quiz.id} to storage`);
      
      // Ensure quiz has a valid structure before saving
      const safeQuiz = {
        ...quiz,
        id: quiz.id,
        title: quiz.title || 'Quiz',
        questions: Array.isArray(quiz.questions) ? quiz.questions : [],
        createdAt: quiz.createdAt || new Date().toISOString()
      };
      
      try {
        // Save individual quiz
        await AsyncStorage.setItem(`quiz_${quiz.id}`, JSON.stringify(safeQuiz));
        
        // Update quiz list
        try {
          const quizListString = await AsyncStorage.getItem('quizList');
          const quizList = quizListString ? JSON.parse(quizListString) : [];
          
          // Add to list if not already present
          if (!quizList.includes(quiz.id)) {
            quizList.push(quiz.id);
            await AsyncStorage.setItem('quizList', JSON.stringify(quizList));
          }
          console.log('Successfully updated quiz list in storage');
        } catch (listError) {
          console.warn('Failed to update quiz list:', listError);
          // Continue even if list update fails
        }
        
        console.log(`Successfully saved quiz ${quiz.id} to storage`);
      } catch (saveError) {
        console.error('Error saving quiz data:', saveError);
      }
    } catch (error) {
      Sentry.captureException(error);
      console.error('Save quiz to storage error:', error);
      // Don't throw errors from storage operations
    }
  }
  
  /**
   * Get quiz from local storage
   * @param {string} quizId - Quiz ID
   * @returns {Promise<Object|null>}
   */
  async getQuizFromStorage(quizId) {
    if (!quizId) {
      console.warn('Invalid quizId provided to getQuizFromStorage');
      return null;
    }
    
    try {
      console.log(`Attempting to retrieve quiz ${quizId} from storage`);
      const quizString = await AsyncStorage.getItem(`quiz_${quizId}`);
      
      if (!quizString) {
        console.log(`No quiz found in storage for ID: ${quizId}`);
        return null;
      }
      
      try {
        const quiz = JSON.parse(quizString);
        console.log(`Successfully retrieved quiz from storage: ${quizId}`);
        
        // Ensure quiz has valid question structure
        if (!quiz.questions) quiz.questions = [];
        return quiz;
      } catch (parseError) {
        console.error('Failed to parse quiz JSON from storage:', parseError);
        return null;
      }
    } catch (error) {
      Sentry.captureException(error);
      console.error('Get quiz from storage error:', error);
      return null;
    }
  }
  
  /**
   * Save quiz results to local storage
   * @param {string} quizId - Quiz ID
   * @param {Object} results - Quiz results
   * @returns {Promise<void>}
   */
  async saveResultsToStorage(quizId, results) {
    try {
      // Save individual results
      await AsyncStorage.setItem(`results_${quizId}`, JSON.stringify(results));
      
      // Update quiz history
      const historyString = await AsyncStorage.getItem('quizHistory');
      const history = historyString ? JSON.parse(historyString) : [];
      
      // Add to history if not already present
      const existingIndex = history.findIndex(item => item.quizId === quizId);
      if (existingIndex >= 0) {
        history[existingIndex] = {
          ...history[existingIndex],
          ...results,
          updatedAt: new Date().toISOString()
        };
      } else {
        history.unshift({
          ...results,
          createdAt: new Date().toISOString()
        });
      }
      
      await AsyncStorage.setItem('quizHistory', JSON.stringify(history));
    } catch (error) {
      Sentry.captureException(error);
      console.error('Save results to storage error:', error);
    }
  }
  
  /**
   * Get quiz results from local storage
   * @param {string} quizId - Quiz ID
   * @returns {Promise<Object|null>}
   */
  async getResultsFromStorage(quizId) {
    try {
      const resultsString = await AsyncStorage.getItem(`results_${quizId}`);
      return resultsString ? JSON.parse(resultsString) : null;
    } catch (error) {
      Sentry.captureException(error);
      console.error('Get results from storage error:', error);
      return null;
    }
  }
}

/**
 * Alias for getQuiz for backward compatibility with older code
 * @param {string} quizId - Quiz ID
 * @returns {Promise<Object>} - Quiz data
 */
QuizService.prototype.getQuizById = function(quizId) {
  return this.getQuiz(quizId);
};

/**
 * Alias for submitQuiz for backward compatibility with older code
 * @param {Object} quizResult - Quiz result object containing quizId, answers, etc.
 * @returns {Promise<Object>} - Quiz results
 */
QuizService.prototype.submitQuizAnswers = function(quizResult) {
  return this.submitQuiz(quizResult.quizId, quizResult.answers);
};

// Create and export a singleton instance
const quizService = new QuizService();
export { sanitizeQuizId };
export default quizService;
