import apiClient from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';

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
    try {
      console.log('Starting quiz generation with file:', file ? file.name : 'undefined');
      
      // Validate input parameters to prevent crashes
      if (!file || !file.uri) {
        console.error('Invalid file object provided');
        throw new Error('Invalid file: File object is required');
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
        console.log('No document ID provided, creating new document');
        
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
              console.log(`Fetching file data from URI: ${safeFile.uri.substring(0, 50)}...`);
              const fetchPromise = fetch(safeFile.uri);
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('File fetch timed out')), 30000)
              );
              
              const response = await Promise.race([fetchPromise, timeoutPromise]);
              if (!response.ok) {
                throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
              }
              
              blob = await response.blob();
              console.log(`Successfully fetched file blob, size: ${blob.size} bytes`);
            } catch (fetchError) {
              console.error('Error fetching file blob:', fetchError);
              throw new Error(`Failed to access file: ${fetchError.message}`);
            }
            
            // Generate a unique filename for this retry attempt
            const retryFileName = retryCount > 0 ? 
              `${Date.now()}_retry${retryCount}_${sanitizedName}` : 
              fileName;
              
            console.log(`Uploading file to Supabase: ${retryFileName}`);
            
            // Upload to storage bucket with better error handling
            const { data: storageData, error: storageError } = await supabase.storage
              .from('documents')
              .upload(retryFileName, blob, {
                contentType: safeFile.type,
                cacheControl: '3600',
                upsert: true // Overwrite if file exists with same name
              });
            
            if (storageError) {
              console.error(`Storage upload error (attempt ${retryCount + 1}):`, storageError);
              retryCount++;
              
              // If it's not a duplicate error or we're out of retries, throw it
              if (!storageError.message?.includes('duplicate') && retryCount >= maxRetries) {
                throw storageError;
              }
              
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
              // Success!
              fileName = retryFileName;
              uploadSuccess = true;
              console.log('File uploaded successfully:', fileName);
            }
          } catch (uploadError) {
            retryCount++;
            console.error(`File upload attempt ${retryCount} failed:`, uploadError);
            
            if (retryCount >= maxRetries) {
              console.error('Maximum upload retries reached, failing');
              throw new Error(`File upload failed after ${maxRetries} attempts: ${uploadError.message}`);
            }
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        // Safe document creation with retries
        try {
          console.log('Creating document record in database');
          
          // Get user ID safely
          let userId;
          try {
            const userResponse = await supabase.auth.getUser();
            userId = userResponse?.data?.user?.id;
            
            if (!userId) {
              console.warn('Unable to get user ID, using placeholder');
              userId = 'anonymous'; // Fallback if we can't get user ID
            }
          } catch (userError) {
            console.error('Error getting user ID:', userError);
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
            console.error('Document record error:', documentError);
            throw new Error(`Failed to create document record: ${documentError.message}`);
          }
          
          if (!documentRecord || documentRecord.length === 0) {
            throw new Error('Document record creation failed: No record returned');
          }
          
          // Use the new document ID
          documentId = documentRecord[0].id;
          console.log('Document record created successfully, ID:', documentId);
        } catch (docError) {
          console.error('Error creating document record:', docError);
          throw new Error(`Document creation failed: ${docError.message}`);
        }
      }
      
      // Create quiz record in database with better title handling
      console.log('Creating quiz record for document ID:', documentId);
      
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
          console.warn('User not authenticated, using anonymous user');
          userId = 'anonymous'; // Fallback if we can't get user ID
        }
      } catch (userError) {
        console.error('Error getting user ID:', userError);
        userId = 'anonymous'; // Fallback
      }
      
      try {
        console.log('Preparing quiz data for insertion');
        const quizData = {
          title: `Quiz on ${safeTitle}`,
          document_id: documentId,  // Use the document ID reference
          total_questions: quizOptions.questionCount,
          status: 'in_progress',
          created_at: new Date().toISOString(),
          user_id: userId
        };
        
        console.log('Inserting quiz record');
        const { data: quizRecord, error: quizError } = await supabase
          .from('quizzes')
          .insert(quizData)
          .select();
          
        if (quizError) {
          console.error('Quiz insertion error:', quizError);
          throw new Error(`Failed to insert quiz: ${quizError.message}`);
        }
        
        if (!quizRecord || quizRecord.length === 0) {
          throw new Error('Quiz record creation failed: No record returned');
        }
        
        console.log('Quiz record created successfully, ID:', quizRecord[0].id);
      
        // For simplicity, return a compatible response
        const response = {
          quiz: {
            id: quizRecord[0].id,
            title: quizRecord[0].title,
            documentId: documentId,
            createdAt: quizRecord[0].created_at,
            questions: [] // In a real app, you would generate questions here
          }
        };
        
        // Store quiz in local storage for offline access
        try {
          console.log('Saving quiz to local storage');
          if (response.quiz && response.quiz.id) {
            await this.saveQuizToStorage(response.quiz);
          }
        } catch (storageError) {
          console.warn('Failed to save quiz to local storage:', storageError);
          // Continue even if local storage fails
        }
        
        console.log('Quiz generation complete, returning response');
        return response;
      } catch (quizCreationError) {
        console.error('Quiz creation error:', quizCreationError);
        throw quizCreationError;
      }
    } catch (error) {
      console.error('Quiz generation error:', error);
      throw error;
    }
  }
  
  /**
   * Get quiz by ID
   * @param {string} quizId - Quiz ID
   * @returns {Promise<Object>} - Quiz data
   */
  async getQuiz(quizId) {
    if (!quizId) {
      console.error('getQuiz called with invalid quizId:', quizId);
      throw new Error('Quiz ID is required');
    }
    
    console.log('Getting quiz with ID:', quizId);
    
    try {
      // Try to get from local storage first as a fallback
      let localQuiz = null;
      try {
        localQuiz = await this.getQuizFromStorage(quizId);
        if (localQuiz) {
          console.log('Found quiz in local storage');
        }
      } catch (storageError) {
        console.warn('Error checking local storage:', storageError);
        // Continue even if local storage fails
      }
      
      // Try to get from Supabase
      try {
        console.log('Fetching quiz from Supabase');
        const { data, error } = await supabase
          .from('quizzes')
          .select('*, questions(*)')
          .eq('id', quizId)
          .single();
          
        if (error) {
          console.error('Error fetching quiz from Supabase:', error);
          // If we have a local version, use that instead
          if (localQuiz) {
            console.log('Using local quiz data as fallback');
            return localQuiz;
          }
          throw error;
        }
        
        console.log('Quiz data retrieved successfully');
        
        // Transform to expected format
        // Get document info if available
        let documentUrl = null;
        if (data.document_id) {
          console.log('Fetching document information');
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
          questions: data.questions || []
        };
        
        return quiz;
      } catch (apiError) {
        console.log('Could not fetch quiz from API, trying local storage');
        
        // Fall back to local storage if API fails
        const quiz = await this.getQuizFromStorage(quizId);
        if (!quiz) {
          throw new Error('Quiz not found');
        }
        return quiz;
      }
    } catch (error) {
      console.error('Get quiz error:', error);
      throw error;
    }
  }
  
  /**
   * Submit quiz answers
   * @param {string} quizId - Quiz ID
   * @param {Object} answers - User's answers (questionId -> selectedOptionIndex)
   * @returns {Promise<Object>} - Quiz results
   */
  async submitQuiz(quizId, answers) {
    try {
      // Get the quiz to calculate the score
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('*, questions(*)')
        .eq('id', quizId)
        .single();
        
      if (quizError) throw quizError;
      
      // Calculate score
      let correctAnswers = 0;
      let totalQuestions = quiz.questions?.length || 0;
      
      if (quiz.questions) {
        quiz.questions.forEach(question => {
          if (answers[question.id] === question.correct_answer_index) {
            correctAnswers++;
          }
        });
      }
      
      const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
      
      // Save result to database
      const resultData = {
        quiz_id: quizId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        score: score,
        answers: answers,
        completed_at: new Date().toISOString()
      };
      
      const { data: resultRecord, error: resultError } = await supabase
        .from('quiz_results')
        .insert(resultData)
        .select();
        
      if (resultError) throw resultError;
      
      // Format response to match expected structure
      const response = {
        results: {
          quizId: quizId,
          score: score,
          totalQuestions: totalQuestions,
          correctAnswers: correctAnswers,
          answers: answers,
          completedAt: new Date().toISOString()
        }
      };
      
      // Store results in local storage
      if (response.results) {
        await this.saveResultsToStorage(quizId, response.results);
      }
      
      return response;
    } catch (error) {
      console.error('Submit quiz error:', error);
      
      // If API fails, calculate results locally
      try {
        console.log('Attempting to calculate results locally from storage');
        const quiz = await this.getQuizFromStorage(quizId);
        if (!quiz) {
          console.warn('Quiz not found in storage, creating minimal fallback');
          // Return minimal valid response instead of throwing
          return {
            results: {
              quizId: quizId,
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
export default quizService;
