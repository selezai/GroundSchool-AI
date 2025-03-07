import apiClient from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      // Set default options
      const quizOptions = {
        questionCount: 10,
        difficulty: 'mixed',
        ...options
      };
      
      // Upload file and generate questions
      const response = await apiClient.uploadFile('/quiz/generate', file, quizOptions);
      
      // Store quiz in local storage for offline access
      if (response.quiz && response.quiz.id) {
        await this.saveQuizToStorage(response.quiz);
      }
      
      return response;
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
    try {
      // Try to get from API first
      try {
        const response = await apiClient.get(`/quiz/${quizId}`);
        return response.quiz;
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
      const response = await apiClient.post(`/quiz/${quizId}/submit`, { answers });
      
      // Store results in local storage
      if (response.results) {
        await this.saveResultsToStorage(quizId, response.results);
      }
      
      return response;
    } catch (error) {
      console.error('Submit quiz error:', error);
      
      // If API fails, calculate results locally
      try {
        const quiz = await this.getQuizFromStorage(quizId);
        if (!quiz) {
          throw new Error('Quiz not found');
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
      return await apiClient.get('/quiz/history', {
        params: { page, limit }
      });
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
      // Save individual quiz
      await AsyncStorage.setItem(`quiz_${quiz.id}`, JSON.stringify(quiz));
      
      // Update quiz list
      const quizListString = await AsyncStorage.getItem('quizList');
      const quizList = quizListString ? JSON.parse(quizListString) : [];
      
      // Add to list if not already present
      if (!quizList.includes(quiz.id)) {
        quizList.push(quiz.id);
        await AsyncStorage.setItem('quizList', JSON.stringify(quizList));
      }
    } catch (error) {
      console.error('Save quiz to storage error:', error);
    }
  }
  
  /**
   * Get quiz from local storage
   * @param {string} quizId - Quiz ID
   * @returns {Promise<Object|null>}
   */
  async getQuizFromStorage(quizId) {
    try {
      const quizString = await AsyncStorage.getItem(`quiz_${quizId}`);
      return quizString ? JSON.parse(quizString) : null;
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

// Create and export a singleton instance
const quizService = new QuizService();
export default quizService;
